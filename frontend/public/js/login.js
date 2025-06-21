import { AuthManager } from './auth.js';
import { initNavbar } from './navbar.js';

const auth = AuthManager.getInstance();
if (auth.isAuthenticated()) {
    window.location.href = '/';
}

initNavbar();

const form = document.getElementById('login-form');
const error = document.getElementById('error');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    error.style.display = 'none';
    error.textContent = '';

    if (!username) {
        error.textContent = '请输入用户名';
        error.style.display = 'block';
        return;
    }

    if (!password) {
        error.textContent = '请输入密码';
        error.style.display = 'block';
        return;
    }

    try {
        const result = await auth.login(username, password);
        if (result.success) {
            error.className = 'success';
            error.textContent = '登录成功，正在跳转...';
            error.style.display = 'block';

            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            error.className = 'error';
            error.textContent = result.message || '登录失败，请重试';
            error.style.display = 'block';
        }
    } catch (err) {
        error.className = 'error';
        error.textContent = '网络错误，请稍后重试';
        error.style.display = 'block';
    }
});
