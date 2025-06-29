import { dbHelper } from '../utils/dbHelper.js';

const roomsDb = dbHelper.query('rooms');
const roomMembersDb = dbHelper.query('room_members');

// Helper to get user ID from a request object (assuming authenticateToken middleware)
// const getUserIdFromRequest = (req) => req.user.userId;


/**
 * Creates a new room and adds the creator as the owner.
 * @param {string} name - The name of the room.
 * @param {string|null} description - The description of the room.
 * @param {'public'|'private'} room_type - The type of the room.
 * @param {string} creatorId - The ID of the user creating the room.
 * @returns {Promise<object>} Result object with success status, data, or error.
 */
async function createRoom(name, description, room_type = 'public', creatorId) {
    try {
        // 创建房间
        const roomResult = await roomsDb.create({
            name,
            description,
            room_type,
            creator_id: creatorId,
            last_active_at: new Date().toISOString(),
        });

        if (!roomResult.success) {
            return dbHelper.error('创建房间失败');
        }

        // 添加创建者为房主
        const memberResult = await roomMembersDb.create({
            room_id: roomResult.data.id,
            user_id: creatorId,
            role: 'owner',
            joined_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
        });

        if (!memberResult.success) {
            await roomsDb.delete({ id: roomResult.data.id });
            return dbHelper.error('添加房间成员失败');
        }

        return dbHelper.success(roomResult.data);
    } catch (error) {
        console.error('Room creation error:', error);
        return dbHelper.error('服务器错误');
    }
}

/**
 * Removes (kicks) a member from a room by an admin.
 * @param {string} roomId - The ID of the room.
 * @param {string} userIdToKick - The ID of the user to be kicked.
 * @returns {Promise<object>} Result object with success status or error.
 */
async function kickMemberByAdmin(roomId, userIdToKick) {
    if (!roomId || !userIdToKick) {
        return { success: false, error: { status: 400, message: 'Room ID and User ID to kick are required.' } };
    }

    try {
        // First, check if the user to be kicked is the room owner.
        // Admins should not be able to kick the owner directly. Ownership transfer or room deletion are other processes.
        const { data: room, error: roomFetchError } = await roomsDb.findOne({
            id: roomId
        });

        if (roomFetchError) {
            console.error('Error fetching room details for kickMemberByAdmin:', roomFetchError);
            return { success: false, error: { status: 500, message: 'Failed to verify room details before kicking member.' } };
        }
        if (!room) {
            return { success: false, error: { status: 404, message: 'Room not found.' } };
        }
        if (room.creator_id === userIdToKick) {
            return { success: false, error: { status: 403, message: 'Cannot kick the room owner. The owner must delete the room or transfer ownership.' } };
        }

        // Proceed to delete the member from room_members
        const { error: deleteError, count } = await roomMembersDb.delete({
            room_id: roomId,
            user_id: userIdToKick
        });

        if (deleteError) {
            console.error('Error kicking member by admin in service:', deleteError);
            return { success: false, error: { status: 500, message: deleteError.message || 'Failed to kick member.' } };
        }
        if (count === 0) {
            return { success: false, error: { status: 404, message: 'User is not a member of this room or already removed.' } };
        }

        return { success: true, message: 'Member kicked successfully by admin.' };
    } catch (error) {
        console.error('Unknown error in kickMemberByAdmin service:', error);
        return { success: false, error: { status: 500, message: error.message || 'An unknown error occurred while kicking the member.' } };
    }
}

/**
 * Deletes a server by an admin.
 * Note: Assumes ON DELETE CASCADE is set for related tables like room_members, room_join_requests.
 * @param {string} roomId - The ID of the room to delete.
 * @returns {Promise<object>} Result object with success status or error.
 */
async function deleteServerByAdmin(roomId) {
    if (!roomId) {
        return { success: false, error: { status: 400, message: 'Room ID is required for deletion.' } };
    }

    try {
        // No need to check creator_id for admin deletion. Admin can delete any room.
        const { error, count } = await roomsDb.delete({ id: roomId });

        if (error) {
            console.error('Error deleting server by admin in service:', error);
            return { success: false, error: { status: 500, message: error.message || 'Failed to delete server.' } };
        }
        if (count === 0) {
            return { success: false, error: { status: 404, message: 'Server not found or already deleted.' } };
        }

        return { success: true, message: 'Server deleted successfully by admin.' };
    } catch (error) {
        console.error('Unknown error in deleteServerByAdmin service:', error);
        return { success: false, error: { status: 500, message: error.message || 'An unknown error occurred while deleting the server.' } };
    }
}

/**
 * Updates a server's details by an admin.
 * @param {string} roomId - The ID of the room to update.
 * @param {object} updates - An object containing fields to update (e.g., { name, description, room_type }).
 * @returns {Promise<object>} Result object with success status, data, or error.
 */
