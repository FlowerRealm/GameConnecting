import express from 'express';

import { supabase } from '../supabaseClient.js'; // Standard Supabase client
import { supabaseAdmin } from '../supabaseAdminClient.js'; // Admin client with SERVICE_ROLE_KEY
import { getIoInstance } from '../socket/index.js';
import { setCache, getCache, deleteCache } from '../utils/cache.js';

const router = express.Router();

// GET /users - List all users with pagination
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const cacheKey = `users_page_${page}_limit_${limit}`;

        const cachedData = getCache(cacheKey);
        if (cachedData) {
            return res.json({ success: true, data: cachedData });
        }

        const { data: users, error, count } = await supabase
            .from('user_profiles')
            .select(`
                id,
                username,
                note,
                role,
                status,
                created_at,
                admin_note,
                approved_at,
                approved_by
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // Collect all unique approved_by IDs
        const approvedByIds = [...new Set(users.map(user => user.approved_by).filter(Boolean))];
        let approverUsernames = new Map();

        if (approvedByIds.length > 0) {
            const { data: approvers, error: approversError } = await supabase
                .from('user_profiles')
                .select('id, username')
                .in('id', approvedByIds);

            if (approversError) {
                console.error('Error fetching approver usernames:', approversError);
            } else if (approvers) {
                approvers.forEach(approver => {
                    approverUsernames.set(approver.id, approver.username);
                });
            }
        }

        // Augment users with approver usernames
        const augmentedUsers = users.map(user => ({
            ...user,
            approvedByUsername: approverUsernames.get(user.approved_by) || null
        }));

        const totalPages = Math.ceil((count || 0) / limit);

        const responseData = {
            users: augmentedUsers,
            total: count || 0,
            page,
            totalPages,
            limit
        };

        setCache(cacheKey, responseData, 30000); // Cache for 30 seconds

        res.json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({ success: false, message: '获取用户列表失败', error: error.message });
    }
});

// PUT /users/:id - Update user status or role
router.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { status, role } = req.body;

    if (!status && !role) {
        return res.status(400).json({ success: false, message: '需要提供状态或角色' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (role) updateData.role = role;
    updateData.updated_at = new Date().toISOString();

    try {
        const { data: updatedUser, error } = await supabase
            .from('user_profiles')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // No rows returned
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            throw error;
        }
        if (!updatedUser) return res.status(404).json({ success: false, message: '用户不存在或更新失败' });

        // Invalidate user list cache
        deleteCache('users_page_'); // Clear all user list caches

        res.json({ success: true, message: '用户更新成功', data: updatedUser });
    } catch (error) {
        console.error('更新用户失败:', error);
        res.status(500).json({ success: false, message: '更新用户失败', error: error.message });
    }
});

// DELETE /users/:id - Delete a user
router.delete('/users/:id', async (req, res) => {
    const userIdToDelete = req.params.id;

    try {
        // Use the admin client to delete the user from Supabase Auth.
        // This requires the SERVICE_ROLE_KEY.
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

        if (deleteAuthError) {
            if (deleteAuthError.message.toLowerCase().includes('user not found')) {
                 return res.status(404).json({ success: false, message: 'Supabase Auth中用户不存在' });
            }
            console.error('Supabase Admin Delete User Error:', deleteAuthError);
            return res.status(500).json({ success: false, message: '删除用户操作失败，请检查Service Role Key配置或用户保护设置' });
        }

        // The ON DELETE CASCADE on user_profiles.id should handle deleting the user_profile row.

        res.json({ success: true, message: '用户已成功删除' });
        deleteCache('users_page_'); // Invalidate user list cache
    } catch (error) {
        console.error('删除用户失败:', error);
        res.status(500).json({ success: false, message: `删除用户失败: ${error.message}` });
    }
});

// GET /servers - List all servers with owner info
router.get('/servers', async (req, res) => {
    try {
        const cacheKey = 'servers_list';
        const cachedData = getCache(cacheKey);
        if (cachedData) {
            return res.json({ success: true, data: cachedData });
        }

        const { data: servers, error } = await supabase
            .from('rooms')
            .select(`
                *,
                creator_id
            `);

        if (error) throw error;

        // Collect all unique creator_ids
        const creatorIds = [...new Set(servers.map(server => server.creator_id).filter(Boolean))];
        let creatorUsernames = new Map();

        if (creatorIds.length > 0) {
            const { data: creators, error: creatorsError } = await supabase
                .from('user_profiles')
                .select('id, username')
                .in('id', creatorIds);

            if (creatorsError) {
                console.error('Error fetching creator usernames:', creatorsError);
            } else if (creators) {
                creators.forEach(creator => {
                    creatorUsernames.set(creator.id, creator.username);
                });
            }
        }

        // Augment servers with creator usernames
        const augmentedServers = servers.map(server => ({
            ...server,
            creatorUsername: creatorUsernames.get(server.creator_id) || null
        }));

        setCache(cacheKey, augmentedServers, 30000); // Cache for 30 seconds

        res.json({ success: true, data: augmentedServers || [] });
    } catch (error) {
        console.error('获取服务器列表失败 (admin):', error);
        res.status(500).json({ success: false, message: '获取服务器列表失败', error: error.message });
    }
});

// GET /pending-users - List users with 'pending' status
router.get('/pending-users', async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('user_profiles')
            .select('id, username, note, status, created_at')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: users || [] });
    } catch (error) {
        console.error('获取待审核用户列表失败:', error);
        res.status(500).json({ success: false, message: '获取待审核用户列表失败', error: error.message });
    }
});

// POST /review-user/:id - Approve or reject a user's registration
router.post('/review-user/:id', async (req, res) => {
    const targetUserId = req.params.id;
    const { status, admin_note, reviewerUserId } = req.body; // status: 'active' (approved) or 'banned'/'suspended' (rejected variants)

    if (!status || !['active', 'suspended', 'banned'].includes(status)) {
        return res.status(400).json({ success: false, message: "无效的状态值。请使用 'active', 'suspended', 或 'banned'." });
    }

    try {
        const { data: userToReview, error: fetchError } = await supabase
            .from('user_profiles')
            .select('id, username, note, status, created_at') // Select fields needed for socket event
            .eq('id', targetUserId)
            .single();

        if (fetchError || !userToReview) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        if (userToReview.status !== 'pending' && status === 'active') {
            // If admin is trying to 'activate' an already non-pending user, perhaps just update admin_note.
            // Or restrict this endpoint strictly for 'pending' users. For now, allow if status changes.
            // return res.status(400).json({ success: false, message: '用户非待审核状态' });
        }


        const updatePayload = {
            status,
            admin_note: admin_note || null,
            approved_by: reviewerUserId,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: updatedUser, error: updateError } = await supabase
            .from('user_profiles')
            .update(updatePayload)
            .eq('id', targetUserId)
            .select('*')
            .single();

        if (updateError) throw updateError;
        if (!updatedUser) return res.status(404).json({ success: false, message: '用户审核更新后未返回数据' });

        const io = getIoInstance();

        let reviewerUsername = '未知用户';
        const { data: reviewerProfile, error: reviewerError } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('id', reviewerUserId)
            .single();

        if (reviewerError) {
            console.error('Error fetching reviewer username:', reviewerError);
        } else if (reviewerProfile) {
            reviewerUsername = reviewerProfile.username;
        }

        // Emit an event to admin room or specific user if needed
        io.to('admin_room').emit('userStatusUpdated', {
            userId: updatedUser.id,
            username: updatedUser.username,
            status: updatedUser.status,
            note: updatedUser.note, // original user note
            adminNote: updatedUser.admin_note, // new admin note for this review
            approvedAt: updatedUser.approved_at,
            approvedBy: { username: reviewerUsername },
            createdAt: updatedUser.created_at
        });

        res.json({ success: true, message: '用户审核成功', data: { ...updatedUser, approvedByUsername: reviewerUsername } });
        deleteCache('users_page_'); // Invalidate user list cache
    } catch (error) {
        console.error('审核用户失败:', error);
        res.status(500).json({ success: false, message: '审核用户失败', error: error.message });
    }
});

export default router;