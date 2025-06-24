import { supabase } from '../supabaseClient.js';

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
        // Step 1: Create the room
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .insert({
                name,
                description,
                room_type,
                creator_id: creatorId,
                last_active_at: new Date().toISOString(), // Set initial activity
            })
            .select()
            .single();

        if (roomError) {
            console.error('Error creating room in service:', roomError);
            return { success: false, error: { status: 500, message: roomError.message || 'Failed to create room.' } };
        }
        if (!room) {
            return { success: false, error: { status: 500, message: 'Room creation did not return data.' } };
        }

        // Step 2: Add the creator as the owner in room_members
        const { error: memberError } = await supabase
            .from('room_members')
            .insert({
                room_id: room.id,
                user_id: creatorId,
                role: 'owner',
                joined_at: new Date().toISOString(),
                last_active: new Date().toISOString(),
            });

        if (memberError) {
            console.error('Error adding creator to room_members in service:', memberError);
            // Attempt to delete the created room if adding member fails (rollback)
            await supabase.from('rooms').delete().eq('id', room.id);
            return { success: false, error: { status: 500, message: memberError.message || 'Failed to add creator as room member.' } };
        }

        return { success: true, data: room };
    } catch (error) {
        console.error('Unknown error in createRoom service:', error);
        return { success: false, error: { status: 500, message: error.message || 'An unknown error occurred.' } };
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
        const { data: room, error: roomFetchError } = await supabase
            .from('rooms')
            .select('creator_id')
            .eq('id', roomId)
            .single();

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
        const { error: deleteError, count } = await supabase
            .from('room_members')
            .delete()
            .eq('room_id', roomId)
            .eq('user_id', userIdToKick);

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
        const { error, count } = await supabase
            .from('rooms')
            .delete()
            .eq('id', roomId);

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
        const { data: updatedRoom, error } = await supabase
            .from('rooms')
            .update(validUpdates)
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
    try {
        const { data: rooms, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('room_type', 'public')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error listing public rooms in service:', error);
            return { success: false, error: { status: 500, message: error.message || 'Failed to list public rooms.' } };
        }
        return { success: true, data: rooms || [] };
    } catch (error) {
        console.error('Unknown error in listPublicRooms service:', error);
        return { success: false, error: { status: 500, message: error.message || 'An unknown error occurred.' } };
    }
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
        // Step 1: Get room details to check if it's public or private
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('id, room_type, creator_id')
            .eq('id', roomId)
            .single();

        if (roomError || !room) {
            return { success: false, error: { status: 404, message: 'Room not found.' } };
        }

        // Prevent owner from re-joining (they are already in via creation)
        if (room.creator_id === userId) {
             // Or check if already a member
            const { data: existingMember, error: memberCheckError } = await supabase
                .from('room_members')
                .select('id')
                .eq('room_id', roomId)
                .eq('user_id', userId)
                .maybeSingle();
            if (memberCheckError && memberCheckError.code !== 'PGRST116') { // PGRST116 means no rows, which is fine
                console.error('Error checking existing member:', memberCheckError);
            }
            if (existingMember) {
                 return { success: false, error: { status: 400, message: 'You are already a member of this room.' } };
            }
        }


        // For now, only public rooms are directly joinable as per simplified requirement
        if (room.room_type === 'private') {
            // Future: Implement join request logic for private rooms
            // For now, let's treat it as "cannot join directly"
            return { success: false, error: { status: 403, message: 'This is a private room. Join requests are not yet implemented.' } };
        }

        // Step 2: Add user to room_members for public rooms
        const { data: newMember, error: insertError } = await supabase
            .from('room_members')
            .insert({
                room_id: roomId,
                user_id: userId,
                role: 'member', // Default role for joining
                joined_at: new Date().toISOString(),
                last_active: new Date().toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            if (insertError.code === '23505') { // Unique constraint violation (already a member)
                return { success: false, error: { status: 400, message: 'You are already a member of this room.' } };
            }
            console.error('Error joining room in service:', insertError);
            return { success: false, error: { status: 500, message: insertError.message || 'Failed to join room.' } };
        }

        return { success: true, data: newMember };
    } catch (error) {
        console.error('Unknown error in joinRoom service:', error);
        return { success: false, error: { status: 500, message: error.message || 'An unknown error occurred.' } };
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
        // Prevent owner from leaving directly, they should delete the room or transfer ownership (not implemented)
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('creator_id')
            .eq('id', roomId)
            .single();

        if (roomError || !room) {
            return { success: false, error: { status: 404, message: 'Room not found.' } };
        }
        if (room.creator_id === userId) {
            return { success: false, error: { status: 400, message: 'Room creator cannot leave the room. Please delete the room instead or transfer ownership (not implemented).' } };
        }

        const { error: deleteError, count } = await supabase
            .from('room_members')
            .delete()
            .eq('room_id', roomId)
            .eq('user_id', userId);

        if (deleteError) {
            console.error('Error leaving room in service:', deleteError);
            return { success: false, error: { status: 500, message: deleteError.message || 'Failed to leave room.' } };
        }
        if (count === 0) {
            return { success: false, error: { status: 404, message: 'You are not a member of this room or room does not exist.'}};
        }

        return { success: true, message: 'Successfully left the room.' };
    } catch (error) {
        console.error('Unknown error in leaveRoom service:', error);
        return { success: false, error: { status: 500, message: error.message || 'An unknown error occurred.' } };
    }
}

/**
 * Gets members of a specific room.
 * @param {string} roomId - The ID of the room.
 * @returns {Promise<object>} Result object with success status, data, or error.
 */
