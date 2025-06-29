# 前端管理员脚本 (`admin.js`)

该文件是前端管理员页面的核心 JavaScript 逻辑，负责处理用户管理、组织管理和服务器管理等功能。它与后端 API 进行交互，并动态更新页面内容。

## 依赖

-   `./auth.js`: `AuthManager` 实例，用于用户认证和权限检查。
-   `./apiService.js`: `apiService` 实例，用于向后端发送 API 请求。
-   `./navbar.js`: `initNavbar` 函数，用于初始化导航栏。
-   `./socket.js`: `socketManager` 实例，用于实时更新（目前已注释掉）。

## 全局变量

-   `currentTab`: 当前选中的标签页（`pending`, `all`, `org-pending`, `orgs`），默认为 `pending`。
-   `currentPage`: 当前页码，默认为 `1`。
-   `limit`: 每页显示的项目数，默认为 `10`。
-   `selectedUserId`: 当前选中的用户 ID，用于用户审核模态框。
-   `currentOrgId`: 当前选中的组织 ID，用于组织成员管理。
-   `currentOrgName`: 当前选中的组织名称，用于组织成员管理。

## 主要功能

### 1. 认证与初始化

-   `ensureAuth()`: 检查用户是否已认证且具有管理员权限。如果不是，则重定向到主页。
-   `DOMContentLoaded` 事件监听器: 页面加载完成后，初始化导航栏，设置标签页点击事件，并加载初始数据。

### 2. 数据加载与渲染

-   `loadData()`: 根据 `currentTab` 加载不同类型的数据（待审核用户、所有用户、待处理组织成员申请、所有组织）。
-   `renderUsers(data)`: 渲染用户列表到表格中，包括用户状态、备注、申请时间等信息，并处理分页和操作按钮。
-   `renderPendingOrgMemberships(responseData)`: 渲染待处理的组织成员申请列表。
-   `loadOrganizations()`: 加载所有组织列表。
-   `renderOrganizations(organizations)`: 渲染组织列表，并添加创建新组织的按钮和组织点击事件。
-   `renderOrganizationMembers(members, containerDiv, orgId, orgName)`: 渲染特定组织的成员列表，包括成员角色和修改角色下拉框。

### 3. 用户审核模态框

-   `showReviewModal(userId)`: 显示用户审核模态框，并填充用户相关信息。
-   `closeModal()`: 关闭用户审核模态框。
-   `handleReview(status)`: 处理用户审核操作（批准或拒绝），向后端发送请求并刷新数据。

### 4. 组织成员管理

-   `handleOrgMembershipReview(event)`: 处理组织成员申请的批准或拒绝操作。
-   `openCreateOrgModal()`: 打开创建新组织模态框。
-   `closeCreateOrgModal()`: 关闭创建新组织模态框。
-   表单提交事件监听器: 处理创建新组织的表单提交，向后端发送请求并刷新组织列表。
-   `handleOrganizationClick(orgId, orgName)`: 处理组织点击事件，加载并显示该组织的成员列表。

### 5. 分页与通用工具

-   `renderPagination(total, currentPage, totalPages)`: 渲染分页控件。
-   `changePage(page)`: 更改当前页码并重新加载数据。
-   `showError(message, type)`: 显示错误或成功消息横幅。
-   `getStatusBadge(status)`: 根据用户状态返回相应的徽章 HTML。
-   `getActionButtons(user)`: 返回用户操作按钮 HTML。

## 交互流程

-   用户点击不同的标签页（如“待审核用户”、“所有用户”、“待处理组织申请”、“组织”），`loadData` 函数会根据选中的标签页加载相应的数据。
-   对于用户列表，管理员可以点击“审核”按钮，弹出模态框进行用户状态的批准或拒绝。
-   对于组织列表，管理员可以点击组织项查看其成员，并可以修改成员的角色。
-   管理员可以点击“创建新组织”按钮，弹出模态框填写组织信息并提交。

## 维护

该文档应与 `frontend/public/js/admin.js` 文件的任何更改保持同步，以确保其准确性和实用性。
