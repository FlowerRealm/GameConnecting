import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../db/index.js';

const router = express.Router();
router.get('/all', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { count, rows: users } = await db.User.findAndCountAll({
            where: { status: 'approved' },
            attributes: ['id', 'username', 'role', 'createdAt'],
            limit,
            offset,
            order: [['username', 'ASC']]
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
        console.error('获取公共用户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败',
            error: error.message
        });
    }
});

export default router;