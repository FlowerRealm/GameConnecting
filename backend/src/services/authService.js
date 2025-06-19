import { supabase } from '../supabaseClient.js';

// Service function for user registration
async function registerUser(email, password, username, note) {
    try {
        // Step 1: Sign up the user with Supabase Auth
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signUpError) {
            if (signUpError.message.includes('User already registered')) {
                return { success: false, error: { status: 400, message: '该邮箱已被注册' } };
            }
            console.error('Supabase SignUp Error in service:', signUpError);
            return { success: false, error: { status: signUpError.status || 500, message: signUpError.message || '注册Auth用户失败' } };
        }

        if (!authData.user) {
            return { success: false, error: { status: 500, message: '用户注册成功但未返回用户信息。可能需要邮件确认。' } };
        }

        // Step 2: Insert user profile
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
            console.error('Error inserting user profile in service:', profileError);
            if (profileError.code === '23505') { // Unique violation
                // TODO: Consider attempting to delete the authData.user if profile insertion fails.
                // This requires admin privileges for Supabase client:
                // await supabase.auth.admin.deleteUser(authData.user.id);
                return { success: false, error: { status: 400, message: '该用户名已被使用或用户ID已存在配置中' } };
            }
            return { success: false, error: { status: 500, message: '用户配置信息创建失败: ' + profileError.message } };
        }

        return {
            success: true,
            data: { userId: authData.user.id }
        };

    } catch (error) {
        console.error('Unknown error in registerUser service:', error);
        return { success: false, error: { status: 500, message: `注册服务发生未知错误: ${error.message}` } };
    }
}

// Service function for user login
async function loginUser(email, password) {
    try {
        // Step 1: Sign in with Supabase Auth
        const { data: authResponse, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            if (signInError.message === 'Invalid login credentials') {
                return { success: false, error: { status: 401, message: '邮箱或密码错误' } };
            }
            console.error('Supabase SignIn Error in service:', signInError);
            return { success: false, error: { status: signInError.status || 500, message: signInError.message || '登录Auth失败' } };
        }

        if (!authResponse.user || !authResponse.session) {
            return { success: false, error: { status: 401, message: '登录失败，未获取到用户信息或会话' } };
        }

        // Step 2: Fetch user profile
        const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('username, role, status')
            .eq('id', authResponse.user.id)
            .single();

        if (profileError) {
            console.error('Error fetching user profile in login service:', profileError);
            return { success: false, error: { status: 500, message: '获取用户配置信息失败' } };
        }
        if (!userProfile) {
            return { success: false, error: { status: 403, message: '用户配置信息不存在，请联系管理员' } };
        }

        // Step 3: Check user status
        if (userProfile.status !== 'active') {
            let message = '您的账号状态异常，请联系管理员';
            if (userProfile.status === 'pending') message = '您的账号正在等待管理员审核';
            if (userProfile.status === 'suspended') message = '您的账号已被暂停';
            if (userProfile.status === 'banned') message = '您的账号已被封禁';
            return { success: false, error: { status: 403, message } };
        }

        return {
            success: true,
            data: {
                access_token: authResponse.session.access_token,
                refresh_token: authResponse.session.refresh_token,
                username: userProfile.username,
                role: userProfile.role,
                userId: authResponse.user.id,
                expires_at: authResponse.session.expires_at
            }
        };

    } catch (error) {
        console.error('Unknown error in loginUser service:', error);
        return { success: false, error: { status: 500, message: `登录服务发生未知错误: ${error.message}` } };
    }
}

// Service function for refreshing JWT
async function refreshAuthToken(clientRefreshToken) {
    try {
        const { data, error } = await supabase.auth.refreshSession({ refresh_token: clientRefreshToken });

        if (error) {
            console.error('Supabase RefreshSession Error in service:', error);
            return { success: false, error: { status: error.status || 401, message: error.message || '无法刷新会话' } };
        }
        if (!data.session || !data.user) {
            return { success: false, error: { status: 401, message: '无法刷新会话，请重新登录' } };
        }

        const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('username, role, status')
            .eq('id', data.user.id)
            .single();

        if (profileError || !userProfile) {
            console.error('Error fetching user profile in refresh token service:', profileError);
            return { success: false, error: { status: 500, message: '刷新时获取用户配置失败' } };
        }
        if (userProfile.status !== 'active') {
            return { success: false, error: { status: 403, message: '账户不再有效，无法刷新令牌' } };
        }

        return {
            success: true,
            data: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                username: userProfile.username,
                role: userProfile.role,
                userId: data.user.id,
                expires_at: data.session.expires_at
            }
        };
    } catch (error) {
        console.error('Unknown error in refreshAuthToken service:', error);
        return { success: false, error: { status: 401, message: `Token 刷新服务发生未知错误: ${error.message}` } };
    }
}

// Service function for user logout
async function logoutUser() {
    // Supabase client's signOut method does not require the token to be passed if it was set
    // during signIn or if the client instance is configured with it (e.g. via `supabase.auth.setAuth()`).
    // The `authenticateToken` middleware in the route ensures a valid session exists.
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Supabase SignOut Error in service:', error);
            return { success: false, error: { status: error.status || 500, message: error.message || '注销失败' } };
        }
        return { success: true };
    } catch (error) {
        console.error('Unknown error in logoutUser service:', error);
        return { success: false, error: { status: 500, message: `注销服务发生未知错误: ${error.message}` } };
    }
}

export {
    registerUser,
    loginUser,
    refreshAuthToken,
    logoutUser,
};
