import { AuthManager } from './auth.js';
import { initNavbar } from './navbar.js';
import { showNotification } from './utils.js';

const auth = AuthManager.getInstance();
if (auth.isAuthenticated()) {
    // 根据角色重定向到不同页面
    const userRole = auth.getRole();
    if (userRole === 'admin') {
        window.location.href = '/administrator/user';
    } else {
    window.location.href = '/';
    }
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
        showNotification('请输入用户名', 'error');
        return;
    }

    if (!password) {
        showNotification('请输入密码', 'error');
        return;
    }

    try {
        const result = await auth.login(username, password);
        if (result.success) {
            showNotification('登录成功，正在跳转...', 'success');

            // 根据用户角色重定向到不同页面
            setTimeout(() => {
                const userRole = auth.getRole();
                if (userRole === 'admin') {
                    window.location.href = '/administrator/user';
                } else {
                window.location.href = '/';
                }
            }, 1000);
        } else {
            showNotification(result.message || '登录失败，请重试', 'error');
        }
    } catch (err) {
        showNotification('网络错误，请稍后重试', 'error');
    }
});
