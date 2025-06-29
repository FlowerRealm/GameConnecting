# GameConnecting 前端文档

## 概述

GameConnecting前端采用原生HTML/CSS/JavaScript架构，使用ES模块化设计，提供响应式用户界面和实时交互功能。前端负责用户界面展示、状态管理、API通信和实时消息处理。

### 技术栈
- **结构**: 原生HTML5
- **样式**: CSS3 (BEM命名规范)
- **脚本**: JavaScript ES6+ (模块化)
- **静态服务器**: Express.js
- **状态管理**: 自定义Store类
- **API通信**: 自定义ApiService类
- **实时通信**: Socket.IO客户端

### 项目结构
```
frontend/
├── webServer.js                 # 前端服务器
├── package.json                 # 项目配置
├── vercel.json                  # Vercel部署配置
├── scripts/                     # 构建脚本
└── public/
    ├── images/                  # 静态图片资源
    ├── js/                      # JavaScript模块
    ├── pages/                   # HTML页面
    └── styles/                  # CSS样式文件
        ├── base/                # 基础样式
        ├── components/          # 组件样式
        ├── layout/              # 布局样式
        └── pages/               # 页面样式
```

## 核心功能模块

### 1. 认证管理 (auth.js)
- **AuthManager类**: 单例模式认证状态管理
- **登录处理**: 用户登录和状态保存
- **令牌管理**: JWT令牌存储和刷新
- **状态检查**: 认证状态验证
- **自动刷新**: Token即将过期时自动刷新

### 2. API通信 (apiService.js)
- **ApiService类**: 统一的API请求处理
- **请求缓存**: GET请求结果缓存
- **防抖处理**: 避免重复请求
- **错误处理**: 统一的错误处理机制
- **性能监控**: 记录慢请求

### 3. 状态管理 (store.js)
- **Store类**: 全局状态管理
- **观察者模式**: 状态变化通知
- **本地存储**: 持久化重要状态
- **通知系统**: 全局消息通知

### 4. Socket.IO管理 (socket.js)
- **SocketManager类**: Socket.IO连接管理
- **自动重连**: 连接断开时自动重连
- **认证集成**: 连接时发送认证信息
- **事件处理**: 统一的事件处理机制

### 5. 实时聊天 (chat.js)
- **ChatManager类**: 聊天功能管理
- **消息处理**: 发送和接收消息
- **房间管理**: 加入和离开房间
- **状态同步**: 在线状态同步

## 页面结构

### 1. 认证页面
- **登录页面** (`/login`): 用户登录界面
- **注册页面** (`/register`): 用户注册界面
- **密码重置页面** (`/forgot-password`): 密码重置流程

### 2. 主要功能页面
- **首页** (`/`): 欢迎页面和导航
- **服务器列表** (`/servers`): 房间/服务器管理
- **聊天页面** (`/chat`): 实时聊天界面
- **用户资料** (`/profile`): 个人信息管理
- **用户列表** (`/users`): 用户浏览页面

### 3. 管理员页面
- **用户管理** (`/administrator/user`): 用户管理界面
- **服务器管理** (`/administrator/server`): 服务器管理界面

## 组件系统

### 1. 导航组件 (navbar.js)
- **响应式导航**: 桌面和移动端适配
- **用户菜单**: 用户信息和操作菜单
- **权限控制**: 根据用户角色显示不同菜单

### 2. 表单组件
- **登录表单**: 用户名密码登录
- **注册表单**: 用户注册信息
- **服务器表单**: 创建/编辑服务器
- **密码重置表单**: 密码重置流程

### 3. 列表组件
- **服务器列表**: 房间/服务器展示
- **用户列表**: 用户信息展示
- **成员列表**: 房间成员管理
- **组织列表**: 组织信息展示

### 4. 模态框组件
- **创建服务器**: 服务器创建模态框
- **服务器详情**: 服务器信息详情
- **成员管理**: 成员管理模态框
- **确认对话框**: 操作确认对话框

## 样式系统

### 1. 基础样式 (base/)
- **reset.css**: CSS重置样式
- **utilities.css**: 工具类样式

### 2. 组件样式 (components/)
- **buttons.css**: 按钮样式
- **form.css**: 表单样式
- **modal.css**: 模态框样式
- **navbar.css**: 导航栏样式
- **notifications.css**: 通知样式
- **servers.css**: 服务器相关样式

