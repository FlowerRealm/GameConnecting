# 前端错误处理 (`errorHandler.js`)

该文件定义了 `ErrorHandler` 类，提供了一套集中的错误处理机制，用于捕获、分类和响应前端应用程序中发生的各种错误，包括 API 错误、Socket 错误、验证错误和意外错误。它与 `store.js` 交互以显示用户通知。

## 依赖

-   `./store.js`: 用于显示通知和管理全局状态。
-   `./config.js`: 用于判断当前环境（开发/生产）以决定错误信息的详细程度。
-   `./auth.js`: `AuthManager` 实例，用于处理认证相关的错误（如令牌过期）。

## `ErrorHandler` 类

### 1. 静态方法

-   **`static handleApiError(error, context = '')`**:
    -   **描述**: 处理从 `apiService.js` 抛出的 API 请求错误。
    -   **参数**:
        -   `error`: 包含 `statusCode` 和 `message` 的错误对象。
        -   `context` (可选): 错误发生的上下文信息。
    -   **行为**: 根据 `statusCode` 确定错误类型和用户友好的消息。特别处理 `401` (未授权) 和 `403` (禁止访问) 错误，清除本地认证信息并提示重新登录。将错误消息添加到全局通知，并更新全局错误状态。

-   **`static handleSocketError(error, context = '')`**:
    -   **描述**: 处理 Socket.IO 连接或通信错误。
    -   **参数**:
        -   `error`: 包含 `message` 和可选 `data` 的错误对象。
        -   `context` (可选): 错误发生的上下文信息。
    -   **行为**: 根据错误消息判断是否为认证过期，如果是，则调用 `AuthManager.logout()` 清除认证信息并重定向到登录页。将错误消息添加到全局通知，并更新连接状态。

-   **`static handleValidationError(errors, context = '')`**:
    -   **描述**: 处理客户端表单验证失败的错误。
    -   **参数**:
        -   `errors`: 错误数组或单个错误对象。
        -   `context` (可选): 错误发生的上下文信息。
    -   **行为**: 提取第一个错误消息，并将其作为警告通知显示给用户。

-   **`static handleUnexpectedError(error, context = '')`**:
    -   **描述**: 捕获应用程序中未被其他处理程序捕获的意外错误（例如，运行时 JavaScript 错误）。
    -   **参数**:
        -   `error`: 错误对象，可能包含 `message` 和 `stack`。
        -   `context` (可选): 错误发生的上下文信息。
    -   **行为**: 在开发环境下，显示详细的错误信息（包括堆栈跟踪）；在生产环境下，显示通用的用户友好消息。将错误消息添加到全局通知，并在开发环境下记录完整的错误信息到控制台。

### 2. 全局错误监听

-   `window.onerror`: 捕获未被 `try...catch` 块捕获的全局 JavaScript 运行时错误，并将其传递给 `handleUnexpectedError`。
-   `window.onunhandledrejection`: 捕获未被处理的 Promise 拒绝，并将其传递给 `handleUnexpectedError`。

## 用法

在应用程序中，可以通过以下方式使用 `ErrorHandler`：

-   **API 请求**: `apiService.js` 会自动调用 `ErrorHandler.handleApiError`。
-   **Socket.IO**: `socket.js` 会自动调用 `ErrorHandler.handleSocketError`。
-   **表单验证**: 在表单提交逻辑中手动调用 `ErrorHandler.handleValidationError`。
-   **其他地方**: 在任何可能发生意外错误的地方，可以使用 `try...catch` 块并调用 `ErrorHandler.handleUnexpectedError`。

```javascript
import { ErrorHandler } from './errorHandler.js';

try {
    // 可能会抛出错误的代码
} catch (error) {
    ErrorHandler.handleUnexpectedError(error, 'MyComponent');
}
```

## 维护

该文档应与 `frontend/public/js/errorHandler.js` 文件的任何更改保持同步，以确保其准确性和实用性。
