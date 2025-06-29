# 构建配置脚本 (`build-config.js`)

该脚本负责从环境变量中读取配置，并生成 `backend/src/config.js` 文件。这个生成的 `config.js` 文件随后会被后端应用程序的其他部分导入和使用。

## 功能

- **加载环境变量**: 使用 `dotenv` 从 `.env.<env>` 文件（例如 `.env.development` 或 `.env.production`）加载环境变量。
- **环境变量检查**: 验证所有必要的环境变量（如 `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `API_KEY`）是否已设置。如果缺少任何变量，脚本将终止并报错。
- **配置对象构建**: 根据环境变量的值构建一个 JavaScript 配置对象，其中包含服务器、Supabase 和 Socket.IO 的设置。
- **生成 `config.js`**: 将构建的配置对象序列化为 JavaScript 代码，并将其写入 `backend/src/config.js` 文件。这使得应用程序可以在运行时直接导入和使用这些配置，而无需每次都从环境变量中读取。

## 用法

通常，此脚本会在应用程序启动或部署过程中运行，以确保 `config.js` 文件是最新的并包含正确的环境特定设置。

```bash
node backend/scripts/build-config.js
```

## 环境变量

以下是此脚本会读取并用于生成配置的一些关键环境变量：

- `NODE_ENV`: 应用程序的环境（`development`, `production` 等）。
- `SUPABASE_URL`: Supabase 项目的 URL。
- `SUPABASE_ANON_KEY`: Supabase 项目的匿名密钥。
- `API_KEY`: 用于 API 认证的密钥。
- `PORT`: 服务器监听的端口。
- `FRONTEND_URL`: 前端应用程序的 URL。
- `SOCKET_PING_TIMEOUT`: Socket.IO 的 ping 超时时间。
- `SOCKET_PING_INTERVAL`: Socket.IO 的 ping 间隔时间。

**注意**: 敏感信息（如 `SUPABASE_SERVICE_KEY`）不应通过此脚本写入 `config.js`，因为 `config.js` 可能会被前端或不应访问这些密钥的部分访问。敏感密钥应直接在需要它们的模块中从环境变量中读取（例如 `supabaseAdminClient.js`）。