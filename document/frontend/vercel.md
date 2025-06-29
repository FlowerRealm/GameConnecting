# Vercel 配置 (`vercel.json`)

该文件是 `GameConnecting` 项目前端在 Vercel 平台上的部署配置。它定义了 Vercel 如何构建、路由和处理前端应用程序的请求。

## 主要功能

-   **版本**: 指定 Vercel 配置文件的版本。
-   **构建 (`builds`)**: 定义了 Vercel 如何构建项目。在这里，它使用 `@vercel/static-build` 构建器，并指定 `public` 目录作为构建输出目录。
-   **路由 (`routes`)**: 定义了 Vercel 如何处理传入的请求，包括：
    -   **静态资源路由**: 将 `/js/`, `/styles/`, `/images/` 等路径映射到相应的静态文件。
    -   **API 代理**: 将所有以 `/api/` 开头的请求代理到后端服务 (`https://gameconnecting.onrender.com/api/$1`)。这允许前端直接调用后端 API，而无需处理跨域问题。
    -   **Socket.IO 代理**: 将所有以 `/socket.io/` 开头的请求代理到后端 Socket.IO 服务 (`https://gameconnecting.onrender.com/socket.io/$1`)。这对于实时通信至关重要。
    -   **页面路由**: 将友好的 URL 路径（如 `/login`, `/register`）映射到 `public/pages/` 目录下的相应 HTML 文件。
    -   **文件系统处理**: `"handle": "filesystem"` 确保 Vercel 默认处理文件系统中的其他文件。
-   **构建环境变量 (`build.env`)**: 在构建过程中注入环境变量。这些变量通常包含后端服务的 URL、Supabase 密钥等，供前端应用程序使用。

## 用法

当项目部署到 Vercel 时，Vercel 会自动读取并应用此配置文件来构建和部署前端应用程序。它确保了前端应用程序能够正确地与后端服务通信，并提供正确的页面路由。

## 环境变量

在 `build.env` 部分定义的环境变量会在 Vercel 的构建和运行时环境中可用。这些变量通常包括：

-   `NODE_ENV`: 生产环境。
-   `BACKEND_URL`: 后端服务的 URL。
-   `SOCKET_URL`: Socket.IO 服务的 URL。
-   `API_KEY`: 后端 API 的密钥。
-   `FRONTEND_URL`: 前端应用程序的 URL。
-   `SOCKET_RECONNECTION_ATTEMPTS`, `SOCKET_RECONNECTION_DELAY`, `SOCKET_TIMEOUT`: Socket.IO 客户端的连接参数。

## 维护

该文档应与 `frontend/vercel.json` 文件的任何更改保持同步，以确保其准确性和实用性。特别是当后端服务的 URL 或前端页面结构发生变化时，需要更新此文件。
