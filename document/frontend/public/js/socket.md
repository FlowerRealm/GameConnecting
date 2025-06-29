# 前端 Socket.IO 管理器 (`socket.js`)

该文件定义了 `SocketManager` 类，这是一个用于管理前端 Socket.IO 连接的单例模式类。它负责连接到 Socket.IO 服务器、处理连接状态、自动重连、事件监听和发送事件，并与认证管理器和错误处理程序集成。

## 依赖

-   `./config.js`: 用于获取 Socket.IO 服务器的 URL 和连接配置。
-   `socket.io.esm.min.js`: Socket.IO 客户端库。
-   `./auth.js`: `AuthManager` 实例，用于获取认证令牌和处理认证失败。
-   `./errorHandler.js`: `ErrorHandler` 实例，用于集中处理 Socket 相关的错误。

## `SocketManager` 类

### 1. 核心概念

-   **单例模式**: 确保 `SocketManager` 在整个应用程序中只有一个实例。
-   **连接状态管理**: 内部维护 `connectionState` (`disconnected`, `connecting`, `connected`) 来跟踪 Socket.IO 连接的状态。
-   **手动重连**: 实现了指数退避策略的自动重连机制，以处理意外断开。
-   **事件监听器管理**: 维护一个内部 `listeners` Map，用于在重连时重新绑定事件监听器。

### 2. 属性

-   `socket`: Socket.IO 客户端实例。
-   `reconnectAttempts`: 当前重连尝试次数。
-   `listeners`: `Map<event, Set<callback>>`，存储所有注册的事件监听器。
-   `connectionState`: 当前连接状态。
-   `reconnectTimer`: 重连定时器。

### 3. 构造函数

-   `constructor()`: 初始化 `SocketManager` 实例，设置初始状态。

### 4. 方法

-   **`connect()`**:
    -   **描述**: 尝试建立 Socket.IO 连接。如果已经连接或正在连接，则不执行任何操作。
    -   **逻辑**: 获取认证令牌，构建 Socket.IO 连接选项（包括认证令牌），然后创建 `socket` 实例并设置事件处理器。
    -   **注意**: 如果没有认证令牌，连接尝试会立即失败。

-   **`setupEventHandlers()`**:
    -   **描述**: 设置 Socket.IO 实例的事件监听器。
    -   **监听事件**:
        -   `connect`: 连接成功时触发，重置重连尝试次数，并重新绑定所有内部存储的事件监听器。
        -   `disconnect`: 连接断开时触发，调用 `handleDisconnect()` 处理重连逻辑。
        -   `error`: 发生错误时触发，调用 `ErrorHandler.handleSocketError()` 进行处理。如果错误是认证失败，则调用 `handleAuthError()`。

-   **`handleDisconnect(reason)`**:
    -   **描述**: 处理 Socket.IO 断开连接的逻辑。
    -   **逻辑**: 如果是意外断开，则根据配置的 `maxRetryAttempts` 和指数退避策略尝试重连。如果达到最大重连次数，则通过 `ErrorHandler` 报告错误。

-   **`handleAuthError()`**:
    -   **描述**: 处理 Socket.IO 认证失败的逻辑。
    -   **逻辑**: 调用 `AuthManager.logout()` 清除本地认证数据，并重定向到登录页面。

-   **`on(event, callback)`**:
    -   **描述**: 注册一个 Socket.IO 事件监听器。它不仅将回调函数添加到 `socket` 实例，还将其存储在内部 `listeners` Map 中，以便在重连时重新绑定。
    -   **参数**: `event` (string), `callback` (function)。

-   **`off(event, callback)`**:
    -   **描述**: 移除一个 Socket.IO 事件监听器。
    -   **参数**: `event` (string), `callback` (function)。

-   **`emit(event, data)`**:
    -   **描述**: 向 Socket.IO 服务器发送一个事件。
    -   **参数**: `event` (string), `data` (any)。

-   **`disconnect()`**:
    -   **描述**: 主动断开 Socket.IO 连接。
    -   **逻辑**: 调用 `socket.disconnect()`，并清除重连定时器。

## 用法

在前端应用程序中，通过导入 `socketManager` 实例来使用 Socket.IO 功能：

```javascript
import { socketManager } from './socket.js';

// 连接到 Socket.IO 服务器
socketManager.connect();

// 监听自定义事件
socketManager.on('message', (data) => {
    console.log('收到消息:', data);
});

// 发送事件
socketManager.emit('sendMessage', { roomId: '123', message: 'Hello' });

// 断开连接
// socketManager.disconnect();
```

## 维护

该文档应与 `frontend/public/js/socket.js` 文件的任何更改保持同步，以确保其准确性和实用性。
