# 组件样式 - 导航栏 (`navbar.css`)

该文件定义了 `GameConnecting` 应用程序中导航栏的样式，包括其布局、品牌、菜单项、认证按钮和用户下拉菜单。它旨在提供一个响应式且具有玻璃拟态效果的导航体验。

## 内容概述

-   **`.navbar`**: 
    -   定义了导航栏的整体定位（固定在顶部，距离边缘 20px）、高度和 `z-index`。
    -   **注意**: 视觉样式（如背景、毛玻璃效果、边框、圆角、阴影）现在由 `style.css` 中的 `.glassmorphic-container` 类提供。
-   **`.navbar .navbar-content-wrapper`**: 
    -   定义了导航栏内容的内部布局，使用 Flexbox 实现品牌、菜单和认证按钮之间的空间分布和垂直居中对齐。
    -   设置了内部填充。
-   **`.navbar-brand`**: 
    -   定义了导航栏品牌（通常是应用程序名称或 Logo）的字体大小、粗细、颜色和过渡效果。
-   **`.navbar-menu`**: 
    -   定义了导航菜单项的 Flexbox 布局和间距。
-   **`.navbar-auth`**: 
    -   定义了认证按钮或用户头像区域的 Flexbox 布局和间距。
-   **`.nav-item`**: 
    -   定义了导航菜单项的通用样式，包括颜色、内边距、圆角、边框和过渡效果。
-   **`.nav-item:hover`**: 
    -   定义了导航菜单项在悬停时的背景、边框和轻微的 `transform` 效果。
-   **`.nav-item.active`**: 
    -   定义了当前活动导航菜单项的样式，使其具有主色调背景和白色文本，并带有阴影。
-   **媒体查询 (`@media screen and (max-width: 768px)`)**: 
    -   针对小屏幕设备隐藏 `navbar-brand`，以节省空间。
-   **`.dropdown`**: 
    -   定义了用户头像下拉菜单的容器样式，使用相对定位。
-   **`.user-avatar`**: 
    -   定义了用户头像的样式，包括大小、圆角、背景、文本颜色和居中对齐。
-   **`.dropdown-content`**: 
    -   定义了下拉菜单内容的样式，包括初始隐藏、绝对定位、背景颜色、阴影、`z-index` 和圆角。
-   **`.dropdown-content.show`**: 
    -   定义了下拉菜单显示时的样式，包括 `display: block` 和一个简单的动画效果。
-   **`.dropdown-content a`**: 
    -   定义了下拉菜单中链接的样式，包括颜色、内边距和过渡效果。
-   **`.dropdown-content a:hover`**: 
    -   定义了下拉菜单中链接在悬停时的背景和文本颜色。
-   **`@keyframes dropdownAppear`**: 
    -   定义了下拉菜单显示时的动画效果，使其从轻微的向上位移和透明度变化中出现。

## 目的

-   **统一导航**: 确保应用程序中所有页面的导航栏具有一致的视觉风格和交互行为。
-   **响应式设计**: 适应不同屏幕尺寸，提供良好的用户体验。
-   **用户状态反馈**: 根据用户认证状态和角色动态显示导航项和用户操作。

## 用法

导航栏通常在每个 HTML 页面的 `<body>` 标签内使用，并通过 JavaScript 动态填充内容。

```html
<nav class="navbar">
    <div class="navbar-content-wrapper">
        <a href="/" class="navbar-brand">GameConnecting</a>
        <div class="navbar-menu" id="navMenu"></div>
        <div class="navbar-auth" id="authButtons"></div>
    </div>
</nav>
```

## 维护

该文档应与 `frontend/public/styles/components/navbar.css` 文件的任何更改保持同步，以确保其准确性和实用性。特别是当导航栏的布局、外观或响应式行为发生变化时。
