# 前端主脚本 (`main.js`)

该文件是前端应用程序的一个通用入口脚本，主要负责初始化全局组件（如导航栏）和根据用户认证状态管理 Socket.IO 连接。它通常被包含在不需要复杂页面逻辑的 HTML 页面中。

## 依赖

-   `./auth.js`: `AuthManager` 实例，用于检查用户认证状态。
-   `./navbar.js`: `initNavbar` 函数，用于初始化导航栏。
-   `./socket.js`: `socketManager` 实例，用于管理 Socket.IO 连接。

## 主要功能

### 1. 导航栏初始化

-   调用 `initNavbar()` 初始化页面导航栏，确保所有页面都具有一致的导航体验。

### 2. Socket.IO 连接管理

-   如果用户通过 `AuthManager.isAuthenticated()` 认证，则可以根据需要在此处调用 `socketManager.connect()` 来建立全局 Socket.IO 连接。
-   **注意**: 目前，`admin.js` 和 `chatPage.js` 等特定页面已经处理了各自的 Socket.IO 连接逻辑，因此此处的全局连接可能不是必需的，或者仅作为通用页面的默认行为。

## 用法

该脚本通常通过 HTML 文件中的 `<script type="module" src="./js/main.js"></script>` 标签加载。它为页面提供了基本的结构和功能，而无需编写大量的页面特定 JavaScript。

## 维护

该文档应与 `frontend/public/js/main.js` 文件的任何更改保持同步，以确保其准确性和实用性。
