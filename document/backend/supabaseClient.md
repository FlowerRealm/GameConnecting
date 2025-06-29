# Supabase 客户端 (`supabaseClient.js`)

该文件负责初始化并导出 Supabase 客户端的一个实例，该实例使用匿名 (Anon) 密钥进行认证。这个客户端主要用于执行公共数据访问操作，或者在不需要高级权限的情况下与 Supabase 交互。

## 功能

- **加载配置**: 从 `config.js` 文件中获取 Supabase 的 URL 和匿名密钥。
- **创建 Supabase 客户端**: 使用 `createClient` 函数创建一个 Supabase 客户端实例。
- **匿名权限**: 该客户端使用匿名密钥进行初始化，这意味着它只能访问那些配置为允许匿名访问的数据库表和功能（通常通过行级安全 (RLS) 策略控制）。
- **无会话持久化**: `auth` 配置中的 `persistSession: false` 和 `autoRefreshToken: false` 表明此客户端不管理用户会话的持久化或自动刷新，因为它主要用于服务器端的公共数据访问。

## 用法

应用程序中需要访问公共数据或执行基本数据库操作的任何服务或模块都应导入此客户端。例如：

```javascript
import { supabase } from '../supabaseClient.js';

async function getPublicRooms() {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('is_public', true);
  if (error) {
    console.error('Error fetching public rooms:', error);
    return [];
  }
  return data;
}
```

## 配置

为了使此客户端正常工作，`backend/src/config.js` 文件中必须包含以下 Supabase 配置：

- `config.supabase.url`: 您的 Supabase 项目 URL。
- `config.supabase.anonKey`: 您的 Supabase 项目的匿名密钥。

**重要提示**: 此客户端不应用于执行需要用户认证或管理员权限的操作。对于此类操作，应使用 `supabaseAdminClient.js` 中导出的 `supabaseAdmin` 客户端。
