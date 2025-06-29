# 页面特定样式 - 服务器列表 (`servers.css`)

该文件定义了 `GameConnecting` 应用程序中服务器列表页面的特定样式。它包含了服务器列表的布局、服务器卡片、模态窗口以及服务器详情中的成员和加入申请列表的样式。

## 内容概述

-   **`.servers-page-container`**: 
    -   定义了服务器列表页面的主容器样式，包括外边距、内边距、最大宽度和 Flexbox 布局。
-   **`.servers-page-header`**: 
    -   定义了页面头部的 Flexbox 布局，用于排列标题和“创建服务器”按钮。
-   **`#serverList`**: 
    -   定义了服务器列表容器的宽度和溢出行为。
-   **`.server-table`**: 
    -   定义了服务器表格的通用样式，包括边框折叠、背景颜色、圆角和阴影。
-   **`.server-table th`, `.server-table td`**: 
    -   定义了表格头部和单元格的内边距、文本对齐、颜色和字体样式。
-   **`.server-table .server-info`**: 
    -   定义了表格中服务器信息（名称和图标）的 Flexbox 布局。
-   **`.server-table .server-actions`**: 
    -   定义了表格中服务器操作按钮的 Flexbox 布局和间距。
-   **`.server-table .no-data`**: 
    -   定义了表格中没有数据时的提示样式。
-   **`.empty-state`**: 
    -   定义了通用的空状态显示样式，包括图标、标题和描述。
-   **模态窗口样式 (`.modal`, `.modal-content`, `.modal-close`, `modal h2`)**: 
    -   定义了模态窗口的通用样式，包括背景遮罩、内容区域的布局和关闭按钮。
-   **服务器详情模态窗口 (`#serverDetailModal .modal-content`)**: 
    -   定义了服务器详情模态窗口的特定样式，包括最大宽度和滚动行为。
-   **`.server-detail-header`**: 
    -   定义了服务器详情模态窗口头部的样式。
-   **`.server-detail-actions`**: 
    -   定义了服务器详情模态窗口中操作按钮的 Flexbox 布局。
-   **`.server-button`**: 
    -   定义了服务器操作按钮的通用样式，包括内边距、圆角、颜色和悬停效果。
-   **`.server-button.edit-button`, `.server-button.delete-button`**: 
    -   定义了编辑和删除按钮的特定颜色和边框。
-   **侧边栏标签页 (`.sidebar-tabs`, `.tab-button`, `.tab-button.active`)**: 
    -   定义了服务器详情模态窗口中侧边栏标签页的 Flexbox 布局和按钮样式。
-   **侧边栏内容 (`.sidebar-content`)**: 
    -   定义了侧边栏内容的显示/隐藏和滚动行为。
-   **成员列表样式 (`.member-item`, `.member-info`, `.member-actions`)**: 
    -   定义了成员列表项的 Flexbox 布局、信息显示和操作按钮。
-   **加入申请样式 (`.join-request-item`, `.join-request-info`, `.join-request-actions`)**: 
    -   定义了加入申请列表项的 Flexbox 布局、信息显示和操作按钮。
-   **响应式设计 (`@media (max-width: 768px)`)**: 
    -   针对小屏幕设备调整了页面头部、表格、模态窗口和侧边栏标签页的布局和样式。

## 目的

-   **服务器列表展示**: 提供一个清晰、直观的界面来展示服务器列表。
-   **服务器管理**: 允许用户和管理员进行服务器的创建、编辑、删除和成员管理。
-   **响应式设计**: 确保页面在不同设备上都能良好显示和使用。

## 用法

这些样式类应用于 `servers.html` 页面中的相应 HTML 元素。

## 维护

该文档应与 `frontend/public/styles/pages/servers.css` 文件的任何更改保持同步，以确保其准确性和实用性。特别是当服务器列表的布局、卡片样式、模态窗口或响应式行为发生变化时。