### 3. 布局样式 (layout/)
- **container.css**: 容器布局样式

### 4. 页面样式 (pages/)
- **admin.css**: 管理员页面样式
- **chat.css**: 聊天页面样式
- **lists.css**: 列表页面样式
- **servers.css**: 服务器页面样式
- **users.css**: 用户页面样式

## 状态管理

### Store类设计
```javascript
class Store {
    constructor() {
        this.state = {};
        this.subscribers = {};
        this.notifications = [];
    }

    // 状态订阅
    subscribe(key, callback) { }

    // 状态更新
    setState(key, value) { }

    // 通知管理
    addNotification(message, type, duration) { }
}
```

### 状态类型
- **用户状态**: 认证信息、用户资料
- **应用状态**: 加载状态、错误状态
- **UI状态**: 模态框状态、侧边栏状态
- **通知状态**: 消息通知队列

## API通信

### ApiService类设计
```javascript
class ApiService {
    constructor() {
        this.baseUrl = config.backendUrl;
        this.apiKey = config.apiKey;
        this.requestQueue = new Set();
    }

    // 统一请求方法
    async request(endpoint, options) { }

    // 响应处理
    async handleResponse(response) { }

    // 错误处理
    handleError(error, context) { }
}
```

### 请求特性
- **自动认证**: 自动添加JWT令牌
- **请求缓存**: GET请求结果缓存
- **防抖处理**: 避免重复请求
- **错误处理**: 统一的错误处理
- **性能监控**: 记录慢请求

## 实时通信

### Socket.IO集成
- **连接管理**: 自动连接和重连
- **认证集成**: 连接时发送认证信息
- **房间管理**: 加入和离开房间
- **消息处理**: 发送和接收消息
- **状态同步**: 在线状态同步

### 事件处理
- **连接事件**: 连接成功/失败
- **认证事件**: 认证成功/失败
- **房间事件**: 加入/离开房间
- **消息事件**: 发送/接收消息
- **状态事件**: 用户状态变化

## 响应式设计

### 断点设计
- **桌面端**: > 768px
- **移动端**: ≤ 768px

### 适配策略
- **弹性布局**: Flexbox和Grid布局
- **媒体查询**: 响应式样式适配
- **移动优先**: 移动端优先设计
- **触摸优化**: 移动端触摸优化

## 性能优化

### 加载优化
- **模块化加载**: ES模块按需加载
- **资源压缩**: CSS和JS压缩
- **缓存策略**: 静态资源缓存
- **懒加载**: 图片和组件懒加载

### 运行时优化
- **内存管理**: 及时清理事件监听器
- **防抖节流**: 避免频繁操作
- **虚拟滚动**: 长列表虚拟滚动
- **状态缓存**: 状态数据缓存

## 安全机制

### 前端安全
- **输入验证**: 客户端输入验证
- **XSS防护**: 输出内容编码
- **CSRF防护**: 令牌验证
- **敏感信息**: 避免敏感信息泄露

### 认证安全
- **令牌存储**: 安全的令牌存储
- **自动刷新**: Token自动刷新
- **状态验证**: 认证状态验证
- **权限控制**: 前端权限控制

## 部署配置

### 开发环境
```bash
# 启动开发服务器
npm run dev

# 构建配置
npm run config:dev
```

### 生产环境
```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

### 环境变量
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

## 调试和测试

### 调试工具
- **浏览器开发者工具**: 前端调试
- **Console日志**: 调试信息输出
- **网络面板**: API请求监控
- **性能面板**: 性能分析

### 测试策略
- **功能测试**: 核心功能测试
- **兼容性测试**: 浏览器兼容性
- **性能测试**: 页面性能测试
- **用户体验测试**: 用户交互测试

## 扩展开发

### 添加新页面
1. 在`public/pages/`目录创建HTML文件
2. 在`public/js/`目录创建对应的JS文件
3. 在`webServer.js`中添加路由
4. 在`public/styles/pages/`目录添加样式

### 添加新组件
1. 在`public/js/`目录创建组件文件
2. 在`public/styles/components/`目录添加样式
3. 在页面中引入组件
4. 注册组件事件处理

### 添加新API调用
1. 在`apiService.js`中添加新方法
2. 在页面组件中调用API
3. 处理API响应和错误
4. 更新UI状态

---

*本文档最后更新时间: 2025年1月*