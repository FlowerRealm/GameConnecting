import { dbHelper } from '../utils/dbHelper.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../supabaseAdminClient.js';

const userDb = dbHelper.query('user_profiles');
const resetDb = dbHelper.query('password_reset_requests');
const roomsDb = dbHelper.query('rooms');
const roomMembersDb = dbHelper.query('room_members');

/**
 * 获取用户列表
 */
async function getUserList(queryParams = {}) {
  const { page = 1, limit = 10, status, search } = queryParams;
  const offset = (page - 1) * limit;

  let conditions = {};
  if (status) conditions.status = status;

  let options = {
    select: 'id, username, role, status, created_at',
    orderBy: { field: 'created_at', ascending: false },
    limit,
    offset
  };

  if (search) {
    options.search = { field: 'username', value: search };
  }

  return await userDb.find(conditions, options);
}

/**
 * 获取用户详情
 */
async function getUserById(userId) {
  return await userDb.findOne({ id: userId });
}

/**
 * 创建用户
 */
async function createUser(userData) {
  const { username, email, password } = userData;

  // 检查用户名是否已存在
  const existingUser = await userDb.findOne({ username });
  if (existingUser.success) {
    return { success: false, error: { message: '用户名已存在' } };
  }

  // 检查邮箱是否已存在
  const existingEmail = await userDb.findOne({ email });
  if (existingEmail.success) {
    return { success: false, error: { message: '邮箱已被使用' } };
  }

  // 哈希密码
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 创建用户
  return await userDb.create({
    username,
    email,
    password: hashedPassword,
    role: 'user',
    status: 'pending',
    created_at: new Date().toISOString()
  });
}

/**
 * 更新用户状态
 */
async function updateUserStatus(userId, status) {
  if (!['pending', 'approved', 'rejected', 'active', 'suspended', 'banned'].includes(status)) {
    return { success: false, error: { message: '无效的用户状态' } };
  }

  return await userDb.update({ id: userId }, {
    status,
    updated_at: new Date().toISOString()
  });
}

/**
 * 更新用户角色
 */
async function updateUserRole(userId, role) {
  if (!['user', 'admin'].includes(role)) {
    return { success: false, error: { message: '无效的用户角色' } };
  }

  return await userDb.update({ id: userId }, {
    role,
    updated_at: new Date().toISOString()
  });
}

/**
 * 更新用户密码（通过 Supabase Auth API）
 */
async function updateUserPassword(userId, password) {
  // 直接调用 Supabase Auth Admin API 修改密码（新版为 updateUserById）
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
  if (error) {
    console.error('Supabase admin password update error:', error);
    return { success: false, error: { message: error.message } };
  }
  return { success: true, data };
}

/**
 * 删除用户
 */
async function deleteUser(userId) {
  return await userDb.delete({ id: userId });
}

/**
 * 验证用户登录
 */
async function verifyLogin(username, password) {
  const userResult = await userDb.findOne({ username });

  if (!userResult.success) {
    return { success: false, error: { message: '用户名或密码错误' } };
  }

  const user = userResult.data;

  // 检查密码
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { success: false, error: { message: '用户名或密码错误' } };
  }

  // 检查用户状态
  if (user.status !== 'active') {
    return { success: false, error: { message: '账号未激活或已被禁用' } };
  }

  // 更新最后登录时间
  await userDb.update({ id: user.id }, {
    last_login: new Date().toISOString()
  });

  return {
    success: true,
    data: {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email
    }
  };
}

// === 用户注册 ===
export async function registerUser(password, username, note) {
  const email = `${username}@local`;
  // 检查用户名是否已存在
  const existingUser = await userDb.findOne({ username });
  if (existingUser.success) {
    return { success: false, error: { message: '用户名已存在' } };
  }
  // 创建 Supabase Auth 用户
  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) {
    return { success: false, error: { message: error.message } };
  }
  // 创建 user_profiles 记录
  await userDb.create({
    id: data.user.id,
    username,
    email,
    note: note || '',
    role: 'user',
    status: 'pending',
    created_at: new Date().toISOString()
  });
  return { success: true };
}

// === 用户登录 ===
export async function loginUser(username, password) {
  // 直接用用户名作为 email 登录 Supabase Auth
  const email = `${username}@local`; // 约定所有用户名型账号邮箱为 username@local
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (error) {
    return { success: false, error: { message: error.message } };
  }
  // 查询 user_profiles 获取角色等
  const userResult = await userDb.findOne({ username });
  if (!userResult.success) {
    return { success: false, error: { message: '用户不存在' } };
  }
  const user = userResult.data;
  return {
    success: true,
    data: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
}

// === 房间相关 ===
export async function listPublicRooms() {
  try {
    const result = await roomsDb.find({ room_type: 'public' });
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: { message: '获取房间列表失败' } };
    }
  } catch (error) {
    return { success: false, error: { message: '服务器错误' } };
  }
}

