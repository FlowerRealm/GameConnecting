# 前端管理员服务器管理脚本 (`adminServerManagement.js`)

该文件是前端管理员服务器管理页面的核心 JavaScript 逻辑，负责处理服务器（房间）的列表展示、创建、编辑、删除以及成员管理等功能。它与后端 API 进行交互，并动态更新页面内容。

## 依赖

-   `./auth.js`: `AuthManager` 实例，用于用户认证和权限检查。
-   `./navbar.js`: `initNavbar` 函数，用于初始化导航栏。
-   `./apiService.js`: `apiService` 实例，用于向后端发送 API 请求。
-   `./store.js`: `store` 实例，用于显示通知。

## 全局变量

-   `currentPage`: 当前页码，默认为 `1`。
-   `itemsPerPage`: 每页显示的项目数，默认为 `10`。
-   `totalItems`: 服务器总数。
-   `totalPages`: 总页数。
-   `currentManagingServerId`: 当前正在管理成员的服务器 ID。

## 主要功能

### 1. 认证与初始化

-   页面加载时，检查用户是否已认证且具有管理员权限。如果不是，则重定向到登录页或主页。
-   初始化导航栏。
-   调用 `loadAndDisplayServers()` 加载并显示服务器列表。

### 2. 服务器列表管理

-   `loadAndDisplayServers(page)`: 从后端 API (`/api/admin/servers`) 获取服务器列表，并处理分页。成功获取数据后，调用 `renderServerList` 和 `renderPaginationControls`。
-   `renderServerList(servers)`: 渲染服务器列表到表格中，包括服务器 ID、名称、类型、创建者、成员数、创建时间、最后活动时间，并为每个服务器添加“编辑”、“删除”和“成员”操作按钮。
-   `renderPaginationControls()`: 渲染分页控件，允许管理员在不同页面之间导航。

### 3. 服务器创建与编辑模态框

-   `openCreateServerModal()`: 打开“创建新服务器”模态框，清空表单并设置标题。
-   `closeServerModal()`: 关闭服务器创建/编辑模态框。
-   `handleEditServer(server)`: 打开“编辑服务器”模态框，并用现有服务器数据填充表单。
-   表单提交事件监听器: 处理服务器创建或编辑的表单提交。根据 `serverIdInput` 的值判断是创建 (`POST /api/admin/servers`) 还是编辑 (`PUT /api/admin/servers/:serverId`) 操作。成功后显示通知并刷新列表。

### 4. 服务器删除

-   `handleDeleteServer(serverId, serverName)`: 处理服务器删除操作。在确认后，向后端 API (`DELETE /api/admin/servers/:serverId`) 发送请求。成功后显示通知并刷新列表。

### 5. 成员管理模态框

-   `openManageMembersModal(serverId, serverName)`: 打开“管理成员”模态框，显示服务器名称，并从后端 API (`/api/admin/servers/:serverId/members`) 获取成员列表。成功后调用 `renderMemberList`。
-   `renderMemberList(members, serverId)`: 渲染成员列表到模态框中的表格，包括用户 ID、用户名、房间角色、加入时间、用户状态，并为每个成员添加“踢出”操作按钮。
-   `handleKickMember(serverId, userId, username)`: 处理踢出成员操作。在确认后，向后端 API (`DELETE /api/admin/servers/:serverId/members/:userId`) 发送请求。成功后显示通知并刷新模态框中的成员列表和主服务器列表。

## 交互流程

-   管理员访问服务器管理页面，页面加载时自动显示服务器列表。
-   管理员可以点击“创建新服务器”按钮，填写表单创建新服务器。
-   管理员可以点击服务器列表中的“编辑”按钮修改服务器信息。
-   管理员可以点击“删除”按钮删除服务器。
-   管理员可以点击“成员”按钮查看服务器成员列表，并可以踢出成员。
-   分页控件允许管理员浏览不同页的服务器列表。

## 维护

该文档应与 `frontend/public/js/adminServerManagement.js` 文件的任何更改保持同步，以确保其准确性和实用性。
