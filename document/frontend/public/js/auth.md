# 前端认证管理器 (`auth.js`)

该文件定义了 `AuthManager` 类，这是一个单例模式的认证状态管理器，负责处理前端的用户认证、会话管理、令牌刷新以及用户角色和权限的检查。它与 `apiService.js` 交互以发送认证相关的请求，并与 `store.js` 交互以更新全局状态。

## 依赖

-   `./apiService.js`: 用于发送所有认证相关的 API 请求。
-   `./store.js`: 用于更新全局加载状态和触发认证相关的事件。

## `AuthManager` 类

### 1. 核心概念

-   **单例模式**: 通过 `static #instance` 确保 `AuthManager` 在整个应用程序中只有一个实例。
-   **内存缓存 (`#memoryCache`)**: 存储当前用户的 `token`、`username`、`role` 和 `tokenExpiry`，以提高访问速度并减少对 `localStorage` 的频繁读取。
-   **持久化存储**: 使用 `localStorage` 来持久化 `access_token`、`refresh_token`、`username` 和 `role`，以便在页面刷新后保持登录状态。

### 2. 私有方法

-   `#loadCacheFromStorage()`: 在 `AuthManager` 实例化时，从 `localStorage` 加载认证数据到内存缓存。
-   `#parseToken(token)`: 解析 JWT 令牌，提取其 payload，特别是 `exp` (过期时间) 字段。
-   `#tryRefreshToken()`: 尝试刷新令牌，并使用 `refreshInProgress` 标志防止重复刷新请求。
-   `#saveAuthData(token, refreshToken, username, role)`: 将认证数据保存到 `localStorage` 和内存缓存，并解析令牌过期时间。成功登录后会触发 `auth:login` 自定义事件。
-   `#removeAuthData()`: 从 `localStorage` 和内存缓存中移除所有认证数据，并触发 `auth:logout` 自定义事件。

### 3. 公有方法

-   `static getInstance()`: 获取 `AuthManager` 的单例实例。
-   `async login(username, password)`: 
    -   **描述**: 向后端发送登录请求，验证用户凭据。
    -   **参数**: `username` (string), `password` (string)。
    -   **返回**: 一个包含 `success` 状态、消息和数据的对象。成功时，会保存 `access_token`、`refresh_token`、`username` 和 `role`。
-   `async register(userData)`: 
    -   **描述**: 向后端发送注册请求。
    -   **参数**: `userData` (object)，包含 `username`, `password` 等注册信息。
    -   **返回**: 后端注册请求的响应。
-   `logout()`: 
    -   **描述**: 向后端发送注销请求，并清除本地存储的所有认证数据。
-   `async changePassword(newPassword)`: 
    -   **描述**: 向后端发送更改当前用户密码的请求。
    -   **参数**: `newPassword` (string)。
    -   **返回**: 后端更改密码请求的响应。
-   `isAuthenticated()`: 
    -   **描述**: 检查用户是否已认证且其访问令牌是否有效。如果令牌即将过期（1小时内），会自动尝试刷新令牌。
    -   **返回**: `true` (已认证且令牌有效) 或 `false`。
-   `async refreshToken()`: 
    -   **描述**: 使用存储的刷新令牌向后端请求新的访问令牌。通常由 `isAuthenticated` 内部调用。
    -   **返回**: `true` (刷新成功) 或 `false` (刷新失败或无刷新令牌)。
-   `getToken()`: 返回当前存储的访问令牌。
-   `getUsername()`: 返回当前存储的用户名。
-   `getRole()`: 返回当前存储的用户角色。
-   `getUserId()`: 从访问令牌中解析并返回用户 ID。
-   `isAdmin()`: 检查当前用户是否具有 `admin` 角色。

## 用法

在前端应用程序中，通过 `AuthManager.getInstance()` 获取 `AuthManager` 的实例，然后调用其公共方法来管理认证状态：

```javascript
import { AuthManager } from './auth.js';

const auth = AuthManager.getInstance();

// 检查用户是否登录
if (auth.isAuthenticated()) {
    console.log(`欢迎，${auth.getUsername()}！您的角色是 ${auth.getRole()}`);
}

// 登录用户
auth.login('myusername', 'mypassword').then(result => {
    if (result.success) {
        console.log('登录成功');
    } else {
        console.error('登录失败:', result.message);
    }
});

// 退出登录
document.getElementById('logoutButton').addEventListener('click', () => {
    auth.logout();
    window.location.href = '/login';
});
```

## 维护

该文档应与 `frontend/public/js/auth.js` 文件的任何更改保持同步，以确保其准确性和实用性。
