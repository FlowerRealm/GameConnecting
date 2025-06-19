console.log('--- SERVER.JS LATEST VERSION RUNNING --- [Timestamp: ' + new Date().toISOString() + ']');
/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-31 09:54:18
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-06-08 08:35:17
 * @FilePath: /GameConnecting/backend/server.js
 */
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import cors from 'cors';
import authRouter from './src/api/auth.js';
// import serversRouter from './src/api/servers.js'; // Old import
import roomsRouter from './src/api/rooms.js'; // New import
import adminRouter from './src/api/admin.js';
import friendsRouter from './src/api/friends.js';
import usersRouter from './src/api/users.js';
import { initSocket } from './src/socket/index.js';
import { getConfig, getServerConfig } from './src/config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const serverConfig = getServerConfig();
const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== serverConfig.apiKey) {
        return res.status(401).json({
            success: false,
            message: '无效的 API Key'
        });
    }
    next();
};

app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [serverConfig.frontendUrl];
        
        // 在开发环境中允许所有来源
        if (getConfig('isDevelopment') || !origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('不允许的跨域请求'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID']
}));

app.use(express.json());

app.use('/auth', authRouter); // Assuming other routes remain as is
// app.use('/servers', serversRouter); // Remove old server route
app.use('/api/rooms', roomsRouter); // Add new rooms route as per instruction
app.use('/admin', adminRouter);
app.use('/friends', friendsRouter);
app.use('/users', usersRouter);

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

const server = createServer(app);
initSocket(server);

const port = serverConfig.port;
server.listen(port, '0.0.0.0', () => {
    console.log('环境:', getConfig('env'));
    console.log('前端URL:', serverConfig.frontendUrl);
    console.log(`后端服务器运行在: http://0.0.0.0:${port}`);
});
