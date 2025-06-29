# GameConnecting 文档索引

## 文档结构概览

```
document/
├── README.md                           # 项目总览
├── PROJECT_OVERVIEW.md                 # 项目详细介绍
├── API_REFERENCE.md                    # API接口完整参考
├── DATABASE_SCHEMA.md                  # 数据库结构文档
├── DEPLOYMENT.md                       # 部署指南
├── DOCUMENT_INDEX.md                   # 文档索引（本文件）
├── backend/                            # 后端文档
│   ├── README.md                       # 后端总览
│   ├── server.md                       # 主服务器文档
│   ├── api/                            # API模块文档
│   ├── config/                         # 配置文档
│   ├── middleware/                     # 中间件文档
│   ├── services/                       # 服务层文档
│   ├── socket/                         # Socket.IO文档
│   ├── migrations/                     # 数据库迁移文档
│   └── scripts/                        # 脚本文档
├── frontend/                           # 前端文档
│   ├── README.md                       # 前端总览
│   ├── webServer.md                    # 前端服务器文档
│   ├── public/                         # 前端资源文档
│   │   ├── js/                         # JavaScript模块文档
│   │   ├── pages/                      # 页面文档
│   │   └── styles/                     # 样式文档
│   └── scripts/                        # 构建脚本文档
└── root/                               # 根目录文档
    ├── package.json.md                 # 项目配置文档
    └── scripts/                        # 根目录脚本文档
```

## 快速导航

### 🏠 项目总览
- **[README.md](README.md)** - 项目总览和快速开始
- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - 项目详细介绍和功能说明

### 🔧 技术文档
- **[API_REFERENCE.md](API_REFERENCE.md)** - 完整的API接口文档
- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - 数据库结构和设计
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - 部署指南和配置说明

### ⚙️ 后端文档
- **[backend/README.md](backend/README.md)** - 后端架构和总览
- **[backend/server.md](backend/server.md)** - 主服务器配置和功能
- **[backend/api/](backend/api/)** - API路由模块文档
- **[backend/services/](backend/services/)** - 业务逻辑服务文档
- **[backend/middleware/](backend/middleware/)** - 中间件文档

### 🎨 前端文档
- **[frontend/README.md](frontend/README.md)** - 前端架构和总览
- **[frontend/webServer.md](frontend/webServer.md)** - 前端服务器配置
- **[frontend/public/js/](frontend/public/js/)** - JavaScript模块文档
- **[frontend/public/pages/](frontend/public/pages/)** - 页面文档
- **[frontend/public/styles/](frontend/public/styles/)** - 样式文档

## 按功能分类

### 🔐 认证系统
- 用户注册和登录流程
- JWT令牌管理
- 密码重置功能
- 权限控制系统

### 🏠 房间管理
- 房间创建和删除
- 成员管理
- 权限控制
- 实时状态同步

### 👥 组织管理
- 组织创建和管理
- 成员审批流程
- 角色权限管理
- 组织关系维护

### 💬 实时通信
- Socket.IO集成
- 消息传递机制
- 在线状态管理
- 房间聊天功能

### 👨‍💼 管理员功能
- 用户管理界面
- 服务器管理
- 组织管理
- 系统监控

## 按角色分类

### 👨‍💻 开发者
- API接口文档
- 数据库设计
- 代码架构说明
- 开发环境配置

### 🚀 运维人员
- 部署指南
- 环境配置
- 监控和日志
- 故障排除

### 👤 用户
- 功能使用说明
- 界面操作指南
- 常见问题解答
- 联系支持

## 按环境分类

### 🛠️ 开发环境
- 本地开发配置
- 调试工具使用
- 热重载设置
- 开发最佳实践

### 🌐 生产环境
- 云平台部署
- 性能优化
- 安全配置
- 监控告警

### 🐳 容器化
- Docker配置
- 容器编排
- 镜像管理
- 服务发现

## 文档更新记录

### 2025年1月
- ✅ 创建项目总览文档
- ✅ 创建API接口参考文档
- ✅ 创建数据库结构文档
- ✅ 创建部署指南文档
- ✅ 创建后端总览文档
- ✅ 创建前端总览文档
- ✅ 创建主服务器文档
- ✅ 创建前端服务器文档

### 待完成
- 🔄 创建API模块详细文档
- 🔄 创建服务层详细文档
- 🔄 创建中间件详细文档
- 🔄 创建前端模块详细文档
- 🔄 创建页面详细文档
- 🔄 创建样式详细文档
- 🔄 创建脚本详细文档

## 文档规范

### 命名规范
- 文件名使用PascalCase
- 目录名使用小写字母
- 文档标题使用中文
- 代码示例使用英文

### 格式规范
- 使用Markdown格式
- 代码块指定语言
- 图片使用相对路径
- 链接使用相对路径

### 内容规范
- 包含功能说明
- 包含代码示例
- 包含配置说明
- 包含故障排除

## 贡献指南

### 添加新文档
1. 在对应目录创建文档文件
2. 更新文档索引
3. 添加文档链接
4. 更新更新记录

### 修改现有文档
1. 更新文档内容
2. 更新更新时间
3. 更新版本信息
4. 通知相关人员

### 文档审查
1. 检查内容准确性
2. 检查格式规范性
3. 检查链接有效性
4. 检查示例可用性

## 联系方式

### 技术支持
- 邮箱: support@game.flowerrealm.top
- 文档问题: 创建Issue
- 功能建议: 提交PR

### 文档维护
- 主要维护者: 项目团队
- 更新频率: 随代码更新
- 审查周期: 每月审查

---

*最后更新时间: 2025年1月*