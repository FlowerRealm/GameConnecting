import { supabase } from '../supabaseClient.js';

// Helper to ensure user_id_1 < user_id_2 for consistency
const getOrderedUserIds = (id1, id2) => {
    if (id1 < id2) {
        return { userId1: id1, userId2: id2 };
    }
    return { userId1: id2, userId2: id1 };
};

async function listFriends(currentUserId) {
    try {
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
                friendship_id: friendship.id
            };
        });
        return { success: true, data: friends };
    } catch (error) {
        console.error('Service error - listFriends:', error);
        return { success: false, error: { status: 500, message: '获取好友列表服务失败: ' + error.message } };
    }
}

async function listFriendRequests(currentUserId) {
    try {
        const { data, error } = await supabase
            .from('friendships')
            .select(`
                id,
                status,
                action_user_id,
                user_profiles_user_id_1:user_profiles!friendships_user_id_1_fkey (id, username)
            `)
            .eq('user_id_2', currentUserId)
            .eq('status', 'pending')
            .neq('action_user_id', currentUserId);

        if (error) throw error;

        const requests = data.map(request => ({
            id: request.id,
            user: {
                id: request.user_profiles_user_id_1.id,
                username: request.user_profiles_user_id_1.username
            }
        }));
        return { success: true, data: requests };
    } catch (error) {
        console.error('Service error - listFriendRequests:', error);
        return { success: false, error: { status: 500, message: '获取好友请求服务失败: ' + error.message } };
    }
}

async function sendFriendRequest(currentUserId, targetUsername) {
    try {
        const { data: targetUser, error: targetUserError } = await supabase
            .from('user_profiles')
            .select('id, username')
            .eq('username', targetUsername)
            .single();

        if (targetUserError || !targetUser) {
            return { success: false, error: { status: 404, message: '未找到该用户' } };
        }
        if (targetUser.id === currentUserId) {
            return { success: false, error: { status: 400, message: '不能添加自己为好友' } };
        }

        const { userId1, userId2 } = getOrderedUserIds(currentUserId, targetUser.id);

        const { data: existingFriendship, error: existingError } = await supabase
            .from('friendships')
            .select('status, action_user_id')
            .eq('user_id_1', userId1)
            .eq('user_id_2', userId2)
            .single();

        if (existingError && existingError.code !== 'PGRST116') { // PGRST116: 0 rows means no record
             throw existingError;
        }

        if (existingFriendship) {
            if (existingFriendship.status === 'accepted') {
                return { success: false, error: { status: 400, message: '你们已经是好友了' } };
            }
            if (existingFriendship.status === 'pending') {
                if (existingFriendship.action_user_id === currentUserId) {
                    return { success: false, error: { status: 400, message: '已经发送过好友请求了' } };
                } else {
                    return { success: false, error: { status: 400, message: '对方已向你发送好友请求，请在请求列表中处理' } };
                }
            }
            if (existingFriendship.status === 'blocked') {
                if (existingFriendship.action_user_id === currentUserId) {
                     return { success: false, error: { status: 403, message: '你已拉黑该用户，无法发送好友请求。请先解除拉黑。' } };
                } else {
                     return { success: false, error: { status: 403, message: '无法添加该用户为好友（对方已拉黑你）' } };
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

        return { success: true, data: newFriendship };
    } catch (error) {
        console.error('Service error - sendFriendRequest:', error);
        return { success: false, error: { status: 500, message: '发送好友请求服务失败: ' + error.message } };
    }
}

async function manageFriendRequest(currentUserId, friendshipId, action) {
    try {
        const { data: friendship, error: fetchError } = await supabase
            .from('friendships')
            .select('*')
            .eq('id', friendshipId)
            .eq('user_id_2', currentUserId)
            .eq('status', 'pending')
            .single();

        if (fetchError || !friendship) {
            return { success: false, error: { status: 404, message: '好友请求不存在或无权操作' } };
        }
        if (friendship.action_user_id === currentUserId) {
             return { success: false, error: { status: 403, message: '不能操作自己发送的请求' } };
        }

        if (action === 'accept') {
            const { error: updateError } = await supabase
                .from('friendships')
                .update({ status: 'accepted', action_user_id: currentUserId }) // action_user_id updates to the one who accepted
                .eq('id', friendshipId);
            if (updateError) throw updateError;
            return { success: true, message: '已接受好友请求' };
        } else { // reject
            const { error: deleteError } = await supabase
                .from('friendships')
                .delete()
                .eq('id', friendshipId);
            if (deleteError) throw deleteError;
            return { success: true, message: '已拒绝好友请求' };
        }
    } catch (error) {
        console.error('Service error - manageFriendRequest:', error);
        return { success: false, error: { status: 500, message: '处理好友请求服务失败: ' + error.message } };
    }
}

async function removeFriend(currentUserId, friendToRemoveId) {
    try {
        const { userId1, userId2 } = getOrderedUserIds(currentUserId, friendToRemoveId);
        const { error } = await supabase
            .from('friendships')
            .delete()
            .eq('user_id_1', userId1)
            .eq('user_id_2', userId2)
            .eq('status', 'accepted');

        if (error) throw error;
        return { success: true, message: '已删除好友' };
    } catch (error) {
        console.error('Service error - removeFriend:', error);
        return { success: false, error: { status: 500, message: '删除好友服务失败: ' + error.message } };
    }
}

async function blockUser(currentUserId, userToBlockId) {
    try {
        if (userToBlockId === currentUserId) {
            return { success: false, error: { status: 400, message: '不能拉黑自己' } };
        }

        const { data: targetUser, error: targetUserError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', userToBlockId)
            .single();

        if (targetUserError || !targetUser) {
            return { success: false, error: { status: 404, message: '用户不存在' } };
        }

        const { userId1, userId2 } = getOrderedUserIds(currentUserId, userToBlockId);

        const { error: deleteError } = await supabase
            .from('friendships')
            .delete()
            .eq('user_id_1', userId1)
            .eq('user_id_2', userId2)
            .neq('status', 'blocked');

        if (deleteError && deleteError.code !== 'PGRST116') { // PGRST116: 0 rows, ok if no prior relation
            throw deleteError;
        }

        const { error: blockError } = await supabase
            .from('friendships')
            .upsert({
                user_id_1: userId1,
                user_id_2: userId2,
                status: 'blocked',
                action_user_id: currentUserId
            }, {
                onConflict: 'user_id_1, user_id_2',
            });

        if (blockError) throw blockError;
        return { success: true, message: '已拉黑该用户' };
    } catch (error) {
        console.error('Service error - blockUser:', error);
        return { success: false, error: { status: 500, message: '拉黑用户服务失败: ' + error.message } };
    }
}

export {
    listFriends,
    listFriendRequests,
    sendFriendRequest,
    manageFriendRequest,
    removeFriend,
    blockUser,
};
