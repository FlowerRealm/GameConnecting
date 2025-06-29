# 公开组织 API (`organizations.js`)

该文件包含用于获取公开组织列表的 API 端点。这些端点不需要身份验证。

## 依赖

- `express`: 用于创建路由。
- `../services/adminOrganizationService.js`: 包含 `listPublicOrganizations` 函数，用于从数据库中检索公开的组织。

## 路由

---

### 1. 获取公开组织列表

- **Endpoint**: `GET /`
- **描述**: 获取所有公开可列出的组织列表。
- **中间件**: 无
- **成功响应 (`200 OK`)**:
  ```json
  {
      "success": true,
      "data": [
          {
              "id": "uuid",
              "name": "Public Organization",
              "description": "This is a public organization.",
              "created_at": "timestamp",
              "member_count": 10
          }
      ]
  }
  ```
- **失败响应 (`500 Internal Server Error`)**:
  ```json
  {
      "success": false,
      "message": "Failed to list organizations due to a server error."
  }
  ```
