# 管理员服务器管理页面 (`administrator/server.html`)

该文件定义了 `GameConnecting` 应用程序中管理员用于管理服务器（房间）的页面。它提供了一个界面，允许管理员查看、创建、编辑、删除服务器以及管理服务器成员。

## 结构概述

-   **头部 (`<head>`)**: 包含页面标题和样式表链接 (`style.css`)。
-   **导航栏 (`<nav>`)**: 页面顶部的导航栏，由 `navbar.js` 动态加载。
-   **主内容 (`.admin-container glassmorphic-container`)**: 包含服务器管理页面的主要部分。
    -   **标题**: “服务器管理”。
    -   **操作区域 (`.admin-actions`)**: 包含“创建新服务器”按钮 (`#createServerBtn`)。
    -   **服务器列表容器 (`#serverListContainer`)**: 用于动态加载和显示服务器列表，初始显示“正在加载服务器列表...”的占位符。
    -   **分页区域 (`#serverListPagination`)**: 用于显示服务器列表的分页控件。
-   **创建/编辑服务器模态窗口 (`#serverModal`)**: 
    -   用于创建新服务器或编辑现有服务器信息的弹出窗口。
    -   包含服务器名称和描述的输入框，以及“取消”和“保存”按钮。
    -   一个隐藏的 `serverId` 输入框，用于在编辑模式下存储服务器 ID。
-   **管理成员模态窗口 (`#membersModal`)**: 
    -   用于显示和管理特定服务器成员的弹出窗口。
    -   包含服务器名称 (`#membersModalServerName`) 和成员列表容器 (`#memberListContainer`)。

## 引入的 JavaScript 文件

-   `/js/adminServerManagement.js`: 包含页面所有交互逻辑，处理服务器列表的加载、模态窗口的显示与隐藏、表单提交以及与后端 API 的通信。

## 目的

-   **服务器管理**: 提供一个集中的界面，供管理员对游戏服务器进行全面的管理。
-   **操作便捷**: 允许管理员快速执行创建、编辑、删除服务器以及管理成员等操作。
-   **信息概览**: 清晰地展示服务器的关键信息和成员列表。

## 维护

该文档应与 `frontend/public/pages/administrator/server.html` 文件的任何更改保持同步，以确保其准确性和实用性。特别是当页面结构、模态窗口内容、元素 ID 或引入的脚本发生变化时。
