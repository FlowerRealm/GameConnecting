# GameConnecting 部署指南

## 概述

GameConnecting支持多种部署方式，包括本地开发环境、生产环境部署和云平台部署。本文档详细说明各种部署方式的配置和步骤。

## 部署架构

### 系统架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (Vercel)  │    │   后端 (Render)  │    │ 数据库 (Supabase) │
│   Port: 12000   │◄──►│   Port: 12001   │◄──►│   PostgreSQL    │
│                 │    │                 │    │                 │
│  - HTML/CSS/JS  │    │  - Node.js      │    │  - 用户数据     │
│  - 静态资源     │    │  - Express      │    │  - 房间数据     │
│  - 路由管理     │    │  - Socket.IO    │    │  - 组织数据     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 环境配置
- **开发环境**: 本地部署，前后端分离
- **生产环境**: 云平台部署，前后端分离
- **数据库**: Supabase托管PostgreSQL

## 本地开发环境部署

### 1. 环境准备

#### 系统要求
- Node.js 18+
- npm 或 yarn
- Git
- PostgreSQL (可选，推荐使用Supabase)

#### 克隆项目
```bash
git clone <repository-url>
cd GameConnecting
```

### 2. 后端部署

#### 安装依赖
```bash
cd backend
npm install
```

#### 环境配置
创建 `.env.development` 文件：
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
NODE_ENV=development
FRONTEND_URL=http://localhost:12000

# 集群配置
ENABLE_CLUSTERING=false
```

#### 数据库迁移
```bash
# 应用所有迁移
npm run db:migrate:up

# 查看迁移状态
npm run db:migrate:status

# 回滚迁移
npm run db:migrate:down
```

#### 启动服务器
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 3. 前端部署

#### 安装依赖
```bash
cd frontend
npm install
```

#### 环境配置
创建 `.env.development` 文件：
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

#### 构建配置
```bash
# 构建开发配置
npm run config:dev

# 构建生产配置
npm run config:prod
```

#### 启动服务器
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 4. 验证部署

#### 检查服务状态
```bash
# 检查后端服务
curl http://localhost:12001/health

# 检查前端服务
curl http://localhost:12000/health
```

#### 访问应用
- 前端: http://localhost:12000
- 后端API: http://localhost:12001
- 健康检查: http://localhost:12001/health

## 生产环境部署

### 1. 后端部署 (Render)

#### 创建Render应用
1. 登录 [Render](https://render.com)
2. 创建新的Web Service
3. 连接GitHub仓库
4. 配置部署设置

#### 环境变量配置
在Render控制台设置以下环境变量：
```bash
# 数据库配置
DATABASE_URL=postgresql://user:password@host:port/database

# Supabase配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# 应用配置
API_KEY=your-api-key
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://game.flowerrealm.top

# 集群配置
ENABLE_CLUSTERING=true
```

#### 构建配置
```bash
# 构建命令
npm run build

# 启动命令
npm start
```

#### 自动部署
- 推送到main分支自动触发部署
- 支持预览部署
- 自动健康检查

### 2. 前端部署 (Vercel)

#### 创建Vercel项目
1. 登录 [Vercel](https://vercel.com)
2. 导入GitHub仓库
3. 配置项目设置
4. 设置环境变量

#### 环境变量配置
在Vercel控制台设置以下环境变量：
```bash
# 后端服务地址
BACKEND_URL=https://gameconnecting.onrender.com
SOCKET_URL=https://gameconnecting.onrender.com

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 前端地址
FRONTEND_URL=https://game.flowerrealm.top
```

#### 构建配置
```bash
# 构建命令
npm run build

# 输出目录
public
```

#### 域名配置
- 自定义域名: game.flowerrealm.top
- SSL证书自动配置
- CDN加速

### 3. 数据库配置 (Supabase)

#### 创建Supabase项目
1. 登录 [Supabase](https://supabase.com)
2. 创建新项目
3. 配置数据库设置
4. 获取连接信息

#### 数据库迁移
```bash
# 设置数据库URL
export DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# 应用迁移
npm run db:migrate:up
```

#### 安全配置
- 启用Row Level Security (RLS)
- 配置API密钥
- 设置访问策略

## Docker部署

### 1. 后端Docker配置

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 12001

CMD ["npm", "start"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "12001:12001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - API_KEY=${API_KEY}
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "12000:12000"
    environment:
      - BACKEND_URL=http://backend:12001
      - SOCKET_URL=http://backend:12001
    depends_on:
      - backend
    restart: unless-stopped
```

### 2. 部署命令
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 环境变量配置

