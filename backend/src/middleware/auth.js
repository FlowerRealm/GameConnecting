import { supabase } from '../supabaseClient.js'; // Supabase client

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '未提供认证令牌'
        });
    }

    try {
        // Verify token with Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            let message = '无效或过期的认证令牌';
            if (authError) {
                console.error('Supabase GetUser Error:', authError.message);
                // Customize message based on Supabase error if needed
                if (authError.message.includes('expired')) message = '认证令牌已过期';
                else if (authError.message.includes('invalid')) message = '无效的认证令牌';
            }
            return res.status(403).json({ success: false, message });
        }

        // Fetch user profile from user_profiles table
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('username, role, status, id, note') // include id and other fields if needed by req.user
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('获取用户配置信息失败 (auth middleware):', profileError.message);
            return res.status(500).json({ success: false, message: '验证时获取用户配置信息失败' });
        }
        if (!profile) {
            // This case means user exists in Supabase auth.users but not in user_profiles
            // This is an inconsistent state.
            return res.status(403).json({ success: false, message: '用户配置信息不存在，请联系管理员' });
        }

        if (profile.status !== 'active') { // Assuming 'active' is the approved status
            let message = '您的账户状态异常，请联系管理员';
            if (profile.status === 'pending') message = '您的账号正在等待管理员审核';
            if (profile.status === 'suspended') message = '您的账号已被暂停';
            if (profile.status === 'banned') message = '您的账号已被封禁';
            return res.status(403).json({ success: false, message });
        }

        // Attach user information to request object
        req.user = {
            id: user.id, // Supabase auth user ID (UUID)
            userId: user.id, // Alias for compatibility if other parts of app use userId
            email: user.email,
            role: profile.role,
            status: profile.status,
            username: profile.username,
            // Add any other fields from 'user' or 'profile' that might be needed downstream
        };

        next();

    } catch (error) { // Catch-all for unexpected errors
        console.error('认证中间件未知错误:', error.message);
        return res.status(500).json({
            success: false,
            message: '认证处理时发生未知错误'
        });
    }
};

export const isAdmin = (req, res, next) => {
    // Relies on req.user being populated by authenticateToken
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: '需要管理员权限'
        });
    }
    next();
};

export const isApproved = (req, res, next) => {
    // Relies on req.user being populated by authenticateToken
    // And authenticateToken already checks for 'active' status.
    // This middleware might be redundant if authenticateToken enforces 'active' status for all authenticated routes.
    // However, it can be kept for explicit checks or if some routes allow non-active users post-authentication for specific actions.
    if (!req.user || req.user.status !== 'active') {
        return res.status(403).json({
            success: false,
            message: '账户未激活或状态异常' // Generic message as authenticateToken provides specifics
        });
    }
    next();
};

// verifyServerAccess middleware has been removed as its logic is integrated into servers.js routes.
// If it were to be kept as a generic middleware, it would also need to use Supabase.
// For example:
/*
export const verifyServerAccess = (requireOwner = false) => async (req, res, next) => {
    try {
        const serverId = req.params.id; // Assuming server ID is in params
        const currentUserId = req.user.id; // From authenticateToken

        if (!serverId) {
            return res.status(400).json({ success: false, message: '未提供服务器ID' });
        }

        const { data: server, error: serverError } = await supabase
            .from('servers')
            .select('created_by')
            .eq('id', serverId)
            .single();

        if (serverError || !server) {
            return res.status(404).json({ success: false, message: '服务器未找到' });
        }

        const isOwner = server.created_by === currentUserId;

        if (requireOwner) {
            if (!isOwner) {
                return res.status(403).json({ success: false, message: '只有服务器所有者可以执行此操作' });
            }
        } else {
            // If not requiring owner, check if site admin or owner
            const isSiteAdmin = req.user.role === 'admin';
            if (!isOwner && !isSiteAdmin) {
                return res.status(403).json({ success: false, message: '只有服务器所有者或站点管理员可以执行此操作' });
            }
        }

        req.serverData = server; // Attach server data if needed
        next();

    } catch (error) {
        console.error('服务器权限验证失败 (Supabase):', error);
        res.status(500).json({ success: false, message: '服务器权限验证失败: ' + error.message });
    }
};
*/
