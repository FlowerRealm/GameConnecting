import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// Helper to ensure user_id_1 < user_id_2 for consistency
const getOrderedUserIds = (id1, id2) => {
    if (id1 < id2) {
        return { userId1: id1, userId2: id2 };
    }
    return { userId1: id2, userId2: id1 };
};

// GET /friends - List all accepted friends
router.get('/friends', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;

        const { data, error } = await supabase
            .from('friendships')
            .select(`
                id,
                user_id_1,
                user_id_2,
                user_profiles_user_id_1:user_profiles!friendships_user_id_1_fkey (id, username),
                user_profiles_user_id_2:user_profiles!friendships_user_id_2_fkey (id, username)
            `)
            .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`)
            .eq('status', 'accepted');

        if (error) throw error;

        const friends = data.map(friendship => {
            const friendProfile = friendship.user_id_1 === currentUserId
                ? friendship.user_profiles_user_id_2
                : friendship.user_profiles_user_id_1;
            return {
                id: friendProfile.id,
                username: friendProfile.username,
                friendship_id: friendship.id // Include friendship_id if needed for deletion etc.
            };
        });

        res.json({ success: true, data: friends });
    } catch (error) {
        console.error('获取好友列表失败:', error);
        res.status(500).json({ success: false, message: '获取好友列表失败', error: error.message });
    }
});

// GET /friend-requests - List incoming friend requests
router.get('/friend-requests', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const { data, error } = await supabase
            .from('friendships')
            .select(`
                id,
                status,
                action_user_id,
                user_profiles_user_id_1:user_profiles!friendships_user_id_1_fkey (id, username)
            `)
            .eq('user_id_2', currentUserId) // Current user is the recipient
            .eq('status', 'pending')
            .neq('action_user_id', currentUserId); // Request was initiated by the other user

        if (error) throw error;

        const requests = data.map(request => ({
            id: request.id, // This is the friendship_id
            user: { // This is the sender
                id: request.user_profiles_user_id_1.id,
                username: request.user_profiles_user_id_1.username
            }
        }));
        res.json({ success: true, data: requests });
    } catch (error) {
        console.error('获取好友请求失败:', error);
        res.status(500).json({ success: false, message: '获取好友请求失败', error: error.message });
    }
});

// POST /friend-requests/:username - Send a friend request
router.post('/friend-requests/:username', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const targetUsername = req.params.username;

        const { data: targetUser, error: targetUserError } = await supabase
            .from('user_profiles')
            .select('id, username')
            .eq('username', targetUsername)
            .single();

        if (targetUserError || !targetUser) {
            return res.status(404).json({ success: false, message: '未找到该用户' });
        }
        if (targetUser.id === currentUserId) {
            return res.status(400).json({ success: false, message: '不能添加自己为好友' });
        }

        const { userId1, userId2 } = getOrderedUserIds(currentUserId, targetUser.id);

        const { data: existingFriendship, error: existingError } = await supabase
            .from('friendships')
            .select('status, action_user_id')
            .eq('user_id_1', userId1)
            .eq('user_id_2', userId2)
            .single();

        if (existingError && existingError.code !== 'PGRST116') { // PGRST116: 0 rows
             throw existingError;
        }

        if (existingFriendship) {
            if (existingFriendship.status === 'accepted') {
                return res.status(400).json({ success: false, message: '你们已经是好友了' });
            }
            if (existingFriendship.status === 'pending') {
                 // If current user was the action_user_id, it's a duplicate.
                 // If targetUser was the action_user_id, current user can accept (but this endpoint is for sending).
                if (existingFriendship.action_user_id === currentUserId) {
                    return res.status(400).json({ success: false, message: '已经发送过好友请求了' });
                } else {
                    return res.status(400).json({ success: false, message: '对方已向你发送好友请求，请在请求列表中处理' });
                }
            }
            if (existingFriendship.status === 'blocked') {
                // If current user was the one who blocked (action_user_id)
                if (existingFriendship.action_user_id === currentUserId) {
                     return res.status(403).json({ success: false, message: '你已拉黑该用户，无法发送好友请求。请先解除拉黑。' });
                } else { // Current user was blocked by targetUser
                     return res.status(403).json({ success: false, message: '无法添加该用户为好友（对方已拉黑你）' });
                }
            }
        }

        const { data: newFriendship, error: insertError } = await supabase
            .from('friendships')
            .insert({
                user_id_1: userId1,
                user_id_2: userId2,
                status: 'pending',
                action_user_id: currentUserId
            })
            .select()
            .single();

        if (insertError) throw insertError;

        res.status(201).json({ success: true, message: '好友请求已发送', data: newFriendship });
    } catch (error) {
        console.error('发送好友请求失败:', error);
        res.status(500).json({ success: false, message: '发送好友请求失败', error: error.message });
    }
});

// PUT /friend-requests/:friendshipId - Accept or reject a friend request
router.put('/friend-requests/:friendshipId', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const friendshipId = req.params.friendshipId;
        const { action } = req.body; // 'accept' or 'reject'

        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: '无效的操作' });
        }

        const { data: friendship, error: fetchError } = await supabase
            .from('friendships')
            .select('*')
            .eq('id', friendshipId)
            .eq('user_id_2', currentUserId) // Current user must be the recipient
            .eq('status', 'pending')
            .single();

        if (fetchError || !friendship) {
            return res.status(404).json({ success: false, message: '好友请求不存在或无权操作' });
        }

        // Ensure the current user wasn't the one who sent the request initially
        if (friendship.action_user_id === currentUserId) {
             return res.status(403).json({ success: false, message: '不能操作自己发送的请求' });
        }

        if (action === 'accept') {
            const { error: updateError } = await supabase
                .from('friendships')
                .update({ status: 'accepted', action_user_id: currentUserId })
                .eq('id', friendshipId);

            if (updateError) throw updateError;
            res.json({ success: true, message: '已接受好友请求' });
        } else { // reject
            const { error: deleteError } = await supabase
                .from('friendships')
                .delete()
                .eq('id', friendshipId);

            if (deleteError) throw deleteError;
            res.json({ success: true, message: '已拒绝好友请求' });
        }
    } catch (error) {
        console.error('处理好友请求失败:', error);
        res.status(500).json({ success: false, message: '处理好友请求失败', error: error.message });
    }
});

// DELETE /friends/:friendId - Remove an accepted friend
router.delete('/friends/:friendId', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const friendToRemoveId = req.params.friendId;

        const { userId1, userId2 } = getOrderedUserIds(currentUserId, friendToRemoveId);

        const { error } = await supabase
            .from('friendships')
            .delete()
            .eq('user_id_1', userId1)
            .eq('user_id_2', userId2)
            .eq('status', 'accepted');
            // We don't check count here, if no record matched, it's not an error, just nothing deleted.

        if (error) throw error;

        res.json({ success: true, message: '已删除好友' });
    } catch (error) {
        console.error('删除好友失败:', error);
        res.status(500).json({ success: false, message: '删除好友失败', error: error.message });
    }
});

// POST /block/:userId - Block a user
router.post('/block/:userId', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const userToBlockId = req.params.userId;

        if (userToBlockId === currentUserId) {
            return res.status(400).json({ success: false, message: '不能拉黑自己' });
        }

        const { data: targetUser, error: targetUserError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', userToBlockId)
            .single();

        if (targetUserError || !targetUser) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        const { userId1, userId2 } = getOrderedUserIds(currentUserId, userToBlockId);

        // Remove any existing friendship (accepted, pending) before blocking
        const { error: deleteError } = await supabase
            .from('friendships')
            .delete()
            .eq('user_id_1', userId1)
            .eq('user_id_2', userId2)
            .neq('status', 'blocked'); // Don't delete if already blocked by the other user

        if (deleteError) {
            // It's okay if no record was found to delete (PGRST116)
            if (deleteError.code !== 'PGRST116') {
                throw deleteError;
            }
        }

        // Insert new 'blocked' record or update if one existed (upsert might be an option too)
        const { error: blockError } = await supabase
            .from('friendships')
            .upsert({
                user_id_1: userId1,
                user_id_2: userId2,
                status: 'blocked',
                action_user_id: currentUserId
            }, {
                onConflict: 'user_id_1, user_id_2', // Assumes unique constraint on (user_id_1, user_id_2)
            });


        if (blockError) throw blockError;

        res.json({ success: true, message: '已拉黑该用户' });
    } catch (error) {
        console.error('拉黑用户失败:', error);
        res.status(500).json({ success: false, message: '拉黑用户失败', error: error.message });
    }
});

export default router;
