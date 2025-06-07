import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { getAuthConfig } from '../config/index.js';

const { jwtSecret: JWT_SECRET } = getAuthConfig();

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '未提供认证令牌'
        });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
            return res.status(403).json({
                success: false,
                message: '认证令牌已过期'
            });
        }
        const user = await db.User.findByPk(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        if (user.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: '账户未获得批准'
            });
        }
        req.user = {
            userId: user.id,
            username: user.username,
            role: user.role,
            status: user.status
        };
        next();
    } catch (error) {
        console.error('令牌验证失败:', error.message);
        let message = '无效的认证令牌';
        if (error.name === 'TokenExpiredError') {
            message = '认证令牌已过期';
        } else if (error.name === 'JsonWebTokenError') {
            message = '无效的认证令牌格式';
        }

        return res.status(403).json({
            success: false,
            message
        });
    }
};

export const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: '需要管理员权限'
        });
    }
    next();
};

export const isApproved = (req, res, next) => {
    if (!req.user || req.user.status !== 'approved') {
        return res.status(403).json({
            success: false,
            message: '账户未获得批准'
        });
    }
    next();
};

export const verifyServerAccess = (requireOwner = false) => async (req, res, next) => {
    try {
        const serverId = req.params.id;
        const userId = req.user.userId;

        const server = await db.Server.findByPk(serverId);
        if (!server) {
            return res.status(404).json({ success: false, message: '服务器未找到' });
        }

        const serverMembership = await db.ServerMember.findOne({
            where: {
                ServerId: serverId,
                UserId: userId,
            }
        });

        const isUserActualServerOwner = serverMembership?.role === 'owner';
        const isUserSiteAdmin = req.user.role === 'admin';

        if (requireOwner) {
            if (!isUserActualServerOwner) {
                return res.status(403).json({ success: false, message: '只有群主可以执行此操作' });
            }
        } else {
            if (!isUserActualServerOwner && !isUserSiteAdmin) {
                return res.status(403).json({ success: false, message: '只有服务器所有者或管理员可以执行此操作' });
            }
        }

        req.server = server;
        req.serverMember = serverMembership;
        req.isServerOwner = isUserActualServerOwner;
        req.isAdmin = isUserSiteAdmin;

        next();
    } catch (error) {
        console.error('服务器权限验证失败:', error);
        res.status(500).json({ success: false, message: '服务器权限验证失败: ' + error.message });
    }
};
