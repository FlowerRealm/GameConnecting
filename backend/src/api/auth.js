import express from 'express';

import {
    registerUser,
    loginUser,
    requestPasswordReset,
    verifyResetToken,
    resetPassword,
} from '../services/authService.js';

const router = express.Router();

// POST /register - User registration
router.post('/register', async (req, res) => {
    try {
        const { password, username, note, requestedOrganizationIds } = req.body;

        if (!password || !username) {
            return res.status(400).json({ success: false, message: '密码和用户名不能为空' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: '密码长度至少为6位' });
        }

        const result = await registerUser(password, username, note, requestedOrganizationIds || []);

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
        console.error('注册路由未知错误:', error); // Original log
        res.status(500).json({ success: false, message: `注册路由处理失败: ${error.message}` });
    }
});

// POST /login - User login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body; // Changed 'email' to 'username'
        if (!username || !password) { // Changed 'email' to 'username'
            return res.status(400).json({ success: false, message: '用户名和密码不能为空' }); // Updated message
        }

        const result = await loginUser(username, password); // Changed 'email' to 'username'

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
        console.error('登录路由未知错误:', error); // Original log
        res.status(500).json({ success: false, message: `登录路由处理失败: ${error.message}` });
    }
});



// POST /logout - User logout
router.post('/logout', (req, res) => {
    res.json({ success: true, message: '已成功注销' });
});

// POST /password/request-reset - 请求密码重置
router.post('/password/request-reset', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ success: false, message: '用户名不能为空' });
        }

        const result = await requestPasswordReset(username);

        if (result.success) {
            res.json({
                success: true,
                message: '密码重置请求已处理，请检查您的重置代码',
                data: { resetRequestId: result.data.resetRequestId }
            });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('密码重置请求路由未知错误:', error);
        res.status(500).json({ success: false, message: `密码重置请求处理失败: ${error.message}` });
    }
});

// POST /password/verify-reset-token - 验证重置令牌
router.post('/password/verify-reset-token', async (req, res) => {
    try {
        const { resetRequestId, resetCode } = req.body;

        if (!resetRequestId || !resetCode) {
            return res.status(400).json({ success: false, message: '重置请求ID和重置代码不能为空' });
        }

        const result = await verifyResetToken(resetRequestId, resetCode);

        if (result.success) {
            res.json({
                success: true,
                message: '重置代码验证成功',
                data: { verificationToken: result.data.verificationToken }
            });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('验证重置令牌路由未知错误:', error);
        res.status(500).json({ success: false, message: `验证重置令牌处理失败: ${error.message}` });
    }
});

// POST /password/reset - 重置密码
router.post('/password/reset', async (req, res) => {
    try {
        const { verificationToken, newPassword } = req.body;

        if (!verificationToken || !newPassword) {
            return res.status(400).json({ success: false, message: '验证令牌和新密码不能为空' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: '密码长度至少为6位' });
        }

        const result = await resetPassword(verificationToken, newPassword);

        if (result.success) {
            res.json({
                success: true,
                message: '密码已成功重置，请使用新密码登录'
            });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('重置密码路由未知错误:', error);
        res.status(500).json({ success: false, message: `重置密码处理失败: ${error.message}` });
    }
});

export default router;