/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-31 11:09:11
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-06-07 20:49:51
 * @FilePath: /GameConnecting/frontend/public/js/register.js
 */
import { AuthManager } from './auth.js';
import { initNavbar } from './navbar.js';
import { apiService } from './apiService.js'; // Added import

const auth = AuthManager.getInstance();
if (auth.isAuthenticated()) {
    window.location.href = '/';
}

initNavbar();

async function loadAndRenderOrganizations() {
    const container = document.getElementById('organization-select-container');
    if (!container) {
        console.error('Organization select container not found.');
        return;
    }

    try {
        const result = await apiService.request('/api/organizations'); // Uses the new public endpoint
        if (result.success && result.data && result.data.length > 0) {
            container.innerHTML = ''; // Clear "Loading..."
            result.data.forEach(org => {
                const div = document.createElement('div');
                div.classList.add('checkbox-item'); // Optional: for styling

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `org-${org.id}`;
                checkbox.name = 'organizationIds';
                checkbox.value = org.id;

                const label = document.createElement('label');
                label.htmlFor = `org-${org.id}`;
                label.textContent = org.name;
                if (org.description) {
                    label.title = org.description;
                }

                div.appendChild(checkbox);
                div.appendChild(label);
                container.appendChild(div);
            });
        } else if (result.success && result.data && result.data.length === 0) {
            container.innerHTML = '<p>暂无公开组织可供选择加入。</p>';
        } else {
            container.innerHTML = '<p>无法加载组织列表，请稍后再试。</p>';
            console.error('Failed to load organizations:', result.message);
        }
    } catch (error) {
        console.error('Error loading organizations:', error);
        container.innerHTML = '<p>加载组织列表时发生错误。</p>';
    }
}

// Load organizations when the script runs (module scripts are deferred by default)
loadAndRenderOrganizations();

const form = document.getElementById('register-form');
const error = document.getElementById('error');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    // const email = document.getElementById('email').value.trim(); // REMOVE Email Value Retrieval
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const note = document.getElementById('note')?.value?.trim();

    error.style.display = 'none';
    error.textContent = '';

    if (!username) {
        error.textContent = '请输入用户名';
        error.style.display = 'block';
        return;
    }

    // REMOVE Client-Side Email Validation
    // if (!email) {
    //     error.textContent = '请输入邮箱地址';
    //     error.style.display = 'block';
    //     return;
    // }
    // const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailPattern.test(email)) {
    //     error.textContent = '请输入有效的邮箱地址';
    //     error.style.display = 'block';
    //     return;
    // }

    if (username.length < 3 || username.length > 20) {
        error.textContent = '用户名长度应在3-20个字符之间';
        error.style.display = 'block';
        return;
    }

    if (!password) {
        error.textContent = '请输入密码';
        error.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        error.textContent = '密码长度至少为6个字符';
        error.style.display = 'block';
        return;
    }

    if (password !== confirmPassword) {
        error.textContent = '两次输入的密码不一致';
        error.style.display = 'block';
        return;
    }

    if (note && note.length > 500) {
        error.textContent = '备注信息不能超过500个字符';
        error.style.display = 'block';
        return;
    }

    try {
        const selectedOrgCheckboxes = document.querySelectorAll('#organization-select-container input[name="organizationIds"]:checked');
        const requestedOrganizationIds = Array.from(selectedOrgCheckboxes).map(cb => cb.value);

        // REMOVE Email from Payload
        const result = await auth.register({
            username,
            password,
            note,
            requestedOrganizationIds
        });

        if (result.success) {
            error.className = 'success';
            error.textContent = '注册成功，正在跳转到登录页面...';
            error.style.display = 'block';

            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } else {
            error.className = 'error';
            error.textContent = result.message || '注册失败，请重试';
            error.style.display = 'block';
        }
    } catch (err) {
        error.className = 'error';
        error.textContent = '网络错误，请稍后重试';
        error.style.display = 'block';
    }
});
