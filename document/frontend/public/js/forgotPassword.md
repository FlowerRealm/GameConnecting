# 前端忘记密码脚本 (`forgotPassword.js`)

该文件实现了前端“忘记密码”页面的所有逻辑，引导用户通过三个步骤重置密码：请求重置码、验证重置码和设置新密码。它与后端认证 API 进行交互以完成密码重置流程。

## 依赖

-   `./apiService.js`: `apiService` 实例，用于向后端发送 API 请求。
-   `./navbar.js`: `initNavbar` 函数，用于初始化导航栏。

## 全局变量

-   `usernameForm`: 请求重置码的表单元素。
-   `verificationForm`: 验证重置码的表单元素。
-   `newPasswordForm`: 设置新密码的表单元素。
-   `successMessage`: 密码重置成功后显示的元素。
-   `usernameError`, `verificationError`, `passwordError`: 各步骤的错误消息显示元素。
-   `backToUsername`: 返回第一步的按钮。
-   `resetData`: 一个对象，用于在不同步骤之间存储 `resetRequestId`、`verificationToken` 和 `username`。

## 主要功能

### 1. 页面初始化

-   调用 `initNavbar()` 初始化导航栏。
-   获取所有表单和错误消息的 DOM 元素。

### 2. 请求重置码 (第一步)

-   **表单**: `usernameForm`
-   **事件**: 监听 `submit` 事件。
-   **逻辑**:
    1.  获取用户输入的用户名。
    2.  验证用户名是否为空。
    3.  向后端 `POST /auth/password/request-reset` 发送请求，请求体包含 `username`。
    4.  如果请求成功，存储 `resetRequestId` 和 `username` 到 `resetData`，隐藏 `usernameForm`，显示 `verificationForm`，并更新提示消息。
    5.  如果请求失败，显示错误消息。

### 3. 验证重置码 (第二步)

-   **表单**: `verificationForm`
-   **事件**: 监听 `submit` 事件。
-   **逻辑**:
    1.  获取用户输入的6位数字重置码。
    2.  验证重置码格式。
    3.  向后端 `POST /auth/password/verify-reset-token` 发送请求，请求体包含 `resetRequestId` 和 `resetCode`。
    4.  如果请求成功，存储 `verificationToken` 到 `resetData`，隐藏 `verificationForm`，显示 `newPasswordForm`。
    5.  如果请求失败，显示错误消息。

### 4. 设置新密码 (第三步)

-   **表单**: `newPasswordForm`
-   **事件**: 监听 `submit` 事件。
-   **逻辑**:
    1.  获取用户输入的新密码和确认密码。
    2.  验证密码长度（至少6位）和两次输入是否一致。
    3.  向后端 `POST /auth/password/reset` 发送请求，请求体包含 `verificationToken` 和 `newPassword`。
    4.  如果请求成功，隐藏 `newPasswordForm`，显示 `successMessage`。
    5.  如果请求失败，显示错误消息。

### 5. 辅助功能

-   **返回按钮**: `backToUsername` 按钮监听 `click` 事件，用于从第二步返回到第一步。
-   `showError(element, message)`: 在指定元素中显示错误消息。
-   `hideError(element)`: 隐藏指定元素的错误消息。
-   `showElement(element)`: 显示指定 DOM 元素。
-   `hideElement(element)`: 隐藏指定 DOM 元素。

## 交互流程

1.  用户在“忘记密码”页面输入用户名，点击“获取重置码”。
2.  如果用户名有效，页面切换到第二步，提示用户输入重置码。
3.  用户输入重置码，点击“验证重置码”。
4.  如果重置码有效，页面切换到第三步，提示用户设置新密码。
5.  用户输入新密码并确认，点击“重置密码”。
6.  如果密码重置成功，显示成功消息。

## 维护

该文档应与 `frontend/public/js/forgotPassword.js` 文件的任何更改保持同步，以确保其准确性和实用性。
