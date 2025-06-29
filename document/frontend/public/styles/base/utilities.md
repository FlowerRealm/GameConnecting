# 基础工具样式 (`utilities.css`)

该文件包含了一组通用的、可复用的 CSS 工具类，用于快速应用常见的样式属性，从而提高开发效率和代码一致性。这些工具类通常直接应用于 HTML 元素，以实现特定的布局或视觉效果。

## 内容概述

-   **文本对齐**: 
    -   `.text-center`: 文本居中对齐。
    -   `.text-right`: 文本右对齐。
    -   `.text-left`: 文本左对齐。
-   **边距工具类**: 
    -   `mt-1` 到 `mt-5`: 控制上外边距（`margin-top`），从 `0.25rem` 到 `2rem`。
    -   `mb-1` 到 `mb-5`: 控制下外边距（`margin-bottom`），从 `0.25rem` 到 `2rem`。
-   **填充工具类**: 
    -   `p-1` 到 `p-5`: 控制内边距（`padding`），从 `0.25rem` 到 `2rem`。
-   **Flexbox 工具类**: 
    -   `d-none`: `display: none;`。
    -   `d-flex`: `display: flex;`。
    -   `flex-column`: `flex-direction: column;`。
    -   `align-items-center`: `align-items: center;`。
    -   `justify-content-center`: `justify-content: center;`。
    -   `justify-content-between`: `justify-content: space-between;`。
-   **响应式工具类 (`@media screen and (max-width: 768px)`)**: 
    -   `d-mobile-none`: 在移动设备上隐藏元素。
    -   `d-mobile-block`: 在移动设备上显示为块级元素。
    -   `d-mobile-flex`: 在移动设备上显示为 flex 容器。
-   **滚动条样式**: 自定义 Webkit 浏览器的滚动条外观。
-   **背景渐变工具类**: 
    -   `.bg-gradient`: 应用一个从左下到右上的线性渐变背景，并确保最小高度为视口高度。

## 目的

-   **快速原型开发**: 允许开发人员快速构建页面布局和应用基本样式，而无需编写自定义 CSS。
-   **代码一致性**: 确保在整个应用程序中应用一致的间距、对齐和布局。
-   **减少重复**: 避免在多个地方重复编写相同的 CSS 规则。

## 用法

这些工具类可以直接添加到 HTML 元素的 `class` 属性中：

```html
<div class="d-flex justify-content-center mt-3">
    <p class="text-center p-2">这是一个居中对齐的文本。</p>
</div>
```

## 维护

-   **原子性**: 每个工具类应尽可能地只负责一个单一的 CSS 属性或一组紧密相关的属性。
-   **命名**: 遵循清晰、简洁的命名约定，使其用途一目了然。
-   **可扩展性**: 在添加新的工具类时，应考虑其通用性和未来的可扩展性。
