import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
    registerUser,
    loginUser,
    refreshAuthToken,
    logoutUser,
} from '../services/authService.js';

const router = express.Router();

// POST /register - User registration
router.post('/register', async (req, res) => {
    try {
        const { email, password, username, note } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({ success: false, message: '邮箱、密码和用户名不能为空' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: '密码长度至少为6位' });
        }

        const result = await registerUser(email, password, username, note);

        if (result.success) {
            res.status(201).json({
                success: true,
                message: '注册成功，请等待管理员审核。如项目启用邮件确认，请先确认邮箱。',
                data: result.data
            });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        // This catch block is for unexpected errors in the route handler itself,
        // or if the service throws an error not caught by its own try-catch.
        console.error('注册路由未知错误:', error);
        res.status(500).json({ success: false, message: `注册路由处理失败: ${error.message}` });
    }
});

// POST /login - User login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: '邮箱和密码不能为空' });
        }

        const result = await loginUser(email, password);

        if (result.success) {
            res.json({
                success: true,
                message: '登录成功',
                data: result.data
            });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('登录路由未知错误:', error);
        res.status(500).json({ success: false, message: `登录路由处理失败: ${error.message}` });
    }
});

// POST /refresh - Refresh JWT
router.post('/refresh', async (req, res) => {
    const clientRefreshToken = req.body.refresh_token;
    if (!clientRefreshToken) {
        return res.status(400).json({ success: false, message: '未提供刷新令牌' });
    }

    try {
        const result = await refreshAuthToken(clientRefreshToken);

        if (result.success) {
            res.json({
                success: true,
                message: 'Token 刷新成功',
                data: result.data
            });
        } else {
            res.status(result.error.status || 401).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('Token 刷新路由未知错误:', error);
        res.status(500).json({ success: false, message: `Token 刷新路由处理失败: ${error.message}` });
    }
});

// POST /logout - User logout
router.post('/logout', authenticateToken, async (req, res) => {
    // The authenticateToken middleware ensures req.user is populated.
    // The token itself isn't strictly needed by logoutUser if Supabase client is already authed.
    try {
        const result = await logoutUser(); // Pass req.user or token if service needs it, but current service doesn't

        if (result.success) {
            res.json({ success: true, message: '已成功注销' });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('注销路由未知错误:', error);
        res.status(500).json({ success: false, message: `注销路由处理失败: ${error.message}` });
    }
});

export default router;