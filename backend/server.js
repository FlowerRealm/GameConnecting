/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-31 09:54:18
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-06-29 19:05:27
 * @FilePath: /GameConnecting/backend/server.js
 */
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import compression from 'compression';
import { Server } from 'socket.io';

// 导入路由
import authRouter from './src/api/auth.js';
import roomsRouter from './src/api/rooms.js';
import adminRouter from './src/api/admin.js';
import usersRouter from './src/api/users.js';
import { initSocket } from './src/socket/index.js';

const app = express();
const PORT = process.env.PORT || 12001;

// 允许的CORS源
const allowedOrigins = [
  'https://game.flowerrealm.top',
  'http://localhost:12000',
  'https://gameconnecting.vercel.app'
];

// CORS配置
app.use(cors({
  origin: (origin, callback) => !origin || allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error('不允许的CORS来源')),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-User-Id', 'X-Username', 'X-User-Role']
}));

// 中间件
app.use(compression());
app.use(express.json());

// API路由
app.use('/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/admin', adminRouter);
app.use('/users', usersRouter);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 创建HTTP服务器
const server = createServer(app);

// 初始化Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-User-Id', 'X-Username', 'X-User-Role']
  }
});

// 设置Socket处理
initSocket(io);

// 启动服务器
server.listen(PORT, () => console.log(`服务器运行在端口 ${PORT}`));
