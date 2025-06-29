# GameConnecting 数据库结构文档

## 概述

GameConnecting使用PostgreSQL数据库，通过Supabase进行管理。数据库设计采用关系型数据库模式，支持用户认证、房间管理、组织管理和实时通信功能。

### 数据库信息
- **数据库类型**: PostgreSQL 15+
- **管理平台**: Supabase
- **连接方式**: 连接池
- **迁移工具**: node-pg-migrate

## 表结构设计

### 1. 用户资料表 (user_profiles)

存储用户的基本信息和状态。

```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 字段说明
- `id`: 用户唯一标识符
- `username`: 用户名（唯一）
- `email`: 邮箱地址（唯一，占位邮箱）
- `role`: 用户角色（user/admin/moderator）
- `status`: 用户状态（pending/active/suspended/banned）
- `note`: 备注信息
- `created_at`: 创建时间
- `updated_at`: 更新时间

#### 索引
```sql
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
```

### 2. 房间表 (rooms)

存储游戏房间/服务器信息。

```sql
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    room_type VARCHAR(20) DEFAULT 'public' CHECK (room_type IN ('public', 'private')),
    creator_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 字段说明
- `id`: 房间唯一标识符
- `name`: 房间名称
- `description`: 房间描述
- `room_type`: 房间类型（public/private）
- `creator_id`: 创建者ID（外键）
- `created_at`: 创建时间
- `updated_at`: 更新时间
- `last_active_at`: 最后活跃时间

#### 索引
```sql
CREATE INDEX idx_rooms_creator_id ON rooms(creator_id);
CREATE INDEX idx_rooms_room_type ON rooms(room_type);
CREATE INDEX idx_rooms_last_active_at ON rooms(last_active_at);
```

### 3. 房间成员表 (room_members)

存储房间成员关系。

```sql
CREATE TABLE room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);
```

#### 字段说明
- `id`: 成员关系唯一标识符
- `room_id`: 房间ID（外键）
- `user_id`: 用户ID（外键）
- `role`: 成员角色（owner/admin/member）
- `joined_at`: 加入时间

#### 索引
```sql
CREATE INDEX idx_room_members_room_id ON room_members(room_id);
CREATE INDEX idx_room_members_user_id ON room_members(user_id);
CREATE INDEX idx_room_members_role ON room_members(role);
```

### 4. 组织表 (organizations)

存储组织信息。

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 字段说明
- `id`: 组织唯一标识符
- `name`: 组织名称
- `description`: 组织描述
- `created_by`: 创建者ID（外键）
- `is_public`: 是否公开
- `created_at`: 创建时间
- `updated_at`: 更新时间

#### 索引
```sql
CREATE INDEX idx_organizations_created_by ON organizations(created_by);
CREATE INDEX idx_organizations_is_public ON organizations(is_public);
```

### 5. 用户组织关系表 (user_organization_memberships)

存储用户与组织的关系。

```sql
CREATE TABLE user_organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_in_org VARCHAR(20) DEFAULT 'member' CHECK (role_in_org IN ('owner', 'admin', 'member')),
    status_in_org VARCHAR(20) DEFAULT 'pending' CHECK (status_in_org IN ('pending', 'active', 'rejected', 'left')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);
```

#### 字段说明
- `id`: 关系唯一标识符
- `user_id`: 用户ID（外键）
- `organization_id`: 组织ID（外键）
- `role_in_org`: 组织内角色（owner/admin/member）
- `status_in_org`: 组织内状态（pending/active/rejected/left）
- `joined_at`: 加入时间
- `updated_at`: 更新时间

#### 索引
```sql
CREATE INDEX idx_user_org_memberships_user_id ON user_organization_memberships(user_id);
CREATE INDEX idx_user_org_memberships_org_id ON user_organization_memberships(organization_id);
CREATE INDEX idx_user_org_memberships_status ON user_organization_memberships(status_in_org);
```

### 6. 密码重置请求表 (password_reset_requests)

存储密码重置请求信息。

