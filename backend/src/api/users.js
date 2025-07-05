import express from 'express';

import { supabase } from '../supabaseClient.js';
import {
    getUserList,
    getUserById,
    createUser,
    updateUserStatus,
    updateUserRole,
    updateUserPassword,
    deleteUser,
    verifyLogin,
    registerUser,
    loginUser
} from '../services/userService.js';

const router = express.Router();

// POST /me/password - Change current user's password
router.post('/me/password', async (req, res) => {
    const { password: newPassword, userId } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: '新密码不能为空且长度至少为6位。'
        });
    }

    try {
        const result = await updateUserPassword(userId, newPassword);

        if (result.success) {
            res.json({ success: true, message: '密码更新成功。' });
        } else {
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('更改密码路由处理失败:', error);
        res.status(500).json({ success: false, message: '更改密码时发生服务器内部错误。' });
    }
});

// GET /users/all - Fetch a list of users, filterable by status
router.get('/all', async (req, res) => {
    try {
        const result = await getUserList(req.query);
        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败',
            error: error.message
        });
    }
});

// GET /users/admin - Fetch admin users (or all users for admin panel)
router.get('/admin', async (req, res) => {
    try {
        const result = await getUserList(req.query);
        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('获取公共用户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败',
            error: error.message
        });
    }
});

// GET /users/list - Fetch a simple list of active users (id and username)
router.get('/list', async (req, res) => {
    try {
        const result = await getActiveUsersList();
        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('获取用户列表路由 (/list) 处理失败:', error);
        res.status(500).json({ success: false, message: '获取用户列表时发生服务器内部错误。' });
    }
});

// GET /users/:userId - Get user by ID
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }
    try {
        const result = await getUserById(userId);
        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('获取用户信息路由处理失败:', error);
        res.status(500).json({ success: false, message: `获取用户信息处理失败: ${error.message}` });
    }
});

// PUT /users/:userId/status - Update user status
router.put('/:userId/status', async (req, res) => {
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
        console.error('更新用户状态路由处理失败:', error);
        res.status(500).json({ success: false, message: `更新用户状态处理失败: ${error.message}` });
    }
});

// PUT /users/:userId/role - Update user role
router.put('/:userId/role', async (req, res) => {
    const { userId } = req.params;
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
        console.error('更新用户角色路由处理失败:', error);
        res.status(500).json({ success: false, message: `更新用户角色处理失败: ${error.message}` });
    }
});

export default router;