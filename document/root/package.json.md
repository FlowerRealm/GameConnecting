# 项目根目录 `package.json`

该文件是整个 `GameConnecting` 项目的根级 `package.json` 文件，它定义了项目的元数据、脚本命令以及跨多个子项目的共享依赖。它利用 npm 的 `workspaces` 功能来管理 `backend` 和 `frontend` 两个子项目。

## 结构与功能

-   **`name`**: 项目的名称。
-   **`version`**: 项目的版本号。
-   **`description`**: 项目的简要描述。
-   **`private`**: 设置为 `true` 表示这是一个私有项目，不打算发布到 npm 注册表。
-   **`scripts`**: 定义了一系列可执行的脚本命令，用于简化开发和部署流程：
    -   `install-deps`: 安装所有子项目（`backend` 和 `frontend`）的依赖。
    -   `prod`: 启动生产环境的后端和前端服务。它首先运行 `set-prod` 脚本，然后使用 `concurrently` 并行启动后端和前端的生产模式。
    -   `dev`: 启动开发环境的后端和前端服务。它首先运行 `set-dev` 脚本，然后使用 `concurrently` 并行启动后端和前端的开发模式。
    -   `set-dev`: 执行 `switch-env.sh 1` 脚本，用于切换到开发环境配置。
    -   `set-prod`: 执行 `switch-env.sh 2` 脚本，用于切换到生产环境配置。
-   **`workspaces`**: 声明了项目的子目录 (`backend` 和 `frontend`) 作为 npm 工作区。这允许在根级别管理子项目的依赖和脚本。
-   **`author`**: 项目的作者信息。
-   **`license`**: 项目的许可证。
-   **`devDependencies`**: 列出了仅在开发过程中需要的依赖项，例如 `concurrently`，它用于并行运行多个脚本。

## 用法

该文件是项目管理的核心。通过 `npm run <script-name>` 命令，可以方便地执行预定义的任务，例如安装所有依赖、启动开发服务器或构建生产版本。

## 注意事项

-   **子项目 `package.json`**: `backend/` 和 `frontend/` 目录中也有各自的 `package.json` 文件，它们定义了各自模块的特定依赖和脚本。
-   **`concurrently`**: `concurrently` 是一个非常有用的工具，它允许同时运行多个 shell 命令，这对于启动前端和后端服务非常方便。
