import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { getSocketConfig, getAuthConfig } from '../config/index.js';
const onlineUsers = new Map();
const activeServers = new Map();

let ioInstance = null;

export const initSocket = (httpServer) => {
    const socketConfig = getSocketConfig();
    const authConfig = getAuthConfig();

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
                return next(new Error('需要认证'));
            }

            const decoded = jwt.verify(token, authConfig.jwtSecret);
            const user = await db.User.findByPk(decoded.userId);

            if (!user) {
                return next(new Error('用户不存在'));
            }

            socket.user = {
                id: user.id,
                username: user.username,
                role: user.role
            };
            next();
        } catch (error) {
            console.error('Socket 认证失败:', error.message);
            next(new Error('认证失败'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket: User ${socket.user.username} (ID: ${socket.user.id}) connected.`);
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
                const serverData = await db.Server.findByPk(serverId, {
                    include: [{
                        model: db.User,
                        as: 'members',
                        through: { where: { UserId: socket.user.id } }
                    }]
                });

                if (!serverData || !serverData.members.length) {
                    throw new Error('您不是该服务器的成员');
                }
                if (!activeServers.has(String(serverId))) {
                    activeServers.set(serverId, {
                        members: new Set(),
                        lastActivity: new Date()
                    });
                }
                const server = activeServers.get(String(serverId));
                server.members.add(String(socket.user.id));
                server.lastActivity = new Date();
                socket.join(`server:${serverId}`);
                io.to(`server:${serverId}`).emit('memberJoined', {
                    userId: socket.user.id,
                    username: socket.user.username,
                    timestamp: new Date(),
                    onlineCount: server.members.size
                });
            } catch (error) {
                console.error(`用户 ${socket.user.username} 加入服务器 ${serverId} 失败:`, error.message);
                socket.emit('error', error.message);
            }
        });

        socket.on('serverMessage', async (data) => {
            try {
                const { serverId, message, type = 'text' } = data;
                const server = activeServers.get(String(serverId));
                if (!server || !server.members.has(String(socket.user.id))) {
                    throw new Error('您不在该服务器中');
                }

                // 更新服务器活跃时间
                server.lastActivity = new Date();

                io.to(`server:${serverId}`).emit('message', {
                    type,
                    userId: socket.user.id,
                    username: socket.user.username,
                    message,
                    timestamp: new Date()
                });
            } catch (error) {
                console.error(`用户 ${socket.user.username} 在服务器 ${data.serverId} 发送消息失败:`, error.message);
                socket.emit('error', error.message);
            }
        });

        socket.on('leaveServer', async (serverId) => {
            try {
                const server = activeServers.get(String(serverId));
                if (server && server.members.has(String(socket.user.id))) {
                    server.members.delete(String(socket.user.id));
                    socket.leave(`server:${serverId}`);
                    if (server.members.size === 0) {
                        activeServers.delete(String(serverId));
                    }
                    io.to(`server:${serverId}`).emit('memberLeft', {
                        userId: socket.user.id,
                        username: socket.user.username,
                        timestamp: new Date(),
                        onlineCount: server.members.size
                    });
                }
            } catch (error) {
                console.error(`用户 ${socket.user.username} 离开服务器 ${serverId} 失败:`, error.message);
                socket.emit('error', error.message);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket: User ${socket.user.username} (ID: ${socket.user.id}) disconnected.`);
            const userSockets = onlineUsers.get(socket.user.id);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineUsers.delete(socket.user.id);
                }
            }

            activeServers.forEach((server, serverId) => {
                if (server.members.has(String(socket.user.id))) {
                    server.members.delete(String(socket.user.id));
                    if (server.members.size === 0) {
                        activeServers.delete(String(serverId));
                    } else {
                        io.to(`server:${serverId}`).emit('memberLeft', {
                            userId: socket.user.id,
                            username: socket.user.username,
                            timestamp: new Date(),
                            onlineCount: server.members.size
                        });
                    }
                }
            });
        });
    });

    return io;
};

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
            onlineMemberCount: data.members.size
        };
    });
    return info;
};