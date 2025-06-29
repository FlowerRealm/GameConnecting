import { apiService } from './apiService.js';
import { initNavbar } from './navbar.js';

// 初始化页面
initNavbar();

// 表单元素
const usernameForm = document.getElementById('username-form');
const verificationForm = document.getElementById('verification-form');
const newPasswordForm = document.getElementById('new-password-form');
const successMessage = document.getElementById('success-message');

// 错误消息元素
const usernameError = document.getElementById('username-error');
const verificationError = document.getElementById('verification-error');
const passwordError = document.getElementById('password-error');

// 返回按钮
const backToUsername = document.getElementById('back-to-username');

// 存储步骤间传递的数据
const resetData = {
    resetRequestId: null,
    verificationToken: null,
    username: null
};

// 第一步：请求重置码
usernameForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();

    if (!username) {
        showNotification('请输入用户名', 'error');
        return;
    }

    try {
        // 显示加载状态
        usernameForm.querySelector('button').disabled = true;
        usernameForm.querySelector('button').textContent = '处理中...';

        const response = await apiService.request('/auth/password/request-reset', {
            method: 'POST',
            body: JSON.stringify({ username })
        });

        if (response.success) {
            // 存储请求ID和用户名
            resetData.resetRequestId = response.data.resetRequestId;
            resetData.username = username;

            // 显示第二步
            hideElement(usernameForm);
            showElement(verificationForm);

            // 更新提示消息，提示用户查看控制台获取重置码（仅开发环境使用）
            const helpText = verificationForm.querySelector('.help-text');
            helpText.textContent = `系统已生成重置码，请查看服务器控制台日志以获取（仅开发环境）`;
        } else {
            showNotification(response.message || '请求重置码失败，请稍后重试', 'error');
        }
    } catch (error) {
        showNotification('网络错误，请稍后重试', 'error');
    } finally {
        // 恢复按钮状态
        usernameForm.querySelector('button').disabled = false;
        usernameForm.querySelector('button').textContent = '获取重置码';
    }
});

// 第二步：验证重置码
verificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const resetCode = document.getElementById('reset-code').value.trim();

    if (!resetCode || !/^\d{6}$/.test(resetCode)) {
        showNotification('请输入6位数字重置码', 'error');
        return;
    }

    try {
        // 显示加载状态
        verificationForm.querySelector('button').disabled = true;
        verificationForm.querySelector('button').textContent = '验证中...';

        const response = await apiService.request('/auth/password/verify-reset-token', {
            method: 'POST',
            body: JSON.stringify({
                resetRequestId: resetData.resetRequestId,
                resetCode
            })
        });

        if (response.success) {
            // 存储验证令牌
            resetData.verificationToken = response.data.verificationToken;

            // 显示第三步
            hideElement(verificationForm);
            showElement(newPasswordForm);
        } else {
            showNotification(response.message || '验证失败，请检查重置码是否正确', 'error');
        }
    } catch (error) {
        showNotification('网络错误，请稍后重试', 'error');
    } finally {
        // 恢复按钮状态
        verificationForm.querySelector('button').disabled = false;
        verificationForm.querySelector('button').textContent = '验证重置码';
    }
});

// 第三步：设置新密码
newPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword.length < 6) {
        showNotification('密码长度至少为6位', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification('两次输入的密码不一致', 'error');
        return;
    }

    try {
        // 显示加载状态
        newPasswordForm.querySelector('button').disabled = true;
        newPasswordForm.querySelector('button').textContent = '重置中...';

        const response = await apiService.request('/auth/password/reset', {
            method: 'POST',
            body: JSON.stringify({
                verificationToken: resetData.verificationToken,
                newPassword
            })
        });

        if (response.success) {
            // 显示成功消息
            hideElement(newPasswordForm);
            showElement(successMessage);
        } else {
            showNotification(response.message || '密码重置失败，请稍后重试', 'error');
        }
    } catch (error) {
        showNotification('网络错误，请稍后重试', 'error');
    } finally {
        // 恢复按钮状态
        newPasswordForm.querySelector('button').disabled = false;
        newPasswordForm.querySelector('button').textContent = '重置密码';
    }
});

// 返回上一步
backToUsername.addEventListener('click', (e) => {
    e.preventDefault();

    // 清除重置码输入
    document.getElementById('reset-code').value = '';
    hideError(verificationError);

    // 显示第一步
    hideElement(verificationForm);
    showElement(usernameForm);
});



// 显示元素
function showElement(element) {
    element.style.display = 'block';
}

// 隐藏元素
function hideElement(element) {
    element.style.display = 'none';
}