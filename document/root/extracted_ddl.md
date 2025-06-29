# 提取的 DDL 模式 (`extracted_ddl.sql`)

该文件是数据库模式定义语言 (DDL) 的一个提取快照，代表了数据库在某个特定时间点的结构。**请注意，此文件仅用于历史参考目的。**

## 重要提示

-   **模式管理**: 本项目的数据库模式现在由 `node-pg-migrate` 工具主动管理。所有模式更改都应通过 `backend/migrations` 目录中的迁移脚本进行。
-   **请勿手动应用**: **切勿**手动将此文件应用于由迁移工具管理的数据库。这样做可能会导致数据库状态不一致或数据丢失。
-   **历史参考**: 此文件仅用于查看过去某个时间点的数据库结构，例如，用于理解旧的模式设计或进行审计。

## 内容概述

该 SQL 文件包含了以下数据库对象的 `CREATE TABLE` 和 `CREATE FUNCTION` 语句：

-   **函数**: 
    -   `public.trigger_set_timestamp()`: 一个 PostgreSQL 函数，用于在行更新时自动设置 `updated_at` 列为当前时间。

-   **表**: 
    -   `public.user_profiles`: 存储用户资料。
    -   `public.friendships`: 管理用户之间的好友关系。
    -   `public.rooms`: 存储游戏房间或社区的信息。
    -   `public.room_members`: 管理用户在房间内的成员资格和角色。
    -   `public.room_join_requests`: 管理用户加入私人房间的请求。
    -   `public.organizations`: 存储组织或大型社区的信息。
    -   `public.user_organization_memberships`: 管理用户在组织内的成员资格、角色和状态。

每个表都包含 `created_at` 和 `updated_at` 时间戳列，并应用了 `set_timestamp` 触发器以自动更新 `updated_at`。
