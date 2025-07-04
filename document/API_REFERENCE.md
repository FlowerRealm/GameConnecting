# GameConnecting API 接口完整参考

## 概述

GameConnecting API 提供RESTful接口，支持用户认证、房间管理和实时通信功能。所有API响应都采用统一的JSON格式。

### 基础信息
- **基础URL**: `https://gameconnecting.onrender.com` (生产环境)
- **开发环境**: `http://localhost:12001`
- **认证方式**: Bearer Token (JWT)
- **内容类型**: `application/json`

### 响应格式
```json
{
    "success": true,
    "message": "操作成功",
    "data": {
        // 具体数据
    }
}
```

### 错误响应
```json
{
    "success": false,
    "message": "错误描述",
    "error": {
        "status": 400,
        "message": "详细错误信息"
    }
}
```

## 认证接口

### 用户注册

**POST** `/auth/register`

注册新用户账户。

#### 请求参数
```json
{
    "username": "string",           // 用户名（必填）
    "password": "string",           // 密码（必填，最少6位）
    "note": "string"                // 备注（可选）
}
```

#### 响应示例
```json
{
    "success": true,
    "message": "注册成功，请等待管理员审核。如项目启用邮件确认，请先确认邮箱。",
    "data": {
        "userId": "uuid"
    }
}
```

#### 错误码
- `400`: 用户名或密码为空
- `400`: 密码长度不足6位
- `400`: 用户名已存在
- `500`: 服务器内部错误

### 用户登录

**POST** `/auth/login`

用户登录获取访问令牌。

#### 请求参数
```json
{
    "username": "string",    // 用户名（必填）
    "password": "string"     // 密码（必填）
}
```

#### 响应示例
```json
{
    "success": true,
    "message": "登录成功",
    "data": {
        "access_token": "string",      // 访问令牌
        "refresh_token": "string",     // 刷新令牌
        "username": "string",          // 用户名
        "role": "string",              // 用户角色
        "userId": "uuid",              // 用户ID
        "expires_at": "timestamp"      // 过期时间
    }
}
```

#### 错误码
- `400`: 用户名或密码为空
- `401`: 用户名或密码错误
- `403`: 账户状态异常（pending/suspended/banned）

### 刷新令牌

**POST** `/auth/refresh`

使用刷新令牌获取新的访问令牌。

#### 请求参数
```json
{
    "refresh_token": "string"    // 刷新令牌（必填）
}
```

#### 响应示例
```json
{
    "success": true,
    "message": "Token 刷新成功",
    "data": {
        "access_token": "string",
        "refresh_token": "string",
        "username": "string",
        "role": "string",
        "userId": "uuid",
        "expires_at": "timestamp"
    }
}
```

#### 错误码
- `400`: 未提供刷新令牌
- `401`: 刷新令牌无效或过期
- `403`: 账户状态异常

### 用户注销

**POST** `/auth/logout`

用户注销，清除会话。

#### 请求头
```
Authorization: Bearer <access_token>
```

#### 响应示例
```json
{
    "success": true,
    "message": "已成功注销"
}
```

### 请求密码重置

**POST** `/auth/password/request-reset`

请求密码重置码。

#### 请求参数
```json
{
    "username": "string"    // 用户名（必填）
}
```

#### 响应示例
```json
{
    "success": true,
    "message": "密码重置请求已处理，请检查您的重置代码",
    "data": {
        "resetRequestId": "uuid"
    }
}
```

### 验证重置码

**POST** `/auth/password/verify-reset-token`

验证密码重置码。

#### 请求参数
```json
{
    "resetRequestId": "uuid",    // 重置请求ID（必填）
    "resetCode": "string"        // 6位重置码（必填）
}
```

#### 响应示例
```json
{
    "success": true,
    "message": "重置代码验证成功",
    "data": {
        "verificationToken": "string"
    }
}
```

### 重置密码

**POST** `/auth/password/reset`

使用验证令牌重置密码。

