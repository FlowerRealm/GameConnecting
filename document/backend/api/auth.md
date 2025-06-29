# 认证 API (`auth.js`)

该文件处理所有与用户认证相关的路由，包括注册、登录、注销、刷新令牌和密码重置。

## 依赖

- `express`: 用于创建路由。
- `../middleware/auth.js`: 包含 `authenticateToken` 中间件，用于保护需要用户登录的路由。
- `../services/authService.js`: 包含处理认证相关业务逻辑的服务函数。

## 路由

---

### 1. 用户注册

- **Endpoint**: `POST /register`
- **描述**: 注册一个新用户。
- **请求体**:
  ```json
  {
      "username": "testuser",
      "password": "password123",
      "note": "Optional note",
      "requestedOrganizationIds": ["org-uuid-1"]
  }
  ```
  - `username` (必需): 用户名。
  - `password` (必需): 密码，最少6位。
  - `note` (可选): 备注。
  - `requestedOrganizationIds` (可选): 请求加入的组织ID数组。
- **成功响应 (`201 Created`)**:
  ```json
  {
      "success": true,
      "message": "注册成功，请等待管理员审核。如项目启用邮件确认，请先确认邮箱。",
      "data": { ... } // 注册成功返回的数据
  }
  ```
- **失败响应**:
    - `400 Bad Request`: 缺少用户名或密码，或密码长度不足。
    - `500 Internal Server Error`: 注册失败（例如，用户已存在）。

---

### 2. 用户登录

- **Endpoint**: `POST /login`
- **描述**: 用户使用用户名和密码登录。
- **请求体**:
  ```json
  {
      "username": "testuser",
      "password": "password123"
  }
  ```
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "登录成功",
      "data": { 
          "access_token": "...", 
          "refresh_token": "...",
          ...
      }
  }
  ```
- **失败响应**:
    - `400 Bad Request`: 缺少用户名或密码。
    - `401 Unauthorized` / `403 Forbidden`: 凭据无效或账户状态异常。

---

### 3. 刷新认证令牌

- **Endpoint**: `POST /refresh`
- **描述**: 使用刷新令牌获取新的访问令牌。
- **请求体**:
  ```json
  {
      "refresh_token": "your-refresh-token"
  }
  ```
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "Token 刷新成功",
      "data": { ... } // 新的令牌信息
  }
  ```
- **失败响应 (`401 Unauthorized`)**: 刷新令牌无效或过期。

---

### 4. 用户注销

- **Endpoint**: `POST /logout`
- **描述**: 用户注销，使当前会话失效。
- **中间件**: `authenticateToken`
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "已成功注销"
  }
  ```
- **失败响应 (`500 Internal Server Error`)**: 注销失败。

---

### 5. 请求密码重置

- **Endpoint**: `POST /password/request-reset`
- **描述**: 为指定用户请求密码重置码。
- **请求体**:
  ```json
  {
      "username": "testuser"
  }
  ```
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "密码重置请求已处理，请检查您的重置代码",
      "data": { "resetRequestId": "..." }
  }
  ```
- **失败响应 (`404 Not Found` / `500 Internal Server Error`)**: 用户不存在或请求失败。

---

### 6. 验证密码重置令牌

- **Endpoint**: `POST /password/verify-reset-token`
- **描述**: 验证密码重置请求ID和重置码。
- **请求体**:
  ```json
  {
      "resetRequestId": "request-id",
      "resetCode": "123456"
  }
  ```
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "重置代码验证成功",
      "data": { "verificationToken": "..." }
  }
  ```
- **失败响应 (`400 Bad Request` / `401 Unauthorized`)**: 验证失败。

---

### 7. 重置密码

- **Endpoint**: `POST /password/reset`
- **描述**: 使用验证令牌设置新密码。
- **请求体**:
  ```json
  {
      "verificationToken": "verification-token",
      "newPassword": "newSecurePassword"
  }
  ```
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "message": "密码已成功重置，请使用新密码登录"
  }
  ```
- **失败响应 (`400 Bad Request` / `401 Unauthorized`)**: 重置失败。
