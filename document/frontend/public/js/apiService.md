# 前端 API 服务 (`apiService.js`)

该文件实现了前端与后端 API 交互的核心逻辑，提供了一个统一的接口来发送 HTTP 请求。它集成了请求缓存、防抖、性能监控和集中式错误处理等功能，以提高应用程序的性能和用户体验。

## 主要功能

-   **单例模式**: `ApiService` 类被实现为单例，确保在整个应用程序中只有一个实例，便于管理和共享状态。
-   **请求缓存 (`requestCache`)**: 
    -   为 `GET` 请求提供内存缓存，减少对后端的不必要请求。
    -   支持设置缓存过期时间 (TTL)，默认 30 秒，列表数据可配置为 60 秒。
    -   `set(key, data, ttl)`: 设置缓存。
    -   `get(key)`: 获取缓存，如果过期则返回 `null`。
    -   `generateKey(endpoint, options)`: 根据请求生成唯一的缓存键。
-   **请求防抖 (`debounce`)**: 
    -   防止在短时间内发送重复的相同请求，特别是对于快速触发的用户操作。
    -   确保同一请求在处理中时，后续的相同请求会等待当前请求完成。
-   **统一请求接口 (`request`)**: 
    -   `request(endpoint, options)`: 主要的请求方法，封装了 `fetch` API。
    -   自动添加 `Authorization` Bearer Token 到请求头。
    -   自动处理 JSON 请求体和响应。
    -   **性能监控**: 记录超过 500ms 的慢请求到控制台。
    -   **错误处理**: 将错误传递给 `errorHandler.js` 中的 `ErrorHandler.handleApiError` 进行集中处理。
-   **加载状态管理**: 通过 `store.js` 更新全局加载状态 (`isLoading`)，以便在请求进行时显示加载指示器。

## 类和函数

---

### `requestCache` 对象

一个用于管理请求缓存的简单对象，包含 `cache` (Map)、`set`、`get` 和 `generateKey` 方法。

---

### `debounce` 函数

一个闭包实现的防抖函数，用于管理并发请求，确保同一请求不会被重复发送。

---

### `ApiService` 类

-   **`constructor()`**: 初始化 `baseUrl` 和 `apiKey`，并设置请求队列。
-   **`static getInstance()`**: 获取 `ApiService` 的单例实例。
-   **`updateLoadingState()`**: 根据请求队列的大小更新全局加载状态。
-   **`buildUrl(endpoint)`**: 构建完整的后端 API URL。
-   **`handleResponse(response)`**: 处理 `fetch` API 返回的响应，解析 JSON 数据，并根据响应状态抛出错误或返回成功数据。
-   **`async request(endpoint, options = {})`**: 
    -   **参数**:
        -   `endpoint` (string): API 端点路径，例如 `'/auth/login'`。
        -   `options` (object): `fetch` API 的选项，例如 `method`, `body`, `headers` 等。
    -   **返回**: 一个 Promise，解析为后端返回的 JSON 数据（如果成功），或在请求失败时抛出错误。

## 用法

在需要与后端 API 交互的任何前端模块中，导入 `apiService` 实例并调用其 `request` 方法：

```javascript
import { apiService } from './apiService.js';

async function login(username, password) {
    try {
        const response = await apiService.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        console.log('Login successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('Login failed:', error.message);
        throw error;
    }
}
```

## 维护

该文档应与 `frontend/public/js/apiService.js` 文件的任何更改保持同步，以确保其准确性和实用性。
