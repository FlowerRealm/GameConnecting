import { apiService } from './apiService.js';
import { showNotification } from './utils.js';
import { clearCache, updateUser } from './admin.js';

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
            <button class="action-button edit-button" data-edit data-user-id="${user.id}"><i class="fas fa-edit"></i> 操作</button>
            <button class="action-button delete-button" data-delete data-user-id="${user.id}"><i class="fas fa-trash"></i> 删除</button>
            ${user.status === 'pending' ? `<button class="action-button review-button" data-review data-user-id="${user.id}"><i class="fas fa-user-check"></i> 审核</button>` : ''}
        </div>
    `;
}

export function renderUsers(data, currentTab, limit) {
    let users = [];
    if (Array.isArray(data)) {
        users = data;
    } else if (data.users || data.data) {
        users = data.users || data.data;
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
                        ${getActionButtons(user)}
                    </td>
                </tr>
            `;
        });
    }
    html += '</tbody></table>';
    table.innerHTML = html;
    document.getElementById('pagination').innerHTML = '';

    document.querySelectorAll('[data-review]').forEach(button => {
        const userId = button.dataset.userId;
        if (userId) {
            button.addEventListener('click', () => showReviewModal(userId));
        }
    });

    // 为操作按钮绑定点击事件
    document.querySelectorAll('[data-edit]').forEach(button => {
        const userId = button.dataset.userId;
        if (userId) {
            button.addEventListener('click', () => showEditModal(userId));
        }
    });
    // 新增：为删除按钮绑定事件
    document.querySelectorAll('[data-delete]').forEach(button => {
        const userId = button.dataset.userId;
        if (userId) {
            button.addEventListener('click', () => handleDeleteUser(userId));
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

function showEditModal(userId) {
    selectedUserId = userId; // 保证全局 userId 正确
    const modal = document.getElementById('editUserModal');
    modal.style.display = 'block';

    // 获取用户信息
    apiService.request(`/api/users/${userId}`)
        .then(response => {
            if (response.success && response.data) {
                const user = response.data;
                const modalBody = modal.querySelector('.modal-body');
                modalBody.innerHTML = `
                    <div class="form-group">
                        <label for="editStatus"><i class="fas fa-user-shield"></i> 状态:</label>
                        <select id="editStatus" class="styled-select">
                            <option value="active" ${user.status === 'active' ? 'selected' : ''}>已激活</option>
                            <option value="banned" ${user.status === 'banned' ? 'selected' : ''}>已封禁</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editRole"><i class="fas fa-user-tag"></i> 角色:</label>
                        <select id="editRole" class="styled-select">
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>普通用户</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>管理员</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editPassword"><i class="fas fa-key"></i> 新密码:</label>
                        <input type="password" id="editPassword" class="styled-input" placeholder="如需重置请输入新密码">
                    </div>
                `;
                // 不再绑定 change 事件，改为只在保存按钮点击时统一提交
            } else {
                showNotification('获取用户信息失败', 'error');
                closeModal();
            }
        })
        .catch(error => {
            console.error('获取用户信息失败:', error);
            showNotification('获取用户信息失败: ' + error.message, 'error');
            closeModal();
        });
}

export function closeModal() {
    document.getElementById('reviewModal').style.display = 'none';
    const editModal = document.getElementById('editUserModal');
    if (editModal) editModal.style.display = 'none';
    document.getElementById('adminNote').value = '';
    selectedUserId = null;
}

// 为保存编辑对话框按钮绑定点击事件
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('closeEditModalBtn').addEventListener('click', closeModal);
    document.getElementById('saveEditBtn').addEventListener('click', () => {
        const userId = selectedUserId;
        const status = document.getElementById('editStatus').value;
        const role = document.getElementById('editRole').value;
        const password = document.getElementById('editPassword').value; // 获取新密码
        updateUser(userId, status, role, password); // 传递新密码
        closeModal();
    });
});

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

function handleDeleteUser(userId) {
    if (!confirm('确定要删除该用户吗？此操作不可恢复！')) return;
    apiService.request(`/admin/users/${userId}`, { method: 'DELETE' })
        .then(response => {
            if (response.success) {
                showNotification('用户删除成功', 'success');
                clearCache('all_');
                clearCache('pending_');
                // 重新加载数据
                if (typeof loadData === 'function') loadData();
                else window.location.reload();
            } else {
                showNotification(response.message || '用户删除失败', 'error');
            }
        })
        .catch(error => {
            showNotification(error.message || '用户删除失败', 'error');
        });
}