# 环境切换脚本 (`switch-env.sh`)

该 Bash/Zsh 脚本提供了一个交互式或命令行方式来切换项目的开发和生产环境配置。它通过调用后端和前端的 `npm run config:dev` 或 `npm run config:prod` 脚本来生成相应的配置文件。

## 功能

-   **交互式菜单**: 如果不带参数运行，脚本会显示一个菜单，允许用户选择要切换到的环境（开发或生产）。
-   **命令行参数**: 支持通过命令行参数直接指定环境（`1` 为开发，`2` 为生产），方便自动化。
-   **后端配置生成**: 导航到 `backend` 目录并执行 `npm run config:dev` 或 `npm run config:prod`，这会触发 `build-config.js` 脚本来生成 `backend/src/config.js`。
-   **前端配置生成**: 导航到 `frontend` 目录并执行 `npm run config:dev` 或 `npm run config:prod`，这会触发 `frontend/scripts/build-config.js` 脚本来生成 `frontend/public/js/config.js`。
-   **错误检查**: 检查 Node.js 和 npm 是否已安装，以及 `package.json` 文件是否存在。
-   **彩色输出**: 使用 ANSI 转义码提供彩色输出，增强用户体验。

## 用法

在项目根目录下执行此脚本：

### 交互式模式

```bash
./switch-env.sh
```

然后按照提示选择环境。

### 命令行模式

-   **切换到开发环境**:
    ```bash
    ./switch-env.sh 1
    ```
-   **切换到生产环境**:
    ```bash
    ./switch-env.sh 2
    ```

## 注意事项

-   **执行权限**: 确保脚本具有执行权限。如果遇到权限错误，请运行 `chmod +x switch-env.sh`。
-   **`npm run config:dev` / `npm run config:prod`**: 此脚本依赖于 `backend/package.json` 和 `frontend/package.json` 中定义了 `config:dev` 和 `config:prod` 脚本。这些脚本通常会调用各自的 `build-config.js`。
-   **环境变量**: 确保 `.env.development` 和 `.env.production` 文件在 `backend/` 和 `frontend/` 目录下正确配置，因为 `build-config.js` 脚本会读取它们。
