# 后端配置 (`config.js`)

该文件导出一个包含后端应用程序所有配置设置的 `config` 对象。这允许在一个集中的位置轻松管理不同环境（如开发、生产）的配置。

## 结构

配置对象按功能区域进行组织：

- `env`: 当前的环境（例如，`development`）。
- `isDevelopment`: 一个布尔值，指示应用程序当前是否在开发模式下运行。
- `server`: 与 Express 服务器相关的设置。
    - `port`: 服务器监听的端口号。
    - `frontendUrl`: 前端应用程序的 URL，主要用于 CORS 配置。
    - `apiKey`: 用于保护某些 API 端点的 API 密钥。
- `supabase`: 与 Supabase 服务连接相关的设置。
    - `url`: Supabase 项目的 URL。
    - `anonKey`: Supabase 项目的匿名 (public) 密钥。
- `socket`: 与 Socket.IO 服务器相关的设置。
    - `pingTimeout`: ping 超时时间（毫秒）。
    - `pingInterval`: ping 间隔时间（毫秒）。
    - `cors`: Socket.IO 的 CORS 配置。
        - `origin`: 允许连接的源列表。
        - `methods`: 允许的 HTTP 方法。
        - `credentials`: 是否允许凭据。

## 用法

应用程序的其他部分可以通过导入此文件来访问这些配置值。例如，在 `server.js` 中：

```javascript
import { getServerConfig } from './src/config/index.js';
const serverConfig = getServerConfig();
const PORT = serverConfig.port;
```

**注意**: 敏感信息（如 Supabase 的 `service_role` 密钥）不应硬编码在此文件中。它们应该通过环境变量来提供，并在需要时由配置加载逻辑读取。
