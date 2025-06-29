# Socket.IO 服务器 (`index.js`)

该文件负责初始化和管理 Socket.IO 服务器，以实现客户端和服务器之间的实时双向通信。它处理用户认证、服务器（房间）加入/离开、消息传递以及 WebRTC 语音聊天的信令。

## 主要功能

- **Socket.IO 初始化**: `initSocket(httpServer)` 函数使用传入的 HTTP 服务器实例来设置和配置 Socket.IO 服务器。
- **认证中间件**: 在每个新的 socket 连接上强制执行认证。它验证客户端提供的 JWT，并从数据库中获取用户资料，确保只有活跃用户才能连接。
- **在线状态管理**: 使用 `onlineUsers` 和 `activeServers` Map 来跟踪在线用户和活跃的服务器房间。
- **服务器/房间事件**: 处理与服务器（房间）相关的事件，如 `joinServer`, `serverMessage`, 和 `leaveServer`。
- **语音聊天信令**: 为 WebRTC 实现信令逻辑，处理 `voice:join_room`, `voice:send_signal` 等事件，以协调对等连接（peer connections）。
- **实例导出**: `getIoInstance()` 导出一个函数，允许应用程序的其他部分（例如，API 路由）访问 Socket.IO 实例以发送事件。

## 认证

- 在建立连接时，客户端必须通过 `socket.handshake.auth.token` 提供一个有效的 JWT。
- 中间件会验证此令牌，获取用户资料，并将一个 `user` 对象附加到 `socket` 实例上。
- 只有 `status` 为 `active` 的用户才被允许连接。

## 数据结构

- `onlineUsers`: `Map<userId, Set<socketId>>` - 跟踪每个用户的所有活动 socket 连接。
- `activeServers`: `Map<serverId, { members: Set<userId>, lastActivity: Date }>` - 维护每个活动服务器房间中的用户集和最后活动时间。
- `voiceSessions`: `Map<roomId, Map<socketId, {socketId, userId, username}>>` - 管理每个房间中的语音聊天会话和参与者。

## 主要事件

### 连接与断开

- `connection`: 当一个客户端成功通过认证后触发。处理用户加入在线列表和 `admin_room`（如果适用）。
- `disconnect`: 当一个客户端断开连接时触发。处理从在线列表、活动服务器和语音会话中清理该用户。

### 服务器/房间事件

- `joinServer(serverId)`: 用户加入一个服务器房间。
- `serverMessage({ serverId, message, type })`: 用户在服务器房间内发送消息。
- `leaveServer(serverId)`: 用户离开一个服务器房间。

### 语音聊天 (WebRTC 信令)

- `voice:join_room({ roomId })`: 用户加入一个房间的语音聊天。
- `voice:leave_room({ roomId })`: 用户离开语音聊天。
- `voice:send_signal({ roomId, targetSocketId, signalType, sdp })`: 在对等方之间中继 WebRTC 信令消息（offer/answer）。
- `voice:send_ice_candidate({ roomId, targetSocketId, candidate })`: 在对等方之间中继 ICE 候选者。

## 导出函数

- `initSocket(httpServer)`: 初始化并返回 Socket.IO 服务器实例。
- `getIoInstance()`: 获取已初始化的 Socket.IO 实例。
- `getActiveServersInfo()`: 获取有关活动服务器的信息（在线成员数，最后活动时间）。
