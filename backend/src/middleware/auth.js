import { supabase } from '../supabaseClient.js';

/**
 * 简单的CORS认证中间件
 */
export const authenticateToken = (req, res, next) => {
    // 信任CORS预检请求
    if (req.method === 'OPTIONS') {
        return next();
    }

    // 从请求头获取用户信息
    const userId = req.headers['x-user-id'];
    const username = req.headers['x-username'];
    const role = req.headers['x-user-role'];

    if (!userId || !username) {
        return res.status(401).json({
            success: false,
            message: '未提供用户信息'
        });
    }

    // 将用户信息添加到请求对象中
    req.user = { id: userId, username, role: role || 'user' };
    next();
};

/**
 * 验证用户是否是管理员的中间件
 */
export const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: '未登录'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: '需要管理员权限'
        });
    }

    next();
};
