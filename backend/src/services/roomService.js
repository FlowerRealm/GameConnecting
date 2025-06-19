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
async function createRoom(name, description, room_type, creatorId) {
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
};
