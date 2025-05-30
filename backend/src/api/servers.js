import express from 'express';
import Server from '../db/models/server.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// 获取所有服务器
router.get('/', async (req, res) => {
    try {
        const servers = await Server.findAll();
        res.json(servers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 创建新服务器 (需要认证)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, ipAddress, port } = req.body;
        const server = await Server.create({
            name,
            ipAddress,
            port,
            createdBy: req.user.userId // 记录创建者
        });
        res.status(201).json(server);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 获取特定服务器 (需要认证)
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const server = await Server.findByPk(req.params.id);
        if (!server) {
            return res.status(404).json({ error: '服务器未找到' });
        }
        res.json(server);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 更新特定服务器 (需要认证，并且是创建者)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, ipAddress, port } = req.body;
        const server = await Server.findByPk(req.params.id);

        if (!server) {
            return res.status(404).json({ error: '服务器未找到' });
        }

        if (server.createdBy !== req.user.userId) {
            return res.status(403).json({ error: '无权修改此服务器' });
        }

        server.name = name || server.name;
        server.ipAddress = ipAddress || server.ipAddress;
        server.port = port || server.port;
        await server.save();

        res.json(server);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 删除特定服务器 (需要认证，并且是创建者)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const server = await Server.findByPk(req.params.id);

        if (!server) {
            return res.status(404).json({ error: '服务器未找到' });
        }

        if (server.createdBy !== req.user.userId) {
            return res.status(403).json({ error: '无权删除此服务器' });
        }

        await server.destroy();

        res.json({ message: '服务器删除成功' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;