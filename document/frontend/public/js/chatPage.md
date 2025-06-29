# 前端聊天页面脚本 (`chatPage.js`)

该文件是 `GameConnecting` 项目中聊天页面的主要 JavaScript 逻辑。它负责初始化聊天界面、管理用户认证、处理服务器（房间）的加入和离开，以及集成实时通信和语音聊天功能。

## 依赖

-   `./auth.js`: `AuthManager` 实例，用于用户认证和权限检查。
-   `./navbar.js`: `initNavbar` 函数，用于初始化导航栏。
-   `./socket.js`: `socketManager` 实例，用于管理 Socket.IO 连接。
-   `./chat.js`: `ChatManager` 类，用于处理聊天消息的发送和显示。
-   `./apiService.js`: `apiService` 实例，用于向后端发送 API 请求。
-   `./store.js`: `store` 实例，用于显示通知和管理全局状态。
-   `./voiceService.js`: 语音聊天服务，包括 `initVoiceChat`, `joinVoiceRoom`, `leaveVoiceRoom`, `toggleMute`, `setVoiceUsersUpdateCallback`。

## 全局变量

-   `chatManager`: `ChatManager` 实例。
-   `currentServerDetails`: 当前服务器的详细信息。
-   `isInVoiceChat`: 跟踪用户是否在语音聊天中。
-   `isMuted`: 跟踪用户是否已静音。

## 主要功能

### 1. 页面初始化与认证

-   在 `DOMContentLoaded` 事件触发时执行初始化逻辑。
-   检查用户是否已认证。如果未认证，则重定向到登录页面。
-   初始化导航栏。
-   从 URL 参数中获取 `serverId`。如果未指定，则显示错误并重定向到服务器列表页面。

### 2. 聊天与 Socket.IO 管理

-   连接 Socket.IO 服务器 (`socketManager.connect()`)。
-   初始化 `ChatManager` 实例，并将其与 `socketManager` 关联。
-   加载当前服务器的详细信息 (`loadServerDetails()`)。
-   用户加入服务器 (`chatManager.joinServer(serverId)`)。
-   更新页面标题显示当前服务器名称。

### 3. 语音聊天集成

-   初始化语音聊天服务 (`initVoiceChat()`)，并设置语音用户列表更新的回调函数 (`setVoiceUsersUpdateCallback()`)。
-   **加入/离开语音聊天**: `toggleVoiceChatButton` 的点击事件处理程序，根据 `isInVoiceChat` 状态调用 `joinVoiceRoom()` 或 `leaveVoiceRoom()`。
-   **静音/取消静音**: `toggleMuteButton` 的点击事件处理程序，调用 `toggleMute()` 并更新 UI。
-   `updateVoiceUserListUI(voiceUsers)`: 这是一个占位函数，用于更新语音聊天中的用户列表 UI（目前未实现具体逻辑）。

### 4. 离开服务器功能

-   `leaveServerButton` 的点击事件处理程序，向后端 API (`/api/rooms/:serverId/leave`) 发送请求以离开服务器。
-   成功离开后，调用 `chatManager.leaveServer()`，显示通知，并重定向到服务器列表页面。

### 5. 辅助函数

-   `loadServerDetails(serverId)`: 从后端 API 获取指定服务器的详细信息。成功后返回服务器数据，失败则显示通知并返回 `null`。

## 交互流程

-   用户访问聊天页面，系统首先验证其认证状态。
-   如果 URL 中包含 `serverId`，则尝试加载服务器详情并加入该服务器的聊天。
-   用户可以通过输入框发送消息，消息会通过 Socket.IO 实时发送给房间内的其他成员。
-   用户可以点击“离开服务器”按钮退出当前聊天房间。
-   用户可以点击“加入语音”/“离开语音”按钮来进入或退出语音聊天。
-   在语音聊天中，用户可以点击“静音”/“取消静音”按钮来控制自己的麦克风。

## 维护

该文档应与 `frontend/public/js/chatPage.js` 文件的任何更改保持同步，以确保其准确性和实用性。
