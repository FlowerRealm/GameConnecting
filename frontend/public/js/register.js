import { AuthManager } from './auth.js';
import { apiService } from './apiService.js'; // 导入apiService

const auth = AuthManager.getInstance();
if (auth.isAuthenticated()) {
    window.location.href = '/';
}

const form = document.getElementById('register-form');
const error = document.getElementById('error');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        error.textContent = '两次输入的密码不一致';
        error.style.display = 'block';
        return;
    }

    const result = await auth.register(username, password);

    if (result.success) {
        window.location.href = '/login.html';
    } else {
        error.textContent = result.message;
        error.style.display = 'block';
    }
});
