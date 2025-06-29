# 组件样式 - 通知 (`notifications.css`)

该文件定义了 `GameConnecting` 应用程序中全局通知消息的样式。它提供了不同类型的通知（成功、错误、警告、信息）的视觉样式和定位，以向用户提供即时反馈。

## 内容概述

-   **`.notification-container`**: 
    -   定义了通知容器的定位（固定在视口右上角，位于导航栏下方），`z-index` 和宽度。
    -   使用 Flexbox 布局，使通知垂直堆叠并保持间距。
-   **`.notification-item`**: 
    -   定义了单个通知项的通用样式，包括内边距、圆角、阴影、文本颜色、透明度和过渡效果。
-   **类型变体**: 
    -   `.notification-item.success`: 成功通知的背景颜色（绿色）。
    -   `.notification-item.error`: 错误通知的背景颜色（红色）。
    -   `.notification-item.warning`: 警告通知的背景颜色（黄色）和文本颜色。
    -   `.notification-item.info`: 信息通知的背景颜色（蓝色）。
-   **`.notification-item.fade-out`**: 
    -   定义了通知消失时的动画效果，使其透明度变为 0 并向右滑出。

## 目的

-   **用户反馈**: 提供一种统一且非侵入性的方式来向用户显示操作结果、警告或错误信息。
-   **视觉区分**: 通过不同的颜色区分通知的类型，帮助用户快速理解消息的性质。
-   **易于集成**: 提供预定义的 CSS 类，方便 JavaScript 动态创建和管理通知。

## 用法

通知通常由 JavaScript（例如 `store.js` 中的 `addNotification` 方法）动态创建并插入到 HTML 中的 `#notification-container` 元素中。例如：

```html
<div id="notification-container" class="notification-container">
    <!-- 通知将由 JavaScript 动态插入这里 -->
</div>
```

JavaScript 代码会根据通知类型添加相应的类：

```javascript
// 假设 store.js 已经导入并实例化
store.addNotification('操作成功！', 'success');
store.addNotification('发生错误！', 'error');
```

## 维护

该文档应与 `frontend/public/styles/components/notifications.css` 文件的任何更改保持同步，以确保其准确性和实用性。特别是当通知的定位、外观或动画效果发生变化时。
