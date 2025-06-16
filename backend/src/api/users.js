import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabase } from '../supabaseClient.js'; // Changed import

const router = express.Router();
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