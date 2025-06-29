# 添加密码重置表 (`1750425685600_add_password_reset_table.js`)

该迁移文件用于在数据库中添加 `password_reset_requests` 表，并创建相关的索引、触发器和辅助函数，以支持密码重置功能。

## `up` 函数

`up` 函数负责执行以下操作：

1.  **创建 `password_reset_requests` 表**:
    -   `id`: UUID 类型，主键，非空。
    -   `user_id`: UUID 类型，非空，引用 `user_profiles` 表的 `id`，并设置级联删除。
    -   `reset_code_hash`: TEXT 类型，非空，存储重置码的哈希值。
    -   `verification_token`: TEXT 类型，用于验证重置流程的令牌。
    -   `expires_at`: TIMESTAMPTZ 类型，非空，表示重置请求的过期时间。
    -   `used`: BOOLEAN 类型，非空，默认为 `false`，表示重置码是否已被使用。
    -   `created_at`: TIMESTAMPTZ 类型，非空，默认为当前时间戳。
    -   `updated_at`: TIMESTAMPTZ 类型，非空，默认为当前时间戳。

2.  **添加索引**:
    -   在 `user_id` 列上创建索引，以优化按用户 ID 查找重置请求的性能。
    -   在 `verification_token` 列上创建索引，以优化按验证令牌查找重置请求的性能。

3.  **创建 `set_timestamp` 触发器**: 为 `password_reset_requests` 表创建一个 `BEFORE UPDATE` 触发器，该触发器会在每次更新行时自动将 `updated_at` 列设置为当前时间。

4.  **创建 `create_password_reset_table` RPC 函数**:
    -   创建一个名为 `create_password_reset_table` 的 PostgreSQL 函数。
    -   该函数检查 `password_reset_requests` 表是否存在。如果不存在，它会创建该表，并为其添加 `user_id` 和 `verification_token` 索引，以及 `set_timestamp` 触发器。
    -   这个函数允许在应用程序运行时按需创建表，即使迁移尚未执行。

## `down` 函数

`down` 函数负责回滚 `up` 函数所做的更改：

-   **删除 `create_password_reset_table` 函数**: 删除之前创建的 RPC 函数。
-   **删除 `password_reset_requests` 表**: 删除 `password_reset_requests` 表。由于级联删除，与该表相关的索引和触发器也将被删除。
