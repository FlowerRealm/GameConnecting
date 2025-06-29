# 管理员组织 API (`adminOrganizations.js`)

该文件负责处理所有与管理员相关的组织管理操作。所有路由都要求用户经过身份验证并具有管理员权限。

## 依赖

- `express`: 用于创建路由。
- `../middleware/auth.js`: 包含 `authenticateToken` 和 `isAdmin` 中间件。
- `../services/adminOrganizationService.js`: 包含处理组织相关业务逻辑的服务函数。

## 全局中间件

所有在此文件中定义的路由都将自动使用 `authenticateToken` 和 `isAdmin` 中间件进行保护，确保只有管理员才能访问。

```javascript
router.use(authenticateToken, isAdmin);
```

## 路由

---

### 1. 获取所有组织列表

- **Endpoint**: `GET /`
- **描述**: 获取所有组织的分页列表。
- **查询参数**: (由 `adminOrganizationService.listAllOrganizations` 处理)
    - `page` (可选): 页码。
    - `limit` (可选): 每页的项目数。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": { ... }, // 分页后的组织数据
      "message": "Organizations listed successfully."
  }
  ```
- **失败响应 (`500 Internal Server Error`)**:
  ```json
  {
      "success": false,
      "message": "Failed to list organizations."
  }
  ```

---

### 2. 获取待处理的成员资格请求

- **Endpoint**: `GET /pending-memberships`
- **描述**: 获取所有状态为 `pending_approval` 的组织成员资格请求。
- **查询参数**: (由 `adminOrganizationService.listPendingMemberships` 处理)
    - `page` (可选): 页码。
    - `limit` (可选): 每页的项目数。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": { ... }, // 待处理请求的分页数据
      "message": "Pending memberships retrieved successfully."
  }
  ```
- **失败响应 (`500 Internal Server Error`)**:
  ```json
  {
      "success": false,
      "message": "Failed to list pending membership requests."
  }
  ```

---

### 3. 获取特定组织的详细信息

- **Endpoint**: `GET /:orgId`
- **描述**: 获取单个组织的详细信息。
- **路径参数**:
    - `orgId`: 组织的唯一标识符。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": { ... }, // 组织详细信息
      "message": "Organization details retrieved successfully."
  }
  ```
- **失败响应 (`404 Not Found`)**:
  ```json
  {
      "success": false,
      "message": "Organization not found."
  }
  ```

---

### 4. 创建新组织

- **Endpoint**: `POST /`
- **描述**: 创建一个新组织。
- **请求体**:
  ```json
  {
      "name": "New Organization Name",
      "description": "Optional description."
  }
  ```
  - `name` (必需): 组织的名称。
- **成功响应 (`201 Created`)**:
  ```json
  {
      "success": true,
      "data": { ... }, // 新创建的组织对象
      "message": "Organization created successfully."
  }
  ```
- **失败响应**:
    - `400 Bad Request`: `Organization name is required.`
    - `500 Internal Server Error`: `Failed to create organization due to an unexpected server error.`

---

### 5. 更新组织详细信息

- **Endpoint**: `PUT /:orgId`
- **描述**: 更新现有组织的详细信息。
- **路径参数**:
    - `orgId`: 组织的唯一标识符。
- **请求体**: 包含要更新的字段，例如 `name` 或 `description`。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": { ... }, // 更新后的组织对象
      "message": "Organization updated successfully."
  }
  ```
- **失败响应 (`404 Not Found`)**:
  ```json
  {
      "success": false,
      "message": "Organization not found or update failed."
  }
  ```

---

### 6. 删除组织

- **Endpoint**: `DELETE /:orgId`
- **描述**: 删除一个组织。
- **路径参数**:
    - `orgId`: 组织的唯一标识符。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "Organization deleted successfully."
  }
  ```
- **失败响应 (`404 Not Found`)**:
  ```json
  {
      "success": false,
      "message": "Organization not found or delete failed."
  }
  ```

---

### 7. 获取组织成员列表

- **Endpoint**: `GET /:orgId/members`
- **描述**: 获取特定组织的所有成员列表。
- **路径参数**:
    - `orgId`: 组织的唯一标识符。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": [ ... ], // 成员列表
      "message": "Organization members listed successfully."
  }
  ```
- **失败响应 (`500 Internal Server Error`)**:
  ```json
  {
      "success": false,
      "message": "Failed to list organization members."
  }
  ```

---

### 8. 向组织添加成员

- **Endpoint**: `POST /:orgId/members`
- **描述**: 将一个用户添加到组织中。
- **路径参数**:
    - `orgId`: 组织的唯一标识符。
- **请求体**:
  ```json
  {
      "userId": "user-uuid",
      "role_in_org": "member"
  }
  ```
  - `userId` (必需): 要添加的用户的 ID。
  - `role_in_org` (必需): 用户在组织中的角色。
- **成功响应 (`201 Created`)**:
  ```json
  {
      "success": true,
      "data": { ... }, // 创建的成员关系记录
      "message": "Member added successfully."
  }
  ```
- **失败响应 (`400 Bad Request`)**:
  ```json
  {
      "success": false,
      "message": "User ID and role are required."
  }
  ```

---

### 9. 更新组织成员

- **Endpoint**: `PUT /:orgId/members/:userId`
- **描述**: 更新用户在组织中的角色或状态。
- **路径参数**:
    - `orgId`: 组织的唯一标识符。
    - `userId`: 用户的唯一标识符。
- **请求体**: 包含 `role_in_org` 或 `status_in_org`。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": { ... }, // 更新后的成员关系记录
      "message": "Member updated successfully."
  }
  ```
- **失败响应 (`400 Bad Request`)**:
  ```json
  {
      "success": false,
      "message": "Either role or status must be provided for update."
  }
  ```

---

### 10. 从组织中移除成员

- **Endpoint**: `DELETE /:orgId/members/:userId`
- **描述**: 从组织中移除一个用户。
- **路径参数**:
    - `orgId`: 组织的唯一标识符。
    - `userId`: 用户的唯一标识符。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "Member removed from organization successfully."
  }
  ```
- **失败响应 (`404 Not Found`)**:
  ```json
  {
      "success": false,
      "message": "Membership not found or removal failed."
  }
  ```
