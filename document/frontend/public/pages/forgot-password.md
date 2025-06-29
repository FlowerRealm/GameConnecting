# 忘记密码页面 (`forgot-password.html`)

该文件定义了 `GameConnecting` 应用程序的“忘记密码”页面。它提供了一个三步流程，引导用户重置其账户密码。

## 结构概述

-   **头部 (`<head>`)**: 包含页面标题、样式表链接 (`style.css`) 和主 JavaScript 脚本 (`forgotPassword.js`)。
-   **导航栏 (`<nav>`)**: 页面顶部的导航栏，由 `navbar.js` 动态加载。
-   **主内容 (`<div class="login-container glassmorphic-container">`)**: 包含密码重置流程的各个步骤表单和成功消息。
    -   **第一步：输入用户名 (`#username-form`)**: 包含用户名输入框和“获取重置码”按钮。
    -   **第二步：输入重置码 (`#verification-form`)**: 包含重置码输入框、“验证重置码”按钮和“返回”链接。此表单初始隐藏。
    -   **第三步：设置新密码 (`#new-password-form`)**: 包含新密码和确认密码输入框以及“重置密码”按钮。此表单初始隐藏。
    -   **成功信息 (`#success-message`)**: 密码重置成功后显示的消息和返回登录页面的链接。此区域初始隐藏。
    -   **错误消息**: 每个步骤下方都有一个 `div` 用于显示错误消息 (`#username-error`, `#verification-error`, `#password-error`)，初始隐藏。

## 引入的 JavaScript 文件

-   `/js/forgotPassword.js`: 包含页面所有交互逻辑，处理表单提交、步骤切换和与后端 API 的通信。
-   `/js/navbar.js`: 用于初始化导航栏。

## 目的

-   **密码重置**: 提供一个用户友好的界面来引导用户完成密码重置过程。
-   **分步引导**: 将复杂的密码重置流程分解为简单的、易于理解的步骤。
-   **错误反馈**: 在每个步骤中提供即时和清晰的错误反馈。

## 维护

该文档应与 `frontend/public/pages/forgot-password.html` 文件的任何更改保持同步，以确保其准确性和实用性。特别是当页面结构、表单元素 ID 或引入的脚本发生变化时。
