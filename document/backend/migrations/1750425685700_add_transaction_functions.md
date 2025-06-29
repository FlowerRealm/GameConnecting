# 添加事务函数 (`1750425685700_add_transaction_functions.js`)

该迁移文件引入了多个 PostgreSQL 函数和触发器，旨在优化数据库操作的原子性、缓存管理和数据检索效率。

## `up` 函数

`up` 函数负责执行以下操作：

1.  **创建 `create_user_profile_with_memberships` 函数**:
    -   **描述**: 这是一个 PL/pgSQL 函数，用于在一个事务中原子地创建用户资料并处理其组织成员关系。
    -   **参数**:
        -   `p_id` (UUID): 用户 ID。
        -   `p_username` (TEXT): 用户名。
        -   `p_note` (TEXT): 备注。
        -   `p_role` (TEXT): 角色。
        -   `p_status` (TEXT): 状态。
        -   `p_organization_ids` (UUID[]): 请求加入的组织 ID 数组。
    -   **功能**: 首先插入 `user_profiles` 记录，然后遍历 `p_organization_ids` 数组，为每个组织创建 `user_organization_memberships` 记录，状态为 `pending_approval`。

2.  **创建 `invalidate_user_cache` 函数**:
    -   **描述**: 这是一个 PL/pgSQL 触发器函数，用于在 `user_profiles` 表的行被更新时发送一个 PostgreSQL 通知 (`pg_notify`)。
    -   **功能**: 当 `user_profiles` 表中的行被更新时，它会向名为 `user_cache_invalidation` 的通道发送一个通知，通知内容是更新行的 `id`。这允许外部服务（如缓存层）监听此通知并使相关缓存失效。

3.  **创建 `invalidate_cache_trigger` 触发器**:
    -   **描述**: 在 `user_profiles` 表上创建一个 `AFTER UPDATE` 触发器，该触发器在每次更新操作后执行 `invalidate_user_cache` 函数。

4.  **创建 `get_users_with_details` 函数**:
    -   **描述**: 这是一个 PL/pgSQL 函数，用于批量获取用户详细信息，包括他们的组织成员资格。
    -   **参数**:
        -   `p_user_ids` (UUID[]): 用户 ID 数组。
    -   **返回**: 一个 JSON 对象，其中包含每个用户的详细信息，包括其 ID、用户名、角色、状态、创建时间以及他们所属的组织列表（包括组织 ID、名称、用户在组织中的角色和状态）。

## `down` 函数

`down` 函数负责回滚 `up` 函数所做的更改，即删除所有创建的函数和触发器：

-   **移除 `invalidate_cache_trigger` 触发器**。
-   **移除 `invalidate_user_cache` 函数**。
-   **移除 `create_user_profile_with_memberships` 函数**。
-   **移除 `get_users_with_details` 函数**。
