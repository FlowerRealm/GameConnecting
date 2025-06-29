# Supabase 管理员客户端 (`supabaseAdminClient.js`)

该文件负责初始化并导出 Supabase 客户端的一个特殊实例，该实例使用 `SUPABASE_SERVICE_KEY` 进行认证。这个客户端具有完整的管理员权限，可以绕过行级安全 (RLS) 策略，并执行只有服务角色才能执行的操作（例如，直接管理用户、修改受保护的数据）。

## 功能

- **加载环境变量**: 使用 `dotenv` 从 `.env.development`（或 `.env.production`）文件中加载 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY`。
- **创建 Supabase 客户端**: 使用 `createClient` 函数创建一个 Supabase 客户端实例。
- **管理员权限**: 该客户端使用 `SUPABASE_SERVICE_KEY` 进行初始化，这意味着它具有服务角色的权限，可以执行管理操作。
- **无会话持久化**: `auth` 配置中的 `autoRefreshToken: false` 和 `persistSession: false` 确保此客户端不会尝试管理用户会话，因为它用于服务器端管理任务。

## 用法

应用程序中需要执行管理操作的任何服务或模块都应导入此客户端。例如：

```javascript
import { supabaseAdmin } from '../supabaseAdminClient.js';

async function deleteUser(userId) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    console.error('Error deleting user:', error);
    return false;
  }
  return true;
}
```

## 配置

为了使此客户端正常工作，必须在后端项目的 `.env.development` 或 `.env.production` 文件中设置以下环境变量：

- `SUPABASE_URL`: 您的 Supabase 项目 URL。
- `SUPABASE_SERVICE_KEY`: 您的 Supabase 项目的服务角色密钥。这是一个高度敏感的密钥，绝不能暴露给客户端。

**重要提示**: `SUPABASE_SERVICE_KEY` 具有完全的数据库访问权限。请务必妥善保管此密钥，并仅在服务器端代码中使用。
