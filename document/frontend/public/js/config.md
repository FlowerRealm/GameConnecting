# 前端配置 (`config.js`)

该文件是前端应用程序的配置文件，它包含了前端运行所需的各种环境特定设置。**这个文件是由 `frontend/scripts/build-config.js` 脚本自动生成的，不应手动修改。**

## 结构

`config.js` 文件导出一个名为 `config` 的 JavaScript 对象，其中包含以下属性：

-   `frontendUrl`: 前端应用程序的 URL。
-   `backendUrl`: 后端 API 服务的 URL。
-   `socketUrl`: Socket.IO 服务的 URL（通常与 `backendUrl` 相同，但协议可能不同，例如 `ws://` 或 `wss://`）。
-   `env`: 当前的运行环境（例如 `development` 或 `production`）。

## 示例

### 开发环境 (`NODE_ENV=development`)

```javascript
export const config = {
  "frontendUrl": "http://localhost:12000",
  "backendUrl": "http://localhost:12001",
  "socketUrl": "ws://localhost:12001",
  "env": "development"
};
```

### 生产环境 (`NODE_ENV=production`)

```javascript
export const config = {
  "frontendUrl": "https://game.flowerrealm.top",
  "backendUrl": "https://gameconnecting.onrender.com",
  "socketUrl": "wss://gameconnecting.onrender.com",
  "env": "production"
};
```

## 用法

前端应用程序中的其他 JavaScript 模块可以通过导入此文件来访问这些配置值：

```javascript
import { config } from './config.js';

console.log('后端 URL:', config.backendUrl);
```

## 维护

-   **自动生成**: 此文件由 `frontend/scripts/build-config.js` 脚本根据 `.env.development` 或 `.env.production` 文件中的环境变量自动生成。因此，任何配置更改都应在相应的 `.env` 文件中进行，然后重新运行构建脚本。
-   **版本控制**: 通常不建议将此文件直接提交到版本控制系统，因为它包含环境特定的值。相反，应提交生成此文件的脚本和 `.env.example` 文件。
