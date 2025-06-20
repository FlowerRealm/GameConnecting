import { AuthManager } from './auth.js'; // Assuming AuthManager is in auth.js
import { initNavbar } from './navbar.js'; // To initialize navbar on this page

// Initialize navbar
initNavbar();

const authManager = AuthManager.getInstance();

// Redirect if not authenticated
if (!authManager.isAuthenticated()) {
    window.location.href = '/login';
    // Stop script execution if redirecting
    throw new Error('User not authenticated. Redirecting to login.');
}

const changePasswordForm = document.getElementById('change-password-form');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const messageArea = document.getElementById('message-area');

if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageArea.textContent = '';
        messageArea.style.display = 'none';
        messageArea.className = 'message-area'; // Reset class

        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Client-side validation
        if (!newPassword || !confirmPassword) {
            messageArea.textContent = '新密码和确认密码均不能为空。';
            messageArea.classList.add('error');
            messageArea.style.display = 'block';
            return;
        }

        if (newPassword.length < 6) {
            messageArea.textContent = '新密码长度至少为6位。';
            messageArea.classList.add('error');
            messageArea.style.display = 'block';
            return;
        }

        if (newPassword !== confirmPassword) {
            messageArea.textContent = '两次输入的密码不匹配。';
            messageArea.classList.add('error');
            messageArea.style.display = 'block';
            return;
        }

        try {
            // Placeholder for where the actual API call will be made via AuthManager
            // This will be implemented in the next plan step (extending AuthManager)
            // For now, let's simulate the call and expect a structure.
            // const result = await authManager.changePassword(newPassword); // Assuming changePassword method will be added

            // Simulate an async call and a potential structure for the result
            // Replace this with the actual call once authManager.changePassword is implemented.
            console.log('Attempting to call authManager.changePassword (not yet implemented)');
            const result = await new Promise(resolve => setTimeout(() => {
                 // Simulate a success for now, or toggle for testing
                // resolve({ success: true });
                resolve({ success: false, message: '密码更新功能尚未完全实现。' }); // Simulate a pending state
            }, 500));


            if (result && result.success) {
                messageArea.textContent = '密码更新成功！';
                messageArea.classList.add('success');
                changePasswordForm.reset(); // Clear the form
            } else {
                messageArea.textContent = result.message || '密码更新失败，请重试。';
                messageArea.classList.add('error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            messageArea.textContent = '密码更新过程中发生错误，请稍后重试。';
            messageArea.classList.add('error');
        } finally {
            messageArea.style.display = 'block';
        }
    });
} else {
    console.error('Change password form not found on profile page.');
}
