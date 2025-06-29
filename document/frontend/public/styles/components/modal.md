# 组件样式 - 模态框 (`modal.css`)

该文件定义了 `GameConnecting` 应用程序中模态窗口（弹出框）的通用样式。它包括模态框的背景遮罩、内容区域的布局和样式，以及模态框内部按钮的样式。

## 内容概述

-   **`.modal`**: 
    -   定义了模态框的整体样式，使其覆盖整个屏幕并居中显示。
    -   `display: none;` 初始隐藏模态框。
    -   `position: fixed;` 使模态框固定在视口。
    -   `top`, `left`, `right`, `bottom`: 覆盖整个视口。
    -   `background: rgba(0, 0, 0, 0.5);`: 半透明黑色背景遮罩。
    -   `z-index: 1000;`: 确保模态框位于其他内容之上。
    -   `backdrop-filter: blur(4px);`: 为背景添加模糊效果。
-   **`.modal-content`**: 
    -   定义了模态框内容区域的样式。
    -   `width`, `max-width`: 控制内容区域的宽度。
    -   `margin`: 使内容区域在垂直方向上居中。
    -   `padding`: 内容区域的内边距。
    -   **注意**: 视觉样式（如背景、毛玻璃效果、边框、圆角、阴影）现在由 `style.css` 中的 `.glassmorphic-container` 类提供。
-   **`.modal-content h2`**: 模态框标题的样式。
-   **`.modal-info`**: 模态框信息区域的样式。
-   **`.info-row`**: 模态框信息行（Flexbox 布局）的样式。
-   **`.modal-buttons`**: 模态框底部按钮容器的样式，使用 Flexbox 布局。
-   **`.modal-close`**: 模态框关闭按钮的样式。
-   **`.modal-button`**: 
    -   定义了模态框内部按钮的通用样式，包括内边距、圆角、边框、背景、文本颜色和过渡效果。
    -   实现了悬停时的背景填充效果。
-   **`.modal-button.primary`**: 主色调模态框按钮的样式。
-   **媒体查询 (`@media screen and (max-width: 768px)`)**: 
    -   针对小屏幕设备调整模态框内容区域的内边距和外边距。
    -   将模态框按钮布局改为垂直堆叠。

## 目的

-   **统一弹出界面**: 为应用程序中的所有弹出窗口提供一致的视觉和交互体验。
-   **用户引导**: 通过模态框将用户的注意力集中到特定的任务或信息上。
-   **响应式设计**: 确保模态框在不同设备上都能良好显示。

## 用法

模态框通常由 JavaScript 控制其显示和隐藏。HTML 结构通常如下：

```html
<div id="myModal" class="modal">
    <div class="modal-content glassmorphic-container">
        <span class="modal-close" onclick="closeMyModal()">&times;</span>
        <h2>模态框标题</h2>
        <p>模态框内容。</p>
        <div class="modal-buttons">
            <button class="modal-button">取消</button>
            <button class="modal-button primary">确定</button>
        </div>
    </div>
</div>
```

## 维护

该文档应与 `frontend/public/styles/components/modal.css` 文件的任何更改保持同步，以确保其准确性和实用性。特别是当模态框的通用外观、布局或内部元素样式发生变化时。