#### 请求参数
```json
{
    "verificationToken": "string",    // 验证令牌（必填）
    "newPassword": "string"           // 新密码（必填，最少6位）
}
```

#### 响应示例
```json
{
    "success": true,
    "message": "密码已成功重置，请使用新密码登录"
}
```

## 房间管理接口

### 获取房间列表

**GET** `/api/rooms/list`

获取所有公开房间列表。

#### 响应示例
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "name": "string",
            "description": "string",
            "room_type": "public",
            "creator_id": "uuid",
            "member_count": 0,
            "created_at": "timestamp",
            "last_active_at": "timestamp"
        }
    ]
}
```

### 创建房间

**POST** `/api/rooms/create`

创建新房间。

#### 请求头
```
Authorization: Bearer <access_token>
```

#### 请求参数
```json
{
    "name": "string",           // 房间名称（必填，最少3位）
    "description": "string"     // 房间描述（可选）
}
```

#### 响应示例
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "name": "string",
        "description": "string",
        "room_type": "public",
        "creator_id": "uuid",
        "created_at": "timestamp"
    }
}
```

### 加入房间

**POST** `/api/rooms/{roomId}/join`

加入指定房间。

#### 请求头
```
Authorization: Bearer <access_token>
```

#### 路径参数
- `roomId`: 房间ID

#### 响应示例
```json
{
    "success": true,
    "message": "成功加入房间"
}
```

### 获取房间成员

**GET** `/api/rooms/{roomId}/members`

获取房间成员列表。

#### 请求头
```
Authorization: Bearer <access_token>
```

#### 路径参数
- `roomId`: 房间ID

#### 响应示例
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "username": "string",
            "role": "member",
            "joined_at": "timestamp"
        }
    ]
}
```

### 离开房间

**POST** `/api/rooms/{roomId}/leave`

离开指定房间。

#### 请求头
```
Authorization: Bearer <access_token>
```

#### 路径参数
- `roomId`: 房间ID

#### 响应示例
```json
{
    "success": true,
    "message": "已离开房间"
}
```

### 删除房间

**DELETE** `/api/rooms/{roomId}`

删除房间（仅房间所有者）。

#### 请求头
```
Authorization: Bearer <access_token>
```

#### 路径参数
- `roomId`: 房间ID

#### 响应示例
```json
{
    "success": true,
    "message": "房间已删除"
}
```

## Socket.IO 事件

### 连接认证

**事件**: `authenticate`

客户端连接时发送认证信息。

#### 发送数据
```json
{
    "token": "string"    // JWT访问令牌
}
```

#### 响应事件
- `authenticated`: 认证成功
- `auth_error`: 认证失败

### 加入房间

**事件**: `join_room`

加入聊天房间。

#### 发送数据
```json
{
    "roomId": "string"    // 房间ID
}
```

#### 响应事件
- `room_joined`: 成功加入房间
- `room_error`: 加入房间失败

### 发送消息

**事件**: `send_message`

发送聊天消息。

#### 发送数据
```json
{
    "roomId": "string",      // 房间ID
    "message": "string",     // 消息内容
    "type": "text"           // 消息类型
}
```

#### 广播事件
- `new_message`: 新消息通知

### 离开房间

**事件**: `leave_room`

离开聊天房间。

#### 发送数据
```json
{
    "roomId": "string"    // 房间ID
}
```

#### 响应事件
- `room_left`: 成功离开房间

## 错误码说明

### HTTP状态码
- `200`: 请求成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未认证或认证失败
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

### 业务错误码
- `USER_NOT_FOUND`: 用户不存在
- `USER_ALREADY_EXISTS`: 用户已存在
- `INVALID_CREDENTIALS`: 用户名或密码错误
- `USER_NOT_ACTIVE`: 用户状态异常
- `ROOM_NOT_FOUND`: 房间不存在
- `ROOM_ALREADY_EXISTS`: 房间已存在
- `NOT_ROOM_OWNER`: 不是房间所有者
- `ALREADY_MEMBER`: 已是房间成员
- `NOT_MEMBER`: 不是房间成员