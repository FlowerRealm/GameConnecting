/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-31 11:09:11
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-06-07 20:49:51
 * @FilePath: /GameConnecting/frontend/public/js/register.js
 */
import { AuthManager } from './auth.js';
import { initNavbar } from './navbar.js';
import { apiService } from './apiService.js';
import { showNotification } from './utils.js';

const auth = AuthManager.getInstance();
if (auth.isAuthenticated()) {
    window.location.href = '/';
}

initNavbar();

const form = document.getElementById('register-form');
const error = document.getElementById('error');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const note = document.getElementById('note')?.value?.trim();

    error.style.display = 'none';
    error.textContent = '';

    if (!username) {
        showNotification('请输入用户名', 'error');
        return;
    }

    if (username.length < 3 || username.length > 20) {
        showNotification('用户名长度应在3-20个字符之间', 'error');
        return;
    }

    if (!password) {
        showNotification('请输入密码', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('密码长度至少为6个字符', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('两次输入的密码不一致', 'error');
        return;
    }

    if (note && note.length > 500) {
        showNotification('备注信息不能超过500个字符', 'error');
        return;
    }

    try {
        const result = await auth.register({
            username,
            password,
            note
        });

        if (result.success) {
            showNotification('注册成功，正在跳转到登录页面...', 'success');

            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } else {
            showNotification(result.message || '注册失败，请重试', 'error');
        }
    } catch (err) {
        showNotification('网络错误，请稍后重试', 'error');
    }
});