export async function createRoom(name, description, room_type = 'public', creatorId) {
  try {
    const room = {
      name,
      description,
      room_type: room_type || 'public',
      creator_id: creatorId,
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString()
    };
    const result = await roomsDb.create(room);
    if (result.success) {
      // 自动将创建者加入成员表
      await roomMembersDb.create({
        room_id: result.data.id,
        user_id: creatorId,
        role: 'owner',
        joined_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      });
      return { success: true, data: result.data };
    } else {
      return { success: false, error: { message: '创建房间失败' } };
    }
  } catch (error) {
    return { success: false, error: { message: '服务器错误' } };
  }
}

export async function joinRoom(roomId, userId) {
  try {
    // 检查是否已是成员
    const exist = await roomMembersDb.findOne({ room_id: roomId, user_id: userId });
    if (exist.success) {
      return { success: false, error: { message: '已经是房间成员' } };
    }
    // 加入房间
    const result = await roomMembersDb.create({
      room_id: roomId,
      user_id: userId,
      role: 'member',
      joined_at: new Date().toISOString(),
      last_active: new Date().toISOString()
    });
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: { message: '加入房间失败' } };
    }
  } catch (error) {
    return { success: false, error: { message: '服务器错误' } };
  }
}

export async function leaveRoom(roomId, userId) {
  try {
    const result = await roomMembersDb.delete({ room_id: roomId, user_id: userId });
    if (result.success) {
      return { success: true, message: '已离开房间' };
    } else {
      return { success: false, error: { message: '离开房间失败' } };
    }
  } catch (error) {
    return { success: false, error: { message: '服务器错误' } };
  }
}

export async function getRoomMembers(roomId) {
  try {
    const result = await roomMembersDb.find({ room_id: roomId });
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: { message: '获取成员失败' } };
    }
  } catch (error) {
    return { success: false, error: { message: '服务器错误' } };
  }
}

export async function deleteRoom(roomId, userId) {
  try {
    // 只允许房主删除
    const room = await roomsDb.findOne({ id: roomId });
    if (!room.success) {
      return { success: false, error: { message: '房间不存在' } };
    }
    if (room.data.creator_id !== userId) {
      return { success: false, error: { message: '只有房主可以删除房间' } };
    }
    const result = await roomsDb.delete({ id: roomId });
    if (result.success) {
      return { success: true, message: '房间已删除' };
    } else {
      return { success: false, error: { message: '删除房间失败' } };
    }
  } catch (error) {
    return { success: false, error: { message: '服务器错误' } };
  }
}

// ========== 密码重置相关（占位实现） ========== //
export async function requestPasswordReset(username) {
  // 查找用户
  const userResult = await userDb.findOne({ username });
  if (!userResult.success) {
    // 不暴露用户是否存在，防止枚举
    return { success: true, data: { resetRequestId: uuidv4() } };
  }
  const user = userResult.data;
  // 生成6位数字验证码
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const resetCodeHash = crypto.createHash('sha256').update(resetCode).digest('hex');
  const resetRequestId = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小时有效
  // 存储请求
  await resetDb.create({
    id: resetRequestId,
    user_id: user.id,
    reset_code_hash: resetCodeHash,
    expires_at: expiresAt.toISOString(),
    used: false
  });
  // 实际项目应通过短信/邮件/站内信发送 resetCode，这里直接返回（开发环境）
  return { success: true, data: { resetRequestId, devResetCode: resetCode } };
}

export async function verifyResetToken(resetRequestId, resetCode) {
  const resetCodeHash = crypto.createHash('sha256').update(resetCode).digest('hex');
  const reqResult = await resetDb.findOne({ id: resetRequestId });
  if (!reqResult.success) {
    return { success: false, error: { message: '无效的重置请求' } };
  }
  const req = reqResult.data;
  if (req.used || new Date(req.expires_at) < new Date()) {
    return { success: false, error: { message: '重置码已过期或已使用' } };
  }
  if (req.reset_code_hash !== resetCodeHash) {
    return { success: false, error: { message: '验证码错误' } };
  }
  // 生成验证令牌
  const verificationToken = uuidv4();
  await resetDb.update({ id: resetRequestId }, { verification_token: verificationToken, used: true });
  return { success: true, data: { verificationToken, userId: req.user_id } };
}

export async function resetPassword(verificationToken, newPassword) {
  // 查找验证令牌
  const reqResult = await resetDb.findOne({ verification_token: verificationToken, used: true });
  if (!reqResult.success) {
    return { success: false, error: { message: '无效的验证令牌' } };
  }
  const req = reqResult.data;
  // 更新用户密码
  await updateUserPassword(req.user_id, newPassword);
  return { success: true };
}

export { getUserList, getUserById, createUser, updateUserStatus, updateUserRole, updateUserPassword, deleteUser, verifyLogin };