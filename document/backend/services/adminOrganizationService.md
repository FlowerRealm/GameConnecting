# 管理员组织服务 (`adminOrganizationService.js`)

该文件提供了一系列函数，用于处理与组织相关的管理任务。所有函数都使用 `supabaseAdmin` 客户端，以确保具有足够的权限来执行这些操作。

## 函数

---

### 1. `listAllOrganizations(queryParams)`

- **描述**: 获取所有组织的分页列表。
- **参数**:
    - `queryParams` (可选): 包含 `page` 和 `limit` 的对象，用于分页。
- **返回**: 一个包含组织列表、总数和分页信息的结果对象。

---

### 2. `getOrganizationById(orgId)`

- **描述**: 根据 ID 获取单个组织的详细信息。
- **参数**:
    - `orgId`: 组织的唯一标识符 (UUID)。
- **返回**: 一个包含组织数据的结果对象，如果找不到则返回错误。

---

### 3. `createOrganization(orgData, creatorId)`

- **描述**: 创建一个新组织，并将创建者自动添加为该组织的管理员。
- **参数**:
    - `orgData`: 包含新组织信息的对象，例如 `name`, `description`。
    - `creatorId`: 创建组织的用户的 ID。
- **返回**: 一个包含新创建的组织数据的结果对象。

---

### 4. `updateOrganization(orgId, updateData)`

- **描述**: 更新现有组织的详细信息。
- **参数**:
    - `orgId`: 要更新的组织的 ID。
    - `updateData`: 包含要更新的字段的对象。
- **返回**: 一个包含更新后的组织数据的结果对象。

---

### 5. `deleteOrganization(orgId)`

- **描述**: 删除一个组织。
- **参数**:
    - `orgId`: 要删除的组织的 ID。
- **返回**: 一个表示操作成功的消息对象。

---

### 6. `listOrganizationMembers(orgId, queryParams)`

- **描述**: 获取特定组织的所有成员的分页列表。
- **参数**:
    - `orgId`: 组织的 ID。
    - `queryParams` (可选): 用于分页的参数。
- **返回**: 一个包含成员列表、总数和分页信息的结果对象。

---

### 7. `addOrganizationMember(orgId, userId, role_in_org)`

- **描述**: 将一个用户作为“已批准”成员添加到组织中。
- **参数**:
    - `orgId`: 组织的 ID。
    - `userId`: 要添加的用户的 ID。
    - `role_in_org`: 用户在组织中的角色。
- **返回**: 一个包含新成员关系数据的结果对象。

---

### 8. `updateOrganizationMember(orgId, userId, memberData)`

- **描述**: 更新用户在组织中的角色或状态。
- **参数**:
    - `orgId`: 组织的 ID。
    - `userId`: 用户的 ID。
    - `memberData`: 包含要更新的 `role_in_org` 或 `status_in_org` 的对象。
- **返回**: 一个包含更新后的成员关系数据的结果对象。

---

### 9. `removeOrganizationMember(orgId, userId)`

- **描述**: 从组织中移除一个用户。
- **参数**:
    - `orgId`: 组织的 ID。
    - `userId`: 要移除的用户的 ID。
- **返回**: 一个表示操作成功的消息对象。

---

### 10. `listPublicOrganizations()`

- **描述**: 获取所有公开可列出的组织列表。
- **返回**: 一个包含公开组织列表的结果对象。

---

### 11. `listPendingMemberships(queryParams)`

- **描述**: 获取所有待批准的组织成员资格请求的分页列表。
- **参数**:
    - `queryParams` (可选): 用于分页的参数。
- **返回**: 一个包含待处理请求列表、总数和分页信息的结果对象。