### 开发环境 (.env.development)
```bash
# 后端配置
NODE_ENV=development
PORT=12001
API_KEY=dev-api-key-123

# 数据库配置
DATABASE_URL=postgresql://user:password@host:port/database
LOCAL_DB_URL=postgresql://user:password@localhost:5432/gameconnecting

# Supabase配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# 前端配置
FRONTEND_URL=http://localhost:12000
BACKEND_URL=http://localhost:12001
SOCKET_URL=http://localhost:12001

# 集群配置
ENABLE_CLUSTERING=false
```

### 生产环境 (.env.production)
```bash
# 后端配置
NODE_ENV=production
PORT=10000
API_KEY=prod-api-key-456

# 数据库配置
DATABASE_URL=postgresql://user:password@host:port/database

# Supabase配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# 前端配置
FRONTEND_URL=https://game.flowerrealm.top
BACKEND_URL=https://gameconnecting.onrender.com
SOCKET_URL=https://gameconnecting.onrender.com

# 集群配置
ENABLE_CLUSTERING=true
```

## 监控和日志

### 1. 应用监控

#### 健康检查
```bash
# 后端健康检查
curl https://gameconnecting.onrender.com/health

# 前端健康检查
curl https://game.flowerrealm.top/health
```

#### 性能监控
- 响应时间监控
- 错误率监控
- 资源使用监控
- 数据库性能监控

### 2. 日志管理

#### 后端日志
- 访问日志
- 错误日志
- 安全日志
- 业务日志

#### 前端日志
- 控制台日志
- 网络请求日志
- 错误日志
- 用户行为日志

## 安全配置

### 1. 网络安全

#### HTTPS配置
- 强制HTTPS重定向
- SSL证书配置
- 安全头设置

#### CORS配置
```javascript
const allowedOrigins = [
    'https://game.flowerrealm.top',
    'http://localhost:12000',
    'https://gameconnecting.vercel.app'
];
```

### 2. 认证安全

#### JWT配置
- 短期访问令牌
- 长期刷新令牌
- 令牌验证中间件

#### API密钥
- 后端服务认证
- 请求头验证
- 密钥轮换机制

### 3. 数据安全

#### 数据库安全
- 连接加密
- 参数化查询
- 权限控制

#### 环境变量
- 敏感信息保护
- 密钥管理
- 访问控制

## 故障排除

### 1. 常见问题

#### 端口冲突
```bash
# 检查端口占用
lsof -i :12001
lsof -i :12000

# 修改端口配置
export PORT=12002
```

#### 数据库连接失败
```bash
# 检查数据库连接
psql $DATABASE_URL -c "SELECT 1"

# 验证环境变量
echo $DATABASE_URL
```

#### CORS错误
- 检查allowedOrigins配置
- 验证前端URL
- 检查浏览器控制台

### 2. 调试方法

#### 后端调试
```bash
# 查看日志
npm run dev

# 检查环境变量
node -e "console.log(process.env)"

# 测试API
curl -X GET http://localhost:12001/health
```

#### 前端调试
```bash
# 查看控制台
npm run dev

# 检查网络请求
# 浏览器开发者工具 -> Network

# 测试配置
curl http://localhost:12000/health
```

### 3. 性能优化

#### 数据库优化
```bash
# 创建索引
CREATE INDEX idx_user_profiles_username ON user_profiles(username);

# 分析查询
EXPLAIN ANALYZE SELECT * FROM user_profiles WHERE username = 'test';
```

#### 应用优化
- 启用压缩
- 配置缓存
- 优化查询
- 负载均衡

## 备份和恢复

### 1. 数据库备份

#### 自动备份
```bash
# 创建备份脚本
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 定期备份
```bash
# 添加到crontab
0 2 * * * /path/to/backup.sh
```

### 2. 应用备份

#### 代码备份
```bash
# Git备份
git push origin main

# 文件备份
tar -czf app_backup_$(date +%Y%m%d).tar.gz ./
```

#### 配置备份
```bash
# 环境变量备份
cp .env.production .env.production.backup

# 配置文件备份
cp -r config/ config_backup/
```

## 扩展部署

### 1. 负载均衡

#### Nginx配置
```nginx
upstream backend {
    server backend1:12001;
    server backend2:12001;
    server backend3:12001;
}

server {
    listen 80;
    server_name game.flowerrealm.top;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. 缓存层

#### Redis配置
```bash
# 安装Redis
sudo apt-get install redis-server

# 配置Redis
redis-cli ping
```

#### 应用缓存
```javascript
// 缓存配置
const cacheConfig = {
    host: 'localhost',
    port: 6379,
    ttl: 300 // 5分钟
};
```

### 3. CDN配置

#### 静态资源CDN
- 图片资源CDN
- CSS/JS文件CDN
- 字体文件CDN

#### 配置示例
```javascript
// CDN配置
const cdnConfig = {
    baseUrl: 'https://cdn.game.flowerrealm.top',
    version: 'v1.0.0'
};
```

---

*本文档最后更新时间: 2025年1月*