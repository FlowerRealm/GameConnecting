# 前端 Web 服务器 (`webServer.js`)

该文件是 `GameConnecting` 项目前端的开发服务器，它使用 Express.js 来提供静态文件和处理页面路由。它主要用于本地开发环境，模拟生产环境中的静态文件服务。

## 主要功能

-   **环境变量加载**: 从 `.env.development` 或 `.env.production` 文件加载环境变量，用于配置服务器行为和前端应用程序。
-   **静态文件服务**: 使用 `express.static` 提供 `public/` 目录下的所有静态资源（HTML, CSS, JavaScript, 图片等）。
-   **健康检查端点**: 提供一个 `/health` 端点，用于检查服务器的运行状态。
-   **页面路由**: 定义了多个 `GET` 路由，将特定的 URL 路径映射到 `public/pages/` 目录下的 HTML 文件，从而实现单页应用（SPA）或多页应用（MPA）的页面导航。
-   **错误处理**: 一个简单的错误处理中间件，用于捕获和响应服务器端错误。
-   **服务器启动**: 监听指定端口，启动 HTTP 服务器。

## 路由映射

-   `GET /`: `public/pages/index.html`
-   `GET /login`: `public/pages/login.html`
-   `GET /register`: `public/pages/register.html`
-   `GET /chat`: `public/pages/chat.html`
-   `GET /servers`: `public/pages/servers.html`
-   `GET /profile`: `public/pages/profile.html`
-   `GET /forgot-password`: `public/pages/forgot-password.html`
-   `GET /users`: `public/pages/friends.html` (注意：此路由映射到 `friends.html`)
-   `GET /administrator/user`: `public/pages/administrator/user.html`
-   `GET /administrator/server`: `public/pages/administrator/server.html`
-   `GET /user/server`: `public/pages/user/server.html`
-   `GET /user/user`: `public/pages/user/user.html`

## 启动服务器

可以通过以下命令启动前端开发服务器：

```bash
node frontend/webServer.js
```

或者通过 `package.json` 中定义的脚本：

```bash
npm run dev
```

## 环境变量

-   `PORT`: 服务器监听的端口号（默认为 `12000`）。
-   `NODE_ENV`: 应用程序的运行环境（例如 `development`, `production`）。
-   `BACKEND_URL`: 后端服务的 URL，供前端 JavaScript 使用。
-   `SOCKET_URL`: Socket.IO 服务的 URL，供前端 JavaScript 使用。

## 维护

该文档应与 `frontend/webServer.js` 文件的任何更改保持同步，以确保其准确性和实用性。
