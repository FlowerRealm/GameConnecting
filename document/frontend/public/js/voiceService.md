# 前端语音聊天服务 (`voiceService.js`)

该文件实现了前端的 WebRTC 语音聊天功能，负责管理用户的麦克风访问、建立和维护与其他用户的对等连接 (Peer Connection)，以及通过 Socket.IO 进行信令交换。

## 核心概念

-   **WebRTC**: 使用 WebRTC API 实现浏览器之间的实时音频通信。
-   **Socket.IO 信令**: 利用 Socket.IO 服务器作为信令服务器，交换建立 WebRTC 连接所需的 SDP (Session Description Protocol) 和 ICE (Interactive Connectivity Establishment) 候选者。
-   **对等连接管理**: 维护一个 `peerConnections` 对象，存储与每个远程用户建立的 `RTCPeerConnection` 实例。
-   **本地媒体流**: 管理用户的本地音频流（麦克风输入）。
-   **远程媒体流**: 接收并播放来自其他用户的远程音频流。

## 全局变量

-   `peerConnections`: `Object`，键为 `socketId`，值为 `RTCPeerConnection` 实例，用于管理与其他用户的对等连接。
-   `localStream`: `MediaStream` 对象，存储用户的本地麦克风音频流。
-   `currentVoiceRoomId`: `string`，当前用户所在的语音聊天房间 ID。
-   `localSocketId`: `string`，当前用户的 Socket.IO ID。
-   `activeVoiceUsers`: `Map<socketId, {userId, username, socketId}>`，存储当前语音房间中的活跃用户列表。
-   `onVoiceUsersUpdate`: `function`，一个回调函数，用于在活跃语音用户列表更新时通知 UI。
-   `iceConfiguration`: `Object`，WebRTC ICE 服务器配置，包含 STUN 服务器。
-   `socket`: `Socket.IO` 客户端实例，用于信令交换。

## 导出函数

---

### 1. `setVoiceUsersUpdateCallback(callback)`

-   **描述**: 设置一个回调函数，当语音房间中的活跃用户列表发生变化时，该函数会被调用。
-   **参数**:
    -   `callback` (function): 回调函数，接收一个 `voiceUsers` 数组作为参数。

---

### 2. `initVoiceChat(socketInstance)`

-   **描述**: 初始化语音聊天服务，设置 Socket.IO 事件监听器。
-   **参数**:
    -   `socketInstance` (Socket.IO 客户端实例): 已连接的 Socket.IO 客户端实例。
-   **行为**: 
    -   存储传入的 `socketInstance`。
    -   设置 `localSocketId`。
    -   监听以下 Socket.IO 事件：
        -   `voice:active_users_in_room`: 接收当前语音房间中的所有活跃用户列表。
        -   `voice:user_joined`: 有新用户加入语音房间。
        -   `voice:user_left`: 有用户离开语音房间。
        -   `voice:receive_signal`: 接收 WebRTC 信令（offer/answer）。
        -   `voice:receive_ice_candidate`: 接收 ICE 候选者。
        -   `voice:error`: 接收来自服务器的语音聊天错误。

---

### 3. `joinVoiceRoom(roomId)`

-   **描述**: 尝试加入指定的语音聊天房间。
-   **参数**:
    -   `roomId` (string): 要加入的房间 ID。
-   **返回**: `Promise<boolean>`，解析为 `true` 表示成功加入，`false` 表示失败。
-   **行为**: 
    -   检查 `socket` 是否已初始化。
    -   如果已在其他房间或已有本地流，则先离开。
    -   尝试通过 `navigator.mediaDevices.getUserMedia({ audio: true })` 获取麦克风权限和本地音频流。
    -   如果成功，向 Socket.IO 服务器发送 `voice:join_room` 事件。
    -   如果失败，显示错误消息并返回 `false`。

---

### 4. `leaveVoiceRoom()`

-   **描述**: 离开当前所在的语音聊天房间。
-   **行为**: 
    -   向 Socket.IO 服务器发送 `voice:leave_room` 事件。
    -   停止本地音频流的轨道。
    -   关闭所有对等连接。
    -   移除所有远程音频元素。
    -   清空 `activeVoiceUsers` 和 `peerConnections`。

---

### 5. `toggleMute()`

-   **描述**: 切换本地麦克风的静音状态。
-   **返回**: `boolean`，表示当前是否处于静音状态。
-   **行为**: 遍历本地音频流的所有音频轨道，并切换其 `enabled` 属性。

## 内部函数

---

### `createPeerConnection(targetSocketId, isOfferInitiator)`

-   **描述**: 为指定的远程用户创建一个 `RTCPeerConnection` 实例。
-   **参数**:
    -   `targetSocketId` (string): 远程用户的 Socket.IO ID。
    -   `isOfferInitiator` (boolean): 如果当前用户是发起方 (offer)，则为 `true`。
-   **行为**: 
    -   配置 ICE 服务器。
    -   将本地音频流的轨道添加到对等连接。
    -   设置 `onicecandidate` 事件处理器，用于发送 ICE 候选者。
    -   设置 `ontrack` 事件处理器，用于接收远程音频流并将其附加到 `<audio>` 元素。
    -   设置 `oniceconnectionstatechange` 事件处理器，用于监控连接状态。
    -   如果 `isOfferInitiator` 为 `true`，则创建并发送 SDP offer。

## Socket.IO 事件 (发送)

-   `voice:join_room`: 请求加入语音房间。
-   `voice:leave_room`: 请求离开语音房间。
-   `voice:send_signal`: 发送 WebRTC 信令 (offer/answer)。
-   `voice:send_ice_candidate`: 发送 ICE 候选者。

## Socket.IO 事件 (接收)

-   `voice:active_users_in_room`: 接收当前语音房间中的活跃用户列表。
-   `voice:user_joined`: 接收新加入语音房间的用户信息。
-   `voice:user_left`: 接收离开语音房间的用户信息。
-   `voice:receive_signal`: 接收 WebRTC 信令。
-   `voice:receive_ice_candidate`: 接收 ICE 候选者。
-   `voice:error`: 接收语音聊天错误信息。

## 用法

在需要语音聊天功能的页面（例如 `chatPage.js`）中，首先初始化 `voiceService`，然后调用 `joinVoiceRoom` 和 `leaveVoiceRoom` 等函数。

```javascript
import { initVoiceChat, joinVoiceRoom, leaveVoiceRoom, toggleMute } from './voiceService.js';
import { socketManager } from './socket.js';

// 在 Socket.IO 连接成功后初始化语音服务
socketManager.on('connect', () => {
    initVoiceChat(socketManager.getSocket());
});

// 加入语音房间
document.getElementById('join-voice-button').addEventListener('click', () => {
    joinVoiceRoom('some-room-id');
});

// 切换静音
document.getElementById('mute-button').addEventListener('click', () => {
    toggleMute();
});
```

## 维护

该文档应与 `frontend/public/js/voiceService.js` 文件的任何更改保持同步，以确保其准确性和实用性。
