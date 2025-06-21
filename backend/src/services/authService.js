import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdminClient.js'; // Added for admin operations

// Service function for user registration
async function registerUser(password, username, note, requestedOrganizationIds = []) { // Email parameter removed
    let authUserId = null; // To store the ID of the created auth user for potential rollback

    try {
        // Generate Placeholder Email
        const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const placeholderEmail = `${normalizedUsername}_${Date.now().toString().slice(-6)}@no-reply.example.com`;

        // Step 1: Create the user with Supabase Admin Auth
        const { data: authData, error: adminUserError } = await supabaseAdmin.auth.admin.createUser({
            email: placeholderEmail,
            password: password,
            email_confirm: true // Add or set this to true
        });

        if (adminUserError) {
            // Adapt error handling for createUser.
            if (adminUserError.message && (adminUserError.message.toLowerCase().includes('email address already registered') ||
                adminUserError.message && adminUserError.message.toLowerCase().includes('unique constraint failed') && adminUserError.message.toLowerCase().includes('email'))) {
                console.error('Supabase Admin CreateUser Error (likely placeholder email collision):', adminUserError);
                return { success: false, error: { status: 400, message: '注册失败，生成的占位邮箱已存在或与现有用户冲突。' } };
            }
            console.error('Supabase Admin CreateUser Error:', adminUserError);
            return { success: false, error: { status: adminUserError.status || 500, message: adminUserError.message || '通过Admin API创建Auth用户失败' } };
        }

        // Ensure authData and authData.user exist
        if (!authData || !authData.user) {
            console.error('Admin CreateUser response missing user data:', authData);
            return { success: false, error: { status: 500, message: '通过Admin API创建用户成功但未返回用户信息。' } };
        }
        authUserId = authData.user.id; // Get user ID

        // Step 2: Insert user profile
        const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
                id: authUserId,
                username,
                note: note || null,
                role: 'user',
                status: 'pending' // Or 'active' if auto-approved, 'pending' if admin approval needed
            });

        if (profileError) {
            console.error('Error inserting user profile in service:', profileError);
            // Attempt to delete the auth user if profile creation fails
            if (authUserId) {
                console.log(`Attempting to delete auth user ${authUserId} due to profile insertion error.`);
                const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
                if (deleteUserError) {
                    console.error(`Failed to cleanup Supabase auth user ${authUserId} after profile insert error:`, deleteUserError);
                } else {
                    console.log(`Successfully deleted auth user ${authUserId} after profile error.`);
                }
            }
            if (profileError.code === '23505') { // Unique violation for username
                return { success: false, error: { status: 400, message: '该用户名已被使用。' } };
            }
            return { success: false, error: { status: 500, message: '用户配置信息创建失败: ' + profileError.message } };
        }

        // Step 3: Handle requested organization memberships
        if (requestedOrganizationIds && requestedOrganizationIds.length > 0) {
            const membershipsToInsert = requestedOrganizationIds.map(orgId => ({
                user_id: authUserId,
                organization_id: orgId,
                role_in_org: 'member', // Default role
                status_in_org: 'pending_approval' // Default status
            }));

            const { error: membershipError } = await supabase
                .from('user_organization_memberships')
                .insert(membershipsToInsert);

            if (membershipError) {
                console.error('Error inserting organization memberships:', membershipError);
                // Attempt to delete the auth user (which should cascade to user_profiles)
                if (authUserId) {
                    console.log(`Attempting to delete auth user ${authUserId} due to membership insertion error.`);
                    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
                    if (deleteUserError) {
                        console.error(`Failed to cleanup Supabase auth user ${authUserId} after membership insert error:`, deleteUserError);
                    } else {
                        console.log(`Successfully deleted auth user ${authUserId} after membership error.`);
                    }
                }
                return { success: false, error: { status: 500, message: '创建组织成员请求失败: ' + membershipError.message } };
            }
        }

        return {
            success: true,
            data: { userId: authUserId },
            message: '注册成功，请等待管理员审核。如项目启用邮件确认，请先确认邮箱。'
        };

    } catch (error) {
        console.error('Unknown error in registerUser service:', error);
        // If an authUserId was set, it means the auth user was created, try to clean up if something unexpected happened
        if (authUserId) {
            console.log(`Attempting to delete auth user ${authUserId} due to unknown error in registration process.`);
            const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
            if (deleteUserError) {
                console.error(`Failed to cleanup Supabase auth user ${authUserId} after unknown error:`, deleteUserError);
            } else {
                console.log(`Successfully deleted auth user ${authUserId} after unknown error.`);
            }
        }
        return { success: false, error: { status: 500, message: `注册服务发生未知错误: ${error.message}` } };
    }
}

