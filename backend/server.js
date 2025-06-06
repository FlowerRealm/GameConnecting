import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import cors from 'cors';
import { initDb, sequelize, db } from './src/db/index.js';
import authRouter from './src/api/auth.js';
import serversRouter from './src/api/servers.js';
import adminRouter from './src/api/admin.js';
import friendsRouter from './src/api/friends.js';
import usersRouter from './src/api/users.js';
import { initSocket } from './src/socket/index.js';
import { getConfig, getServerConfig } from './src/config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

await initDb();

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

        if (!origin || allowedOrigins.includes(origin)) {
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

app.use('/auth', authRouter);
app.use('/servers', serversRouter);
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
server.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
    console.log('环境:', getConfig('env'));
    console.log('前端URL:', serverConfig.frontendUrl);
});
