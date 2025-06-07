import { AuthManager } from './auth.js';
import { apiService } from './apiService.js';
import { initNavbar } from './navbar.js';
import { socketManager } from './socket.js'; // 引入 socketManager
const auth = AuthManager.getInstance();

async function ensureAuth() {
    if (!auth.isAuthenticated() || !auth.isAdmin()) {
        window.location.href = '/';
        return false;
    }
    return true;
}

let currentTab = 'pending';
let currentPage = 1;
const limit = 10;
let selectedUserId = null;

// 初始化页面
document.addEventListener('DOMContentLoaded', async () => {
    if (!await ensureAuth()) {
        return;
    }
    initNavbar();

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            currentTab = button.dataset.tab;
            currentPage = 1;
            loadUsers();
        });
    });

    loadUsers();

    socketManager.connect();
    socketManager.on('userStatusUpdated', (updatedUser) => {
        loadUsers();
    });
});

// 加载用户列表
async function loadUsers() {
    try {
        let response;
        if (currentTab === 'pending') {
            response = await apiService.request('/admin/pending-users');
        } else {
            response = await apiService.request(`/admin/users?page=${currentPage}&limit=${limit}`);
        }

        if (response.success && response.data && response.data.success) {
            renderUsers(response.data.data);
        } else {
            showError(response.data?.message || response.message || '获取用户列表失败');
        }
    } catch (error) {
        showError('加载用户列表失败');
    }
}
// 获取状态标签
function getStatusBadge(status) {
    const statusMap = {
        pending: ['待审核', 'warning', 'fa-clock'],
        approved: ['已批准', 'success', 'fa-check-circle'],
        rejected: ['已拒绝', 'danger', 'fa-times-circle']
    };
    const [text, colorClass, icon] = statusMap[status] || ['未知', '', 'fa-question-circle'];
    return `<span class="status-badge status-${colorClass}">
        <i class="fas ${icon}"></i>
        ${text}
    </span>`;
}

// 获取操作按钮
function getActionButtons(user) {
    return `
        <div class="action-buttons">
            <button class="action-button review-button" data-review data-user-id="${user.id}">
                <i class="fas fa-user-check"></i>
                审核
            </button>
        </div>
    `;
}

// 渲染用户列表
function renderUsers(data) {
    let users = [];
    let totalUsers = 0;
    let currentPageNum = 1;
    let totalPages = 1;

    if (Array.isArray(data)) {
        users = data;
        totalUsers = data.length;
    } else if (data.users) {
        users = data.users;
        totalUsers = data.total;
        currentPageNum = data.page;
        totalPages = data.totalPages;
    } else {
        return;
    }

    const table = document.getElementById('userTable');

    let html = `
        <table class="user-table">
            <thead>
                <tr>
                    <th><i class="fas fa-user"></i> 用户名</th>
                    <th><i class="fas fa-info-circle"></i> 状态</th>
                    <th><i class="fas fa-comment"></i> 申请备注</th>
                    <th><i class="fas fa-calendar"></i> 申请时间</th>
                    <th><i class="fas fa-comment-dots"></i> 审核备注</th>
                    <th><i class="fas fa-clock"></i> 审核时间</th>
                    <th><i class="fas fa-tools"></i> 操作</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (users.length === 0) {
        html += `
            <tr>
                <td colspan="7" class="no-data">
                    <i class="fas fa-inbox"></i>
                    ${currentTab === 'pending' ? '没有待审核的用户' : '没有用户数据'}
                </td>
            </tr>
        `;
    } else {
        users.forEach(user => {
            const status = getStatusBadge(user.status);
            const date = new Date(user.createdAt).toLocaleString('zh-CN');
            const reviewInfo = user.approvedAt
                ? `${new Date(user.approvedAt).toLocaleString('zh-CN')}<br><small>(${user.approvedByUser?.username || '未知'})</small>`
                : '-';

            html += `
                <tr>
                    <td>
                        <div class="user-info">
                            <i class="fas fa-user-circle"></i>
                            ${user.username}
                        </div>
                    </td>
                    <td>${status}</td>
                    <td>
                        <div class="note-text" title="${user.note || ''}">${user.note || '-'}</div>
                    </td>
                    <td>${date}</td>
                    <td>
                        <div class="note-text" title="${user.adminNote || ''}">${user.adminNote || '-'}</div>
                    </td>
                    <td>${reviewInfo}</td>
                    <td>
                        ${user.status === 'pending' ? getActionButtons(user) : '-'}
                    </td>
                </tr>
            `;
        });
    }

    html += '</tbody></table>';
    table.innerHTML = html;

    if (currentTab === 'all' && totalUsers > limit) {
        renderPagination(totalUsers, currentPageNum, totalPages);
    } else {
        document.getElementById('pagination').innerHTML = '';
    }
    document.querySelectorAll('[data-review]').forEach(button => {
        const userId = button.dataset.userId;
        if (userId) {
            button.addEventListener('click', () => showReviewModal(userId));
        }
    });
}
// 显示审核模态框
function showReviewModal(userId) {
    selectedUserId = userId;
    const modal = document.getElementById('reviewModal');
    const user = document.querySelector(`[data-user-id="${userId}"]`).closest('tr');

    document.getElementById('modalUsername').textContent = user.cells[0].textContent;
    document.getElementById('modalApplyTime').textContent = user.cells[3].textContent;
    document.getElementById('modalNote').textContent = user.cells[2].textContent || '(无)';
    document.getElementById('adminNote').value = '';

    modal.style.display = 'block';
}

// 关闭模态框
function closeModal() {
    document.getElementById('reviewModal').style.display = 'none';
    document.getElementById('adminNote').value = '';
    selectedUserId = null;
}

// 处理审核
async function handleReview(status) {
    if (!selectedUserId) return;

    try {
        const note = document.getElementById('adminNote').value;
        const response = await apiService.request(`/admin/review-user/${selectedUserId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status,
                note,
                action: status === 'approved' ? '批准' : '拒绝'
            })
        });

        if (response.success) {
            document.getElementById('reviewModal').style.display = 'none';
            await loadUsers();
        } else {
            showError(response.message || '审核操作失败');
        }
    } catch (error) {
        showError(error.message || '审核操作失败');
    }
}

// 渲染分页
function renderPagination(total, currentPage, totalPages) {
    const pagination = document.getElementById('pagination');

    let html = `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            上一页
        </button>
        <span>第 ${currentPage} 页，共 ${totalPages} 页</span>
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            下一页
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

// 显示错误信息
function showError(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message error';
    errorDiv.textContent = message;

    const tabContainer = document.querySelector('.tab-container');
    tabContainer.insertAdjacentElement('afterend', errorDiv);

    setTimeout(() => {
        errorDiv.style.opacity = '0';
        setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
}
// 绑定全局函数
window.handleReview = handleReview;
window.changePage = changePage;
