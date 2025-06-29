# 前端状态管理 (`store.js`)

该文件定义了 `Store` 类，这是一个简单的全局状态管理系统，采用单例模式。它允许前端应用程序的不同部分共享和响应状态变化，并提供了通知系统和本地存储持久化功能。

## `Store` 类

### 1. 核心概念

-   **单例模式**: 通过 `static getInstance()` 确保 `Store` 在整个应用程序中只有一个实例，便于全局状态的统一管理。
-   **响应式状态**: 任何组件都可以订阅 `Store` 中的特定状态键，并在该状态变化时接收通知。
-   **本地存储持久化**: 允许将某些关键状态（如 `user`, `servers`, `friends`）持久化到 `localStorage`，以便在页面刷新后恢复状态。
-   **通知系统**: 提供一个简单的方式来显示全局通知消息（成功、错误、警告等）。

### 2. 属性

-   `state`: 一个包含所有应用程序状态的 JavaScript 对象。初始状态包括 `user`, `servers`, `activeServer`, `friends`, `notifications`, `connectionStatus`, `isLoading`, `error`。
-   `listeners`: `Map<key, Set<callback>>`，存储每个状态键对应的订阅者回调函数。

### 3. 方法

-   **`static getInstance()`**:
    -   **描述**: 获取 `Store` 类的单例实例。
    -   **返回**: `Store` 实例。

-   **`subscribe(key, callback)`**:
    -   **描述**: 订阅 `Store` 中特定状态键的变化。当该键的状态更新时，`callback` 函数将被调用。
    -   **参数**:
        -   `key` (string): 要订阅的状态键（例如 `'user'`, `'notifications'`）。
        -   `callback` (function): 当状态变化时执行的回调函数，它将接收最新的状态值作为参数。
    -   **返回**: 一个函数，调用该函数可以取消订阅。

-   **`notify(key)`**:
    -   **描述**: 通知所有订阅了指定状态键的监听器。这是一个内部方法，通常由 `setState` 调用。
    -   **参数**:
        -   `key` (string): 要通知的状态键。

-   **`setState(key, value)`**:
    -   **描述**: 更新 `Store` 中指定状态键的值，并通知所有订阅者。
    -   **参数**:
        -   `key` (string): 要更新的状态键。
        -   `value` (any): 新的状态值。

-   **`getState(key)`**:
    -   **描述**: 获取 `Store` 中指定状态键的当前值。
    -   **参数**:
        -   `key` (string): 要获取的状态键。
    -   **返回**: 状态值。

-   **`saveToLocalStorage(key)`**:
    -   **描述**: 将指定的状态键的值保存到 `localStorage`。只有在 `persistentKeys` 数组中定义的键才会被保存。
    -   **参数**:
        -   `key` (string): 要保存的状态键。

-   **`loadFromLocalStorage()`**:
    -   **描述**: 从 `localStorage` 加载持久化的状态到 `Store` 的 `state` 中。

-   **`clearState()`**:
    -   **描述**: 重置 `Store` 的所有状态为初始值，并清除 `localStorage` 中所有持久化的状态。

-   **`addNotification(message, type = 'info', duration = 5000)`**:
    -   **描述**: 添加一个通知消息到 `notifications` 状态，并触发通知。
    -   **参数**:
        -   `message` (string): 通知内容。
        -   `type` (string, 可选): 通知类型（`'info'`, `'success'`, `'warning'`, `'error'`），默认为 `'info'`。
        -   `duration` (number, 可选): 通知显示的时长（毫秒），默认为 5000 毫秒。设置为 0 则不会自动移除。

-   **`removeNotification(id)`**:
    -   **描述**: 根据 ID 移除一个通知消息。
    -   **参数**:
        -   `id` (number): 要移除的通知的 ID。

-   **`renderNotifications(notifications)`**:
    -   **描述**: 将 `notifications` 状态中的消息渲染到页面上的通知容器中。这是一个内部辅助方法，通常由 `notify('notifications')` 调用。
    -   **参数**:
        -   `notifications` (array): 通知消息数组。

## 用法

```javascript
import { store } from './store.js';

// 订阅用户状态变化
store.subscribe('user', (user) => {
    if (user) {
        console.log('用户已登录:', user.username);
    } else {
        console.log('用户已注销');
    }
});

// 更新加载状态
store.setState('isLoading', true);

// 添加一个成功通知
store.addNotification('操作成功！', 'success');

// 获取当前服务器列表
const servers = store.getState('servers');
```

## 维护

该文档应与 `frontend/public/js/store.js` 文件的任何更改保持同步，以确保其准确性和实用性。
