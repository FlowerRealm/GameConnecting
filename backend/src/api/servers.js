import express from 'express';
import { Op } from 'sequelize';
import { db } from '../db/index.js';
import { authenticateToken, verifyServerAccess } from '../middleware/auth.js';
import { getActiveServersInfo } from '../socket/index.js';

const router = express.Router();
router.get('/', async (req, res) => {
    try {
        const serversFromDb = await db.Server.findAll();
        const activeServersData = getActiveServersInfo();

        const serversWithOnlineCount = serversFromDb.map(server => {
            const serverJson = server.toJSON();
            serverJson.onlineMembers = activeServersData[String(serverJson.id)]?.onlineMemberCount || 0;
            return serverJson;
        });

        res.json({ success: true, data: serversWithOnlineCount });
    } catch (error) {
        console.error('获取服务器列表失败:', error);
        res.status(500).json({ success: false, message: '获取服务器列表失败', error: error.message });
    }
});

router.get('/joined', authenticateToken, async (req, res) => {
    try {
        const user = await db.User.findByPk(req.user.userId, {
            include: [{
                model: db.Server,
                as: 'joinedServers',
                through: { attributes: ['role', 'joinedAt', 'lastActive'] }
            }]
        });
        if (!user) {
            return res.status(404).json({ success: false, message: '用户未找到' });
        }

        res.json({ success: true, data: user.joinedServers });
    } catch (error) {
        console.error('获取用户加入的服务器失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户加入的服务器失败',
            error: error.message
        });
    }
});

// 创建新服务器
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        const server = await db.Server.create({
            name,
            description,
            createdBy: req.user.userId
        });

        await db.ServerMember.create({
            UserId: req.user.userId,
            ServerId: server.id,
            role: 'owner'
        });

        res.status(201).json({ success: true, data: server });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '创建服务器失败',
            error: error.message
        });
    }
});

router.post('/:id/join', authenticateToken, async (req, res) => {
    try {
        const server = await db.Server.findByPk(req.params.id);
        if (!server) {
            return res.status(404).json({ success: false, message: '服务器未找到' });
        }
        const existingMember = await db.ServerMember.findOne({
            where: {
                UserId: req.user.userId,
                ServerId: server.id
            }
        });

        if (existingMember) {
            return res.status(200).json({
                success: true,
                message: '您已经是该服务器的成员'
            });
        }

        const existingRequest = await db.ServerJoinRequest.findOne({
            where: {
                userId: req.user.userId,
                serverId: server.id
            }
        });

        if (existingRequest) {
            return res.status(400).json({ success: false, message: '您已提交过加入申请，请等待审核。' });
        }

        await db.ServerJoinRequest.create({
            userId: req.user.userId,
            serverId: server.id
        });
        return res.status(200).json({ success: true, message: '申请已发送，请等待服主审核。' });

    } catch (error) {
        console.error(`用户 ${req.user.userId} 加入服务器 ${req.params.id} 失败:`, error);
        return res.status(500).json({ success: false, message: '加入服务器失败，请稍后重试。' });
    }
});

router.post('/:id/leave', authenticateToken, async (req, res) => {
    try {
        const member = await db.ServerMember.findOne({
            where: {
                UserId: req.user.userId,
                ServerId: req.params.id
            }
        });

        if (!member) {
            return res.status(404).json({ success: false, message: '您不是该服务器的成员' });
        }

        if (member.role === 'owner') {
            return res.status(400).json({ success: false, message: '群主不能退出服务器,请先转让群主或关闭服务器' });
        }

        await member.destroy();

        // 检查服务器是否还有成员
        const remainingMembersCount = await db.ServerMember.count({
            where: {
                ServerId: req.params.id
            }
        });

        if (remainingMembersCount === 0) {
            const serverToDelete = await db.Server.findByPk(req.params.id);
            if (serverToDelete) {
                await serverToDelete.destroy();
                return res.json({ success: true, message: '成功退出服务器，服务器已删除' });
            }
        }

        res.json({ success: true, message: '成功退出服务器' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '退出服务器失败',
            error: error.message
        });
    }
});

router.get('/:id/join-requests', authenticateToken, verifyServerAccess(), async (req, res) => {
    try {
        const server = req.server;
        if (!req.isServerOwner && !req.isAdmin) {
            return res.status(403).json({
                success: false,
                message: '只有服务器所有者或管理员可以查看加入申请'
            });
        }

        // server.id is available from req.server set by verifyServerAccess
        const joinRequests = await db.ServerJoinRequest.findAll({
            where: { serverId: server.id }, // Use server.id from the req.server object
            include: [{
                model: db.User,
                as: 'requester',
                attributes: ['id', 'username']
            }]
        });

        res.json({ success: true, data: joinRequests });
    } catch (error) {
        console.error('获取加入申请列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取加入申请列表失败',
            error: error.message
        });
    }
});

