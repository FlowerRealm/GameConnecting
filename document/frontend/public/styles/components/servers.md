# 组件样式 - 服务器 (`servers.css`)

该文件定义了 `GameConnecting` 应用程序中服务器列表和服务器详情组件的样式。它包括服务器卡片、服务器列表布局、成员列表和加入请求列表的样式。

## 内容概述

-   **`.server-list`**: 
    -   定义了服务器列表的网格布局，使其在不同屏幕尺寸下能够自适应显示。
    -   使用 `display: grid` 和 `grid-template-columns` 实现响应式列布局。
-   **`.servers-page-container`**: 
    -   定义了服务器页面容器的 Flexbox 布局和内边距。
    -   **注意**: 视觉样式（如背景、毛玻璃效果、边框、圆角、阴影）现在由 `style.css` 中的 `.glassmorphic-container` 类提供。
-   **`.server-card`**: 
    -   定义了单个服务器卡片的样式，包括背景、边框、圆角、内边距、阴影和悬停时的动画效果。
    -   使用 Flexbox 布局，使卡片内容垂直排列。
-   **`.server-header`**: 
    -   定义了服务器卡片头部（包含服务器名称和统计信息）的 Flexbox 布局。
-   **`.server-header h3`**: 
    -   定义了服务器名称的字体样式和文本溢出处理。
-   **`.server-stats`**: 
    -   定义了服务器统计信息（如成员数）的样式，包括图标和文本颜色。
-   **`.sidebar-content`**: 
    -   定义了侧边栏内容的通用样式，用于切换显示成员列表和加入请求。
-   **`.member-item`, `.join-request-item`**: 
    -   定义了成员列表项和加入请求项的样式，包括 Flexbox 布局和底部边框。
-   **`.member-avatar`**: 
    -   定义了成员头像的样式。
-   **`.member-info`, `.request-info`**: 
    -   定义了成员信息和请求信息的样式。
-   **`.member-name`, `.requester-name`**: 
    -   定义了成员名称和请求者名称的字体样式。
-   **`.member-role`, `.request-time`**: 
    -   定义了成员角色和请求时间的字体样式。
-   **`.member-actions`, `.request-actions`**: 
    -   定义了成员操作和请求操作按钮容器的 Flexbox 布局。
-   **`.servers-page-header`**: 
    -   定义了服务器页面头部的 Flexbox 布局，用于排列标题和“创建服务器”按钮。
-   **`.member-action-button`, `.approve-button`, `.reject-button`**: 
    -   定义了成员操作按钮（如踢出、批准、拒绝）的样式，包括内边距、圆角、字体大小和悬停效果。
-   **`#noServerSelected`**: 
    -   定义了当没有服务器被选中时显示的占位符样式。

## 目的

-   **统一外观**: 确保服务器相关组件具有一致的视觉风格。
-   **信息展示**: 清晰地展示服务器和成员的关键信息。
-   **用户交互**: 提供直观的界面，方便用户进行服务器和成员管理操作。

## 用法

这些样式类应用于服务器列表页面和服务器详情模态框中的相应 HTML 元素。

## 维护

该文档应与 `frontend/public/styles/components/servers.css` 文件的任何更改保持同步，以确保其准确性和实用性。特别是当服务器卡片、列表布局、成员列表或操作按钮的样式发生变化时。