async function updateServerByAdmin(roomId, updates) {
    if (!roomId || !updates || Object.keys(updates).length === 0) {
        return { success: false, error: { status: 400, message: 'Room ID and updates object are required and updates cannot be empty.' } };
    }

    const allowedUpdates = ['name', 'description']; // Removed 'room_type'
    const validUpdates = {};
    let hasInvalidField = false;

    for (const key in updates) {
        if (allowedUpdates.includes(key)) {
            // Removed room_type specific validation as it's no longer an allowed update here.
            // if (key === 'room_type' && !['public', 'private'].includes(updates[key])) {
            //     return { success: false, error: { status: 400, message: "Invalid room_type. Must be 'public' or 'private'." } };
            // }
            if (key === 'name' && (typeof updates[key] !== 'string' || updates[key].trim().length < 3 || updates[key].trim().length > 100)) {
                return { success: false, error: { status: 400, message: "Name must be a string between 3 and 100 characters." } };
            }
            if (key === 'description' && updates[key] !== null && (typeof updates[key] !== 'string' || updates[key].length > 1000)) {
                return { success: false, error: { status: 400, message: "Description must be a string and no more than 1000 characters." } };
            }
            validUpdates[key] = updates[key];
        } else {
            hasInvalidField = true; // Just note it, or strictly reject
            console.warn(`Admin update server: Disallowed field '${key}' provided in updates.`);
            // Depending on strictness, you might return an error here:
            // return { success: false, error: { status: 400, message: `Field '${key}' is not allowed for update.` } };
        }
    }

    if (Object.keys(validUpdates).length === 0 && hasInvalidField) {
        // This means only invalid fields were provided, or if strict, an invalid field caused early exit.
        return { success: false, error: { status: 400, message: 'No valid fields provided for update or only disallowed fields were sent.' } };
    }
    if (Object.keys(validUpdates).length === 0 && !hasInvalidField) {
        return { success: false, error: { status: 400, message: 'No fields to update were provided after validation (e.g. empty name).' } };
    }


    validUpdates.updated_at = new Date().toISOString(); // Ensure updated_at is set

    try {
        const { data: updatedRoom, error } = await roomsDb.update(validUpdates)
            .eq('id', roomId)
            .select()
            .single();

        if (error) {
            console.error('Error updating server by admin in service:', error);
            if (error.code === 'PGRST116') { // PostgREST error for "No rows found"
                return { success: false, error: { status: 404, message: 'Server not found.' } };
            }
            return { success: false, error: { status: 500, message: error.message || 'Failed to update server.' } };
        }
        if (!updatedRoom) { // Should be caught by PGRST116, but as a fallback
            return { success: false, error: { status: 404, message: 'Server not found or update failed to return data.' } };
        }

        return { success: true, data: updatedRoom };
    } catch (error) {
        console.error('Unknown error in updateServerByAdmin service:', error);
        return { success: false, error: { status: 500, message: error.message || 'An unknown error occurred while updating the server.' } };
    }
}

/**
 * Lists all public rooms.
 * @returns {Promise<object>} Result object with success status, data, or error.
 */
async function listPublicRooms() {
    return await roomsDb.find(
        { room_type: 'public' },
        {
            select: `
                *,
                creator:creator_id(username),
                members:room_members(count)
            `,
            orderBy: {
                field: 'last_active_at',
                ascending: false
            }
        }
    );
}

/**
 * Allows a user to join a room.
 * For public rooms, adds directly. For private, could create a join request (simplified for now).
 * @param {string} roomId - The ID of the room to join.
 * @param {string} userId - The ID of the user joining.
 * @returns {Promise<object>} Result object with success status, data, or error.
 */
async function joinRoom(roomId, userId) {
    try {
        // 检查是否已是成员
        const existingMember = await roomMembersDb.findOne({
            room_id: roomId,
            user_id: userId
        });

        if (existingMember.success) {
            return dbHelper.error('已经是房间成员', 400);
        }

        // 加入房间
        return await roomMembersDb.create({
            room_id: roomId,
            user_id: userId,
            role: 'member',
            joined_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
        });
    } catch (error) {
        return dbHelper.error('服务器错误');
    }
}

/**
 * Allows a user to leave a room.
 * @param {string} roomId - The ID of the room to leave.
 * @param {string} userId - The ID of the user leaving.
 * @returns {Promise<object>} Result object with success status or error.
 */
async function leaveRoom(roomId, userId) {
    try {
        // 检查是否是房主
        const room = await roomsDb.findOne({
            id: roomId,
            creator_id: userId
        });

        if (room.success) {
            return dbHelper.error('房主不能离开房间', 400);
        }

        // 离开房间
        return await roomMembersDb.delete({
            room_id: roomId,
            user_id: userId
        });
    } catch (error) {
        return dbHelper.error('服务器错误');
    }
}

