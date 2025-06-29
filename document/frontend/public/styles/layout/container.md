# 布局样式 - 容器 (`container.css`)

该文件定义了 `GameConnecting` 应用程序中各种容器的通用布局样式。这些容器用于组织页面内容，并确保在不同屏幕尺寸下都能提供一致的视觉体验。

## 内容概述

-   **`.container`**: 
    -   定义了主内容区域的 Flexbox 布局，使其能够填充可用空间 (`flex: 1`)。
-   **`.game-container`**: 
    -   一个 Flexbox 容器，用于包裹游戏画布或其他交互式内容。
-   **`.login-container`, `.register-container`**: 
    -   定义了登录和注册页面的容器样式。
    -   设置了内边距和外边距，以确保内容与页面边缘和导航栏之间有适当的间距。
    -   **注意**: 背景、圆角、边框和 `backdrop-filter` 等视觉样式现在由 HTML 中应用的 `.glassmorphic-container` 类处理。
-   **`.admin-container`, `.friends-container`, `.servers-container`**: 
    -   定义了管理员页面、好友页面和服务器页面的通用容器样式。
    -   设置了宽度、背景、内边距、圆角、阴影和 `backdrop-filter`。
    -   设置了顶部、左右和底部外边距，以确保内容与导航栏和页面边缘之间有适当的间距。
-   **媒体查询 (`@media screen and (max-width: 768px)`)**: 
    -   针对小屏幕设备调整了 `.login-container`, `.register-container`, `.admin-container`, `.friends-container`, `.servers-container` 的内边距和顶部外边距，以适应移动设备的显示。

## 目的

-   **统一布局**: 为应用程序的不同页面提供一致的容器布局。
-   **响应式设计**: 确保页面内容在不同屏幕尺寸下都能良好显示和适应。
-   **职责分离**: 将布局样式与组件样式和基础样式分离，提高代码的可维护性。

## 用法

这些容器类通常应用于 HTML 页面中的主要内容区域，以组织和布局页面元素。

```html
<main class="container login-container glassmorphic-container">
    <!-- 登录表单内容 -->
</main>
```

## 维护

该文档应与 `frontend/public/styles/layout/container.css` 文件的任何更改保持同步，以确保其准确性和实用性。特别是当容器的布局、间距或响应式行为发生变化时。
