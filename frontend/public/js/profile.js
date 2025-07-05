import { AuthManager } from './auth.js';
import { initNavbar } from './navbar.js';
import { apiService } from './apiService.js';
import { showNotification } from './utils.js';

// Initialize navbar
initNavbar();

const authManager = AuthManager.getInstance();

// Redirect if not authenticated
if (!authManager.isAuthenticated()) {
    window.location.href = '/login';
    throw new Error('User not authenticated. Redirecting to login.');
}

const changePasswordForm = document.getElementById('change-password-form');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');

if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!newPassword || !confirmPassword) {
            showNotification('新密码和确认密码均不能为空。', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showNotification('新密码长度至少为6位。', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotification('两次输入的密码不匹配。', 'error');
            return;
        }

        try {
            const result = await authManager.changePassword(newPassword);

            if (result && result.success) {
                showNotification('密码更新成功！', 'success');
                changePasswordForm.reset();
            } else {
                showNotification(result.message || '密码更新失败，请重试。', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showNotification('密码更新过程中发生错误，请稍后重试。', 'error');
        }
    });
} else {
    console.error('Change password form not found on profile page.');
}
