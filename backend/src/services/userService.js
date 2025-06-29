import { dbHelper } from '../utils/dbHelper.js';
import bcrypt from 'bcryptjs';

const userDb = dbHelper.query('user_profiles');

/**
 * 获取用户列表
 */
async function getUserList(queryParams = {}) {
  const { page = 1, limit = 10, status, search } = queryParams;
  const offset = (page - 1) * limit;

  let conditions = {};
  if (status) conditions.status = status;

  let options = {
    select: 'id, username, email, role, status, created_at, last_login',
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
 * 更新用户密码
 */
async function updateUserPassword(userId, password) {
  // 哈希密码
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  return await userDb.update({ id: userId }, {
    password: hashedPassword,
    updated_at: new Date().toISOString()
  });
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

export {
  getUserList,
  getUserById,
  createUser,
  updateUserStatus,
  updateUserRole,
  updateUserPassword,
  deleteUser,
  verifyLogin
};