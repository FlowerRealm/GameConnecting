import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../db/models/user.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // 从环境变量获取密钥

export const initSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || ["http://localhost:3000"],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // 身份验证中间件
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('需要认证'));
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findByPk(decoded.userId);

            if (!user) {
                return next(new Error('用户不存在'));
            }

            socket.user = {
                id: user.id,
                username: user.username
            };
            next();
        } catch (error) {
            console.error('Socket 认证失败:', error.message);
            next(new Error('认证失败'));
        }
    });

    const rooms = new Map();

    io.on('connection', (socket) => {
        console.log(`用户 ${socket.user.username} 已连接`);

        // 加入游戏房间
        socket.on('joinRoom', async (roomId) => { // 添加 async
            try {
                // 可以在这里添加房间存在的验证，或者其他加入房间的逻辑
                if (!rooms.has(roomId)) {
                    rooms.set(roomId, { players: new Set() });
                }
                const room = rooms.get(roomId);
                room.players.add(socket.user.id);

                socket.join(roomId);
                io.to(roomId).emit('playerJoined', {
                    userId: socket.user.id,
                    username: socket.user.username,
                    playerCount: room.players.size
                });
            } catch (error) {
                console.error(`用户 ${socket.user.username} 加入房间 ${roomId} 失败:`, error.message);
                socket.emit('error', '加入房间失败');
            }
        });

        // 离开游戏房间
        socket.on('leaveRoom', async (roomId) => { // 添加 async
            try {
                if (rooms.has(roomId)) {
                    const room = rooms.get(roomId);
                    room.players.delete(socket.user.id);

                    if (room.players.size === 0) {
                        rooms.delete(roomId);
                    }

                    socket.leave(roomId);
                    io.to(roomId).emit('playerLeft', {
                        userId: socket.user.id,
                        username: socket.user.username,
                        playerCount: room.players.size
                    });
                }
            } catch (error) {
                console.error(`用户 ${socket.user.username} 离开房间 ${roomId} 失败:`, error.message);
                socket.emit('error', '离开房间失败');
            }
        });

        // 游戏动作
        socket.on('gameAction', async (data) => { // 添加 async
            try {
                const { roomId, action, position } = data;
                if (rooms.has(roomId)) {
                    // 可以在这里添加游戏逻辑验证
                    io.to(roomId).emit('gameUpdate', {
                        userId: socket.user.id,
                        username: socket.user.username,
                        action,
                        position
                    });
                }
            } catch (error) {
                console.error(`用户 ${socket.user.username} 在房间 ${data.roomId} 执行游戏动作失败:`, error.message);
                socket.emit('error', '游戏动作失败');
            }
        });

        // 聊天消息
        socket.on('chatMessage', async (data) => { // 添加 async
            try {
                const { roomId, message } = data;
                if (rooms.has(roomId)) {
                    io.to(roomId).emit('message', {
                        userId: socket.user.id,
                        username: socket.user.username,
                        message,
                        timestamp: new Date()
                    });
                }
            } catch (error) {
                console.error(`用户 ${socket.user.username} 在房间 ${data.roomId} 发送聊天消息失败:`, error.message);
                socket.emit('error', '发送消息失败');
            }
        });

        // 断开连接
        socket.on('disconnect', () => {
            console.log(`用户 ${socket.user.username} 已断开连接`);
            rooms.forEach((room, roomId) => {
                if (room.players.has(socket.user.id)) {
                    room.players.delete(socket.user.id);
                    if (room.players.size === 0) {
                        rooms.delete(roomId);
                    }
                    io.to(roomId).emit('playerLeft', {
                        userId: socket.user.id,
                        username: socket.user.username,
                        playerCount: room.players.size
                    });
                }
            });
        });
    });

    return io;
};