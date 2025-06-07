import { AuthManager } from './auth.js';
import { apiService } from './apiService.js';
import { initNavbar } from './navbar.js';
import { store } from './store.js'; // 引入 store 用于通知
const auth = AuthManager.getInstance();
const limit = 10; // 每页显示的用户数量

let currentPage = 1;

document.addEventListener('DOMContentLoaded', async () => {
    if (!auth.isAuthenticated()) {
        store.addNotification('您的会话已过期或无效，请重新登录。', 'warning');
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

        if (response.success && response.data && response.data.success && response.data.data) {
            renderUsers(response.data.data);
        } else {
            showError(response.data?.message || response.message || '获取用户列表失败');
        }
    } catch (error) {
        if (error.statusCode !== 401 && error.statusCode !== 403) {
            showError('加载用户列表时发生意外错误。');
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
            const registrationDate = new Date(user.createdAt).toLocaleString('zh-CN');
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
        renderPagination(totalUsers, currentPageNum, totalPages);
    } else {
        document.getElementById('pagination').innerHTML = '';
    }
}

// 渲染分页
function renderPagination(total, currentPageNum, totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    let html = `
        <button class="pagination-button" ${currentPageNum === 1 ? 'disabled' : ''} onclick="changePage(${currentPageNum - 1})">
            <i class="fas fa-chevron-left"></i> 上一页
        </button>
        <span class="pagination-info">第 ${currentPageNum} 页 / 共 ${totalPages} 页</span>
        <button class="pagination-button" ${currentPageNum === totalPages ? 'disabled' : ''} onclick="changePage(${currentPageNum + 1})">
            下一页 <i class="fas fa-chevron-right"></i>
        </button>
    `;
    pagination.innerHTML = html;
}

// 切换页面
function changePage(page) {
    if (page < 1) return;
    currentPage = page;
    loadUsers();
}

// 显示成功信息
function showSuccess(message) {
    store.addNotification(message, 'success');
}

// 显示错误信息
function showError(message) {
    store.addNotification(message, 'error');
}

// 绑定全局函数
window.changePage = changePage;
