import express from 'express';

import { supabase } from '../supabaseClient.js'; // Changed import
import { updateUserPassword, getUserOrganizationMemberships, getActiveUsersList, getAllActiveUsers } from '../services/userService.js';

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
            // Use result.status if provided by service, otherwise default to 500
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('更改密码路由处理失败:', error);
        // Generic error message for any other unexpected errors from the service call
        res.status(500).json({ success: false, message: '更改密码时发生服务器内部错误。' });
    }
});

// GET /me/organizations - Fetch organizations for the current user
router.get('/me/organizations', async (req, res) => {
    try {
        const { userId } = req.body; // Extracted from token by authenticateToken middleware
        if (!userId) {
            // This case should ideally be handled by authenticateToken ensuring user is present
            return res.status(401).json({ success: false, message: '用户未认证或用户ID缺失。' });
        }

        // Call the service function to get organization memberships
        // Assuming userService.getUserOrganizationMemberships will be implemented
        const memberships = await getUserOrganizationMemberships(userId);

        res.status(200).json({
            success: true,
            data: memberships
        });
    } catch (error) {
        console.error(`Error fetching organizations for user ${req.user?.id}:`, error);
        res.status(500).json({
            success: false,
            message: '获取用户组织信息失败。',
            error: error.message // Provide error message for debugging if appropriate
        });
    }
});

router.get('/all', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await getAllActiveUsers({ page, limit });

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

// GET /list - Fetch a simple list of active users (id and username)
router.get('/list', async (req, res) => {
    try {
        // The new service function already filters by active status and selects specific fields
        const result = await getActiveUsersList();

        if (result.success) {
            res.json({
                success: true,
                data: result.data // result.data is expected to be an array of {id, username}
            });
        } else {
            // Use result.status if provided by service, otherwise default to 500
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        // This catch block is for truly unexpected errors, not for errors handled and returned by the service
        console.error('获取用户列表路由 (/list) 处理失败:', error);
        res.status(500).json({ success: false, message: '获取用户列表时发生服务器内部错误。' });
    }
});

export default router;