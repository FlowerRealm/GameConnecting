import express from 'express';
import { supabase } from '../supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js'; // Assuming verifyServerAccess is removed/merged
import { getActiveServersInfo } from '../socket/index.js'; // This function needs to be Supabase compatible or its usage re-evaluated

const router = express.Router();

// Helper function to check if a user is a server owner or site admin
async function checkServerAdminOrOwner(serverId, userId) {
    const { data: server, error: serverError } = await supabase
        .from('servers')
        .select('created_by')
        .eq('id', serverId)
        .single();

    if (serverError || !server) return { isOwner: false, isAdmin: false, error: serverError || new Error('Server not found') };

    const isOwner = server.created_by === userId;
    if (isOwner) return { isOwner: true, isAdmin: false, server }; // Pass server data if needed

    const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (profileError || !userProfile) return { isOwner: false, isAdmin: false, error: profileError || new Error('User profile not found')};

    const isAdmin = userProfile.role === 'admin';
    return { isOwner, isAdmin, server }; // Return server for context
}


// GET / - List all servers with online count
router.get('/', async (req, res) => {
    try {
        const { data: serversFromDb, error } = await supabase
            .from('servers')
            .select('*');

        if (error) throw error;

        const activeServersData = getActiveServersInfo(); // This might need re-evaluation with Supabase

        const serversWithOnlineCount = serversFromDb.map(server => ({
            ...server,
            onlineMembers: activeServersData[String(server.id)]?.onlineMemberCount || 0,
        }));

        res.json({ success: true, data: serversWithOnlineCount });
    } catch (error) {
        console.error('获取服务器列表失败:', error);
        res.status(500).json({ success: false, message: '获取服务器列表失败', error: error.message });
    }
});

// GET /joined - List servers joined by the user
router.get('/joined', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const { data, error } = await supabase
            .from('server_members')
            .select(`
                role,
                joined_at,
                last_active,
                servers (*)
            `)
            .eq('user_id', currentUserId);

        if (error) throw error;

        const joinedServers = data.map(sm => ({
            ...sm.servers, // server details
            role_in_server: sm.role, // user's role in this server
            joined_at_server: sm.joined_at,
            last_active_in_server: sm.last_active,
        }));

        res.json({ success: true, data: joinedServers });
    } catch (error) {
        console.error('获取用户加入的服务器失败:', error);
        res.status(500).json({ success: false, message: '获取用户加入的服务器失败', error: error.message });
    }
});

// POST / - Create a new server
router.post('/', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const { name, description } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: '服务器名称不能为空' });
        }

        const { data: newServer, error: serverError } = await supabase
            .from('servers')
            .insert({ name, description, created_by: currentUserId })
            .select()
            .single();

        if (serverError) throw serverError;
        if (!newServer) throw new Error('Server creation failed to return data.');


        const { error: memberError } = await supabase
            .from('server_members')
            .insert({
                user_id: currentUserId,
                server_id: newServer.id,
                role: 'owner'
            });

        if (memberError) {
            // Attempt to clean up server if member creation fails
            await supabase.from('servers').delete().eq('id', newServer.id);
            throw memberError;
        }

        res.status(201).json({ success: true, data: newServer });
    } catch (error) {
        console.error('创建服务器失败:', error);
        res.status(400).json({ success: false, message: '创建服务器失败', error: error.message });
    }
});

// POST /:id/join - Request to join a server
router.post('/:id/join', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const serverId = req.params.id;

        const { data: server, error: serverError } = await supabase
            .from('servers')
            .select('id')
            .eq('id', serverId)
            .single();

        if (serverError || !server) {
            return res.status(404).json({ success: false, message: '服务器未找到' });
        }

        const { data: existingMember, error: memberError } = await supabase
            .from('server_members')
            .select('id')
            .eq('user_id', currentUserId)
            .eq('server_id', serverId)
            .single();

        if (memberError && memberError.code !== 'PGRST116') throw memberError; // PGRST116: 0 rows
        if (existingMember) {
            return res.status(200).json({ success: true, message: '您已经是该服务器的成员' });
        }

        const { data: existingRequest, error: requestError } = await supabase
            .from('server_join_requests')
            .select('id')
            .eq('user_id', currentUserId)
            .eq('server_id', serverId)
            .eq('status', 'pending') // Check for active pending requests
            .single();

        if (requestError && requestError.code !== 'PGRST116') throw requestError;
        if (existingRequest) {
            return res.status(400).json({ success: false, message: '您已提交过加入申请，请等待审核。' });
        }

        const { error: insertReqError } = await supabase
            .from('server_join_requests')
            .insert({ user_id: currentUserId, server_id: serverId, status: 'pending' });

        if (insertReqError) throw insertReqError;

        return res.status(200).json({ success: true, message: '申请已发送，请等待服主审核。' });
    } catch (error) {
        console.error(`用户 ${req.user.userId} 加入服务器 ${req.params.id} 失败:`, error);
        return res.status(500).json({ success: false, message: '加入服务器操作失败，请稍后重试。' });
    }
});

