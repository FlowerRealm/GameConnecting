# 用户服务 (`userService.js`)

该文件提供了用于处理用户特定操作的业务逻辑，例如更新密码和获取用户的组织成员资格。

## 依赖

- `../supabaseAdminClient.js`: 用于与 Supabase 后端进行交互的具有管理员权限的客户端。

## 函数

---

### 1. `updateUserPassword(userId, newPassword)`

- **描述**: 使用用户的 ID 更新其密码。此操作需要管理员权限，因此使用了 `supabaseAdmin` 客户端。
- **参数**:
    - `userId`: 用户的唯一标识符 (UUID)。
    - `newPassword`: 用户的新密码，长度至少为6个字符。
- **返回**: 一个表示操作是否成功的结果对象。如果成功，则返回成功消息；如果失败，则返回包含错误消息和状态码的对象。

---

### 2. `getUserOrganizationMemberships(userId)`

- **描述**: 获取指定用户的所有组织成员资格。它会查询 `user_organization_memberships` 表，并连接 `organizations` 表以获取组织的详细信息。
- **参数**:
    - `userId`: 用户的唯一标识符 (UUID)。
- **返回**: 一个 Promise，解析为一个包含用户组织成员资格信息的数组。每个对象包括组织ID、名称、描述以及用户在该组织中的角色和状态。如果发生错误，则会抛出该错误。

---

### 3. `getActiveUsersList()`

- **描述**: 获取所有状态为 `active` 的用户的列表。此函数仅返回每个用户的 `id` 和 `username`，并按用户名升序排序。
- **返回**: 一个结果对象。如果成功，`data` 属性将包含一个用户对象数组。如果失败，将返回一个包含错误消息和状态码的对象。
