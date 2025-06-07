import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { getAuthConfig } from '../config/index.js';

const router = express.Router();
const { jwtSecret: JWT_SECRET, tokenExpireTime: TOKEN_EXPIRE_TIME } = getAuthConfig();

router.post('/register', async (req, res) => {
    try {
        const { username, password, note } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }
        const existingUser = await db.User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: '该用户名已被使用'
            });
        }

        const user = await db.User.create({
            username,
            password,
            note,
            status: 'pending',
            role: 'user'
        });

        res.status(201).json({
            success: true,
            message: '注册申请已提交，请等待管理员审核',
            data: { userId: user.id }
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '注册失败，请稍后重试'
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码不能为空'
            });
        }

        const user = await db.User.findOne({
            where: { username },
            attributes: ['id', 'username', 'password', 'role', 'status']
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '未找到该用户，请检查用户名或注册新账号'
            });
        }
        const validPassword = await user.validatePassword(password);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: '密码错误，请重试'
            });
        }

        if (user.status === 'pending') {
            return res.status(403).json({
                success: false,
                message: '您的账号正在等待管理员审核'
            });
        }

        if (user.status === 'rejected') {
            return res.status(403).json({
                success: false,
                message: '您的账号申请已被拒绝'
            });
        }

        if (user.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: '您的账号状态异常，请联系管理员'
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRE_TIME }
        );

        res.json({
            success: true,
            message: '登录成功',
            data: {
                token,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '登录失败，请稍后重试'
        });
    }
});

router.post('/refresh', authenticateToken, async (req, res) => {
    try {
        const user = await db.User.findByPk(req.user.userId, {
            attributes: ['id', 'username', 'role', 'status']
        });

        if (!user || user.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: '用户状态异常'
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRE_TIME }
        );

        res.json({
            success: true,
            message: 'Token 刷新成功',
            data: {
                token,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Token 刷新失败:', error);
        res.status(500).json({
            success: false,
            message: 'Token 刷新失败'
        });
    }
});

export default router;