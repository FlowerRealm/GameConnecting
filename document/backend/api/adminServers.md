# 管理员服务器 API (`adminServers.js`)

该文件包含所有与管理员权限相关的服务器（房间）管理 API 端点。

## 依赖

- `express`: 用于创建路由。
- `../middleware/auth.js`: 包含 `authenticateToken` 和 `isAdmin` 中间件。
- `../services/roomService.js`: 包含处理房间/服务器相关业务逻辑的服务函数。

## 路由

---

### 1. 获取所有服务器列表（管理员视图）

- **Endpoint**: `GET /`
- **描述**: 获取所有服务器的分页列表，专为管理员视图设计。
- **中间件**: `authenticateToken`, `isAdmin`
- **查询参数**:
    - `page` (可选): 页码，默认为 `1`。
    - `limit` (可选): 每页的项目数，默认为 `10`。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": { 
          "servers": [], 
          "total": 0, 
          "page": 1, 
          "totalPages": 1, 
          "limit": 10 
      },
      "message": "Servers retrieved successfully."
  }
  ```
- **失败响应 (`500 Internal Server Error`)**:
  ```json
  {
      "success": false,
      "message": "An unexpected error occurred on the server."
  }
  ```

---

### 2. 管理员创建服务器

- **Endpoint**: `POST /`
- **描述**: 管理员创建一个新的服务器（房间）。
- **中间件**: `authenticateToken`, `isAdmin`
- **请求体**:
  ```json
  {
      "name": "Admin's New Server",
      "description": "A server created by an admin.",
      "room_type": "public"
  }
  ```
  - `name` (必需): 服务器名称。
  - `description` (可选): 服务器描述。
  - `room_type` (可选): 房间类型，`public` 或 `private`，默认为 `public`。
- **成功响应 (`201 Created`)**:
  ```json
  {
      "success": true,
      "data": { ... }, // 新创建的服务器对象
      "message": "Server created successfully by admin."
  }
  ```
- **失败响应**:
    - `400 Bad Request`: 名称或房间类型无效。
    - `500 Internal Server Error`: 服务器创建失败。

---

### 3. 管理员更新服务器

- **Endpoint**: `PUT /:serverId`
- **描述**: 管理员更新现有服务器的信息。
- **中间件**: `authenticateToken`, `isAdmin`
- **路径参数**:
    - `serverId`: 要更新的服务器的 ID。
- **请求体**: 包含要更新的字段，例如 `name`, `description`。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": { ... }, // 更新后的服务器对象
      "message": "Server updated successfully by admin."
  }
  ```
- **失败响应**:
    - `400 Bad Request`: 请求体无效。
    - `404 Not Found` / `500 Internal Server Error`: 更新失败。

---

### 4. 管理员删除服务器

- **Endpoint**: `DELETE /:serverId`
- **描述**: 管理员删除一个服务器。
- **中间件**: `authenticateToken`, `isAdmin`
- **路径参数**:
    - `serverId`: 要删除的服务器的 ID。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "Server deleted successfully by admin."
  }
  ```
- **失败响应 (`404 Not Found` / `500 Internal Server Error`)**: 删除失败。

---

### 5. 获取服务器成员列表（管理员视图）

- **Endpoint**: `GET /:serverId/members`
- **描述**: 获取特定服务器的成员列表。
- **中间件**: `authenticateToken`, `isAdmin`
- **路径参数**:
    - `serverId`: 服务器的 ID。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": [ ... ] // 成员列表
  }
  ```
- **失败响应 (`404 Not Found` / `500 Internal Server Error`)**: 获取成员失败。

---

### 6. 管理员踢出服务器成员

- **Endpoint**: `DELETE /:serverId/members/:userId`
- **描述**: 管理员从服务器中踢出一个成员。
- **中间件**: `authenticateToken`, `isAdmin`
- **路径参数**:
    - `serverId`: 服务器的 ID。
    - `userId`: 要踢出的用户的 ID。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "Member kicked successfully by admin."
  }
  ```
- **失败响应 (`404 Not Found` / `500 Internal Server Error`)**: 踢出成员失败。
