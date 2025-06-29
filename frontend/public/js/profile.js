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
} else {
    loadMyOrganizations();
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

async function loadMyOrganizations() {
    const container = document.getElementById('organizations-list-container');
    if (!container) {
        console.error('Organizations list container not found.');
        return;
    }

    try {
        const response = await apiService.request('/users/me/organizations', 'GET');

        if (response && response.success && Array.isArray(response.data)) {
            if (response.data.length === 0) {
                container.innerHTML = '<p>您尚未加入任何组织。</p>';
            } else {
                let html = '';
                response.data.forEach(org => {
                    html += `
                        <div class="organization-item">
                            <h3>${org.org_name}</h3>
                            <p><strong>我的角色:</strong> ${org.role_in_org || '未指定'}</p>
                            <p><strong>成员状态:</strong> ${org.status_in_org || '未知'}</p>
                            ${org.org_description ? `<p><em>${org.org_description}</em></p>` : ''}
                        </div>
                    `;
                });
                container.innerHTML = html;
            }
        } else {
            container.innerHTML = `<p class="error-message">无法加载您的组织信息，请稍后再试。 (错误: ${response?.message || '未知错误'})</p>`;
            console.error('Failed to load organizations:', response?.message);
        }
    } catch (error) {
        console.error('Error fetching organizations:', error);
        container.innerHTML = '<p class="error-message">加载组织信息时发生网络错误或服务器错误，请检查您的网络连接并稍后再试。</p>';
    }
}
