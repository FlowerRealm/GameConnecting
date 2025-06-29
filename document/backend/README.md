# GameConnecting 后端文档

## 概述

GameConnecting后端采用Node.js + Express + Socket.IO架构，提供RESTful API和实时通信功能。后端负责用户认证、数据管理、业务逻辑处理和实时消息传递。

### 技术栈
- **运行时**: Node.js 18+
- **框架**: Express.js 4.18+
- **数据库**: PostgreSQL (Supabase管理)
- **认证**: Supabase Auth + JWT
- **实时通信**: Socket.IO 4.6+
- **数据库迁移**: node-pg-migrate
- **压缩**: compression
- **CORS**: cors

### 项目结构
```
backend/
├── server.js                    # 主服务器文件
├── package.json                 # 项目配置
├── migrate-pg-config.js         # 数据库迁移配置
├── migrations/                  # 数据库迁移文件
├── scripts/                     # 构建和部署脚本
└── src/
    ├── api/                     # API路由模块
    ├── config/                  # 配置管理
    ├── middleware/              # 中间件
    ├── services/                # 业务逻辑服务
    ├── socket/                  # Socket.IO处理
    ├── supabaseClient.js        # Supabase客户端
    └── supabaseAdminClient.js   # Supabase管理员客户端
```

## 核心功能模块

### 1. 认证系统 (authService.js)
- **用户注册**: 用户名注册，生成占位邮箱
- **用户登录**: JWT令牌认证
- **令牌刷新**: 自动刷新访问令牌
- **密码重置**: 安全的密码重置流程
- **状态管理**: 用户状态验证

### 2. 房间管理 (roomService.js)
- **房间创建**: 创建游戏房间
- **成员管理**: 加入、离开、踢出成员
- **权限控制**: 所有者和管理员权限
- **房间操作**: 编辑、删除房间

### 3. 组织管理 (adminOrganizationService.js)
- **组织创建**: 管理员创建组织
- **成员管理**: 组织成员审批和管理
- **权限控制**: 组织内角色管理
- **组织操作**: 编辑、删除组织

### 4. 用户管理 (userService.js)
- **用户信息**: 获取和更新用户信息
- **密码管理**: 修改用户密码
- **组织关系**: 用户组织成员关系

### 5. 实时通信 (socket/index.js)
- **连接管理**: Socket.IO连接处理
- **房间管理**: 实时房间加入/离开
- **消息传递**: 实时消息广播
- **状态同步**: 在线状态同步

## 中间件系统

### 认证中间件 (auth.js)
- **authenticateToken**: JWT令牌验证
- **isAdmin**: 管理员权限检查
- **isApproved**: 用户状态验证

### 安全中间件
- **CORS**: 跨域请求处理
- **API密钥验证**: 后端服务认证
- **请求压缩**: 响应数据压缩

## 配置管理

### 环境配置
- **开发环境**: `.env.development`
- **生产环境**: `.env.production`
- **配置构建**: `scripts/build-config.js`

### 数据库配置
- **连接配置**: Supabase连接设置
- **迁移管理**: node-pg-migrate配置
- **连接池**: 数据库连接复用

## 数据库设计

### 核心表结构
- `user_profiles`: 用户资料表
- `rooms`: 房间/服务器表
- `room_members`: 房间成员表
- `organizations`: 组织表
- `user_organization_memberships`: 用户组织关系表
- `password_reset_requests`: 密码重置请求表

### 数据库函数
- `create_user_profile_with_memberships`: 用户注册事务函数
- `get_users_with_details`: 批量获取用户信息
- `invalidate_user_cache`: 缓存失效触发器

## API路由结构

### 认证路由 (/auth)
- `POST /register`: 用户注册
- `POST /login`: 用户登录
- `POST /refresh`: 刷新令牌
- `POST /logout`: 用户注销
- `POST /password/request-reset`: 请求密码重置
- `POST /password/verify-reset-token`: 验证重置码
- `POST /password/reset`: 重置密码

### 房间路由 (/api/rooms)
- `GET /list`: 获取房间列表
- `POST /create`: 创建房间
- `POST /{roomId}/join`: 加入房间
- `GET /{roomId}/members`: 获取房间成员
- `POST /{roomId}/leave`: 离开房间
- `DELETE /{roomId}`: 删除房间

