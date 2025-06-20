import { Server as SocketServer } from 'socket.io';
import { supabase } from '../supabaseClient.js';
import { getSocketConfig } from '../config/index.js';

const onlineUsers = new Map(); // socket.user.id -> Set of socket.id
const activeServers = new Map(); // serverId (string) -> { members: Set of user.id (string), lastActivity: Date }
const voiceSessions = new Map(); // Structure: Map<roomId, Map<socketId, {socketId: string, userId: string, username: string}>>

let ioInstance = null;

export const initSocket = (httpServer) => {
    const socketConfig = getSocketConfig();

    const io = new SocketServer(httpServer, {
        cors: socketConfig.cors,
        allowEIO3: true,
        transports: ['polling', 'websocket'],
        pingTimeout: socketConfig.pingTimeout,
        pingInterval: socketConfig.pingInterval
    });

    ioInstance = io;

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication failed: No token provided'));
            }

            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

            if (authError || !authUser) {
                console.error('Socket Auth Error (getUser):', authError?.message || 'No auth user');
                return next(new Error('Authentication failed: Invalid token'));
            }

            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('id, username, role, status')
                .eq('id', authUser.id)
                .single();

            if (profileError || !profile) {
                console.error('Socket Auth Error (getProfile):', profileError?.message || 'No profile');
                return next(new Error('Authentication failed: User profile not found'));
            }

            if (profile.status !== 'active') {
                console.warn(`Socket Auth: User ${profile.username} status is ${profile.status}, denying connection.`);
                return next(new Error('Authentication failed: Account not active'));
            }

            socket.user = { // Store Supabase user profile data
                id: profile.id, // This is the UUID from user_profiles (which is auth.users.id)
                username: profile.username,
                role: profile.role
            };
            next();
        } catch (error) {
            console.error('Socket Authentication Middleware Unexpected Error:', error.message);
            next(new Error('Authentication failed: Server error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket: User ${socket.user.username} (ID: ${socket.user.id}) connected with socket ID ${socket.id}.`);
        if (!onlineUsers.has(socket.user.id)) {
            onlineUsers.set(socket.user.id, new Set());
        }
        onlineUsers.get(socket.user.id).add(socket.id);

        if (socket.user.role === 'admin') {
            socket.join('admin_room');
            console.log(`Socket: Admin ${socket.user.username} joined admin_room.`);
        }

        socket.on('joinServer', async (serverId) => {
            try {
                const serverIdStr = String(serverId); // Ensure serverId is treated as string for map keys
                const userIdStr = String(socket.user.id);

                const { data: serverMember, error: memberError } = await supabase
                    .from('server_members')
                    .select('user_id')
                    .eq('server_id', serverId)
                    .eq('user_id', socket.user.id) // socket.user.id is Supabase UUID
                    .maybeSingle(); // Use maybeSingle to not error if user is not a member

                if (memberError) throw memberError;

                if (!serverMember) {
                    throw new Error('You are not a member of this server.');
                }

                if (!activeServers.has(serverIdStr)) {
                    activeServers.set(serverIdStr, {
                        members: new Set(),
                        lastActivity: new Date()
                    });
                }
                const server = activeServers.get(serverIdStr);
                server.members.add(userIdStr);
                server.lastActivity = new Date();
                socket.join(`server:${serverIdStr}`);

                console.log(`Socket: User ${socket.user.username} joined server room server:${serverIdStr}`);
                io.to(`server:${serverIdStr}`).emit('memberJoined', {
                    userId: socket.user.id,
                    username: socket.user.username,
                    timestamp: new Date(),
                    onlineCount: server.members.size
                });
            } catch (error) {
                console.error(`User ${socket.user.username} joining server ${serverId} failed:`, error.message);
                socket.emit('joinServerError', { serverId, message: error.message });
            }
        });

        socket.on('serverMessage', async (data) => {
            try {
                const { serverId, message, type = 'text' } = data;
                const serverIdStr = String(serverId);
                const userIdStr = String(socket.user.id);
                
                const server = activeServers.get(serverIdStr);
                if (!server || !server.members.has(userIdStr)) {
                    throw new Error('You are not currently in this server room or server is inactive.');
                }

                server.lastActivity = new Date();

                const messageData = {
                    type,
                    userId: socket.user.id,
                    username: socket.user.username,
                    message,
                    timestamp: new Date()
                };
                
                io.to(`server:${serverIdStr}`).emit('message', messageData);
            } catch (error) {
                console.error(`User ${socket.user.username} sending message to server ${data.serverId} failed:`, error.message);
                socket.emit('serverMessageError', { serverId: data.serverId, message: error.message });
            }
        });

        socket.on('leaveServer', async (serverId) => {
            try {
                const serverIdStr = String(serverId);
                const userIdStr = String(socket.user.id);
                const server = activeServers.get(serverIdStr);

                if (server && server.members.has(userIdStr)) {
                    server.members.delete(userIdStr);
                    socket.leave(`server:${serverIdStr}`);
                    console.log(`Socket: User ${socket.user.username} left server room server:${serverIdStr}`);
                    
                    if (server.members.size === 0) {
                        activeServers.delete(serverIdStr);
                        console.log(`Socket: Server ${serverIdStr} is now empty of active users.`);
                        await deleteEmptyServerIfNoMembersInDb(serverId); // Check DB members too
                    } else {
                        io.to(`server:${serverIdStr}`).emit('memberLeft', {
                            userId: socket.user.id,
                            username: socket.user.username,
                            timestamp: new Date(),
                            onlineCount: server.members.size
                        });
                    }
                }
            } catch (error) {
                console.error(`User ${socket.user.username} leaving server ${serverId} failed:`, error.message);
                socket.emit('leaveServerError', { serverId, message: error.message });
            }
        });

        socket.on('disconnect', async () => {
            console.log(`Socket: User ${socket.user.username} (ID: ${socket.user.id}) disconnected socket ID ${socket.id}.`);
            const userSockets = onlineUsers.get(socket.user.id);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineUsers.delete(socket.user.id);
                    console.log(`Socket: User ${socket.user.username} is now fully offline.`);
                }
            }

            const userIdStr = String(socket.user.id);
            activeServers.forEach((server, serverIdStr) => { // serverId is already string key
                if (server.members.has(userIdStr)) {
                    server.members.delete(userIdStr);
                    console.log(`Socket: User ${socket.user.username} removed from active list of server ${serverIdStr}`);
                    if (server.members.size === 0) {
                        activeServers.delete(serverIdStr);
                        console.log(`Socket: Server ${serverIdStr} is now empty of active users due to disconnect.`);
                        deleteEmptyServerIfNoMembersInDb(Number(serverIdStr)); // Convert back to number if DB expects it
                    } else {
                        io.to(`server:${serverIdStr}`).emit('memberLeft', {
                            userId: socket.user.id,
                            username: socket.user.username,
                            timestamp: new Date(),
                            onlineCount: server.members.size
                        });
                    }
                }
            });

            // Voice session cleanup on disconnect
            const disconnectedSocketId = socket.id;
            if (socket.user && socket.user.id && socket.user.username) { // Check if socket.user and its properties exist
                const { id: disconnectedUserId, username: disconnectedUsername } = socket.user;
                voiceSessions.forEach((roomVoiceSession, roomId) => {
                    if (roomVoiceSession.has(disconnectedSocketId)) {
                        roomVoiceSession.delete(disconnectedSocketId);
                        console.log(`Socket: User ${disconnectedUsername} (socket: ${disconnectedSocketId}) removed from voice in room ${roomId} due to disconnect. Remaining: ${roomVoiceSession.size}`);

                        // Notify remaining users in that voice room
                        roomVoiceSession.forEach(peer => {
                            io.to(peer.socketId).emit('voice:user_left', {
                                socketId: disconnectedSocketId,
                                userId: disconnectedUserId,
                                username: disconnectedUsername
                            });
                        });

                        if (roomVoiceSession.size === 0) {
                            voiceSessions.delete(roomId);
                            console.log(`Socket: Voice session for room ${roomId} is now empty due to disconnect.`);
                        }
                    }
                });
            } else {
                // Fallback for cases where socket.user might not be fully populated
                voiceSessions.forEach((roomVoiceSession, roomId) => {
                    if (roomVoiceSession.has(disconnectedSocketId)) {
                        const deletedPeer = roomVoiceSession.get(disconnectedSocketId); // Get peer info before deleting
                        roomVoiceSession.delete(disconnectedSocketId);
                        console.log(`Socket: User (socket: ${disconnectedSocketId}, details unknown/partial) removed from voice in room ${roomId} due to disconnect. Remaining: ${roomVoiceSession.size}`);
                        // Notify remaining users, even if username is unknown
                        roomVoiceSession.forEach(peer => {
                            io.to(peer.socketId).emit('voice:user_left', {
                                socketId: disconnectedSocketId,
                                userId: deletedPeer?.userId || 'unknown',
                                username: deletedPeer?.username || 'unknown'
                            });
                        });
                        if (roomVoiceSession.size === 0) {
                            voiceSessions.delete(roomId);
                            console.log(`Socket: Voice session for room ${roomId} is now empty due to disconnect of user with unknown details.`);
                        }
                    }
                });
            } // End of voice session cleanup
        }); // End of socket.on('disconnect')

        // --- Voice Chat Event Handlers ---

        socket.on('voice:join_room', (data) => {
            const { roomId } = data;
            // Assuming socket.user is populated by authentication middleware
            if (!socket.user || !socket.user.id || !socket.user.username) {
                socket.emit('voice:error', { message: 'User not properly authenticated for voice chat.' });
                return;
            }
            const { id: userId, username } = socket.user;
            const socketId = socket.id;

            if (!roomId) {
                socket.emit('voice:error', { message: 'Room ID is required to join voice chat.' });
                return;
            }
            const currentRoomId = String(roomId); // Ensure consistent type for roomId

            if (!voiceSessions.has(currentRoomId)) {
                voiceSessions.set(currentRoomId, new Map());
            }
            const roomVoiceSession = voiceSessions.get(currentRoomId);

            // Notify existing users about the new peer
            // Note: peer.socketId is the correct field name from the planned structure
            roomVoiceSession.forEach(peer => {
                io.to(peer.socketId).emit('voice:user_joined', { socketId, userId, username });
            });

            // Send the list of existing users to the new peer
            const existingUsers = Array.from(roomVoiceSession.values());
            socket.emit('voice:active_users_in_room', { users: existingUsers });

            // Add new peer to the session
            // Storing socketId explicitly as part of the peer object for clarity
            roomVoiceSession.set(socketId, { socketId, userId, username });
            console.log(`Socket: User ${username} (socket: ${socketId}) joined voice in room ${currentRoomId}. Total in voice: ${roomVoiceSession.size}`);
        });

        socket.on('voice:leave_room', (data) => {
            const { roomId } = data;
            if (!socket.user || !socket.user.id || !socket.user.username) {
                // Should not happen if user was in a voice room, but good check
                return;
            }
            const { id: userId, username } = socket.user;
            const socketId = socket.id;
            const currentRoomId = String(roomId);

            if (voiceSessions.has(currentRoomId)) {
                const roomVoiceSession = voiceSessions.get(currentRoomId);
                if (roomVoiceSession.has(socketId)) {
                    roomVoiceSession.delete(socketId);
                    console.log(`Socket: User ${username} (socket: ${socketId}) left voice in room ${currentRoomId}. Remaining in voice: ${roomVoiceSession.size}`);

                    // Notify remaining users
                    roomVoiceSession.forEach(peer => {
                        io.to(peer.socketId).emit('voice:user_left', { socketId, userId, username });
                    });

                    if (roomVoiceSession.size === 0) {
                        voiceSessions.delete(currentRoomId);
                        console.log(`Socket: Voice session for room ${currentRoomId} is now empty.`);
                    }
                }
            }
        });

        socket.on('voice:send_signal', (data) => {
            const { roomId, targetSocketId, signalType, sdp } = data;
            const senderSocketId = socket.id;
            const currentRoomId = String(roomId);

            if (voiceSessions.has(currentRoomId) && voiceSessions.get(currentRoomId).has(targetSocketId)) {
                io.to(targetSocketId).emit('voice:receive_signal', {
                    senderSocketId,
                    signalType,
                    sdp
                });
            } else {
                console.warn(`Socket: User ${socket.id} tried to send signal to ${targetSocketId} not in same voice room ${currentRoomId}`);
                // socket.emit('voice:error', { message: `User ${targetSocketId} not found in voice room ${currentRoomId}.` });
            }
        });

        socket.on('voice:send_ice_candidate', (data) => {
            const { roomId, targetSocketId, candidate } = data;
            const senderSocketId = socket.id;
            const currentRoomId = String(roomId);

            if (voiceSessions.has(currentRoomId) && voiceSessions.get(currentRoomId).has(targetSocketId)) {
                 io.to(targetSocketId).emit('voice:receive_ice_candidate', {
                    senderSocketId,
                    candidate
                });
            } else {
                console.warn(`Socket: User ${socket.id} tried to send ICE candidate to ${targetSocketId} not in same voice room ${currentRoomId}`);
            }
        });

    });

    return io;
};

