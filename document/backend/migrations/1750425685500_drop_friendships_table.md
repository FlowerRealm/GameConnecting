# 删除好友关系表 (`1750425685500_drop_friendships_table.js`)

该迁移文件用于从数据库中删除 `friendships` 表。这通常发生在决定不再需要该功能或将其替换为其他机制时。

## `up` 函数

`up` 函数负责执行删除操作：

-   **删除 `public.friendships` 表**: 使用 `DROP TABLE IF EXISTS` 语句删除 `friendships` 表。与该表关联的任何触发器（例如 `set_timestamp`）也将自动被删除。

## `down` 函数

`down` 函数负责回滚 `up` 函数所做的更改，即重新创建 `friendships` 表：

-   **重新创建 `public.friendships` 表**: 重新创建 `friendships` 表，包括其所有列、约束和外键引用，与 `initial-schema.js` 中定义的结构相同。
-   **重新创建 `set_timestamp` 触发器**: 为重新创建的 `friendships` 表重新应用 `set_timestamp` 触发器，以确保 `updated_at` 字段的自动更新功能恢复。
