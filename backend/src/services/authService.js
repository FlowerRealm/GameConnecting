import { supabase } from '../supabaseClient.js';
import { supabaseAdmin } from '../supabaseAdminClient.js'; // Added for admin operations
import crypto from 'crypto';

// Service function for user registration
async function registerUser(password, username, note, requestedOrganizationIds = []) {
    let authUserId = null;

    try {
        // 规范化用户名并生成占位邮箱
        const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const placeholderEmail = `${normalizedUsername}_${Date.now().toString().slice(-6)}@no-reply.example.com`;

        // 批处理：创建用户和插入配置
        const { data: authData, error: adminUserError } = await supabaseAdmin.auth.admin.createUser({
            email: placeholderEmail,
            password: password,
            email_confirm: true
        });

        if (adminUserError) {
            if (adminUserError.message && (adminUserError.message.toLowerCase().includes('email address already registered') ||
                adminUserError.message.toLowerCase().includes('unique constraint failed') && adminUserError.message.toLowerCase().includes('email'))) {
                return { success: false, error: { status: 400, message: '注册失败，生成的占位邮箱已存在或与现有用户冲突。' } };
            }
            return { success: false, error: { status: adminUserError.status || 500, message: adminUserError.message || '通过Admin API创建Auth用户失败' } };
        }

        // 确保authData和authData.user存在
        if (!authData || !authData.user) {
            return { success: false, error: { status: 500, message: '通过Admin API创建用户成功但未返回用户信息。' } };
        }
        authUserId = authData.user.id;

        // 创建用户资料
        const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
                id: authUserId,
                username: username,
                note: note || null,
                role: 'user',
                status: 'pending'
            });

        if (profileError) {
            // 如果创建用户资料失败，清理Auth用户
            if (authUserId) {
                await supabaseAdmin.auth.admin.deleteUser(authUserId).catch(e => console.error('Failed to delete auth user after profile error:', e));
            }

            if (profileError.message && profileError.message.includes('duplicate key')) {
                return { success: false, error: { status: 400, message: '该用户名已被使用。' } };
            }
            return { success: false, error: { status: 500, message: '创建用户资料失败: ' + profileError.message } };
        }

        // 如果有组织ID，创建组织成员关系
        if (requestedOrganizationIds && requestedOrganizationIds.length > 0) {
            for (const orgId of requestedOrganizationIds) {
                const { error: membershipError } = await supabase
                    .from('user_organization_memberships')
                    .insert({
                        user_id: authUserId,
                        organization_id: orgId,
                        role_in_org: 'member',
                        status_in_org: 'pending_approval'
                    });

                if (membershipError) {
                    console.error('Failed to create organization membership:', membershipError);
                    // 不中断注册流程，只记录错误
                }
            }
        }

        return {
            success: true,
            data: { userId: authUserId },
            message: '注册成功，请等待管理员审核。'
        };
    } catch (error) {
        // 如果创建了Auth用户但后续操作失败，尝试清理
        if (authUserId) {
            await supabaseAdmin.auth.admin.deleteUser(authUserId).catch(e => console.error('Failed to delete auth user after error:', e));
        }
        return { success: false, error: { status: 500, message: `注册服务发生未知错误: ${error.message}` } };
    }
}

// Service function for user login
async function loginUser(username, password) {
    try {
        // 从数据库查询用户ID
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('id, status, role')
            .eq('username', username)
            .single();

        if (profileError || !profileData) {
            // 安全原因，不透露用户是否存在
            return { success: false, error: { status: 401, message: '用户名或密码错误' } };
        }

        const userId = profileData.id;

        // 如果状态不是active，直接返回适当消息
        if (profileData.status !== 'active') {
            let message = '您的账号状态异常，请联系管理员';
            if (profileData.status === 'pending') message = '您的账号正在等待管理员审核';
            if (profileData.status === 'suspended') message = '您的账号已被暂停';
            if (profileData.status === 'banned') message = '您的账号已被封禁';
            return { success: false, error: { status: 403, message } };
        }

        // 获取用户占位邮箱
        const { data: authUserResponse, error: adminUserError } = await supabaseAdmin.auth.admin.getUserById(userId);

        if (adminUserError || !authUserResponse?.user?.email) {
            return { success: false, error: { status: 500, message: '登录时获取用户认证信息失败' } };
        }

        const placeholderEmail = authUserResponse.user.email;

        // 使用占位邮箱登录
        const { data: authResponse, error: signInError } = await supabase.auth.signInWithPassword({
            email: placeholderEmail,
            password,
        });

        if (signInError) {
            if (signInError.message === 'Invalid login credentials') {
                return { success: false, error: { status: 401, message: '用户名或密码错误' } };
            }
            return { success: false, error: { status: signInError.status || 500, message: signInError.message || '登录Auth失败' } };
        }

        if (!authResponse.user || !authResponse.session) {
            return { success: false, error: { status: 401, message: '登录失败，未获取到用户信息或会话' } };
        }

        return {
            success: true,
            data: {
                username: username,
                role: profileData.role,
                userId: authResponse.user.id
            }
        };
    } catch (error) {
        return { success: false, error: { status: 500, message: `登录服务发生未知错误: ${error.message}` } };
    }
}