/**
 * Gets members of a specific room.
 * @param {string} roomId - The ID of the room.
 * @returns {Promise<object>} Result object with success status, data, or error.
 */
async function getRoomMembers(roomId) {
    return await roomMembersDb.find(
        { room_id: roomId },
        {
            select: `
                *,
                user:user_id(username, status)
            `,
            orderBy: {
                field: 'joined_at',
                ascending: true
            }
        }
    );
}

/**
 * Deletes a room if the user is the creator.
 * @param {string} roomId - The ID of the room to delete.
 * @param {string} userId - The ID of the user attempting to delete.
 * @returns {Promise<object>} Result object with success status or error.
 */
async function deleteRoom(roomId, userId) {
    try {
        // 检查房间和权限
        const room = await roomsDb.findOne({
            id: roomId
        });

        if (!room.success) {
            return dbHelper.error('房间不存在', 404);
        }

        if (room.data.creator_id !== userId) {
            return dbHelper.error('只有房主可以删除房间', 403);
        }

        // 删除房间
        return await roomsDb.delete({ id: roomId });
    } catch (error) {
        return dbHelper.error('服务器错误');
    }
}


export {
    createRoom,
    listPublicRooms,
    joinRoom,
    leaveRoom,
    getRoomMembers,
    deleteRoom,
    getAllServersForAdmin, // Added for admin functionality
    updateServerByAdmin, // Added for admin server update
    deleteServerByAdmin, // Added for admin server deletion
    kickMemberByAdmin, // Added for admin kicking member
};

/**
 * Fetches all rooms with extended information for admin view.
 * Includes creator's username and member count.
 * Supports pagination.
 * @param {object} queryParams - Pagination parameters { page, limit }.
 * @returns {Promise<object>} Result object with success status, paginated data, or error.
 */
async function getAllServersForAdmin(queryParams = {}) {
    const page = parseInt(queryParams.page) || 1;
    const defaultLimit = 10; // Or get from a config
    const limit = parseInt(queryParams.limit) || defaultLimit;
    const offset = (page - 1) * limit;

    try {
        // Fetch paginated rooms and total count
        const { data: rooms, error, count } = await roomsDb.find(
            { room_type: 'public' },
            {
                select: `
                    id,
                    name,
                    description,
                    room_type,
                    created_at,
                    last_active_at,
                    creator_id
                `,
                orderBy: {
                    field: 'created_at',
                    ascending: false
                },
                range: {
                    start: offset,
                    end: offset + limit - 1
                },
                count: 'exact'
            }
        );

        if (error) {
            console.error('Error fetching all rooms for admin in service:', error);
            return { success: false, error: { status: 500, message: error.message || 'Failed to fetch rooms for admin.' } };
        }

        if (!rooms || rooms.length === 0) {
            return {
                success: true,
                data: {
                    servers: [],
                    total: 0,
                    page,
                    totalPages: 0,
                    limit
                }
            };
        }

        // Collect all room_ids and creator_ids
        const roomIds = rooms.map(room => room.id);
        const creatorIds = [...new Set(rooms.map(room => room.creator_id).filter(Boolean))];

        // Execute member count and creator username fetches in parallel
        const [memberCountsResult, profilesResult] = await Promise.all([
            roomIds.length > 0 ? dbHelper.rpc('get_room_member_counts', { room_ids: roomIds }) : Promise.resolve({ data: [], error: null }),
            creatorIds.length > 0 ? dbHelper.rpc('get_users_with_details', { p_user_ids: creatorIds }) : Promise.resolve({ data: [], error: null })
        ]);

        let memberCountMap = new Map();
        if (!memberCountsResult.error && memberCountsResult.data) {
            memberCountsResult.data.forEach(item => {
                memberCountMap.set(item.room_id, item.member_count);
            });
        } else if (memberCountsResult.error) {
            console.error('Failed to fetch member counts for admin server list:', memberCountsResult.error);
        }

        let creatorUsernames = new Map();
        if (!profilesResult.error && profilesResult.data && profilesResult.data[0]) {
            profilesResult.data[0].forEach(profile => {
                creatorUsernames.set(profile.id, profile.username);
            });
        } else if (profilesResult.error) {
            console.error('Failed to fetch creator profiles:', profilesResult.error);
        }

        // Step 4: Augment rooms with creator username and member count
        const augmentedRooms = rooms.map(room => ({
            ...room,
            creatorUsername: creatorUsernames.get(room.creator_id) || '未知用户',
            member_count: memberCountMap.get(room.id) || 0,
        }));

        return {
            success: true,
            data: {
                servers: augmentedRooms,
                total: count || 0,
                page,
                totalPages: Math.ceil((count || 0) / limit),
                limit
            }
        };

    } catch (error) {
        console.error('Unknown error in getAllServersForAdmin service:', error);
        return { success: false, error: { status: 500, message: error.message || 'An unknown error occurred while fetching rooms for admin.' } };
    }
}
