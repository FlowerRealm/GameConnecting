import { AuthManager } from './auth.js';
import { apiService } from './apiService.js';
import { initNavbar } from './navbar.js';
import { showNotification, renderPagination } from './utils.js';
const auth = AuthManager.getInstance();
const limit = 10;

let currentPage = 1;

document.addEventListener('DOMContentLoaded', async () => {
    if (!auth.isAuthenticated()) {
        showNotification('您的会话已过期或无效，请重新登录。', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        return;
    }
    initNavbar();
    await loadUsers();
});

async function loadUsers() {
    try {
        const response = await apiService.request(`/users/all?page=${currentPage}&limit=${limit}`);

        if (response.success && response.data && response.data.users) {
            renderUsers(response.data);
        } else {
            showNotification(response.data?.message || response.message || '获取用户列表失败');
        }
    } catch (error) {
        if (error.statusCode !== 401 && error.statusCode !== 403) {
            showNotification('加载用户列表时发生意外错误。');
        }
    }
}

// 渲染用户列表
function renderUsers(data) {
    let users = [];
    let totalUsers = 0;
    let currentPageNum = 1;
    let totalPages = 1;

    if (data.users) {
        users = data.users;
        totalUsers = data.total;
        currentPageNum = data.page;
        totalPages = data.totalPages;
    } else {
        document.getElementById('userTableContainer').innerHTML = '<p class="no-data">无法加载用户数据。</p>';
        return;
    }

    const tableContainer = document.getElementById('userTableContainer');

    let html = `
        <table class="user-table">
            <thead>
                <tr>
                    <th><i class="fas fa-user"></i> 用户名</th>
                    <th><i class="fas fa-shield-alt"></i> 角色</th>
                    <th><i class="fas fa-calendar-alt"></i> 注册时间</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (users.length === 0) {
        html += `
            <tr>
                <td colspan="3" class="no-data">
                    <i class="fas fa-users-slash"></i>
                    没有用户数据
                </td>
            </tr>
        `;
    } else {
        users.forEach(user => {
            const registrationDate = new Date(user.created_at).toLocaleString('zh-CN');
            const roleDisplay = user.role === 'admin' ? '管理员' : '用户';

            html += `
                <tr>
                    <td>
                        <div class="user-info">
                            <i class="fas fa-user-circle"></i>
                            ${user.username}
                        </div>
                    </td>
                    <td>${roleDisplay}</td>
                    <td>${registrationDate}</td>
                </tr>
            `;
        });
    }

    html += '</tbody></table>';
    tableContainer.innerHTML = html;

    if (totalUsers > limit) {
        renderPagination(totalUsers, currentPageNum, totalPages, changePage);
    } else {
        document.getElementById('pagination').innerHTML = '';
    }
}

// 切换页面
function changePage(page) {
    if (page < 1) return;
    currentPage = page;
    loadUsers();
}

// 绑定全局函数
window.changePage = changePage;
