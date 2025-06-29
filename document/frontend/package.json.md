# 前端 `package.json`

该文件是 `GameConnecting` 项目前端部分的 `package.json` 文件，它定义了前端应用程序的元数据、脚本命令以及其特定的依赖项。

## 结构与功能

-   **`name`**: 前端项目的名称。
-   **`version`**: 前端项目的版本号。
-   **`description`**: 前端项目的简要描述。
-   **`type`**: 设置为 `module`，表示项目使用 ES 模块语法。
-   **`private`**: 设置为 `true`，表示这是一个私有项目，不打算发布到 npm 注册表。
-   **`scripts`**: 定义了一系列可执行的脚本命令，用于前端的开发和构建流程：
    -   `start`: 启动生产环境的前端 Web 服务器（运行 `webServer.js`）。
    -   `dev`: 启动开发环境的前端 Web 服务器。它首先运行 `config:dev` 脚本来生成开发配置，然后使用 `nodemon` 监控 `webServer.js` 的变化并自动重启。
    -   `build`: 构建生产环境的配置（运行 `config:prod` 脚本）。
    -   `config:dev`: 使用 `cross-env` 设置 `NODE_ENV` 为 `development`，然后运行 `scripts/build-config.js` 来生成开发环境的配置文件。
    -   `config:prod`: 使用 `cross-env` 设置 `NODE_ENV` 为 `production`，然后运行 `scripts/build-config.js` 来生成生产环境的配置文件。
-   **`dependencies`**: 列出了前端应用程序在运行时所需的依赖项：
    -   `dotenv`: 用于加载环境变量。
    -   `express`: 用于构建简单的 Web 服务器。
    -   `socket.io-client`: Socket.IO 客户端库，用于实时通信。
-   **`devDependencies`**: 列出了仅在开发过程中需要的依赖项：
    -   `cross-env`: 用于跨平台设置环境变量。
    -   `nodemon`: 一个开发工具，用于在文件更改时自动重启 Node.js 应用程序。
-   **`engines`**: 指定了项目所需的 Node.js 版本。

## 用法

该文件是前端项目管理的核心。通过 `npm run <script-name>` 命令，可以方便地执行预定义的任务，例如启动开发服务器或构建生产配置。

## 注意事项

-   **配置文件生成**: `config:dev` 和 `config:prod` 脚本是关键，它们确保前端应用程序在不同环境下使用正确的后端 API 地址和 Supabase 密钥。
-   **`webServer.js`**: `start` 和 `dev` 脚本都依赖于 `webServer.js` 来启动前端服务。
