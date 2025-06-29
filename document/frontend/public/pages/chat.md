# 聊天页面 (`chat.html`)

该文件定义了 `GameConnecting` 应用程序的聊天页面。它提供了用户进行实时消息通信和语音聊天的界面。

## 结构概述

-   **头部 (`<header>`)**: 包含导航栏，由 `navbar.js` 动态加载认证状态和用户角色相关的导航项和认证按钮。
-   **通知容器 (`#notification-container`)**: 用于显示全局通知消息（成功、错误、警告等），由 `store.js` 管理。
-   **主内容 (`<main class="container chat-container">`)**: 包含聊天界面的主要元素。
    -   **聊天头部 (`.chat-header`)**: 显示当前服务器名称 (`#currentServerName`)、在线成员数量 (`#memberCount`)、离开服务器按钮 (`#leaveServerButton`)、加入/离开语音聊天按钮 (`#toggle-voice-chat-button`) 和静音/取消静音按钮 (`#toggle-mute-button`)。
    -   **聊天主体 (`.chat-body`)**: 
        -   **聊天框 (`#chatBox`)**: 消息显示区域，聊天消息将在这里动态插入。
        -   **成员/请求侧边栏 (`#memberRequestSidebar`)**: 包含两个标签页（“成员列表”和“加入申请”）及其对应的内容区域 (`#memberListContainer`, `#joinRequestContainer`)。
    -   **聊天输入 (`.chat-input`)**: 包含消息输入框 (`#messageInput`) 和发送按钮 (`#sendButton`)。
-   **模板 (`<template>`)**: 
    -   `#messageTemplate`: 用于动态创建聊天消息元素的 HTML 模板。

## 引入的 JavaScript 文件

该页面通过 `<script type="module">` 标签引入了多个 JavaScript 模块，以实现其功能：

-   `https://cdn.socket.io/4.7.2/socket.io.esm.min.js`: Socket.IO 客户端库。
-   `/js/config.js`: 前端配置，包含后端 URL 等信息。
-   `/js/store.js`: 全局状态管理。
-   `/js/apiService.js`: API 请求服务。
-   `/js/auth.js`: 认证管理器。
-   `/js/navbar.js`: 导航栏初始化脚本。
-   `/js/socket.js`: Socket.IO 连接管理器。
-   `/js/chat.js`: 聊天功能的核心逻辑 (`ChatManager` 类)。
-   `/js/chatPage.js`: 聊天页面特定的逻辑和初始化。
-   `/js/voiceService.js`: 语音聊天服务。

## 目的

-   **用户交互界面**: 提供一个直观的界面，供用户进行实时文本聊天和语音聊天。
-   **功能集成**: 将认证、API 通信、Socket.IO 和语音聊天等多个前端模块集成到统一的页面中。
-   **动态内容**: 通过 JavaScript 动态加载和更新聊天消息、成员列表和语音聊天状态。

## 维护

该文档应与 `frontend/public/pages/chat.html` 文件的任何更改保持同步，以确保其准确性和实用性。特别是当页面结构、引入的脚本或样式发生变化时。
