# 认证服务 (`authService.js`)

该文件提供了处理用户认证、会话管理和密码重置的核心业务逻辑。它与 Supabase Auth 和数据库进行交互，以安全地管理用户凭据和会话。

## 主要功能

- **用户注册**: 创建新的用户账户和关联的用户资料。
- **用户登录**: 验证用户凭据并创建会话。
- **令牌刷新**: 刷新过期的访问令牌。
- **用户注销**: 终止用户会话。
- **密码重置**: 提供一个安全的流程来重置忘记的密码。
- **内存缓存**: 实现了一个简单的内存缓存 (`MemoryCache`) 来减少对数据库的重复查询，特别是对于用户名到ID的映射。

## 函数

---

### 1. `registerUser(password, username, note, requestedOrganizationIds)`

- **描述**: 注册一个新用户。它使用 `supabaseAdmin` 来创建 Auth 用户，然后在本应用数据库的 `user_profiles` 表中创建一个对应的资料记录。如果提供了 `requestedOrganizationIds`，它还会为用户创建待处理的组织成员资格请求。
- **参数**:
    - `password`: 用户密码。
    - `username`: 用户名。
    - `note` (可选): 用户的备注。
    - `requestedOrganizationIds` (可选): 用户希望加入的组织ID数组。
- **返回**: 一个结果对象，成功时包含 `userId`，失败时包含错误信息。

---

### 2. `loginUser(username, password)`

- **描述**: 用户登录。该函数首先通过用户名从 `user_profiles` 表中查找用户，检查其状态，然后使用从 `supabaseAdmin` 获取的占位电子邮件和用户提供的密码通过 `supabase.auth.signInWithPassword` 进行登录。
- **参数**:
    - `username`: 用户名。
    - `password`: 用户密码。
- **返回**: 一个结果对象，成功时包含访问和刷新令牌以及用户详细信息，失败时包含错误信息。

---

### 3. `refreshAuthToken(clientRefreshToken)`

- **描述**: 使用客户端提供的刷新令牌来获取一个新的访问令牌和会话。
- **参数**:
    - `clientRefreshToken`: 用户的刷新令牌。
- **返回**: 一个包含新令牌和用户详细信息的结果对象。

---

### 4. `logoutUser()`

- **描述**: 注销当前用户，使 Supabase 中的会话失效。
- **返回**: 一个表示操作是否成功的结果对象。

---

### 5. `requestPasswordReset(username)`

- **描述**: 启动密码重置流程。它会生成一个6位数的重置码，将其哈希值存储在 `password_reset_requests` 表中，并返回一个重置请求ID。为了安全，即使用户不存在，它也会返回一个伪造的成功响应。
- **参数**:
    - `username`: 请求重置密码的用户名。
- **返回**: 一个包含 `resetRequestId` 的结果对象。

---

### 6. `verifyResetToken(resetRequestId, resetCode)`

- **描述**: 验证用户提供的重置码是否与存储的哈希值匹配。如果匹配，它会生成一个一次性的 `verificationToken` 用于最终的密码重置。
- **参数**:
    - `resetRequestId`: 从 `requestPasswordReset` 获取的请求ID。
    - `resetCode`: 用户收到的6位数重置码。
- **返回**: 一个包含 `verificationToken` 和 `userId` 的结果对象。

---

### 7. `resetPassword(verificationToken, newPassword)`

- **描述**: 使用 `verificationToken` 来最终确定密码重置。它会使用 `supabaseAdmin` 客户端来更新用户的密码。
- **参数**:
    - `verificationToken`: 从 `verifyResetToken` 获取的验证令牌。
    - `newPassword`: 用户的新密码。
- **返回**: 一个表示操作是否成功的结果对象。
