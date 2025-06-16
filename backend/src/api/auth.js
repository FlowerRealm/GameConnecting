import express from 'express';
import { supabase } from '../supabaseClient.js';
import { authenticateToken } from '../middleware/auth.js';

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

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signUpError) {
            if (signUpError.message.includes('User already registered')) {
                 return res.status(400).json({ success: false, message: '该邮箱已被注册' });
            }
            console.error('Supabase SignUp Error:', signUpError);
            return res.status(signUpError.status || 500).json({ success: false, message: signUpError.message || '注册Auth用户失败' });
        }

        if (!authData.user) {
             return res.status(500).json({ success: false, message: '用户注册成功但未返回用户信息。可能需要邮件确认。' });
        }

        const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
                id: authData.user.id,
                username,
                note: note || null,
                role: 'user',
                status: 'pending'
            });

        if (profileError) {
            console.error('Error inserting user profile:', profileError);
            if (profileError.code === '23505') { // Unique violation
                 return res.status(400).json({ success: false, message: '该用户名已被使用或用户ID已存在配置中' });
            }
            // Attempt to delete the auth user if profile creation fails (requires admin privileges for Supabase client)
            // const { error: deleteUserError } = await supabase.auth.admin.deleteUser(authData.user.id);
            // if (deleteUserError) console.error('Failed to cleanup Supabase auth user after profile insert error:', deleteUserError);
            return res.status(500).json({ success: false, message: '用户配置信息创建失败: ' + profileError.message });
        }

        res.status(201).json({
            success: true,
            message: '注册成功，请等待管理员审核。如项目启用邮件确认，请先确认邮箱。',
            data: { userId: authData.user.id }
        });

    } catch (error) {
        console.error('注册路由未知错误:', error);
        res.status(500).json({ success: false, message: `注册失败: ${error.message}` });
    }
});

// POST /login - User login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: '邮箱和密码不能为空' });
        }

        const { data: authResponse, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            if (signInError.message === 'Invalid login credentials') {
                return res.status(401).json({ success: false, message: '邮箱或密码错误' });
            }
            console.error('Supabase SignIn Error:', signInError);
            return res.status(signInError.status || 500).json({ success: false, message: signInError.message || '登录Auth失败' });
        }

        if (!authResponse.user || !authResponse.session) {
             return res.status(401).json({ success: false, message: '登录失败，未获取到用户信息或会话' });
        }

        const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('username, role, status')
            .eq('id', authResponse.user.id)
            .single();

        if (profileError) {
            console.error('登录时获取用户配置失败:', profileError);
            return res.status(500).json({ success: false, message: '获取用户配置信息失败' });
        }
        if (!userProfile) {
             return res.status(403).json({ success: false, message: '用户配置信息不存在，请联系管理员' });
        }

        if (userProfile.status !== 'active') {
            let message = '您的账号状态异常，请联系管理员';
            if (userProfile.status === 'pending') message = '您的账号正在等待管理员审核';
            if (userProfile.status === 'suspended') message = '您的账号已被暂停';
            if (userProfile.status === 'banned') message = '您的账号已被封禁';
            return res.status(403).json({ success: false, message });
        }

        res.json({
            success: true,
            message: '登录成功',
            data: {
                access_token: authResponse.session.access_token,
                refresh_token: authResponse.session.refresh_token,
                username: userProfile.username,
                role: userProfile.role,
                userId: authResponse.user.id,
                expires_at: authResponse.session.expires_at
            }
        });

    } catch (error) {
        console.error('登录路由未知错误:', error);
        res.status(500).json({ success: false, message: `登录失败: ${error.message}` });
    }
});

// POST /refresh - Refresh JWT
router.post('/refresh', async (req, res) => {
    const clientRefreshToken = req.body.refresh_token;
    if (!clientRefreshToken) {
        return res.status(400).json({ success: false, message: '未提供刷新令牌' });
    }

    try {
        const { data, error } = await supabase.auth.refreshSession({ refresh_token: clientRefreshToken });

        if (error) {
            console.error('Supabase RefreshSession Error:', error);
            return res.status(error.status || 401).json({ success: false, message: error.message || '无法刷新会话' });
        }
        if (!data.session || !data.user) {
            return res.status(401).json({ success: false, message: '无法刷新会话，请重新登录' });
        }

        const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('username, role, status')
            .eq('id', data.user.id)
            .single();

        if (profileError || !userProfile) {
            return res.status(500).json({ success: false, message: '刷新时获取用户配置失败' });
        }
        if (userProfile.status !== 'active') {
            return res.status(403).json({ success: false, message: '账户不再有效，无法刷新令牌' });
        }

        res.json({
            success: true,
            message: 'Token 刷新成功',
            data: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                username: userProfile.username,
                role: userProfile.role,
                userId: data.user.id,
                expires_at: data.session.expires_at
            }
        });
    } catch (error) {
        console.error('Token 刷新路由未知错误:', error);
        res.status(401).json({ success: false, message: `Token 刷新失败: ${error.message}` });
    }
});

// POST /logout - User logout
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // The authenticateToken middleware ensures req.user is populated and token is valid.
        // We need to tell Supabase to invalidate this specific user's session/token.
        // supabase.auth.signOut() called with the user's current JWT (passed by client) should do this.
        // The `Authorization: Bearer <token>` header should be used by Supabase client for this.
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
             return res.status(400).json({ success: false, message: '未提供令牌用于注销' });
        }

        // Global sign out for the user (all sessions) - requires admin
        // await supabase.auth.admin.signOut(req.user.id);

        // Sign out the current session by revoking the refresh token associated with the session.
        // This requires the user to be authenticated (which authenticateToken does).
        // The actual JWT invalidation for stateless JWTs happens by expiry or by client deleting it.
        // Supabase `signOut` revokes all refresh tokens for the user, effectively logging them out everywhere.
        const { error } = await supabase.auth.signOut();


        if (error) {
            console.error('Supabase SignOut Error:', error);
            return res.status(error.status || 500).json({ success: false, message: error.message || '注销失败' });
        }
        res.json({ success: true, message: '已成功注销' });
    } catch (error) {
        console.error('注销路由未知错误:', error);
        res.status(500).json({ success: false, message: `注销失败: ${error.message}` });
    }
});

export default router;