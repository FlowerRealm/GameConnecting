import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// API密钥配置
const API_KEY = process.env.API_KEY || 'FlowerRealmGameConnecting'; // 从环境变量读取API Key，如果不存在则使用默认值
console.log('使用的API Key:', API_KEY);

// API密钥验证中间件
const verifyApiKey = (req, res, next) => {
    const apiKey = req.header('X-API-Key');
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ success: false, message: 'Invalid API Key' });
    }
    next();
};

// 创建Express应用
const app = express();

// 创建HTTP服务器
const server = createServer(app);

// 配置Socket.IO
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// API服务器配置（3001端口）
app.use(express.json());
app.use(verifyApiKey); // 对所有API路由应用密钥验证

// 简单的内存存储
const users = [];
const gameServers = [];

// 身份验证端点
app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (user && user.password === password) {
        const token = crypto.randomBytes(32).toString('hex');
        res.json({
            success: true,
            message: '登录成功',
            data: {
                token,
                username
            }
        });
    } else {
        res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
});

app.post('/auth/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    if (users.some(u => u.username === username)) {
        return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    users.push({ username, password });
    res.status(201).json({ success: true, message: '注册成功' });
});

// 服务器管理端点
app.get('/servers', (req, res) => {
    res.json({ success: true, data: gameServers });
});

app.post('/servers', (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ success: false, message: '服务器名称不能为空' });
    }

    const newServer = {
        id: Date.now(),
        name,
        users: []
    };

    gameServers.push(newServer);
    res.status(201).json({ success: true, data: newServer });
});

// Socket.IO身份验证
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    // TODO: 在这里实现更安全的token验证逻辑，例如验证JWT
    if (token) {
        // 假设token有效，将用户信息附加到socket对象上
        socket.user = { username: 'authenticated_user' }; // 示例：替换为实际的用户信息
        next();
    } else {
        next(new Error('Authentication error: Token missing or invalid'));
    }
});

// Socket.IO连接处理
io.on('connection', (socket) => {
    console.log('用户已连接');

    socket.on('join server', (serverId) => {
        const server = gameServers.find(s => s.id === serverId);
        if (server) {
            socket.join(`server-${serverId}`);
            console.log(`用户加入服务器: ${server.name}`);
        }
    });

    socket.on('leave server', (serverId) => {
        socket.leave(`server-${serverId}`);
        console.log('用户离开服务器');
    });

    socket.on('chat message', (data) => {
        if (data.serverId) {
            io.to(`server-${data.serverId}`).emit('message', data.message);
        }
    });

    socket.on('disconnect', () => {
        console.log('用户已断开连接');
    });
});

// 启动API服务器
server.listen(3001, () => {
    console.log('API服务器运行在端口 3001');
});
