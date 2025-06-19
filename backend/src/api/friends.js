import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
    listFriends,
    listFriendRequests,
    sendFriendRequest,
    manageFriendRequest,
    removeFriend,
    blockUser,
} from '../services/friendService.js';

const router = express.Router();

// GET /friends - List all accepted friends
router.get('/friends', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const result = await listFriends(currentUserId);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('获取好友列表路由处理失败:', error);
        res.status(500).json({ success: false, message: '获取好友列表路由处理失败', error: error.message });
    }
});

// GET /friend-requests - List incoming friend requests
router.get('/friend-requests', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const result = await listFriendRequests(currentUserId);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('获取好友请求路由处理失败:', error);
        res.status(500).json({ success: false, message: '获取好友请求路由处理失败', error: error.message });
    }
});

// POST /friend-requests/:username - Send a friend request
router.post('/friend-requests/:username', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const targetUsername = req.params.username;

        if (!targetUsername) {
             return res.status(400).json({ success: false, message: '目标用户名不能为空' });
        }

        const result = await sendFriendRequest(currentUserId, targetUsername);

        if (result.success) {
            res.status(201).json({ success: true, message: '好友请求已发送', data: result.data });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('发送好友请求路由处理失败:', error);
        res.status(500).json({ success: false, message: '发送好友请求路由处理失败', error: error.message });
    }
});

// PUT /friend-requests/:friendshipId - Accept or reject a friend request
router.put('/friend-requests/:friendshipId', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const friendshipId = req.params.friendshipId;
        const { action } = req.body; // 'accept' or 'reject'

        if (!friendshipId) {
            return res.status(400).json({ success: false, message: '好友关系ID不能为空' });
        }
        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: '无效的操作' });
        }

        const result = await manageFriendRequest(currentUserId, friendshipId, action);

        if (result.success) {
            res.json({ success: true, message: result.message });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('处理好友请求路由处理失败:', error);
        res.status(500).json({ success: false, message: '处理好友请求路由处理失败', error: error.message });
    }
});

// DELETE /friends/:friendId - Remove an accepted friend
router.delete('/friends/:friendId', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const friendToRemoveId = req.params.friendId;

        if (!friendToRemoveId) {
            return res.status(400).json({ success: false, message: '好友ID不能为空' });
        }

        const result = await removeFriend(currentUserId, friendToRemoveId);

        if (result.success) {
            res.json({ success: true, message: result.message });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('删除好友路由处理失败:', error);
        res.status(500).json({ success: false, message: '删除好友路由处理失败', error: error.message });
    }
});

// POST /block/:userId - Block a user
router.post('/block/:userId', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const userToBlockId = req.params.userId;

        if (!userToBlockId) {
            return res.status(400).json({ success: false, message: '用户ID不能为空' });
        }

        const result = await blockUser(currentUserId, userToBlockId);

        if (result.success) {
            res.json({ success: true, message: result.message });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('拉黑用户路由处理失败:', error);
        res.status(500).json({ success: false, message: '拉黑用户路由处理失败', error: error.message });
    }
});

export default router;
