# 前端聊天管理器 (`chat.js`)

该文件定义了 `ChatManager` 类，负责管理前端聊天界面的所有交互和逻辑，包括消息的发送、接收、显示以及与 Socket.IO 服务器的通信。

## 依赖

-   `socketManager` (通过构造函数注入): `SocketManager` 实例，用于与 Socket.IO 服务器进行通信。

## `ChatManager` 类

### 1. 核心概念

-   **封装**: 将聊天界面的 DOM 操作、事件监听和 Socket.IO 通信逻辑封装在一个类中。
-   **状态管理**: 内部维护 `currentServer` 来跟踪用户当前所在的聊天服务器。
-   **消息显示**: 负责将接收到的消息（包括用户消息和系统消息）渲染到聊天框中。

### 2. 私有属性

-   `#socket`: `SocketManager` 实例，用于 Socket.IO 通信。
-   `#chatBox`: 聊天消息显示区域的 DOM 元素。
-   `#messageInput`: 消息输入框的 DOM 元素。
-   `#sendButton`: 发送消息按钮的 DOM 元素。
-   `#memberList`: 成员列表的 DOM 元素（如果存在）。
-   `#currentServer`: 当前用户所在的服务器 ID。
-   `#messageTemplate`: 消息模板的 DOM 元素。
-   `#memberTemplate`: 成员模板的 DOM 元素。
-   `#messageHandler`, `#memberJoinedHandler`, `#memberLeftHandler`, `#errorHandler`: Socket.IO 事件监听器的引用，用于方便地添加和移除监听器。

### 3. 构造函数

-   `constructor(socketManager)`: 初始化 `ChatManager` 实例，获取必要的 DOM 元素，绑定事件处理器，并设置 Socket.IO 监听器。

### 4. 私有方法

-   `#bindEventHandlers()`: 绑定发送消息按钮和消息输入框的事件监听器（点击和回车键）。
-   `#setupSocketListeners()`: 设置 Socket.IO 事件监听器，包括 `message` (接收消息)、`memberJoined` (成员加入)、`memberLeft` (成员离开) 和 `error` (错误)。
-   `#removeSocketListeners()`: 移除所有 Socket.IO 事件监听器，防止内存泄漏。
-   `#sendMessage()`: 从消息输入框获取消息内容，并向 Socket.IO 服务器发送 `serverMessage` 事件。
-   `#displayMessage(data)`: 将消息数据渲染到聊天框中。支持普通消息和系统消息。
-   `#displaySystemMessage(message, type = 'info')`: 显示一条系统消息，并在一定时间后自动消失。
-   `#updateMemberCount(count)`: 更新页面上显示的成员数量。

### 5. 公有方法

-   `joinServer(serverId)`: 
    -   **描述**: 用户加入指定的服务器房间。如果用户已经在其他服务器，会先离开当前服务器。
    -   **参数**: `serverId` (string): 要加入的服务器 ID。
    -   **行为**: 发送 `leaveServer` (如果需要) 和 `joinServer` Socket.IO 事件，并清空聊天框。
-   `leaveServer()`: 
    -   **描述**: 用户离开当前所在的服务器房间。
    -   **行为**: 发送 `leaveServer` Socket.IO 事件，并清空聊天框。
-   `destroy()`: 
    -   **描述**: 清理 `ChatManager` 实例，包括离开当前服务器和移除所有 Socket.IO 监听器。
-   `getCurrentServerId()`: 
    -   **描述**: 返回当前用户所在的服务器 ID。
-   `getCurrentServer()`: 
    -   **描述**: 返回当前服务器的详细信息（目前返回 `null`，可能需要从外部获取）。

### 6. Socket.IO 事件

`ChatManager` 监听以下 Socket.IO 事件：

-   `message`: 接收到新的聊天消息。
-   `memberJoined`: 有新成员加入当前服务器。
-   `memberLeft`: 有成员离开当前服务器。
-   `error`: 接收到 Socket.IO 错误。

`ChatManager` 发送以下 Socket.IO 事件：

-   `serverMessage`: 发送聊天消息到服务器。
-   `joinServer`: 请求加入服务器。
-   `leaveServer`: 请求离开服务器。

## 用法

在聊天页面初始化时创建 `ChatManager` 实例，并传入 `socketManager`：

```javascript
import { SocketManager } from './socket.js';
import { ChatManager } from './chat.js';

const socketManager = SocketManager.getInstance();
const chatManager = new ChatManager(socketManager);

// 当用户选择一个服务器时
chatManager.joinServer('some-server-id');
```

## 维护

该文档应与 `frontend/public/js/chat.js` 文件的任何更改保持同步，以确保其准确性和实用性。
