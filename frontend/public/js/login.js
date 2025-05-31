import { AuthManager } from './auth.js';
import { apiService } from './apiService.js'; // 导入apiService

const auth = AuthManager.getInstance();
if (auth.isAuthenticated()) {
    window.location.href = '/';
}

const form = document.getElementById('login-form');
const error = document.getElementById('error');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const result = await auth.login(username, password);

    if (result.success) {
        window.location.href = '/';
    } else {
        error.textContent = result.message;
        error.style.display = 'block';
    }
});
