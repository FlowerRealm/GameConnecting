import { apiService } from './apiService.js';
import { showNotification } from './utils.js';

export function renderPendingOrgMemberships(responseData, renderPagination) {
    const tableContainer = document.getElementById('userTable');
    let html = `
        <table class="user-table">
            <thead>
                <tr>
                    <th><i class="fas fa-user"></i> 用户名</th>
                    <th><i class="fas fa-envelope"></i> 邮箱</th>
                    <th><i class="fas fa-sitemap"></i> 申请加入组织</th>
                    <th><i class="fas fa-calendar-plus"></i> 申请时间</th>
                    <th><i class="fas fa-tools"></i> 操作</th>
                </tr>
            </thead>
            <tbody>
    `;

    const requests = responseData.pendingRequests || [];
    if (requests.length === 0) {
        html += `<tr><td colspan="5" class="no-data"><i class="fas fa-inbox"></i> 没有待处理的组织成员申请。</td></tr>`;
    } else {
        requests.forEach(req => {
            html += `
                <tr data-membership-id="${req.membershipId}" data-user-id="${req.userId}" data-org-id="${req.organizationId}">
                    <td>${req.username || 'N/A'}</td>
                    <td>${req.userEmail || 'N/A'}</td>
                    <td>${req.organizationName || 'N/A'}</td>
                    <td>${new Date(req.requestedAt).toLocaleString('zh-CN')}</td>
                    <td>
                        <button class="action-button approve-org-member-button" title="批准加入组织">
                            <i class="fas fa-check"></i> 批准
                        </button>
                        <button class="action-button reject-org-member-button" title="拒绝加入组织">
                            <i class="fas fa-times"></i> 拒绝
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    html += '</tbody></table>';
    tableContainer.innerHTML = html;

    if (responseData.total && responseData.limit && responseData.totalPages > 1) {
        renderPagination(responseData.total, responseData.page, responseData.totalPages);
    } else {
        document.getElementById('pagination').innerHTML = '';
    }

    document.querySelectorAll('.approve-org-member-button').forEach(button => {
        button.addEventListener('click', handleOrgMembershipReview);
    });
    document.querySelectorAll('.reject-org-member-button').forEach(button => {
        button.addEventListener('click', handleOrgMembershipReview);
    });
}

async function handleOrgMembershipReview(event) {
    const button = event.currentTarget;
    const row = button.closest('tr');
    const orgId = row.dataset.orgId;
    const userId = row.dataset.userId;

    const action = button.classList.contains('approve-org-member-button') ? 'approved' : 'rejected';
    const roleToSet = (action === 'approved') ? 'member' : undefined;

    if (!confirm(`确定要 ${action === 'approved' ? '批准' : '拒绝'} 这个用户的组织申请吗?`)) {
        return;
    }

    try {
        const payload = { status_in_org: action };
        if (roleToSet) {
            payload.role_in_org = roleToSet;
        }

        const response = await apiService.request(
            `/api/admin/organizations/${orgId}/members/${userId}`,
            {
                method: 'PUT',
                body: JSON.stringify(payload)
            }
        );

        if (response.success) {
            showNotification(response.message || `组织成员申请已${action === 'approved' ? '批准' : '拒绝'}。`, 'success');
            loadData();
        } else {
            showNotification(response.message || '操作失败', 'error');
        }
    } catch (error) {
        showNotification('操作时发生错误: ' + error.message, 'error');
    }
}