async function deleteEmptyServerIfNoMembersInDb(serverId) {
    try {
        console.log(`Socket: Checking server ${serverId} for potential deletion (no active users).`);
        
        const { count, error: countError } = await supabase
            .from('server_members')
            .select('id', { count: 'exact', head: true })
            .eq('server_id', serverId);

        if (countError) {
            console.error(`Socket: Error counting members for server ${serverId}:`, countError.message);
            return;
        }
        
        if (count === 0) {
            console.log(`Socket: Server ${serverId} has no members in DB. Proceeding with deletion.`);
            const { error: deleteRequestsError } = await supabase
                .from('server_join_requests')
                .delete()
                .eq('server_id', serverId);

            if (deleteRequestsError) {
                console.error(`Socket: Error deleting join requests for server ${serverId}:`, deleteRequestsError.message);
                // Continue to attempt server deletion
            }
            
            const { error: deleteServerError } = await supabase
                .from('servers')
                .delete()
                .eq('id', serverId);

            if (deleteServerError) {
                console.error(`Socket: Error deleting server ${serverId}:`, deleteServerError.message);
            } else {
                console.log(`Socket: Server ${serverId} and its join requests deleted successfully from DB.`);
            }
        } else {
            console.log(`Socket: Server ${serverId} still has ${count} members in DB, not deleting.`);
        }
    } catch (error) { // Catch-all for unexpected errors in this function
        console.error(`Socket: Unexpected error in deleteEmptyServerIfNoMembersInDb for server ${serverId}:`, error.message);
    }
}

export const getIoInstance = () => {
    if (!ioInstance) {
        throw new Error("Socket.IO has not been initialized.");
    }
    return ioInstance;
};

export const getActiveServersInfo = () => {
    const info = {};
    activeServers.forEach((data, serverId) => {
        info[serverId] = {
            onlineMemberCount: data.members.size,
            lastActivity: data.lastActivity
        };
    });
    return info;
};