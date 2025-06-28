import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { supabase } from '../supabaseClient.js'; // Standard Supabase client
import { supabaseAdmin } from '../supabaseAdminClient.js'; // Admin client with SERVICE_ROLE_KEY
import { getIoInstance } from '../socket/index.js';

const router = express.Router();

// GET /users - List all users with pagination
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

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

        let augmentedUsers = users || [];
        if (augmentedUsers.length > 0) {
            const approverIds = [...new Set(augmentedUsers.map(u => u.approved_by).filter(id => id))];

            if (approverIds.length > 0) {
                const { data: approverProfiles, error: approversError } = await supabase
                    .from('user_profiles')
                    .select('id, username')
                    .in('id', approverIds);

                if (approversError) {
                    console.error('Failed to fetch approver profiles:', approversError);
                    // Decide if this is a fatal error or if we can proceed without approver usernames
                } else if (approverProfiles) {
                    const approverMap = new Map(approverProfiles.map(p => [p.id, p.username]));
                    augmentedUsers = augmentedUsers.map(u => ({
                        ...u,
                        approvedByUsername: u.approved_by ? (approverMap.get(u.approved_by) || '未知用户') : null
                    }));
                }
            }
        }

        const totalPages = Math.ceil((count || 0) / limit);

        res.json({
            success: true,
            data: {
                users: augmentedUsers,
                total: count || 0,
                page,
                totalPages,
                limit
            }
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({ success: false, message: '获取用户列表失败', error: error.message });
    }
});

// PUT /users/:id/status - Update user status
router.put('/users/:id/status', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Expecting 'active', 'pending', 'suspended', 'banned'

    if (!status) {
        return res.status(400).json({ success: false, message: '状态不能为空' });
    }

    try {
        const { data: updatedUser, error } = await supabase
            .from('user_profiles')
            .update({ status, updated_at: new Date().toISOString() })
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


        res.json({ success: true, message: '用户状态更新成功', data: updatedUser });
    } catch (error) {
        console.error('更新用户状态失败:', error);
        res.status(500).json({ success: false, message: '更新用户状态失败', error: error.message });
    }
});

// PUT /users/:id/role - Update user role
router.put('/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body; // Expecting 'user', 'moderator', 'admin'

    if (!role) {
        return res.status(400).json({ success: false, message: '角色不能为空' });
    }

    try {
        const { data: updatedUser, error } = await supabase
            .from('user_profiles')
            .update({ role, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ success: false, message: '用户不存在' });
            }
            throw error;
        }
        if (!updatedUser) return res.status(404).json({ success: false, message: '用户不存在或更新失败' });

        res.json({ success: true, message: '用户角色更新成功', data: updatedUser });
    } catch (error) {
        console.error('更新用户角色失败:', error);
        res.status(500).json({ success: false, message: '更新用户角色失败', error: error.message });
    }
});

// DELETE /users/:id - Delete a user
router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
    const userIdToDelete = req.params.id;

    try {
        // IMPORTANT: supabase.auth.admin.deleteUser() requires SERVICE_ROLE_KEY.
        // The shared supabase client in supabaseClient.js uses ANON_KEY.
        // This call will likely fail if the client isn't elevated.
        // For this subtask, we write it as if it will work.
        // A dedicated admin client or temporary elevation would be needed in a real scenario.
        // Using supabaseAdmin client which should be initialized with SERVICE_ROLE_KEY
        const { data: deleteData, error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

        if (deleteAuthError) {
            // Handle cases like user not found in auth.users, or permission issues
            if (deleteAuthError.message.toLowerCase().includes('user not found')) {
                 return res.status(404).json({ success: false, message: 'Supabase Auth中用户不存在' });
            }
            // Check for specific permission error if possible, though Supabase might return a generic one
            // The supabaseAdmin client should have service role, so permission errors are less likely unless misconfigured.
            if (deleteAuthError.message.toLowerCase().includes('request failed') || deleteAuthError.status === 401 || deleteAuthError.status === 403) {
                console.error('Supabase Admin Delete User Error (SERVICE_ROLE_KEY might be missing/invalid or user has protections):', deleteAuthError);
                return res.status(500).json({ success: false, message: '删除用户操作失败，请检查Service Role Key配置或用户保护设置' });
            }
            throw deleteAuthError;
        }

        // If auth.deleteUser is successful, the ON DELETE CASCADE on user_profiles.id
        // (foreign key to auth.users.id) should handle deleting the user_profile row.
        // If not, or if you need to ensure it, you could add:
        // await supabase.from('user_profiles').delete().eq('id', userIdToDelete);
        // But this should be automatic if DB schema is set up correctly.

        res.json({ success: true, message: '用户已成功删除 (Auth层面)' });
    } catch (error) {
        console.error('删除用户失败:', error);
        res.status(500).json({ success: false, message: `删除用户失败: ${error.message}` });
    }
});

// GET /servers - List all servers with owner info
router.get('/servers', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { data: servers, error } = await supabase
            .from('servers')
            .select(`
                *,
                owner:user_profiles!servers_created_by_fkey (id, username)
            `);

        if (error) throw error;
        res.json({ success: true, data: servers || [] });
    } catch (error) {
        console.error('获取服务器列表失败 (admin):', error);
        res.status(500).json({ success: false, message: '获取服务器列表失败', error: error.message });
    }
});

// GET /pending-users - List users with 'pending' status
router.get('/pending-users', authenticateToken, isAdmin, async (req, res) => {
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
router.post('/review-user/:id', authenticateToken, isAdmin, async (req, res) => {
    const targetUserId = req.params.id;
    const { status, admin_note } = req.body; // status: 'active' (approved) or 'banned'/'suspended' (rejected variants)
    const reviewerUserId = req.user.id; // Admin's ID from token

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
            .select('*, approvedByUser:user_profiles!user_profiles_approved_by_fkey(username)') // Re-fetch with approvedBy username
            .single();

        if (updateError) throw updateError;
        if (!updatedUser) return res.status(404).json({ success: false, message: '用户审核更新后未返回数据' });


        const io = getIoInstance();
        // Emit an event to admin room or specific user if needed
        io.to('admin_room').emit('userStatusUpdated', {
            userId: updatedUser.id,
            username: updatedUser.username,
            status: updatedUser.status,
            note: updatedUser.note, // original user note
            adminNote: updatedUser.admin_note, // new admin note for this review
            approvedAt: updatedUser.approved_at,
            approvedBy: updatedUser.approvedByUser ? { username: updatedUser.approvedByUser.username } : { username: '未知' },
            createdAt: updatedUser.created_at
        });

        res.json({ success: true, message: '用户审核成功', data: updatedUser });
    } catch (error) {
        console.error('审核用户失败:', error);
        res.status(500).json({ success: false, message: '审核用户失败', error: error.message });
    }
});

export default router;