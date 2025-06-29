# 用户 API (`users.js`)

该文件包含与用户特定操作相关的 API 端点，例如更改密码、获取用户组织以及列出用户。

## 依赖

- `express`: 用于创建路由。
- `../middleware/auth.js`: 包含 `authenticateToken` 中间件，用于保护需要用户登录的路由。
- `../supabaseClient.js`: 标准的 Supabase 客户端。
- `../services/userService.js`: 包含处理用户相关业务逻辑的服务函数。

## 路由

---

### 1. 更改当前用户密码

- **Endpoint**: `POST /me/password`
- **描述**: 更改当前登录用户的密码。
- **中间件**: `authenticateToken`
- **请求体**:
  ```json
  {
      "password": "newSecurePassword"
  }
  ```
  - `password` (必需): 新密码，长度至少为6位。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "密码更新成功。"
  }
  ```
- **失败响应**:
    - `400 Bad Request`: 新密码无效。
    - `500 Internal Server Error`: 更新密码时发生服务器内部错误。

---

### 2. 获取当前用户的组织

- **Endpoint**: `GET /me/organizations`
- **描述**: 获取当前登录用户所属的组织列表。
- **中间件**: `authenticateToken`
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": [ ... ] // 用户所属的组织列表
  }
  ```
- **失败响应 (`500 Internal Server Error`)**: 获取用户组织信息失败。

---

### 3. 获取所有活跃用户（分页）

- **Endpoint**: `GET /all`
- **描述**: 获取所有状态为 `active` 的用户的分页列表。
- **中间件**: `authenticateToken`
- **查询参数**:
    - `page` (可选): 页码，默认为 `1`。
    - `limit` (可选): 每页的项目数，默认为 `10`。
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": {
          "users": [],
          "total": 0,
          "page": 1,
          "totalPages": 1,
          "limit": 10
      }
  }
  ```
- **失败响应 (`500 Internal Server Error`)**: 获取用户列表失败。

---

### 4. 获取活跃用户列表（简要）

- **Endpoint**: `GET /list`
- **描述**: 获取所有状态为 `active` 的用户的简要列表（仅含 `id` 和 `username`）。
- **中间件**: `authenticateToken`
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": [
          {
              "id": "uuid",
              "username": "activeuser"
          }
      ]
  }
  ```
- **失败响应 (`500 Internal Server Error`)**: 获取用户列表时发生服务器内部错误。
