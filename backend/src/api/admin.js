/*
 * 管理员相关API路由
 */
import express from 'express';
import { getUserList, getUserById, updateUserStatus, updateUserRole, updateUserPassword, deleteUser } from '../services/userService.js';

const router = express.Router();

// GET /admin/users - 获取用户列表
router.get('/users', async (req, res) => {
    try {
        const result = await getUserList(req.query);
        if (result.success) {
            // 兼容前端分页结构
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const total = result.data.length;
            const totalPages = Math.ceil(total / limit) || 1;
            res.json({
                success: true,
                data: {
                    data: result.data,
                    total,
                    page,
                    totalPages
                }
            });
        } else {
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: '获取用户列表失败', error: error.message });
    }
});

// PUT /admin/users/:userId/status - 更新用户状态
router.put('/users/:userId/status', async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;
    if (!userId || !status) {
        return res.status(400).json({ success: false, message: '用户ID和状态不能为空' });
    }
    try {
        const result = await updateUserStatus(userId, status);
        if (result.success) {
            res.json({ success: true, message: '用户状态更新成功' });
        } else {
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: `更新用户状态处理失败: ${error.message}` });
    }
});

// PUT /admin/users/:userId/role - 更新用户角色
router.put('/users/:userId/role', async (req, res) => {
    const userId = req.params.userId;
    const { role } = req.body;
    if (!userId || !role) {
        return res.status(400).json({ success: false, message: '用户ID和角色不能为空' });
    }
    try {
        const result = await updateUserRole(userId, role);
        if (result.success) {
            res.json({ success: true, message: '用户角色更新成功' });
        } else {
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: `更新用户角色处理失败: ${error.message}` });
    }
});

// PUT /admin/users/:userId/password - 管理员重置用户密码
router.put('/users/:userId/password', async (req, res) => {
    const { userId } = req.params;
    const { password } = req.body;
    if (!userId || !password || password.length < 6) {
        return res.status(400).json({ success: false, message: '用户ID和新密码（至少6位）不能为空' });
    }
    try {
        const result = await updateUserPassword(userId, password);
        if (result.success) {
            res.json({ success: true, message: '密码重置成功' });
        } else {
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: `重置密码失败: ${error.message}` });
    }
});

// DELETE /admin/users/:userId - 删除用户
router.delete('/users/:userId', async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }
    try {
        const result = await deleteUser(userId);
        if (result.success) {
            res.json({ success: true, message: '用户删除成功' });
        } else {
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: `删除用户失败: ${error.message}` });
    }
});

export default router;