// Service function for user login
async function loginUser(username, password) { // Changed 'email' to 'username'
    try {
        // Step 1: Look up user profile by username to get their auth ID
        const { data: profileForEmailLookup, error: profileLookupError } = await supabase
            .from('user_profiles')
            .select('id') // Select the auth user ID
            .eq('username', username)
            .single();

        if (profileLookupError || !profileForEmailLookup) {
            console.error('Login: User profile not found for username:', username, 'Error:', profileLookupError);
            // Generic message for security, don't reveal if username exists or not
            return { success: false, error: { status: 401, message: '用户名或密码错误' } };
        }

        const userId = profileForEmailLookup.id;

        // Step 2: Fetch the auth user's details (including placeholder email) using the admin client
        const { data: authUserResponse, error: adminUserError } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (adminUserError || !authUserResponse || !authUserResponse.user) {
            console.error('Login: Could not fetch auth user details for ID:', userId, 'Error:', adminUserError);
            return { success: false, error: { status: 500, message: '登录时获取用户认证信息失败' } };
        }

        const placeholderEmail = authUserResponse.user.email;
        if (!placeholderEmail) {
            console.error('Login: Placeholder email not found for user ID:', userId);
            return { success: false, error: { status: 500, message: '登录时用户占位邮箱信息缺失' } };
        }

        // Step 3: Sign in with Supabase Auth using the retrieved placeholder email
        const { data: authResponse, error: signInError } = await supabase.auth.signInWithPassword({
            email: placeholderEmail, // Use the retrieved placeholder email
            password,
        });

        if (signInError) {
            if (signInError.message === 'Invalid login credentials') {
                // This message now refers to the (placeholderEmail, password) pair
                return { success: false, error: { status: 401, message: '用户名或密码错误' } }; // Updated message
            }
            console.error('Supabase SignIn Error in service (using placeholder email):', signInError);
            return { success: false, error: { status: signInError.status || 500, message: signInError.message || '登录Auth失败' } };
        }

        if (!authResponse.user || !authResponse.session) {
            return { success: false, error: { status: 401, message: '登录失败，未获取到用户信息或会话' } };
        }

        // Step 4: Fetch user profile (using the ID from successful sign-in)
        // This remains largely the same as before, as authResponse.user.id is reliable after successful signInWithPassword
        const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('username, role, status') // Ensure 'username' is selected here if you need to return it
            .eq('id', authResponse.user.id)
            .single();

        if (profileError) {
            console.error('Error fetching user profile in login service (after sign-in):', profileError);
            return { success: false, error: { status: 500, message: '获取用户配置信息失败' } };
        }
        if (!userProfile) {
            // This should ideally not happen if the user was able to sign in with Supabase Auth
            // and a profile was created during registration.
            console.error('Login: User profile not found after successful sign-in for ID:', authResponse.user.id);
            return { success: false, error: { status: 403, message: '用户配置信息不存在，请联系管理员' } };
        }

        // Step 5: Check user status
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
                username: userProfile.username, // Return the actual username from the profile
                role: userProfile.role,
                userId: authResponse.user.id, // This is the Supabase Auth User ID (UUID)
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
