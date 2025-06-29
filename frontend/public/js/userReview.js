import { apiService } from './apiService.js';
import { showNotification } from './utils.js';
import { clearCache } from './admin.js';

let selectedUserId = null;

function getStatusBadge(status) {
    const statusMap = {
        pending: ['待审核', 'warning', 'fa-clock'],
        approved: ['已批准', 'success', 'fa-check-circle'],
        rejected: ['已拒绝', 'danger', 'fa-times-circle'],
        active: ['已激活', 'success', 'fa-check-circle'],
        banned: ['已封禁', 'danger', 'fa-ban'],
        suspended: ['已暂停', 'warning', 'fa-pause-circle']
    };
    const [text, colorClass, icon] = statusMap[status] || ['未知', '', 'fa-question-circle'];
    return `<span class="status-badge status-${colorClass}">
        <i class="fas ${icon}"></i>
        ${text}
    </span>`;
}

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

export function renderUsers(data, currentTab, limit) {
    let users = [];
    let totalUsers = 0;
    let currentPageNum = 1;
    let totalPages = 1;

    if (Array.isArray(data)) {
        users = data;
        totalUsers = data.length;
        document.getElementById('pagination').innerHTML = '';
    } else if (data.users || data.data) {
        users = data.users || data.data;
        totalUsers = data.total;
        currentPageNum = data.page;
        totalPages = data.totalPages;
    } else {
        console.warn("renderUsers received unexpected data format:", data);
        document.getElementById('userTable').innerHTML = '<tr><td colspan="7" class="no-data">数据格式错误。</td></tr>';
        document.getElementById('pagination').innerHTML = '';
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
            console.log('User object in renderUsers:', user);
            const status = getStatusBadge(user.status);
            const date = new Date(user.createdAt || user.created_at).toLocaleString('zh-CN');
            const reviewInfo = user.approvedAt || user.approved_at
                ? `${new Date(user.approvedAt || user.approved_at).toLocaleString('zh-CN')}<br><small>(${user.approvedByUsername || '未知'})</small>`
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

    if ((currentTab === 'all' || (data && data.totalPages > 1)) && totalUsers > (data.limit || limit)) {
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

function showReviewModal(userId) {
    selectedUserId = userId;
    const modal = document.getElementById('reviewModal');
    const userRow = Array.from(document.querySelectorAll('#userTable tbody tr')).find(row => row.querySelector(`[data-user-id="${userId}"]`));

    if (userRow) {
        document.getElementById('modalUsername').textContent = userRow.cells[0].textContent.trim();
        document.getElementById('modalApplyTime').textContent = userRow.cells[3].textContent.trim();
        document.getElementById('modalNote').textContent = userRow.cells[2].querySelector('.note-text')?.title || '(无)';
    } else {
        const userButton = document.querySelector(`[data-user-id="${userId}"]`);
        if (userButton) {
            const row = userButton.closest('tr');
            document.getElementById('modalUsername').textContent = row.cells[0].textContent.trim();
            document.getElementById('modalApplyTime').textContent = row.cells[3].textContent.trim();
            document.getElementById('modalNote').textContent = row.cells[2].querySelector('.note-text')?.title || '(无)';
        } else {
            console.error("Could not find user data for modal for userId:", userId);
            document.getElementById('modalUsername').textContent = 'N/A';
            document.getElementById('modalApplyTime').textContent = 'N/A';
            document.getElementById('modalNote').textContent = 'N/A';
        }
    }
    document.getElementById('adminNote').value = '';
    modal.style.display = 'block';
}

export function closeModal() {
    document.getElementById('reviewModal').style.display = 'none';
    document.getElementById('adminNote').value = '';
    selectedUserId = null;
}

export async function handleReview(status, loadData) {
    if (!selectedUserId) return;
    try {
        const note = document.getElementById('adminNote').value;

        let backendStatus;
        if (status === 'approved') {
            backendStatus = 'active';
        } else if (status === 'rejected') {
            backendStatus = 'banned';
        } else {
            showNotification('无效的状态值', 'error');
            return;
        }

        const response = await apiService.request(`/admin/review-user/${selectedUserId}`, {
            method: 'POST',
            body: JSON.stringify({
                status: backendStatus,
                admin_note: note
            })
        });
        if (response.success) {
            clearCache('pending_');
            clearCache('all_');
            closeModal();
            loadData();
        } else {
            showNotification(response.message || '审核操作失败', 'error');
        }
    } catch (error) {
        showNotification(error.message || '审核操作失败', 'error');
    }
}