# GameConnecting 项目文档库

## 目录
1. [项目概述](#项目概述)
2. [技术架构](#技术架构)
3. [数据库结构](#数据库结构)
4. [前后端通信JSON结构](#前后端通信json结构)
5. [核心功能模块](#核心功能模块)
6. [运行流程](#运行流程)
7. [API接口文档](#api接口文档)
8. [前端组件文档](#前端组件文档)
9. [部署配置](#部署配置)

---

## 项目概述

GameConnecting是一个实时游戏社交平台，支持用户注册、认证、房间管理和实时聊天功能。

### 核心特性
- 用户名注册（无需邮箱）
- 角色权限管理（用户/管理员）
- 房间（服务器）管理
- 好友系统
- 实时聊天
- 管理员审批机制

---

## 技术架构

### 后端技术栈
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: PostgreSQL (Supabase管理)
- **认证**: Supabase Auth
- **实时通信**: Socket.IO
- **数据库迁移**: node-pg-migrate

### 前端技术栈
- **结构**: 原生HTML/CSS/JavaScript (ES模块)
- **静态服务器**: Express.js
- **状态管理**: 自定义Store类
- **API通信**: 自定义ApiService类

### 部署架构
- **后端**: Render
- **前端**: Vercel
- **数据库**: Supabase

---

## 数据库结构

### 核心表结构

#### 1. user_profiles (用户资料表)
```sql
CREATE TABLE public.user_profiles (
    id uuid PRIMARY KEY NOT NULL,           -- 用户ID (关联auth.users)
    username text UNIQUE NOT NULL,          -- 用户名
    note text,                              -- 备注
    role text DEFAULT 'user',               -- 角色: 'user', 'admin', 'moderator'
    status text DEFAULT 'pending',          -- 状态: 'pending', 'active', 'suspended', 'banned'
    created_at timestamptz DEFAULT current_timestamp,
    updated_at timestamptz DEFAULT current_timestamp
);
```

#### 2. rooms (房间/服务器表)
```sql
CREATE TABLE public.rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,                     -- 房间名称
    description text,                       -- 房间描述
    room_type text DEFAULT 'public',        -- 房间类型: 'public', 'private'
    creator_id uuid REFERENCES user_profiles(id),
    created_at timestamptz DEFAULT current_timestamp,
    updated_at timestamptz DEFAULT current_timestamp,
    last_active_at timestamptz DEFAULT current_timestamp
);
```

#### 3. room_members (房间成员表)
```sql
CREATE TABLE public.room_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
    user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
    role text DEFAULT 'member',             -- 角色: 'owner', 'member'
    joined_at timestamptz DEFAULT current_timestamp,
    updated_at timestamptz DEFAULT current_timestamp,
    UNIQUE(room_id, user_id)
);
```

#### 4. password_reset_requests (密码重置请求表)
```sql
CREATE TABLE public.password_reset_requests (
    id uuid PRIMARY KEY NOT NULL,
    user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
    reset_code_hash text NOT NULL,          -- 重置码哈希
    verification_token text,                -- 验证令牌
    expires_at timestamptz NOT NULL,        -- 过期时间
    used boolean DEFAULT false,             -- 是否已使用
    created_at timestamptz DEFAULT current_timestamp,
    updated_at timestamptz DEFAULT current_timestamp
);
```

### 索引和约束
- 用户名唯一索引
- 房间成员唯一约束
- 自动更新时间戳触发器

---

## 前后端通信JSON结构

### 1. 用户认证相关

#### 注册请求
```json
POST /auth/register
{
    "username": "string",
    "password": "string",
    "note": "string (optional)"
}
```

#### 注册响应
```json
{
    "success": true,
    "message": "注册成功，请等待管理员审核。如项目启用邮件确认，请先确认邮箱。",
    "data": {
        "userId": "uuid"
    }
}
```

#### 登录请求
```json
POST /auth/login
{
    "username": "string",
    "password": "string"
}
```

#### 登录响应
```json
{
    "success": true,
    "message": "登录成功",
    "data": {
        "access_token": "string",
        "refresh_token": "string",
        "username": "string",
        "role": "string",
        "userId": "uuid",
        "expires_at": "timestamp"
    }
}
```

#### Token刷新请求
```json
POST /auth/refresh
{
    "refresh_token": "string"
}
```

#### Token刷新响应
```json
{
    "success": true,
    "message": "Token 刷新成功",
    "data": {
        "access_token": "string",
        "refresh_token": "string",
        "username": "string",
        "role": "string",
        "userId": "uuid",
        "expires_at": "timestamp"
    }
}
```

### 2. 房间/服务器相关

#### 创建房间请求
```json
POST /api/rooms/create
{
    "name": "string",
    "description": "string (optional)"
}
```

#### 创建房间响应
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "name": "string",
        "description": "string",
        "room_type": "public",
        "creator_id": "uuid",
        "created_at": "timestamp"
    }
}
```

#### 获取房间列表请求
```json
GET /api/rooms/list
```

#### 获取房间列表响应
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "name": "string",
            "description": "string",
            "room_type": "string",
            "creator_id": "uuid",
            "member_count": 0,
            "created_at": "timestamp",
            "last_active_at": "timestamp"
        }
    ]
}
```

#### 加入房间请求
```json
POST /api/rooms/{roomId}/join
```

#### 加入房间响应
```json
{
    "success": true,
    "message": "成功加入房间"
}
```

#### 获取房间成员请求
```json
GET /api/rooms/{roomId}/members
```

#### 获取房间成员响应
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "username": "string",
            "role": "string",
            "joined_at": "timestamp"
        }
    ]
}
```

### 3. 管理员相关

#### 获取用户列表请求
```json
GET /admin/users?page=1&limit=10
```

#### 获取用户列表响应
```json
{
    "success": true,
    "data": {
        "users": [
            {
                "id": "uuid",
                "username": "string",
                "role": "string",
                "status": "string",
                "note": "string",
                "createdAt": "timestamp"
            }
        ],
        "total": 100,
        "page": 1,
        "totalPages": 10,
        "limit": 10
    }
}
```

#### 更新用户状态请求
```json
PUT /admin/users/{userId}/status
{
    "status": "active|suspended|banned",
    "note": "string (optional)"
}
```

#### 更新用户状态响应
```json
{
    "success": true,
    "message": "用户状态更新成功"
}
```

### 4. 密码重置相关

#### 请求密码重置
```json
POST /auth/password/request-reset
{
    "username": "string"
}
```

#### 请求密码重置响应
```json
{
    "success": true,
    "message": "密码重置请求已处理，请检查您的重置代码",
    "data": {
        "resetRequestId": "uuid"
    }
}
```

#### 验证重置码
```json
POST /auth/password/verify-reset-token
{
    "resetRequestId": "uuid",
    "resetCode": "string"
}
```

#### 验证重置码响应
```json
{
    "success": true,
    "message": "重置代码验证成功",
    "data": {
        "verificationToken": "string"
    }
}
```

#### 重置密码
```json
POST /auth/password/reset
{
    "verificationToken": "string",
    "newPassword": "string"
}
```

#### 重置密码响应
```json
{
    "success": true,
    "message": "密码已成功重置，请使用新密码登录"
}
```

---

## 核心功能模块

### 1. 认证模块 (authService.js)

#### registerUser(password, username, note)
**功能**: 用户注册
**参数**:
- `password`: 用户密码
- `username`: 用户名
- `note`: 备注信息

**流程**:
1. 规范化用户名并生成占位邮箱
2. 通过Supabase Admin API创建认证用户
3. 使用事务同时创建用户资料和组织成员关系
4. 返回注册结果

#### loginUser(username, password)
**功能**: 用户登录
**参数**:
- `username`: 用户名
- `password`: 密码

**流程**:
1. 从缓存或数据库查询用户ID和状态
2. 检查用户状态是否允许登录
3. 获取用户占位邮箱
4. 使用Supabase Auth进行登录验证
5. 返回访问令牌和用户信息

#### refreshAuthToken(clientRefreshToken)
**功能**: 刷新访问令牌
**参数**:
- `clientRefreshToken`: 客户端刷新令牌

**流程**:
1. 使用刷新令牌获取新的会话
2. 验证用户状态
3. 返回新的访问令牌

### 2. 房间管理模块 (roomService.js)

#### createRoom(name, description, room_type, creatorId)
**功能**: 创建房间
**参数**:
- `name`: 房间名称
- `description`: 房间描述
- `room_type`: 房间类型
- `creatorId`: 创建者ID

**流程**:
1. 验证房间名称唯一性
2. 创建房间记录
3. 将创建者添加为房间所有者
4. 返回房间信息

#### listPublicRooms()
**功能**: 获取公开房间列表
**返回**: 公开房间数组

#### joinRoom(roomId, userId)
**功能**: 加入房间
**参数**:
- `roomId`: 房间ID
- `userId`: 用户ID

**流程**:
1. 检查用户是否已是成员
2. 根据房间类型处理加入逻辑
3. 添加用户到房间成员表

---

## 运行流程

### 1. 用户注册流程
```
1. 用户填写注册表单
2. 前端调用 /auth/register
3. 后端生成占位邮箱
4. 创建Supabase认证用户
5. 创建用户资料记录
6. 设置状态为pending
7. 返回注册成功消息
8. 等待管理员审批
```

### 2. 用户登录流程
```
1. 用户输入用户名密码
2. 前端调用 /auth/login
3. 后端查询用户资料
4. 检查用户状态
5. 获取占位邮箱
6. 验证密码
7. 返回访问令牌
8. 前端保存认证信息
9. 根据角色重定向
```

### 3. 房间创建流程
```
1. 用户点击创建房间
2. 前端显示创建表单
3. 提交房间信息
4. 调用 /api/rooms/create
5. 后端验证房间名称
6. 创建房间记录
7. 添加创建者为所有者
8. 返回房间信息
9. 重定向到聊天页面
```

### 4. 管理员审批流程
```
1. 管理员访问用户管理页面
2. 查看待审批用户列表
3. 点击审批按钮
4. 调用 /admin/users/{userId}/status
5. 更新用户状态为active
6. 用户可正常登录
```

### 5. 实时聊天流程
```
1. 用户进入聊天页面
2. 建立Socket.IO连接
3. 发送认证信息
4. 加入房间频道
5. 接收实时消息
6. 发送消息到服务器
7. 广播给房间成员
```

---

## API接口文档

### 认证接口

#### POST /auth/register
用户注册
- **请求体**: {username, password, note?}
- **响应**: {success, message, data: {userId}}

#### POST /auth/login
用户登录
- **请求体**: {username, password}
- **响应**: {success, message, data: {access_token, refresh_token, username, role, userId, expires_at}}

#### POST /auth/refresh
刷新令牌
- **请求体**: {refresh_token}
- **响应**: {success, message, data: {access_token, refresh_token, username, role, userId, expires_at}}

#### POST /auth/logout
用户注销
- **请求头**: Authorization: Bearer {token}
- **响应**: {success, message}

### 房间接口

#### GET /api/rooms/list
获取房间列表
- **响应**: {success, data: [room]}

#### POST /api/rooms/create
创建房间
- **请求体**: {name, description?}
- **响应**: {success, data: room}

#### POST /api/rooms/{roomId}/join
加入房间
- **响应**: {success, message}

#### GET /api/rooms/{roomId}/members
获取房间成员
- **响应**: {success, data: [member]}

#### DELETE /api/rooms/{roomId}
删除房间
- **响应**: {success, message}

### 管理员接口

#### GET /admin/users
获取用户列表
- **查询参数**: page, limit
- **响应**: {success, data: {users, total, page, totalPages, limit}}

#### PUT /admin/users/{userId}/status
更新用户状态
- **请求体**: {status, note?}
- **响应**: {success, message}

---

## 前端组件文档

### 1. AuthManager (auth.js)
认证状态管理器
- **单例模式**: 确保全局唯一实例
- **内存缓存**: 提高认证检查性能
- **自动刷新**: Token即将过期时自动刷新
- **事件分发**: 登录/注销时触发自定义事件

### 2. ApiService (apiService.js)
API通信服务
- **请求缓存**: GET请求结果缓存
- **防抖处理**: 避免重复请求
- **错误处理**: 统一的错误处理机制
- **性能监控**: 记录慢请求

### 3. Store (store.js)
状态管理
- **观察者模式**: 状态变化通知
- **本地存储**: 持久化重要状态
- **通知系统**: 全局消息通知

### 4. SocketManager (socket.js)
Socket.IO连接管理
- **自动重连**: 连接断开时自动重连
- **认证集成**: 连接时发送认证信息
- **事件处理**: 统一的事件处理机制

### 5. 页面组件

#### 登录页面 (login.js)
- 表单验证
- 登录状态检查
- 角色重定向

#### 服务器列表页面 (servers.js)
- 服务器列表展示
- 创建/编辑服务器
- 加入服务器
- 成员管理

#### 管理员页面 (admin.js)
- 用户管理
- 审批功能
- 分页控制

---

## 部署配置

### 环境变量配置

#### 后端环境变量 (.env.development/.env.production)
```bash
# 数据库配置
DATABASE_URL=postgresql://user:password@host:port/database
LOCAL_DB_URL=postgresql://user:password@localhost:5432/gameconnecting

# Supabase配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# 应用配置
API_KEY=your-api-key
PORT=12001
NODE_ENV=development|production
FRONTEND_URL=http://localhost:12000

# 集群配置
ENABLE_CLUSTERING=false
```

#### 前端环境变量 (.env.development/.env.production)
```bash
# 后端服务地址
BACKEND_URL=http://localhost:12001
SOCKET_URL=http://localhost:12001

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 前端地址
FRONTEND_URL=http://localhost:12000
```

### 构建和部署流程

#### 后端部署 (Render)
```bash
# 构建命令
npm run build && npm run db:migrate:up

# 启动命令
npm start

# 环境变量
DATABASE_URL=render-postgres-url
SUPABASE_URL=supabase-url
SUPABASE_ANON_KEY=supabase-anon-key
SUPABASE_SERVICE_KEY=supabase-service-key
API_KEY=your-api-key
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://game.flowerrealm.top
```

#### 前端部署 (Vercel)
```bash
# 构建命令
npm run build

# 环境变量
BACKEND_URL=https://gameconnecting.onrender.com
SOCKET_URL=https://gameconnecting.onrender.com
NEXT_PUBLIC_SUPABASE_URL=supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=supabase-anon-key
FRONTEND_URL=https://game.flowerrealm.top
```

### 数据库迁移

#### 本地开发
```bash
# 重置数据库
./reset_db.sh

# 应用迁移
cd backend && npm run db:migrate:up

# 查看迁移状态
npm run db:migrate:status

# 创建新迁移
npm run db:migrate:create -- migration_name
```

#### 生产环境
```bash
# 自动应用迁移 (Render构建时)
npm run db:migrate:up
```

---

## 性能优化

### 后端优化
1. **内存缓存**: 用户资料查询缓存
2. **数据库索引**: 关键字段索引优化
3. **连接池**: 数据库连接复用
4. **压缩中间件**: 响应数据压缩
5. **集群模式**: 多进程负载均衡

### 前端优化
1. **请求缓存**: API响应缓存
2. **防抖处理**: 避免重复请求
3. **懒加载**: 按需加载组件
4. **内存管理**: 及时清理事件监听器
5. **CDN加速**: 静态资源CDN分发

---

## 安全措施

### 认证安全
1. **JWT令牌**: 短期访问令牌 + 长期刷新令牌
2. **占位邮箱**: 避免真实邮箱泄露
3. **密码哈希**: Supabase自动处理
4. **状态验证**: 登录前检查用户状态

### 数据安全
1. **SQL注入防护**: 参数化查询
2. **XSS防护**: 输入验证和输出编码
3. **CSRF防护**: 令牌验证
4. **权限控制**: 基于角色的访问控制

### 网络安全
1. **HTTPS**: 生产环境强制HTTPS
2. **CORS配置**: 限制跨域请求
3. **API密钥**: 后端服务认证
4. **请求限流**: 防止暴力攻击

---

## 监控和日志

### 性能监控
1. **响应时间**: 记录慢请求
2. **错误率**: 统计API错误
3. **资源使用**: 内存和CPU监控
4. **数据库性能**: 查询时间统计

### 日志记录
1. **访问日志**: 请求记录
2. **错误日志**: 异常记录
3. **安全日志**: 认证和授权记录
4. **业务日志**: 关键操作记录

---

## 故障排除

### 常见问题

#### 1. 用户无法登录
- 检查用户状态是否为active
- 验证Token是否有效
- 检查数据库连接

#### 2. 房间创建失败
- 检查房间名称唯一性
- 验证用户权限
- 检查数据库事务

#### 3. 实时聊天断开
- 检查Socket.IO连接
- 验证认证状态
- 检查网络连接

#### 4. 管理员页面404
- 检查路由配置
- 验证文件路径
- 检查权限设置

### 调试工具
1. **浏览器开发者工具**: 前端调试
2. **Postman**: API测试
3. **pgAdmin**: 数据库管理
4. **Supabase Dashboard**: 认证和数据库管理

---

## 更新日志

### v1.0.0 (当前版本)
- 基础用户认证系统
- 房间管理功能
- 管理员审批系统
- 实时聊天功能
- 密码重置功能
- 响应式UI设计
- 性能优化
- 安全加固

---

## 贡献指南

### 开发环境设置
1. 克隆项目仓库
2. 安装依赖: `npm run install-deps`
3. 配置环境变量
4. 启动开发服务器: `npm run dev`

### 代码规范
1. **JavaScript**: ES6+语法
2. **CSS**: BEM命名规范
3. **HTML**: 语义化标签
4. **注释**: 中文注释

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建过程或辅助工具的变动

---

*本文档最后更新时间: 2025年1月*