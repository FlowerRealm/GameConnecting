# 组件样式 - 按钮 (`buttons.css`)

该文件定义了 `GameConnecting` 应用程序中所有按钮的通用样式和变体。它旨在提供一致的按钮外观和交互效果，并支持不同的颜色和大小。

## 内容概述

-   **基础按钮样式 (`.button`, `.btn`, `.auth-button`, `.action-button`, `.server-button`, `.list-action-button`, `.add-server-button`, `.review-button`, `.connect-button`, `.edit-button`, `.delete-button`)**:
    -   定义了按钮的通用外观，包括内边距、圆角、边框、背景、文本颜色、光标样式、字体粗细和过渡效果。
    -   使用 `display: inline-flex` 和 `align-items: center`、`justify-content: center` 来确保按钮内容（包括图标）垂直和水平居中。
-   **悬停效果**: 定义了所有按钮在悬停时的背景、边框和轻微的 `transform` 效果。
-   **颜色变体**: 
    -   `.btn-primary`, `.primary-button`, `.add-server-button`, `.review-button`, `.connect-button`: 主色调按钮样式。
    -   `.btn-secondary`, `.edit-button`: 次要色调按钮样式。
    -   `.btn-danger`, `.delete-button`: 危险操作按钮样式。
    -   `.btn-success`: 成功操作按钮样式。
    -   `.btn-warning`: 警告操作按钮样式。
-   **大小变体**: 
    -   `.btn-sm`: 小尺寸按钮。
    -   `.btn-lg`: 大尺寸按钮。
-   **块级按钮**: 
    -   `.btn-block`: 使按钮占据其父容器的全部宽度。
-   **链接按钮**: 
    -   `.btn-link`: 样式类似于文本链接的按钮。
-   **导航栏按钮**: 
    -   `.navbar .btn`: 针对导航栏内部按钮的特定样式，增加了 `backdrop-filter`。
-   **表单相关样式**: 
    -   `.form-group`: 表单组的通用样式，用于控制表单元素之间的间距。
    -   `.form-text`: 表单辅助文本的样式。
    -   `.form-group label`: 表单标签的样式。
    -   `.form-control`: 表单输入框和文本域的通用样式，包括焦点效果。
-   **特殊按钮样式**: 
    -   `.auth-button.primary`: 注册按钮的特殊样式，使其具有轮廓效果。

## 目的

-   **统一外观**: 确保应用程序中所有按钮具有一致的视觉风格。
-   **易于使用**: 提供不同颜色和大小的按钮，以适应不同的用户交互场景。
-   **提高效率**: 通过预定义的 CSS 类，简化按钮的样式应用。

## 用法

通过将相应的 CSS 类添加到 `<button>` 或 `<a>` 元素上，可以应用这些按钮样式：

```html
<button class="btn btn-primary">主要按钮</button>
<a href="#" class="btn btn-danger btn-sm">删除</a>
<button class="auth-button primary">注册</button>
```

## 维护

该文档应与 `frontend/public/styles/components/buttons.css` 文件的任何更改保持同步，以确保其准确性和实用性。特别是当按钮的通用外观、颜色变体或大小发生变化时。