// Service function to request password reset
async function requestPasswordReset(username) {
    try {
        // 从数据库查询用户ID
        const { data: profile, error: profileLookupError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('username', username)
            .single();

        if (profileLookupError || !profile) {
            // 安全原因，不透露用户是否存在
            return {
                success: true,
                data: {
                    resetRequestId: crypto.randomUUID() // 返回随机UUID防止枚举攻击
                }
            };
        }

        const userId = profile.id;

        // 生成6位重置码
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        // 哈希存储重置码
        const resetCodeHash = crypto.createHash('sha256').update(resetCode).digest('hex');

        // 为防止重置请求攻击，限制每小时只能请求一次重置码
        const hourAgo = new Date();
        hourAgo.setHours(hourAgo.getHours() - 1);

        // 检查最近是否已经请求过重置
        const { data: recentRequests, error: countError } = await supabase
            .from('password_reset_requests')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', hourAgo.toISOString())
            .limit(1);

        if (!countError && recentRequests && recentRequests.length > 0) {
            // 已经最近请求过
            return {
                success: true,
                data: { resetRequestId: recentRequests[0].id }
            };
        }

        // 创建新的重置请求
        const resetRequestId = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 重置码1小时后过期

        // 创建重置请求
        const { error: insertError } = await supabase
            .from('password_reset_requests')
            .insert({
                id: resetRequestId,
                user_id: userId,
                reset_code_hash: resetCodeHash,
                expires_at: expiresAt.toISOString(),
                used: false
            });

        if (insertError) {
            if (insertError.code === '42P01') { // 表不存在
                // 创建表
                await supabaseAdmin.rpc('create_password_reset_table');

                // 重试插入
                const { error: retryError } = await supabase
                    .from('password_reset_requests')
                    .insert({
                        id: resetRequestId,
                        user_id: userId,
                        reset_code_hash: resetCodeHash,
                        expires_at: expiresAt.toISOString(),
                        used: false
                    });

                if (retryError) {
                    return { success: false, error: { status: 500, message: '无法创建密码重置请求' } };
                }
            } else {
                return { success: false, error: { status: 500, message: '无法创建密码重置请求' } };
            }
        }

        // 开发环境下记录重置码
        console.log(`[DEV ONLY] Reset code for user ${username} is ${resetCode}`);

        return {
            success: true,
            data: { resetRequestId }
        };
    } catch (error) {
        return { success: false, error: { status: 500, message: `密码重置请求服务发生未知错误: ${error.message}` } };
    }
}

// Service function to verify reset token
async function verifyResetToken(resetRequestId, resetCode) {
    try {
        // 哈希输入的重置码
        const resetCodeHash = crypto.createHash('sha256').update(resetCode).digest('hex');

        // 获取重置请求
        const { data: resetRequest, error: fetchError } = await supabase
            .from('password_reset_requests')
            .select('user_id, reset_code_hash, expires_at, used')
            .eq('id', resetRequestId)
            .single();

        if (fetchError || !resetRequest) {
            return { success: false, error: { status: 400, message: '无效的重置请求' } };
        }

        // 检查重置请求是否过期
        if (new Date(resetRequest.expires_at) < new Date()) {
            return { success: false, error: { status: 400, message: '重置码已过期' } };
        }

        // 检查是否已使用
        if (resetRequest.used) {
            return { success: false, error: { status: 400, message: '此重置码已被使用' } };
        }

        // 检查重置码是否匹配
        if (resetRequest.reset_code_hash !== resetCodeHash) {
            return { success: false, error: { status: 400, message: '无效的重置码' } };
        }

        // 生成验证令牌
        const verificationToken = crypto.randomUUID();

        // 更新重置请求状态
        const { error: updateError } = await supabase
            .from('password_reset_requests')
            .update({
                verification_token: verificationToken,
                used: true
            })
            .eq('id', resetRequestId);

        if (updateError) {
            return { success: false, error: { status: 500, message: '无法验证重置码' } };
        }

        return {
            success: true,
            data: {
                verificationToken,
                userId: resetRequest.user_id
            }
        };
    } catch (error) {
        return { success: false, error: { status: 500, message: `验证重置令牌服务发生未知错误: ${error.message}` } };
    }
}

// Service function to reset password
async function resetPassword(verificationToken, newPassword) {
    try {
        // 查找验证令牌对应的重置请求
        const { data: resetRequest, error: fetchError } = await supabase
            .from('password_reset_requests')
            .select('user_id')
            .eq('verification_token', verificationToken)
            .eq('used', true)
            .single();

        if (fetchError || !resetRequest) {
            return { success: false, error: { status: 400, message: '无效的验证令牌' } };
        }

        const userId = resetRequest.user_id;

        // 使用管理员客户端更新密码
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (updateError) {
            return { success: false, error: { status: 500, message: '无法重置密码' } };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: { status: 500, message: `重置密码服务发生未知错误: ${error.message}` } };
    }
}

export {
    registerUser,
    loginUser,
    requestPasswordReset,
    verifyResetToken,
    resetPassword,
};
