# 房间 API (`rooms.js`)

该文件包含用于管理房间（也称为服务器）的 API 端点。它处理房间的创建、列表、加入、离开、成员获取和删除。

## 依赖

- `express`: 用于创建路由。
- `../middleware/auth.js`: 包含 `authenticateToken` 中间件，用于保护需要用户登录的路由。
- `../services/roomService.js`: 包含处理房间相关业务逻辑的服务函数。

## 路由

---

### 1. 创建新房间

- **Endpoint**: `POST /create`
- **描述**: 创建一个新房间。
- **中间件**: `authenticateToken`
- **请求体**:
  ```json
  {
      "name": "My New Room",
      "description": "A place to chat.",
      "room_type": "public"
  }
  ```
  - `name` (必需): 房间名称。
  - `description` (可选): 房间描述。
  - `room_type` (可选): 房间类型，`public` 或 `private`，默认为 `public`。
- **成功响应 (`201 Created`)**:
  ```json
  {
      "success": true,
      "message": "Room created successfully.",
      "data": { ... } // 新创建的房间对象
  }
  ```
- **失败响应**:
    - `400 Bad Request`: 缺少房间名称或房间类型无效。
    - `500 Internal Server Error`: 创建房间失败。

---

### 2. 获取公开房间列表

- **Endpoint**: `GET /list`
- **描述**: 获取所有公开房间的列表。
- **中间件**: 无
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": [ ... ] // 公开房间列表
  }
  ```
- **失败响应 (`500 Internal Server Error`)**: 获取列表失败。

---

### 3. 加入房间

- **Endpoint**: `POST /join/:roomId`
- **描述**: 将当前用户加入指定房间。
- **中间件**: `authenticateToken`
- **路径参数**:
    - `roomId`: 要加入的房间的 ID。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "Successfully joined room.",
      "data": { ... } // 相关的加入信息
  }
  ```
- **失败响应 (`400 Bad Request` / `404 Not Found` / `409 Conflict`)**: 加入失败（例如，房间不存在或用户已是成员）。

---

### 4. 离开房间

- **Endpoint**: `POST /leave/:roomId`
- **描述**: 将当前用户从指定房间中移除。
- **中间件**: `authenticateToken`
- **路径参数**:
    - `roomId`: 要离开的房间的 ID。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "Successfully left the room."
  }
  ```
- **失败响应 (`400 Bad Request` / `404 Not Found`)**: 离开失败。

---

### 5. 获取房间成员

- **Endpoint**: `GET /:roomId/members`
- **描述**: 获取指定房间的成员列表。
- **中间件**: `authenticateToken`
- **路径参数**:
    - `roomId`: 房间的 ID。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": [ ... ] // 成员列表
  }
  ```
- **失败响应 (`404 Not Found` / `500 Internal Server Error`)**: 获取成员失败。

---

### 6. 删除房间

- **Endpoint**: `DELETE /:roomId`
- **描述**: 删除一个房间。只有房间的创建者才能执行此操作。
- **中间件**: `authenticateToken`
- **路径参数**:
    - `roomId`: 要删除的房间的 ID。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "Room deleted successfully."
  }
  ```
- **失败响应 (`403 Forbidden` / `404 Not Found`)**: 删除失败（例如，用户不是创建者或房间不存在）。
