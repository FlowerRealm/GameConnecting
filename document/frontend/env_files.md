# 前端环境变量 (`.env.development` / `.env.production`)

这些文件用于存储前端应用程序在不同环境（开发和生产）中使用的环境变量。它们通过 `frontend/scripts/build-config.js` 脚本读取，并最终被注入到前端的 `public/js/config.js` 文件中，供前端 JavaScript 代码使用。

## 目的

-   **环境隔离**: 允许为开发和生产环境配置不同的后端 API 地址、Socket.IO 地址和 Supabase 密钥等，确保环境之间的独立性。
-   **敏感信息管理**: 避免将敏感信息（如 Supabase 密钥）直接硬编码到代码中，而是通过环境变量进行管理。

## 结构

这两个文件都遵循简单的 `KEY=VALUE` 格式。以下是它们可能包含的常见变量：

### `.env.development` 示例

```dotenv
# 后端服务地址
BACKEND_URL=http://localhost:12001
SOCKET_URL=http://localhost:12001

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key

# 前端地址
FRONTEND_URL=http://localhost:12000
```

### `.env.production` 示例

```dotenv
# 后端服务地址
BACKEND_URL=https://gameconnecting.onrender.com
SOCKET_URL=https://gameconnecting.onrender.com

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key

# 前端地址
FRONTEND_URL=https://game.flowerrealm.top
```

## 用法

-   **开发环境**: 在本地开发时，`frontend/scripts/build-config.js` 会读取 `.env.development` 文件来生成 `public/js/config.js`。
-   **生产环境**: 在部署到 Vercel 等平台时，通常会通过 Vercel 的环境变量配置界面设置这些变量，或者在构建过程中（例如通过 `npm run config:prod`）读取 `.env.production` 文件。

## 注意事项

-   **命名约定**: 变量名通常以 `NEXT_PUBLIC_` 开头（如果使用 Next.js 或类似框架）或直接使用 `REACT_APP_` 等前缀，以便在前端代码中安全地访问它们。
-   **敏感信息**: 确保 `SUPABASE_ANON_KEY` 等敏感信息仅在构建时注入，并且不直接暴露在客户端代码中。
-   **版本控制**: `.env` 文件通常不应提交到版本控制系统，以避免泄露敏感信息。应使用 `.env.example` 或类似文件作为模板。
