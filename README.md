# GameConnecting

实时游戏服务器连接平台

## 项目结构

```
.
├── backend/          # 后端服务
│   ├── server.js     # 主服务器文件
│   └── src/
│       ├── api/      # API路由
│       ├── db/       # 数据库模型和配置
│       └── socket/   # Socket.IO处理
└── frontend/         # 前端应用
    ├── public/       # 静态资源
    └── src/          # 源代码
```

## 快速开始

### 开发环境

```bash
# 安装依赖
npm run install-deps

# 启动开发服务器
npm run dev
```

### 生产环境

```bash
# 启动生产服务器
npm start
```

## 环境配置

- 开发环境：`npm run dev`
- 生产环境：`npm start`

## API文档

- 前端：https://game.flowerrealm.top
- 后端：https://gameconnecting.onrender.com

## 技术栈

- 后端：Node.js, Express, Socket.IO, PostgreSQL
- 前端：HTML5, CSS3, JavaScript
