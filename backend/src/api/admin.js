import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { getIoInstance } from '../socket/index.js';

const router = express.Router();

router.get('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows: users } = await db.User.findAndCountAll({
            attributes: ['id', 'username', 'note', 'role', 'status', 'createdAt', 'adminNote', 'approvedAt'],
            include: [{
                model: db.User,
                as: 'approvedByUser',
                attributes: ['username'],
                required: false
            }],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        const totalPages = Math.ceil(count / limit);

        res.json({
            success: true,
            data: {
                users,
                total: count,
                page,
                totalPages,
                limit
            }
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败',
            error: error.message
        });
    }
});

router.put('/users/:id/status', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const user = await db.User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        user.status = status;
        await user.save();

        res.json({ success: true, message: '用户状态更新成功', data: user });
    } catch (error) {
        console.error('更新用户状态失败:', error);
        res.status(500).json({
            success: false,
            message: '更新用户状态失败',
            error: error.message
        });
    }
});

router.put('/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    try {
        const user = await db.User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        user.role = role;
        await user.save();

        res.json({ success: true, message: '用户角色更新成功', data: user });
    } catch (error) {
        console.error('更新用户角色失败:', error);
        res.status(500).json({
            success: false,
            message: '更新用户角色失败',
            error: error.message
        });
    }
});

router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const user = await db.User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        await user.destroy();
        res.json({ success: true, message: '用户删除成功' });
    } catch (error) {
        console.error('删除用户失败:', error);
        res.status(500).json({
            success: false,
            message: '删除用户失败',
            error: error.message
        });
    }
});

router.get('/servers', authenticateToken, isAdmin, async (req, res) => {
    try {
        const servers = await db.Server.findAll({
            include: [{
                model: db.User,
                as: 'owner',
                attributes: ['id', 'username']
            }]
        });
        res.json({ success: true, data: servers });
    } catch (error) {
        console.error('获取服务器列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取服务器列表失败',
            error: error.message
        });
    }
});

router.get('/pending-users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await db.User.findAll({
            where: {
                status: 'pending'
            },
            attributes: ['id', 'username', 'note', 'status', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('获取待审核用户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取待审核用户列表失败',
            error: error.message
        });
    }
});

router.post('/review-user/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, note } = req.body;

    try {
        const user = await db.User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        user.status = status;
        user.adminNote = note || null;
        user.approvedBy = req.user.id;
        user.approvedAt = new Date();
        await user.save();

        const io = getIoInstance();
        const approvedByUser = await db.User.findByPk(req.user.id, { attributes: ['username'] });

        io.to('admin_room').emit('userStatusUpdated', {
            userId: user.id,
            username: user.username,
            status: user.status,
            note: user.note,
            adminNote: user.adminNote,
            approvedAt: user.approvedAt,
            approvedBy: approvedByUser ? { username: approvedByUser.username } : { username: '未知' },
            createdAt: user.createdAt
        });

        res.json({
            success: true,
            message: '用户审核成功',
            data: user
        });
    } catch (error) {
        console.error('审核用户失败:', error);
        res.status(500).json({
            success: false,
            message: '审核用户失败',
            error: error.message
        });
    }
});

export default router;