// POST /:id/leave - Leave a server
router.post('/:id/leave', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const serverId = req.params.id;

        const { data: member, error: memberError } = await supabase
            .from('server_members')
            .select('role')
            .eq('user_id', currentUserId)
            .eq('server_id', serverId)
            .single();

        if (memberError && memberError.code !== 'PGRST116') throw memberError;
        if (!member) {
            return res.status(404).json({ success: false, message: '您不是该服务器的成员' });
        }
        if (member.role === 'owner') {
            return res.status(400).json({ success: false, message: '群主不能退出服务器,请先转让群主或删除服务器' });
        }

        const { error: deleteError } = await supabase
            .from('server_members')
            .delete()
            .eq('user_id', currentUserId)
            .eq('server_id', serverId);

        if (deleteError) throw deleteError;

        // Check if server should be deleted (no members left)
        const { count: remainingMembersCount, error: countError } = await supabase
            .from('server_members')
            .select('*', { count: 'exact', head: true })
            .eq('server_id', serverId);

        if (countError) console.error("Failed to count remaining members:", countError); // Log but proceed

        if (remainingMembersCount === 0) {
            const { error: serverDeleteError } = await supabase
                .from('servers')
                .delete()
                .eq('id', serverId);
            if (serverDeleteError) console.error("Failed to delete empty server:", serverDeleteError); // Log
            return res.json({ success: true, message: '成功退出服务器，服务器因无人已删除' });
        }

        res.json({ success: true, message: '成功退出服务器' });
    } catch (error) {
        console.error('退出服务器失败:', error);
        res.status(500).json({ success: false, message: '退出服务器失败', error: error.message });
    }
});

// GET /:id/join-requests - List join requests for a server (owner/admin only)
router.get('/:id/join-requests', authenticateToken, async (req, res) => {
    try {
        const serverId = req.params.id;
        const currentUserId = req.user.userId;

        const access = await checkServerAdminOrOwner(serverId, currentUserId);
        if (access.error || (!access.isOwner && !access.isAdmin)) {
            return res.status(403).json({ success: false, message: '无权查看加入申请' });
        }

        const { data, error } = await supabase
            .from('server_join_requests')
            .select(`
                id,
                requested_at,
                status,
                user_profiles (id, username)
            `)
            .eq('server_id', serverId)
            .eq('status', 'pending');

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('获取加入申请列表失败:', error);
        res.status(500).json({ success: false, message: '获取加入申请列表失败', error: error.message });
    }
});

// POST /:id/join-requests/:requestId - Process a join request (owner/admin only)
router.post('/:id/join-requests/:requestId', authenticateToken, async (req, res) => {
    try {
        const serverId = req.params.id;
        const requestId = req.params.requestId;
        const currentUserId = req.user.userId;
        const { action } = req.body; // 'approve' or 'reject'

        const access = await checkServerAdminOrOwner(serverId, currentUserId);
        if (access.error || (!access.isOwner && !access.isAdmin)) {
            return res.status(403).json({ success: false, message: '无权处理加入申请' });
        }

        const { data: joinRequest, error: requestError } = await supabase
            .from('server_join_requests')
            .select('id, user_id, status')
            .eq('id', requestId)
            .eq('server_id', serverId)
            .single();

        if (requestError && requestError.code !== 'PGRST116') throw requestError;
        if (!joinRequest || joinRequest.status !== 'pending') {
            return res.status(404).json({ success: false, message: '加入申请未找到或已被处理' });
        }

        if (action === 'approve') {
            const { error: memberInsertError } = await supabase
                .from('server_members')
                .insert({ user_id: joinRequest.user_id, server_id: serverId, role: 'member' });

            if (memberInsertError) {
                // Handle potential duplicate if user somehow joined while request was pending
                if (memberInsertError.code === '23505') { // unique_violation
                     console.warn(`User ${joinRequest.user_id} already a member of server ${serverId}. Approving request by removing it.`);
                } else {
                    throw memberInsertError;
                }
            }
            const { error: deleteReqError } = await supabase.from('server_join_requests').delete().eq('id', requestId);
            if (deleteReqError) throw deleteReqError;
            res.json({ success: true, message: '加入申请已批准' });

        } else if (action === 'reject') {
            const { error: deleteReqError } = await supabase.from('server_join_requests').delete().eq('id', requestId);
            if (deleteReqError) throw deleteReqError;
            res.json({ success: true, message: '加入申请已拒绝' });
        } else {
            return res.status(400).json({ success: false, message: '无效的操作' });
        }
    } catch (error) {
        console.error('处理加入申请失败:', error);
        res.status(500).json({ success: false, message: '处理加入申请失败', error: error.message });
    }
});

