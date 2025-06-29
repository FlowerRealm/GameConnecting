# 前端构建配置脚本 (`build-config.js`)

该脚本负责从环境变量中读取前端应用程序的配置，并将其生成为 `frontend/public/js/config.js` 文件。这个生成的 `config.js` 文件随后会被前端应用程序的其他 JavaScript 模块导入和使用。

## 功能

-   **加载环境变量**: 使用 `dotenv` 从 `.env.<env>` 文件（例如 `.env.development` 或 `.env.production`）加载环境变量。
-   **环境变量检查**: 验证所有必要的前端环境变量（如 `FRONTEND_URL`, `BACKEND_URL`, `SOCKET_URL`）是否已设置。如果缺少任何变量，脚本将终止并报错。
-   **配置对象构建**: 根据环境变量的值构建一个 JavaScript 配置对象，其中包含前端 URL、后端 URL、Socket.IO URL 和 Supabase 相关的密钥。
-   **生成 `config.js`**: 将构建的配置对象序列化为 JavaScript 代码，并将其写入 `frontend/public/js/config.js` 文件。这使得前端应用程序可以在运行时直接导入和使用这些配置。

## 用法

通常，此脚本会在前端应用程序启动或部署过程中运行，以确保 `config.js` 文件是最新的并包含正确的环境特定设置。它通常通过 `frontend/package.json` 中的 `config:dev` 或 `config:prod` 脚本调用。

```bash
# 在 frontend 目录下执行
npm run config:dev
# 或
npm run config:prod
```

## 环境变量

以下是此脚本会读取并用于生成配置的一些关键环境变量：

-   `NODE_ENV`: 应用程序的环境（`development`, `production` 等）。
-   `FRONTEND_URL`: 前端应用程序的 URL。
-   `BACKEND_URL`: 后端 API 服务的 URL。
-   `SOCKET_URL`: Socket.IO 服务的 URL。
-   `NEXT_PUBLIC_SUPABASE_URL`: Supabase 项目的 URL（通常用于前端）。
-   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 项目的匿名密钥（通常用于前端）。

**注意**: 敏感信息（如 Supabase 的 `service_role` 密钥）不应通过此脚本写入 `config.js`，因为 `config.js` 会被前端代码直接访问。这些敏感密钥应仅在后端使用，或通过其他安全机制传递。
