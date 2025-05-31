/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-29 21:38:32
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-05-29 21:39:10
 * @FilePath: /GameConnecting/backend/server.js
 */
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './src/db/index.js';
import authRouter from './src/api/auth.js';
import serversRouter from './src/api/servers.js';
import { initSocket } from './src/socket/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config();

// 初始化数据库
await initDb();

// 创建Express应用
const app = express();

// API KEY验证中间件
const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Invalid API Key' });
    }
    next();
};

// 跨域配置
app.use(cors({
    origin: ["https://game.flowerrealm.top", "http://localhost:3000"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// JSON解析中间件
app.use(express.json());

// API路由
app.use('/auth', authRouter);
app.use('/servers', serversRouter);

// 健康检查端点
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// 创建HTTP服务器
const server = createServer(app);

// 初始化Socket.IO
const io = initSocket(server);

// 错误处理中间件 (放在所有路由之后)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`服务器运行在端口 ${port}`);
});