// GET /:id - Get server details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const serverId = req.params.id;
        const { data: server, error } = await supabase
            .from('servers')
            .select(`
                *,
                server_members (
                    role,
                    joined_at,
                    user_profiles (id, username)
                )
            `)
            .eq('id', serverId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        if (!server) {
            return res.status(404).json({ success: false, message: '服务器未找到' });
        }
        res.json({ success: true, data: server });
    } catch (error) {
        console.error(`获取服务器 ${req.params.id} 详情失败:`, error);
        res.status(500).json({ success: false, message: '获取服务器详情失败', error: error.message });
    }
});

// GET /:id/members - Get server members list
router.get('/:id/members', authenticateToken, async (req, res) => {
    try {
        const serverId = req.params.id;
        const { data, error } = await supabase
            .from('server_members')
            .select(`
                role,
                joined_at,
                last_active,
                user_profiles (id, username)
            `)
            .eq('server_id', serverId);

        if (error) throw error;

        const members = data.map(m => ({
            id: m.user_profiles.id,
            username: m.user_profiles.username,
            role: m.role,
            joined_at: m.joined_at,
            last_active: m.last_active,
        }));
        res.json({ success: true, data: members });
    } catch (error) {
        console.error('获取服务器成员列表失败:', error);
        res.status(500).json({ success: false, message: '获取服务器成员列表失败', error: error.message });
    }
});

// DELETE /:id/members/:memberId - Kick a member (owner/admin only)
router.delete('/:id/members/:memberId', authenticateToken, async (req, res) => {
    try {
        const serverId = req.params.id;
        const memberToKickId = req.params.memberId;
        const currentUserId = req.user.userId;

        const access = await checkServerAdminOrOwner(serverId, currentUserId);
        if (access.error || (!access.isOwner && !access.isAdmin)) {
            return res.status(403).json({ success: false, message: '无权踢出成员' });
        }

        if (access.isOwner && memberToKickId === currentUserId) {
             return res.status(400).json({ success: false, message: '群主不能踢出自己' });
        }

        const { data: memberToKick, error: memberFetchError } = await supabase
            .from('server_members')
            .select('role, user_id')
            .eq('server_id', serverId)
            .eq('user_id', memberToKickId)
            .single();

        if (memberFetchError && memberFetchError.code !== 'PGRST116') throw memberFetchError;
        if (!memberToKick) {
            return res.status(404).json({ success: false, message: '成员未找到' });
        }

        // Site admin can kick anyone except owner if they are not the owner.
        // Owner can kick anyone except themselves.
        if (memberToKick.role === 'owner' && !access.isOwner) { // Site admin trying to kick owner
             return res.status(403).json({ success: false, message: '管理员不能踢出服务器所有者' });
        }
         if (memberToKick.role === 'owner' && access.isOwner && memberToKick.user_id !== currentUserId) {
             // This case should not happen if owner is unique and correctly set.
             // If an owner is trying to kick another "owner" (data inconsistency), prevent.
             return res.status(403).json({ success: false, message: '所有者不能踢出其他所有者角色用户' });
         }


        const { error: deleteError } = await supabase
            .from('server_members')
            .delete()
            .eq('server_id', serverId)
            .eq('user_id', memberToKickId);

        if (deleteError) throw deleteError;
        res.json({ success: true, message: '成员已被踢出' });

    } catch (error) {
        console.error('踢出成员失败:', error);
        res.status(500).json({ success: false, message: '踢出成员失败', error: error.message });
    }
});

// PUT /:id - Update server info (owner/admin only)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const serverId = req.params.id;
        const currentUserId = req.user.userId;
        const { name, description } = req.body;

        const access = await checkServerAdminOrOwner(serverId, currentUserId);
         // Only actual owner should update, or site admin if that's a desired feature.
         // For now, let's restrict to owner for simplicity, matching original verifyServerAccess(true) intent.
        if (access.error || !access.isOwner) {
            return res.status(403).json({ success: false, message: '只有服务器所有者可以更新信息' });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: '没有提供可更新的字段' });
        }
        updateData.updated_at = new Date(); // Manually set updated_at

        const { data: updatedServer, error } = await supabase
            .from('servers')
            .update(updateData)
            .eq('id', serverId)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data: updatedServer });
    } catch (error) {
        console.error('更新服务器信息失败:', error);
        res.status(400).json({ success: false, message: '更新服务器信息失败', error: error.message });
    }
});

// DELETE /:id - Delete server (owner/admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const serverId = req.params.id;
        const currentUserId = req.user.userId;

        const access = await checkServerAdminOrOwner(serverId, currentUserId);
        // Similar to PUT, only owner should delete.
        if (access.error || !access.isOwner) {
            return res.status(403).json({ success: false, message: '只有服务器所有者可以删除服务器' });
        }

        // Foreign key constraints with ON DELETE CASCADE should handle related server_members, server_join_requests.
        const { error } = await supabase
            .from('servers')
            .delete()
            .eq('id', serverId);

        if (error) throw error;
        res.json({ success: true, message: '服务器已删除' });
    } catch (error) {
        console.error('删除服务器失败:', error);
        res.status(500).json({ success: false, message: '删除服务器失败', error: error.message });
    }
});

export default router;