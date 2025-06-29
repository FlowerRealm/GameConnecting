# Supabase 表设置脚本 (`setup-supabase-tables.js`)

该脚本用于在 Supabase 数据库中创建和配置应用程序所需的所有表、函数和触发器。它使用 Supabase 服务角色密钥执行这些管理任务，确保具有足够的权限来定义数据库结构。

## 功能

- **环境变量加载**: 从 `.env.development` 文件中加载 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY`。
- **Supabase 客户端初始化**: 使用服务角色密钥初始化 Supabase 客户端，以便执行特权数据库操作。
- **SQL 执行辅助函数**: `executeSQL` 函数用于安全地执行原始 SQL 语句，并处理常见的错误（如表已存在）。
- **表创建**: 创建以下核心表（如果它们尚不存在）：
    - `user_profiles`: 存储用户资料，包括用户名、角色、状态和管理备注。
    - `friendships`: 记录用户之间的好友关系。
    - `rooms`: 存储房间（服务器）信息，包括名称、描述、创建者和类型。
    - `room_members`: 记录房间成员及其角色。
    - `room_join_requests`: 存储用户加入房间的请求。
    - `organizations`: 存储组织信息。
    - `user_organization_memberships`: 记录用户在组织中的成员资格和角色。
- **`updated_at` 触发器**: 创建一个名为 `trigger_set_timestamp` 的 PostgreSQL 函数，并将其应用于所有相关表，以在每次更新行时自动更新 `updated_at` 字段。
- **行级安全 (RLS)**: 脚本中包含 RLS 策略的示例（已注释掉），强调了在生产环境中为敏感数据表启用 RLS 的重要性。

## 用法

此脚本通常在首次设置 Supabase 项目或需要重置/更新数据库结构时运行。它应该在后端项目的根目录下执行。

```bash
node backend/scripts/setup-supabase-tables.js
```

## 环境变量

为了使此脚本正常工作，必须在 `.env.development` 文件中设置以下环境变量：

- `SUPABASE_URL`: 您的 Supabase 项目 URL。
- `SUPABASE_SERVICE_KEY`: 您的 Supabase 项目的服务角色密钥。这是一个高度敏感的密钥，绝不能暴露给客户端。

**重要提示**: 在生产环境中，请确保使用 `.env.production` 文件或适当的环境变量管理系统来提供这些密钥。
