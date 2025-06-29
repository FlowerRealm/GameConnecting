/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-31 09:54:18
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-06-28 10:13:22
 * @FilePath: /GameConnecting/frontend/webServer.js
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 加载环境变量
const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${env}` });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 12000;

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// 健康检查端点
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// 路由处理
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'register.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'chat.html'));
});

app.get('/servers', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'servers.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'profile.html'));
});

app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'forgot-password.html'));
});

// 将 /friends 路由更改为 /users 以提供用户列表页面
// 该页面 (friends.html) 的内容和JS (friends.js) 已被修改为显示用户列表
app.get('/users', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'friends.html'));
});

// 管理员页面路由
app.get('/administrator/user', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'administrator', 'user.html'));
});

app.get('/administrator/server', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'administrator', 'server.html'));
});

// 用户页面路由
app.get('/user/server', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'user', 'server.html'));
});

app.get('/user/user', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'user', 'user.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    res.status(500).send('Something broke!');
});

// 启动服务器
app.listen(port, 'localhost', () => {
});
