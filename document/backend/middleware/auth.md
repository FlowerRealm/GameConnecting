# 认证中间件 (`auth.js`)

该文件提供用于 Express.js 应用程序的中间件函数，主要用于处理用户认证和授权。

## 函数

---

### 1. `authenticateToken(req, res, next)`

- **描述**: 这是一个核心的认证中间件。它从请求头中提取 JWT，并使用 `supabase.auth.getUser(token)` 来验证其有效性。如果令牌有效，它会从 `user_profiles` 表中获取用户的详细信息（如角色和状态），并检查用户是否为 `active` 状态。最后，它会将一个包含用户信息的 `user` 对象附加到请求对象上，以便后续的路由处理器可以使用。
- **流程**:
    1. 从 `Authorization` 请求头中获取 Bearer Token。
    2. 如果没有令牌，返回 `401 Unauthorized`。
    3. 使用 Supabase 验证令牌。
    4. 如果令牌无效或已过期，返回 `403 Forbidden`。
    5. 从 `user_profiles` 表中获取用户的个人资料。
    6. 如果找不到个人资料或用户状态不是 `active`，返回 `403 Forbidden`。
    7. 将 `user` 对象（包含 `id`, `email`, `role`, `status`, `username` 等）附加到 `req` 对象上。
    8. 调用 `next()` 将控制权传递给下一个中间件。
- **用法**:
  ```javascript
  import { authenticateToken } from './middleware/auth.js';
  router.get('/protected-route', authenticateToken, (req, res) => {
    // req.user is now available
    res.json({ message: `Welcome ${req.user.username}` });
  });
  ```

---

### 2. `isAdmin(req, res, next)`

- **描述**: 这是一个授权中间件，用于检查经过身份验证的用户是否具有 `admin` 角色。它依赖于 `authenticateToken` 中间件首先运行，因为它需要 `req.user` 对象。
- **前置条件**: `authenticateToken` 必须在此中间件之前执行。
- **流程**:
    1. 检查 `req.user` 是否存在以及 `req.user.role` 是否为 `'admin'`。
    2. 如果不满足条件，返回 `403 Forbidden`。
    3. 如果满足条件，调用 `next()`。
- **用法**:
  ```javascript
  import { authenticateToken, isAdmin } from './middleware/auth.js';
  router.get('/admin-only', authenticateToken, isAdmin, (req, res) => {
    res.json({ message: 'Welcome, Admin!' });
  });
  ```

---

### 3. `isApproved(req, res, next)`

- **描述**: 这是一个授权中间件，用于检查用户的状态是否为 `active`。在大多数情况下，这个中间件是多余的，因为 `authenticateToken` 已经执行了此检查。但是，如果某些路由允许非 `active` 用户在通过身份验证后执行特定操作，则它可能很有用。
- **前置条件**: `authenticateToken` 必须在此中间件之前执行。
- **流程**:
    1. 检查 `req.user` 是否存在以及 `req.user.status` 是否为 `'active'`。
    2. 如果不满足条件，返回 `403 Forbidden`。
    3. 如果满足条件，调用 `next()`。