### 管理员路由 (/admin)
- `GET /users`: 获取用户列表
- `PUT /users/{userId}/status`: 更新用户状态

### 组织路由 (/api/admin/organizations)
- `GET /`: 获取组织列表
- `POST /`: 创建组织
- `PUT /{orgId}`: 更新组织
- `DELETE /{orgId}`: 删除组织

### 服务器管理路由 (/api/admin/servers)
- `GET /`: 获取服务器列表
- `POST /`: 创建服务器
- `PUT /{serverId}`: 更新服务器
- `DELETE /{serverId}`: 删除服务器
- `GET /{serverId}/members`: 获取服务器成员
- `DELETE /{serverId}/members/{userId}`: 踢出成员

## 性能优化

### 缓存机制
- **内存缓存**: 用户资料查询缓存
- **缓存失效**: 数据库触发器自动失效
- **缓存策略**: 5分钟TTL，自动清理

### 数据库优化
- **索引优化**: 关键字段索引
- **连接池**: 数据库连接复用
- **查询优化**: 批量查询和事务处理

### 响应优化
- **压缩中间件**: gzip压缩响应
- **集群模式**: 多进程负载均衡
- **性能监控**: 慢请求记录

## 安全机制

### 认证安全
- **JWT令牌**: 短期访问令牌 + 长期刷新令牌
- **占位邮箱**: 避免真实邮箱泄露
- **密码哈希**: Supabase自动处理
- **状态验证**: 登录前检查用户状态

### 数据安全
- **SQL注入防护**: 参数化查询
- **XSS防护**: 输入验证和输出编码
- **CSRF防护**: 令牌验证
- **权限控制**: 基于角色的访问控制

### 网络安全
- **HTTPS**: 生产环境强制HTTPS
- **CORS配置**: 限制跨域请求
- **API密钥**: 后端服务认证
- **请求限流**: 防止暴力攻击

## 部署配置

### 开发环境
```bash
# 启动开发服务器
npm run dev

# 数据库迁移
npm run db:migrate:up

# 查看迁移状态
npm run db:migrate:status
```

### 生产环境
```bash
# 构建项目
npm run build

# 启动生产服务器
npm start

# 应用数据库迁移
npm run db:migrate:up
```

### 环境变量
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
NODE_ENV=production
FRONTEND_URL=https://game.flowerrealm.top

# 集群配置
ENABLE_CLUSTERING=false
```

## 监控和日志

### 性能监控
- **响应时间**: 记录慢请求（>300ms）
- **错误率**: 统计API错误
- **资源使用**: 内存和CPU监控
- **数据库性能**: 查询时间统计

### 日志记录
- **访问日志**: 请求记录
- **错误日志**: 异常记录
- **安全日志**: 认证和授权记录
- **业务日志**: 关键操作记录

## 故障排除

### 常见问题

#### 1. 数据库连接失败
- 检查DATABASE_URL配置
- 验证Supabase项目状态
- 检查网络连接

#### 2. 认证失败
- 检查JWT令牌有效性
- 验证用户状态
- 检查Supabase配置

#### 3. Socket.IO连接失败
- 检查CORS配置
- 验证前端URL设置
- 检查网络连接

#### 4. 性能问题
- 检查数据库索引
- 监控内存使用
- 优化查询语句

### 调试工具
- **Postman**: API测试
- **pgAdmin**: 数据库管理
- **Supabase Dashboard**: 认证和数据库管理
- **Node.js调试**: 代码调试

## 扩展开发

### 添加新API
1. 在`src/api/`目录创建路由文件
2. 在`src/services/`目录创建服务文件
3. 在`server.js`中注册路由
4. 添加相应的中间件和权限检查

### 添加新数据库表
1. 创建迁移文件: `npm run db:migrate:create -- table_name`
2. 编写up和down函数
3. 应用迁移: `npm run db:migrate:up`

### 添加新中间件
1. 在`src/middleware/`目录创建中间件文件
2. 导出中间件函数
3. 在路由中应用中间件

---

*本文档最后更新时间: 2025年1月*