router.post('/:id/join-requests/:requestId', authenticateToken, async (req, res) => {
    try {
        const serverId = req.params.id;
        const requestId = req.params.requestId;
        const { action } = req.body;
        const userId = req.user.userId;

        const server = await db.Server.findByPk(serverId);
        if (!server) {
            return res.status(404).json({ success: false, message: '服务器未找到' });
        }

        const isOwner = server.createdBy === userId;
        const isAdmin = req.user.role === 'admin'; // Corrected: check role from req.user

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '只有服务器所有者或管理员可以处理加入申请'
            });
        }

        const joinRequest = await db.ServerJoinRequest.findOne({
            where: { id: requestId, serverId }
        });
        if (!joinRequest) {
            return res.status(404).json({ success: false, message: '加入申请未找到' });
        }

        if (action === 'approve') {
            // 批准申请，将用户添加到成员列表
            await db.ServerMember.create({
                UserId: joinRequest.userId,
                ServerId: serverId,
                role: 'member'
            });

            await joinRequest.destroy();
            res.json({ success: true, message: '加入申请已批准' });

        } else if (action === 'reject') {
            await joinRequest.destroy();
            res.json({ success: true, message: '加入申请已拒绝' });

        } else {
            return res.status(400).json({ success: false, message: '无效的操作' });
        }

    } catch (error) {
        console.error('处理加入申请失败:', error);
        res.status(500).json({
            success: false,
            message: '处理加入申请失败',
            error: error.message
        });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const server = await db.Server.findByPk(req.params.id, {
            include: [{
                model: db.User,
                as: 'members',
                attributes: ['id', 'username'],
                through: { attributes: [] }
            }]
        });
        if (!server) {
            return res.status(404).json({ success: false, message: '服务器未找到' });
        }
        res.json({ success: true, data: server });
    } catch (error) {
        console.error(`获取服务器 ${req.params.id} 详情失败:`, error);
        res.status(500).json({ success: false, message: '获取服务器详情失败', error: error.message });
    }
});

router.get('/:id/members', authenticateToken, async (req, res) => {
    try {
        const server = await db.Server.findByPk(req.params.id, {
            include: [{
                model: db.User,
                as: 'members',
                attributes: ['id', 'username'],
                through: {
                    attributes: ['role', 'joinedAt', 'lastActive']
                }
            }]
        });

        if (!server) {
            return res.status(404).json({ success: false, message: '服务器未找到' });
        }

        res.json({ success: true, data: server.members });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取服务器成员列表失败',
            error: error.message
        });
    }
});

router.delete('/:id/members/:memberId', authenticateToken, async (req, res) => {
    try {
        const serverId = req.params.id;
        const memberIdToKick = req.params.memberId;
        const userId = req.user.userId;

        const server = await db.Server.findByPk(serverId);
        if (!server) {
            return res.status(404).json({ success: false, message: '服务器未找到' });
        }

        const isOwner = server.createdBy === userId;
        const isAdmin = req.user.role === 'admin'; // Corrected: check role from req.user

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: '只有服务器所有者或管理员可以踢出成员'
            });
        }

        if (isOwner && memberIdToKick == userId) {
            return res.status(400).json({
                success: false,
                message: '群主不能踢出自己'
            });
        }

        const memberToKick = await db.ServerMember.findOne({
            where: {
                UserId: memberIdToKick,
                ServerId: serverId
            }
        });

        if (!memberToKick) {
            return res.status(404).json({ success: false, message: '成员未找到' });
        }

        if (isAdmin && memberToKick.role === 'owner') {
            return res.status(403).json({
                success: false,
                message: '管理员不能踢出服务器所有者'
            });
        }

        await memberToKick.destroy();
        res.json({ success: true, message: '成员已被踢出' });

    } catch (error) {
        console.error('踢出成员失败:', error);
        res.status(500).json({
            success: false,
            message: '踢出成员失败',
            error: error.message
        });
    }
});

router.put('/:id', authenticateToken, verifyServerAccess(true), async (req, res) => {
    try {
        const { name, description } = req.body;
        const server = req.server;
        Object.assign(server, {
            name: name || server.name,
            description: description || server.description
        });

        await server.save();
        res.json({ success: true, data: server });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '更新服务器信息失败',
            error: error.message
        });
    }
});

router.delete('/:id', authenticateToken, verifyServerAccess(true), async (req, res) => {
    try {
        const server = req.server;
        await server.destroy();
        res.json({ success: true, message: '服务器已删除' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '删除服务器失败',
            error: error.message
        });
    }
});

export default router;