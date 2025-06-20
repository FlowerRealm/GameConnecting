import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabase } from '../supabaseClient.js'; // Changed import
import { updateUserPassword, getUserOrganizationMemberships } from '../services/userService.js'; // Added getUserOrganizationMemberships

const router = express.Router();

// POST /me/password - Change current user's password
router.post('/me/password', authenticateToken, async (req, res) => {
    const { password: newPassword } = req.body;
    const userId = req.user.id; // From authenticateToken middleware, ensure your middleware sets req.user.id

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
router.get('/me/organizations', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id; // Extracted from token by authenticateToken middleware
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

router.get('/all', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Supabase query
        const { data: users, error, count } = await supabase
            .from('user_profiles') // Target user_profiles table
            .select('id, username, role, created_at', { count: 'exact' }) // Select specified columns and get total count
            .eq('status', 'active') // Filter by status 'active'
            .order('username', { ascending: true }) // Order by username ascending
            .range(offset, offset + limit - 1); // Apply pagination

        if (error) {
            throw error; // Throw error to be caught by catch block
        }

        const totalPages = Math.ceil((count || 0) / limit);

        res.json({
            success: true,
            data: {
                users: users || [], // Ensure users is an array
                total: count || 0,
                page,
                totalPages,
                limit
            }
        });
    } catch (error) {
        console.error('获取公共用户列表失败:', error); // Keep existing logging
        res.status(500).json({
            success: false,
            message: '获取用户列表失败', // Keep existing message
            error: error.message
        });
    }
});

export default router;