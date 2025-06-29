# GameConnecting 项目文档库

## 项目概述

GameConnecting是一个实时游戏社交平台，专为游戏玩家设计，提供用户认证、房间管理、组织管理和实时聊天功能。

### 核心特性
- **用户认证系统**: 用户名注册（无需邮箱），管理员审批机制
- **角色权限管理**: 用户/管理员角色系统
- **房间管理**: 创建、加入、管理游戏房间
- **组织管理**: 多组织支持，成员管理
- **实时聊天**: Socket.IO实现的实时通信
- **密码重置**: 安全的密码重置流程
- **响应式设计**: 支持桌面和移动设备

### 技术架构
- **后端**: Node.js + Express + Socket.IO + PostgreSQL (Supabase)
- **前端**: 原生HTML/CSS/JavaScript (ES模块)
- **数据库**: PostgreSQL (Supabase管理)
- **认证**: Supabase Auth + JWT
- **部署**: 后端(Render) + 前端(Vercel)

## 文档结构

```
document/
├── README.md                    # 项目总览（本文件）
├── PROJECT_OVERVIEW.md          # 项目详细介绍
├── ARCHITECTURE.md              # 系统架构设计
├── API_REFERENCE.md             # API接口完整参考
├── DEPLOYMENT.md                # 部署指南
├── DEVELOPMENT.md               # 开发指南
├── backend/                     # 后端文档
│   ├── README.md               # 后端总览
│   ├── server.md               # 主服务器文档
│   ├── api/                    # API模块文档
│   ├── services/               # 服务层文档
│   ├── middleware/             # 中间件文档
│   ├── config/                 # 配置文档
│   ├── socket/                 # Socket.IO文档
│   ├── migrations/             # 数据库迁移文档
│   └── scripts/                # 脚本文档
├── frontend/                    # 前端文档
│   ├── README.md               # 前端总览
│   ├── webServer.md            # 前端服务器文档
│   ├── public/                 # 静态资源文档
│   │   ├── js/                 # JavaScript模块文档
│   │   ├── pages/              # 页面文档
│   │   └── styles/             # 样式文档
│   └── scripts/                # 构建脚本文档
└── root/                       # 根目录文档
    ├── package.md              # 根package.json文档
    ├── scripts.md              # 根目录脚本文档
    └── config.md               # 配置文件文档
```

## 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 14+
- Supabase账户

### 本地开发
```bash
# 克隆项目
git clone <repository-url>
cd GameConnecting

# 安装依赖
npm run install-deps

# 配置环境变量
cp backend/.env.development.example backend/.env.development
cp frontend/.env.development.example frontend/.env.development

# 启动开发服务器
npm run dev
```

### 访问地址
- 前端: http://localhost:12000
- 后端: http://localhost:12001
- 管理员页面: http://localhost:12000/administrator/user

## 核心功能流程

### 用户注册流程
1. 用户填写用户名和密码
2. 后端生成占位邮箱
3. 创建Supabase认证用户
4. 创建用户资料记录
5. 设置状态为pending
6. 等待管理员审批

### 用户登录流程
1. 用户输入用户名密码
2. 后端查询用户资料
3. 检查用户状态
4. 获取占位邮箱
5. 验证密码
6. 返回JWT令牌

### 房间管理流程
1. 用户创建房间
2. 验证房间名称唯一性
3. 创建房间记录
4. 添加创建者为所有者
5. 其他用户可加入房间

## 数据库设计

### 核心表结构
- `user_profiles`: 用户资料表
- `rooms`: 房间/服务器表
- `room_members`: 房间成员表
- `organizations`: 组织表
- `user_organization_memberships`: 用户组织关系表
- `password_reset_requests`: 密码重置请求表

## 安全特性

### 认证安全
- JWT令牌管理
- 占位邮箱机制
- 密码哈希存储
- 用户状态验证

### 数据安全
- SQL注入防护
- XSS防护
- CSRF防护
- 基于角色的访问控制

### 网络安全
- HTTPS强制
- CORS配置
- API密钥验证
- 请求限流

## 性能优化

### 后端优化
- 内存缓存机制
- 数据库索引优化
- 连接池复用
- 响应压缩
- 集群模式支持

### 前端优化
- API请求缓存
- 防抖处理
- 懒加载组件
- 内存管理
- CDN加速

## 监控和日志

### 性能监控
- 响应时间记录
- 错误率统计
- 资源使用监控
- 数据库性能监控

### 日志记录
- 访问日志
- 错误日志
- 安全日志
- 业务日志

## 部署信息

### 生产环境
- **前端**: https://game.flowerrealm.top
- **后端**: https://gameconnecting.onrender.com
- **数据库**: Supabase托管

### 环境变量
- 开发环境: `.env.development`
- 生产环境: `.env.production`

## 贡献指南

### 开发规范
- JavaScript: ES6+语法
- CSS: BEM命名规范
- HTML: 语义化标签
- 注释: 中文注释

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建过程

## 更新日志

### v1.0.0 (当前版本)
- 基础用户认证系统
- 房间管理功能
- 组织管理功能
- 管理员审批系统
- 实时聊天功能
- 密码重置功能
- 响应式UI设计
- 性能优化
- 安全加固

## 联系方式

- 项目维护者: FlowerRealm
- 邮箱: admin@flowerrealm.top
- 项目地址: https://github.com/FlowerRealm/GameConnecting

---

*本文档最后更新时间: 2025年1月*