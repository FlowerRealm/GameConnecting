# 前端服务器列表脚本 (`servers.js`)

该文件是前端服务器（房间）列表页面的核心 JavaScript 逻辑，负责展示、管理和交互服务器信息。它处理服务器的创建、编辑、删除、加入以及成员和加入请求的管理。

## 依赖

-   `./auth.js`: `AuthManager` 实例，用于用户认证和权限检查。
-   `./apiService.js`: `apiService` 实例，用于向后端发送 API 请求。
-   `./config.js`: `config` 对象，用于获取前端配置。
-   `./navbar.js`: `initNavbar` 函数，用于初始化导航栏。
-   `./store.js`: `store` 实例，用于显示通知。

## 全局变量

-   `editingServerId`: 当前正在编辑的服务器 ID，如果为 `null` 则表示正在创建新服务器。
-   `currentModalServerInfo`: 一个对象，存储当前模态框中显示的服务器信息，包括 `id`、`isOwner` (当前用户是否为所有者)、`isSiteAdmin` (当前用户是否为站点管理员) 和 `members` (成员列表)。

## 主要功能

### 1. 认证与初始化

-   页面加载时，检查用户是否已认证。如果未认证，则重定向到登录页面。
-   初始化导航栏 (`initNavbar()`)。
-   为服务器表单 (`serverForm`) 绑定提交事件。
-   为服务器详情模态框 (`serverDetailModal`) 绑定点击外部关闭事件。
-   为侧边栏标签页 (`sidebar-tabs`) 绑定切换事件。
-   调用 `loadServers()` 加载并显示服务器列表。

### 2. 服务器列表加载与渲染

-   `loadServers()`: 从后端 API (`/api/rooms/list`) 获取公共服务器列表。成功获取数据后，调用 `renderServers()`。
-   `renderServers(servers)`: 渲染服务器列表到表格中，包括服务器名称、描述、成员数，并为每个服务器添加“加入”和“详情”操作按钮。如果列表为空，则显示“暂无可用服务器”并提供“创建服务器”按钮。

### 3. 服务器创建与编辑

-   `showAddServerModal()`: 显示“创建服务器”模态框，清空表单。
-   `editServer(serverId)`: 显示“编辑服务器”模态框，并用指定服务器的数据填充表单。
-   `handleServerSubmit(event)`: 处理服务器创建或编辑的表单提交。根据 `editingServerId` 判断是创建 (`POST /api/rooms/create`) 还是编辑 (`PUT /api/rooms/:serverId`) 操作。成功后显示通知，关闭模态框，并刷新服务器列表。

### 4. 服务器详情模态框

-   `showServerDetail(serverId)`: 
    -   从后端 API (`/api/rooms/:serverId`) 获取服务器的详细信息。
    -   根据当前用户与服务器的关系（所有者、站点管理员、成员），动态显示“进入服务器”、“加入服务器”、“编辑”、“删除”等按钮。
    -   显示服务器名称和描述。
    -   默认加载成员列表。
-   `closeServerDetailModal()`: 关闭服务器详情模态框。

### 5. 服务器操作

-   `joinServer(serverId)`: 向后端 API (`POST /api/rooms/:serverId/join`) 发送加入服务器请求。成功后根据响应消息进行跳转或显示通知。
-   `deleteServer(serverId)`: 向后端 API (`DELETE /api/rooms/:serverId`) 发送删除服务器请求。成功后显示通知，关闭详情模态框，并刷新服务器列表。

### 6. 成员和加入请求管理

-   `handleTabSwitch(event)`: 处理服务器详情模态框中标签页的切换（成员列表、加入请求）。
-   `loadServerMembers(serverId)`: 从后端 API (`/api/rooms/:serverId/members`) 获取服务器成员列表。
-   `renderServerMembers(members)`: 渲染成员列表到模态框中，并为每个成员提供“踢出”按钮（如果用户有权限）。
-   `loadJoinRequests(serverId)`: (TODO) 加载服务器的加入请求列表。目前显示“功能正在开发中...”的占位符。
-   `renderJoinRequests(requests)`: (TODO) 渲染加入请求列表。
-   `handleApproveRequest(event)`: (TODO) 处理批准加入请求。
-   `handleRejectRequest(event)`: (TODO) 处理拒绝加入请求。
-   `handleKickMember(event)`: 向后端 API (`DELETE /api/admin/servers/:serverId/members/:userId`) 发送踢出成员请求。成功后显示通知并刷新成员列表。

### 7. 辅助函数

-   `showError(message)`: 使用 `store` 显示错误通知。
-   `showSuccess(message)`: 使用 `store` 显示成功通知。

## 交互流程

-   用户访问服务器列表页面，系统首先验证其认证状态。
-   页面加载时，自动显示公共服务器列表。
-   用户可以点击“加入”按钮加入服务器，或点击“详情”按钮查看服务器详细信息。
-   在服务器详情模态框中，用户可以切换查看成员列表或加入请求（如果已实现）。
-   管理员或服务器所有者可以在详情模态框中编辑、删除服务器，或踢出成员。
-   用户可以点击“创建服务器”按钮创建新服务器。

## 维护

该文档应与 `frontend/public/js/servers.js` 文件的任何更改保持同步，以确保其准确性和实用性。
