# 前端用户列表脚本 (`friends.js`)

该文件是前端用户列表页面的核心 JavaScript 逻辑，负责从后端获取所有用户列表并将其渲染到页面上。尽管文件名是 `friends.js`，但其功能已扩展为显示所有用户，而不仅仅是好友。

## 依赖

-   `./auth.js`: `AuthManager` 实例，用于用户认证和权限检查。
-   `./apiService.js`: `apiService` 实例，用于向后端发送 API 请求。
-   `./navbar.js`: `initNavbar` 函数，用于初始化导航栏。
-   `./store.js`: `store` 实例，用于显示通知。

## 全局变量

-   `currentPage`: 当前页码，默认为 `1`。
-   `limit`: 每页显示的用户数量，默认为 `10`。

## 主要功能

### 1. 页面初始化与认证

-   在 `DOMContentLoaded` 事件触发时执行初始化逻辑。
-   检查用户是否已认证。如果未认证，则显示通知并重定向到登录页面。
-   初始化导航栏。
-   调用 `loadUsers()` 加载并显示用户列表。

### 2. 用户列表加载与渲染

-   `loadUsers()`: 从后端 API (`/users/all`) 获取所有用户的分页列表。成功获取数据后，调用 `renderUsers()`。
-   `renderUsers(data)`: 渲染用户列表到表格中，包括用户名、角色和注册时间。处理分页数据，并调用 `renderPagination()` 渲染分页控件。
-   `renderPagination(total, currentPageNum, totalPages)`: 渲染分页控件，包括“上一页”、“下一页”按钮和页码信息。
-   `changePage(page)`: 切换当前页码并重新加载用户列表。此函数被设置为全局函数，以便分页按钮可以直接调用。

### 3. 消息通知

-   `showSuccess(message)`: 使用 `store` 显示成功通知。
-   `showError(message)`: 使用 `store` 显示错误通知。

## 交互流程

-   用户访问用户列表页面，系统首先验证其认证状态。
-   页面加载时，自动从后端获取并显示第一页的用户列表。
-   用户可以通过点击分页按钮在不同页之间导航。

## 维护

该文档应与 `frontend/public/js/friends.js` 文件的任何更改保持同步，以确保其准确性和实用性。
