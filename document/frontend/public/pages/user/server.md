# 用户服务器列表页面 (`user/server.html`)

该文件定义了 `GameConnecting` 应用程序中普通用户用于查看和管理服务器（房间）的页面。它提供了一个界面，允许用户查看可用的服务器、创建新服务器、查看服务器详情以及管理服务器成员和加入请求。

## 结构概述

-   **头部 (`<head>`)**: 包含页面标题和样式表链接 (`style.css`)。
-   **通知容器 (`#notification-container`)**: 用于显示全局通知消息。
-   **导航栏 (`<nav>`)**: 页面顶部的导航栏，由 `navbar.js` 动态加载。
-   **主内容 (`<main class="container servers-page-container glassmorphic-container">`)**: 包含服务器列表的头部和列表区域。
    -   **页面头部 (`.servers-page-header`)**: 包含页面标题“服务器列表”和“创建服务器”按钮 (`showAddServerModal()`)。
    -   **服务器列表区域 (`#serverList`)**: 用于动态加载和显示服务器列表，初始显示“正在加载服务器...”的占位符。
-   **服务器详情模态窗口 (`#serverDetailModal`)**: 
    -   用于显示服务器详细信息、成员列表和加入请求的弹出窗口。
    -   包含服务器名称、描述、操作按钮（如“加入”、“编辑”、“删除”）、侧边栏标签页（“成员”、“加入申请”）及其对应的内容区域 (`#memberListContainer`, `#joinRequestContainer`)。
-   **添加/编辑服务器模态框 (`#serverModal`)**: 
    -   用于创建新服务器或编辑现有服务器信息的弹出窗口。
    -   包含服务器名称和描述的输入框，以及“取消”和“保存”按钮。

## 引入的 JavaScript 文件

-   `/js/config.js`: 前端配置。
-   `/js/store.js`: 全局状态管理。
-   `/js/apiService.js`: API 请求服务。
-   `/js/auth.js`: 认证管理器。
-   `/js/navbar.js`: 导航栏初始化脚本。
-   `/js/servers.js`: 包含页面所有交互逻辑，处理服务器列表的加载、模态窗口的显示与隐藏、表单提交以及与后端 API 的通信。

## 目的

-   **用户服务器管理**: 提供一个界面，供普通用户管理其可以访问的服务器。
-   **信息展示**: 清晰地展示服务器的关键信息。
-   **操作便捷**: 允许用户快速执行加入、创建、查看详情等操作。

## 维护

该文档应与 `frontend/public/pages/user/server.html` 文件的任何更改保持同步，以确保其准确性和实用性。特别是当页面结构、模态窗口内容、元素 ID 或引入的脚本发生变化时。