async function getRoomMembers(roomId) {
    try {
        const { data: members, error } = await supabase
            .from('room_members')
            .select(`
                user_id,
                role,
                joined_at,
                user_profiles ( username, status )
            `)
            .eq('room_id', roomId);

        if (error) {
            console.error('Error getting room members in service:', error);
            return { success: false, error: { status: 500, message: error.message || 'Failed to get room members.' } };
        }

        const formattedMembers = members.map(m => ({
            userId: m.user_id,
            role: m.role,
            joinedAt: m.joined_at,
            username: m.user_profiles?.username,
            status: m.user_profiles?.status,
        }));

        return { success: true, data: formattedMembers || [] };
    } catch (error) {
        console.error('Unknown error in getRoomMembers service:', error);
        return { success: false, error: { status: 500, message: error.message || 'An unknown error occurred.' } };
    }
}

/**
 * Deletes a room if the user is the creator.
 * @param {string} roomId - The ID of the room to delete.
 * @param {string} userId - The ID of the user attempting to delete.
 * @returns {Promise<object>} Result object with success status or error.
 */
async function deleteRoom(roomId, userId) {
    try {
        // Step 1: Verify the user is the creator of the room
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('creator_id')
            .eq('id', roomId)
            .single();

        if (roomError || !room) {
            return { success: false, error: { status: 404, message: 'Room not found.' } };
        }

        if (room.creator_id !== userId) {
            return { success: false, error: { status: 403, message: 'Only the room creator can delete the room.' } };
        }

        // Step 2: Delete the room. CASCADE should handle members and join requests.
        const { error: deleteError, count } = await supabase
            .from('rooms')
            .delete()
            .eq('id', roomId);

        if (deleteError) {
            console.error('Error deleting room in service:', deleteError);
            return { success: false, error: { status: 500, message: deleteError.message || 'Failed to delete room.' } };
        }
        if (count === 0) { // Should not happen if previous check passed, but good for safety
             return { success: false, error: { status: 404, message: 'Room not found for deletion (unexpected).' } };
        }

        return { success: true, message: 'Room deleted successfully.' };
    } catch (error) {
        console.error('Unknown error in deleteRoom service:', error);
        return { success: false, error: { status: 500, message: error.message || 'An unknown error occurred.' } };
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
 * Includes creator's username and potentially member count.
 * @returns {Promise<object>} Result object with success status, data, or error.
 */
async function getAllServersForAdmin() {
    try {
        const { data: rooms, error } = await supabase
            .from('rooms')
            .select(`
                id,
                name,
                description,
                room_type,
                created_at,
                last_active_at,
                creator_id
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all rooms for admin in service:', error);
            return { success: false, error: { status: 500, message: error.message || 'Failed to fetch rooms for admin.' } };
        }

        // Post-process to include member counts (example, can be optimized)
        if (!rooms || rooms.length === 0) {
            return { success: true, data: [] };
        }

        if (!rooms || rooms.length === 0) {
            return { success: true, data: [] };
        }

        // Step 1: Collect all unique creator_ids to fetch their usernames in one go
        const creatorIds = [...new Set(rooms.map(room => room.creator_id).filter(id => id))];
        let creatorUsernameMap = new Map();
        if (creatorIds.length > 0) {
            const { data: creatorProfiles, error: creatorsError } = await supabase
                .from('user_profiles')
                .select('id, username')
                .in('id', creatorIds);
            if (creatorsError) {
                console.error('Failed to fetch creator profiles for admin server list:', creatorsError);
            } else if (creatorProfiles) {
                creatorProfiles.forEach(p => creatorUsernameMap.set(p.id, p.username));
            }
        }

        // Step 2: Collect all room_ids to fetch member counts in one go
        const roomIds = rooms.map(room => room.id);
        let memberCountMap = new Map();
        if (roomIds.length > 0) {
            // This query counts members per room_id.
            // The .rpc call might be more direct if we have a function,
            // but a direct query with group by is also possible.
            // Supabase JS client doesn't directly support GROUP BY in a simple .select().
            // We'll use a workaround: fetch all member rows for these rooms and count in JS,
            // OR make a more complex query using .rpc if a helper PG function exists/is created.
            // For now, let's do a slightly less optimized but better-than-N+1 approach:
            // Fetch all room_members for the relevant rooms, then count in JS.
            // This is one large query instead of N small ones.

            // Alternative: Use an RPC or a view if this becomes a bottleneck.
            // For now, let's stick to the Promise.all for member counts as it was, and optimize it here.
            // The provided solution below is the optimized one.

            const { data: memberCountsData, error: memberCountsError } = await supabase
                .from('room_members')
                .select('room_id, user_id') // Select user_id to count, or just room_id if counting rows
                .in('room_id', roomIds);

            if (memberCountsError) {
                console.error('Failed to fetch member counts for admin server list:', memberCountsError);
            } else if (memberCountsData) {
                memberCountsData.forEach(member => {
                    memberCountMap.set(member.room_id, (memberCountMap.get(member.room_id) || 0) + 1);
                });
            }
        }

        // Step 3: Augment rooms with creator username and member count
        const augmentedRooms = rooms.map(room => ({
            ...room,
            creatorUsername: room.creator_id ? (creatorUsernameMap.get(room.creator_id) || '未知用户') : '无创建者',
            member_count: memberCountMap.get(room.id) || 0,
        }));

        return { success: true, data: augmentedRooms };

    } catch (error) {
        console.error('Unknown error in getAllServersForAdmin service:', error);
        return { success: false, error: { status: 500, message: error.message || 'An unknown error occurred while fetching rooms for admin.' } };
    }
}
