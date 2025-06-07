import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { Op } from 'sequelize';
import { db } from '../db/index.js';

const router = express.Router();

router.get('/friends', authenticateToken, async (req, res) => {
    try {
        const friendships = await db.Friendship.findAll({
            where: {
                [Op.or]: [
                    { userId: req.user.userId },
                    { friendId: req.user.userId }
                ],
                status: 'accepted'
            },
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'username']
                },
                {
                    model: db.User,
                    as: 'friend',
                    attributes: ['id', 'username']
                }
            ]
        });

        const friends = friendships.map(friendship => {
            const friend = friendship.userId === req.user.userId
                ? friendship.friend
                : friendship.user;
            return {
                id: friend.id,
                username: friend.username
            };
        });

        res.json({
            success: true,
            data: friends
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取好友列表失败',
            error: error.message
        });
    }
});

router.get('/friend-requests', authenticateToken, async (req, res) => {
    try {
        const requests = await db.Friendship.findAll({
            where: {
                friendId: req.user.userId,
                status: 'pending'
            },
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'username']
                }
            ]
        });

        res.json({
            success: true,
            data: requests.map(request => ({
                id: request.id,
                user: request.user
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取好友请求失败',
            error: error.message
        });
    }
});

router.post('/friend-requests/:username', authenticateToken, async (req, res) => {
    try {
        const friend = await db.User.findOne({
            where: { username: req.params.username }
        });

        if (!friend) {
            return res.status(404).json({
                success: false,
                message: '未找到该用户'
            });
        }

        if (friend.id === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: '不能添加自己为好友'
            });
        }

        const existingFriendship = await db.Friendship.findOne({
            where: {
                [Op.or]: [
                    {
                        userId: req.user.userId,
                        friendId: friend.id
                    },
                    {
                        userId: friend.id,
                        friendId: req.user.userId
                    }
                ]
            }
        });

        if (existingFriendship) {
            if (existingFriendship.status === 'accepted') {
                return res.status(400).json({
                    success: false,
                    message: '你们已经是好友了'
                });
            }
            if (existingFriendship.status === 'pending') {
                return res.status(400).json({
                    success: false,
                    message: '已经发送过好友请求了'
                });
            }
            if (existingFriendship.status === 'blocked') {
                return res.status(403).json({
                    success: false,
                    message: '无法添加该用户为好友'
                });
            }
        }

        const friendship = await db.Friendship.create({
            userId: req.user.userId,
            friendId: friend.id,
            status: 'pending',
            actionUserId: req.user.userId
        });

        res.status(201).json({
            success: true,
            message: '好友请求已发送',
            data: friendship
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '发送好友请求失败',
            error: error.message
        });
    }
});

router.put('/friend-requests/:friendshipId', authenticateToken, async (req, res) => {
    try {
        const { action } = req.body;
        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: '无效的操作'
            });
        }

        const friendship = await db.Friendship.findOne({
            where: {
                id: req.params.friendshipId,
                friendId: req.user.userId,
                status: 'pending'
            }
        });

        if (!friendship) {
            return res.status(404).json({
                success: false,
                message: '好友请求不存在'
            });
        }

        if (action === 'accept') {
            await friendship.update({
                status: 'accepted',
                actionUserId: req.user.userId
            });
            res.json({
                success: true,
                message: '已接受好友请求'
            });
        } else {
            await friendship.destroy();
            res.json({
                success: true,
                message: '已拒绝好友请求'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '处理好友请求失败',
            error: error.message
        });
    }
});

router.delete('/friends/:friendId', authenticateToken, async (req, res) => {
    try {
        const friendship = await db.Friendship.findOne({
            where: {
                [Op.or]: [
                    {
                        userId: req.user.userId,
                        friendId: req.params.friendId
                    },
                    {
                        userId: req.params.friendId,
                        friendId: req.user.userId
                    }
                ],
                status: 'accepted'
            }
        });

        if (!friendship) {
            return res.status(404).json({
                success: false,
                message: '好友关系不存在'
            });
        }

        await friendship.destroy();

        res.json({
            success: true,
            message: '已删除好友'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '删除好友失败',
            error: error.message
        });
    }
});

router.post('/block/:userId', authenticateToken, async (req, res) => {
    try {
        const targetUser = await db.User.findByPk(req.params.userId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const existingBlock = await db.Friendship.findOne({
            where: {
                [Op.or]: [
                    {
                        userId: req.user.userId,
                        friendId: targetUser.id
                    },
                    {
                        userId: targetUser.id,
                        friendId: req.user.userId
                    }
                ],
                status: 'blocked'
            }
        });

        if (existingBlock) {
            return res.status(400).json({
                success: false,
                message: '已经拉黑该用户'
            });
        }

        await db.Friendship.destroy({
            where: {
                [Op.or]: [
                    {
                        userId: req.user.userId,
                        friendId: targetUser.id
                    },
                    {
                        userId: targetUser.id,
                        friendId: req.user.userId
                    }
                ]
            }
        });

        await db.Friendship.create({
            userId: req.user.userId,
            friendId: targetUser.id,
            status: 'blocked',
            actionUserId: req.user.userId
        });

        res.json({
            success: true,
            message: '已拉黑该用户'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '拉黑用户失败',
            error: error.message
        });
    }
});

export default router;
