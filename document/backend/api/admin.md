# 管理员 API (`admin.js`)

该文件包含所有与管理员权限相关的 API 端点，用于管理用户、服务器和其他核心资源。

## 依赖

- `express`: 用于创建路由。
- `../middleware/auth.js`: 包含 `authenticateToken` 和 `isAdmin` 中间件，用于验证用户身份和管理员权限。
- `../supabaseClient.js`: 标准的 Supabase 客户端。
- `../supabaseAdminClient.js`: 具有 `SERVICE_ROLE_KEY` 的 Supabase 管理员客户端，用于执行特权操作。
- `../socket/index.js`: 用于获取 Socket.IO 实例以进行实时通信。

## 路由

---

### 1. 获取用户列表

- **Endpoint**: `GET /users`
- **描述**: 获取所有用户的分页列表。
- **中间件**: `authenticateToken`, `isAdmin`
- **查询参数**:
    - `page` (可选): 页码，默认为 `1`。
    - `limit` (可选): 每页的项目数，默认为 `10`。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": {
          "users": [
              {
                  "id": "uuid",
                  "username": "string",
                  "note": "string",
                  "role": "user",
                  "status": "active",
                  "created_at": "timestamp",
                  "admin_note": "string",
                  "approved_at": "timestamp",
                  "approved_by": "uuid",
                  "approvedByUsername": "string"
              }
          ],
          "total": 1,
          "page": 1,
          "totalPages": 1,
          "limit": 10
      }
  }
  ```
- **失败响应 (`500 Internal Server Error`)**:
  ```json
  {
      "success": false,
      "message": "获取用户列表失败",
      "error": "error message"
  }
  ```

---

### 2. 更新用户状态

- **Endpoint**: `PUT /users/:id/status`
- **描述**: 更新指定用户的状态。
- **中间件**: `authenticateToken`, `isAdmin`
- **路径参数**:
    - `id`: 要更新的用户的 ID。
- **请求体**:
  ```json
  {
      "status": "active"
  }
  ```
  - `status` (必需): 新状态。有效值为 `active`, `pending`, `suspended`, `banned`。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "用户状态更新成功",
      "data": { ... }
  }
  ```
- **失败响应**:
    - `400 Bad Request`: `状态不能为空`
    - `404 Not Found`: `用户不存在`
    - `500 Internal Server Error`: `更新用户状态失败`

---

### 3. 更新用户角色

- **Endpoint**: `PUT /users/:id/role`
- **描述**: 更新指定用户的角色。
- **中间件**: `authenticateToken`, `isAdmin`
- **路径参数**:
    - `id`: 要更新的用户的 ID。
- **请求体**:
  ```json
  {
      "role": "admin"
  }
  ```
  - `role` (必需): 新角色。有效值为 `user`, `moderator`, `admin`。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "用户角色更新成功",
      "data": { ... }
  }
  ```
- **失败响应**:
    - `400 Bad Request`: `角色不能为空`
    - `404 Not Found`: `用户不存在`
    - `500 Internal Server Error`: `更新用户角色失败`

---

### 4. 删除用户

- **Endpoint**: `DELETE /users/:id`
- **描述**: 从系统中删除一个用户。此操作将从 Supabase Auth 中删除用户，并由于数据库中的级联删除设置，相关的 `user_profiles` 记录也应被删除。
- **中间件**: `authenticateToken`, `isAdmin`
- **路径参数**:
    - `id`: 要删除的用户的 ID。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "用户已成功删除 (Auth层面)"
  }
  ```
- **失败响应**:
    - `404 Not Found`: `Supabase Auth中用户不存在`
    - `500 Internal Server Error`: `删除用户操作失败，请检查Service Role Key配置或用户保护设置`

---

### 5. 获取服务器列表

- **Endpoint**: `GET /servers`
- **描述**: 获取所有服务器的列表，包括所有者的信息。
- **中间件**: `authenticateToken`, `isAdmin`
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": [
          {
              "id": "uuid",
              "created_at": "timestamp",
              "name": "string",
              "description": "string",
              "created_by": "uuid",
              "owner": {
                  "id": "uuid",
                  "username": "string"
              }
          }
      ]
  }
  ```
- **失败响应 (`500 Internal Server Error`)**:
  ```json
  {
      "success": false,
      "message": "获取服务器列表失败",
      "error": "error message"
  }
  ```

---

### 6. 获取待审核用户列表

- **Endpoint**: `GET /pending-users`
- **描述**: 获取所有状态为 `pending` 的用户列表。
- **中间件**: `authenticateToken`, `isAdmin`
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": [
          {
              "id": "uuid",
              "username": "string",
              "note": "string",
              "status": "pending",
              "created_at": "timestamp"
          }
      ]
  }
  ```
- **失败响应 (`500 Internal Server Error`)**:
  ```json
  {
      "success": false,
      "message": "获取待审核用户列表失败",
      "error": "error message"
  }
  ```

---

### 7. 审核用户注册

- **Endpoint**: `POST /review-user/:id`
- **描述**: 批准或拒绝用户的注册请求。
- **中间件**: `authenticateToken`, `isAdmin`
- **路径参数**:
    - `id`: 要审核的用户的 ID。
- **请求体**:
  ```json
  {
      "status": "active",
      "admin_note": "Approved"
  }
  ```
  - `status` (必需): 新状态。有效值为 `active`, `suspended`, `banned`。
  - `admin_note` (可选): 管理员备注。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "用户审核成功",
      "data": { ... }
  }
  ```
- **失败响应**:
    - `400 Bad Request`: `无效的状态值。请使用 'active', 'suspended', 或 'banned'.`
    - `404 Not Found`: `用户不存在`
    - `500 Internal Server Error`: `审核用户失败`
- **Socket.IO 事件**:
    - 成功审核后，会向 `admin_room` 发送一个 `userStatusUpdated` 事件，通知所有管理员。