```sql
CREATE TABLE password_reset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    reset_code VARCHAR(6) NOT NULL,
    verification_token VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 字段说明
- `id`: 重置请求唯一标识符
- `user_id`: 用户ID（外键）
- `reset_code`: 6位重置码
- `verification_token`: 验证令牌
- `expires_at`: 过期时间
- `used_at`: 使用时间
- `created_at`: 创建时间

#### 索引
```sql
CREATE INDEX idx_password_reset_requests_user_id ON password_reset_requests(user_id);
CREATE INDEX idx_password_reset_requests_reset_code ON password_reset_requests(reset_code);
CREATE INDEX idx_password_reset_requests_expires_at ON password_reset_requests(expires_at);
```

## 数据库函数

### 1. 创建用户资料和成员关系函数

```sql
CREATE OR REPLACE FUNCTION create_user_profile_with_memberships(
    p_username VARCHAR(50),
    p_email VARCHAR(255),
    p_note TEXT DEFAULT NULL,
    p_requested_organization_ids UUID[] DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
BEGIN
    -- 创建用户资料
    INSERT INTO user_profiles (username, email, note)
    VALUES (p_username, p_email, p_note)
    RETURNING id INTO v_user_id;

    -- 创建组织成员关系
    IF p_requested_organization_ids IS NOT NULL THEN
        FOREACH v_org_id IN ARRAY p_requested_organization_ids
        LOOP
            INSERT INTO user_organization_memberships (user_id, organization_id)
            VALUES (v_user_id, v_org_id);
        END LOOP;
    END IF;

    RETURN v_user_id;
END;
$$;
```

### 2. 获取用户详细信息函数

```sql
CREATE OR REPLACE FUNCTION get_users_with_details(
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    username VARCHAR(50),
    role VARCHAR(20),
    status VARCHAR(20),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    organizations JSON
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.id,
        up.username,
        up.role,
        up.status,
        up.note,
        up.created_at,
        COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'org_id', uom.organization_id,
                    'name', o.name,
                    'role_in_org', uom.role_in_org,
                    'status_in_org', uom.status_in_org
                )
            )
            FROM user_organization_memberships uom
            JOIN organizations o ON o.id = uom.organization_id
            WHERE uom.user_id = up.id),
            '[]'::json
        ) as organizations
    FROM user_profiles up
    ORDER BY up.created_at DESC
    LIMIT p_limit
    OFFSET (p_page - 1) * p_limit;
END;
$$;
```

### 3. 缓存失效触发器函数

```sql
CREATE OR REPLACE FUNCTION invalidate_user_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- 这里可以添加缓存失效逻辑
    -- 例如：发送缓存失效事件到Redis
    RETURN NEW;
END;
$$;
```

## 触发器

### 1. 用户资料更新触发器

```sql
CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_profiles_cache_invalidation
    AFTER INSERT OR UPDATE OR DELETE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION invalidate_user_cache();
```

### 2. 房间更新触发器

```sql
CREATE TRIGGER trigger_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. 组织更新触发器

```sql
CREATE TRIGGER trigger_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 视图

### 1. 房间成员视图

```sql
CREATE VIEW room_members_view AS
SELECT
    rm.id,
    rm.room_id,
    rm.user_id,
    rm.role,
    rm.joined_at,
    up.username,
    up.status as user_status
FROM room_members rm
JOIN user_profiles up ON up.id = rm.user_id;
```

### 2. 组织成员视图

```sql
CREATE VIEW organization_members_view AS
SELECT
    uom.id,
    uom.organization_id,
    uom.user_id,
    uom.role_in_org,
    uom.status_in_org,
    uom.joined_at,
    up.username,
    up.status as user_status,
    o.name as organization_name
FROM user_organization_memberships uom
JOIN user_profiles up ON up.id = uom.user_id
JOIN organizations o ON o.id = uom.organization_id;
```

## 约束和规则

### 1. 外键约束
- 所有外键都设置了级联删除
- 确保数据一致性
- 防止孤立数据

### 2. 检查约束
- 用户角色限制：user/admin/moderator
- 用户状态限制：pending/active/suspended/banned
- 房间类型限制：public/private
- 成员角色限制：owner/admin/member

### 3. 唯一约束
- 用户名唯一性
- 邮箱唯一性
- 房间成员唯一性
- 组织成员唯一性

## 性能优化

### 1. 索引策略
- 主键自动索引
- 外键字段索引
- 查询频繁字段索引
- 复合索引优化

### 2. 查询优化
- 使用函数封装复杂查询
- 视图简化查询逻辑
- 避免N+1查询问题
- 合理使用JOIN

### 3. 缓存策略
- 用户资料缓存
- 查询结果缓存
- 缓存失效机制
- 内存缓存优化

## 数据迁移

### 1. 初始架构迁移
```sql
-- 1750425685438_initial-schema.js
-- 创建基础表结构
```

### 2. 删除好友关系表
```sql
-- 1750425685500_drop_friendships_table.js
-- 删除不需要的好友关系表
```

### 3. 添加密码重置表
```sql
-- 1750425685600_add_password_reset_table.js
-- 添加密码重置功能
```

### 4. 添加事务函数
```sql
-- 1750425685700_add_transaction_functions.js
-- 添加数据库函数和触发器
```

## 备份和恢复

### 1. 备份策略
- 定期全量备份
- 增量备份
- 事务日志备份
- 异地备份

### 2. 恢复策略
- 全量恢复
- 时间点恢复
- 增量恢复
- 测试恢复

## 监控和维护

### 1. 性能监控
- 慢查询监控
- 索引使用监控
- 连接数监控
- 存储空间监控

### 2. 数据维护
- 定期清理过期数据
- 索引重建
- 统计信息更新
- 数据一致性检查

---

*本文档最后更新时间: 2025年1月*