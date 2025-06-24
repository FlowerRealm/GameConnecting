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

let currentTab = 'pending'; // Default to user pending tab
let currentPage = 1;
const limit = 10; // Default page size
let selectedUserId = null; // For user review modal
let currentOrgId = null; // For organization member management
let currentOrgName = null; // For organization member management

// Initialize page
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
            loadData(); // Changed from loadUsers to generic loadData
        });
    });

    loadData(); // Initial data load

    // Socket connection (if needed for real-time updates on this page)
    // socketManager.connect();
    // socketManager.on('userStatusUpdated', (updatedUser) => {
    //     if (currentTab === 'pending' || currentTab === 'all') loadData();
    // });
    // socketManager.on('orgMembershipUpdated', (updatedMembership) => {
    //     if (currentTab === 'org-pending') loadData();
    // });
});

// Generic data loading function based on currentTab
async function loadData() {
    try {
        let response;
        if (currentTab === 'pending') {
            response = await apiService.request('/admin/pending-users'); // This endpoint might not be paginated by default
        } else if (currentTab === 'all') {
            response = await apiService.request(`/admin/users?page=${currentPage}&limit=${limit}`);
        } else if (currentTab === 'org-pending') {
            response = await apiService.request('/api/admin/organizations/pending-memberships', {
                params: { page: currentPage, limit: limit }
            });
        } else if (currentTab === 'orgs') {
            // For now, just clear the table and pagination for the new tab
            // We will implement loadOrganizations and renderOrganizations later
            document.getElementById('userTable').innerHTML = '';
            document.getElementById('pagination').innerHTML = '';
            loadOrganizations(); // Call the new function to load organizations
            return; // Return early as loadOrganizations will handle rendering
        } else {
            console.error('Unknown tab:', currentTab);
            showError('未知标签页');
            return;
        }

        // Standardize response checking: expect { success: true, data: { actualData, paginationInfo } }
        // Or for non-paginated like pending-users: { success: true, data: [items] }
        if (response.success && response.data) {
            if (response) { // Ensure response is not undefined (e.g. for 'orgs' tab if we return early)
                if (currentTab === 'pending' || currentTab === 'all') {
                    // The old endpoints had data nested under response.data.data
                    // Adjust if your actual pending-users endpoint returns data directly
                    renderUsers(response.data.data || response.data); // Try response.data.data first, then response.data
                } else if (currentTab === 'org-pending') {
                    renderPendingOrgMemberships(response.data); // Service returns data directly under response.data
                }
            }
        } else if (response) { // Check response exists before trying to access response.message
            showError(response.message || `获取${currentTab}列表失败`);
        } else if (currentTab !== 'orgs') { // Don't show error for 'orgs' tab if response is undefined due to early return
            showError(`获取${currentTab}列表失败`);
        }
    } catch (error) {
        console.error(`Error loading data for tab ${currentTab}:`, error);
        showError(`加载${currentTab}列表失败: ${error.message}`);
    }
}

// --- User Review Functions (existing) ---
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

function renderUsers(data) {
    let users = [];
    let totalUsers = 0;
    let currentPageNum = 1;
    let totalPages = 1;

    if (Array.isArray(data)) { // For non-paginated results like initial pending-users
        users = data;
        totalUsers = data.length;
        // No pagination for this case in the old code, so clear pagination
        document.getElementById('pagination').innerHTML = '';
    } else if (data.users || data.data) { // For paginated results (all users) or potentially other structures
        users = data.users || data.data; // Adjust based on actual API response
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
            const status = getStatusBadge(user.status);
            const date = new Date(user.createdAt || user.created_at).toLocaleString('zh-CN'); // Handle both casings
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

    if ( (currentTab === 'all' || (data && data.totalPages > 1) ) && totalUsers > (data.limit || limit) ) {
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
    // Find user data from the table row, assuming username is in the first cell, apply time in 4th, note in 3rd.
    const userRow = Array.from(document.querySelectorAll('#userTable tbody tr')).find(row => row.querySelector(`[data-user-id="${userId}"]`));

    if (userRow) {
        document.getElementById('modalUsername').textContent = userRow.cells[0].textContent.trim();
        document.getElementById('modalApplyTime').textContent = userRow.cells[3].textContent.trim();
        document.getElementById('modalNote').textContent = userRow.cells[2].querySelector('.note-text')?.title || '(无)';
    } else { // Fallback if data attribute isn't on button but on row or cell
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

window.closeModal = function() { // Make it global for inline onclick
    document.getElementById('reviewModal').style.display = 'none';
    document.getElementById('adminNote').value = '';
    selectedUserId = null;
}

window.handleReview = async function(status) { // Make it global
    if (!selectedUserId) return;
    try {
        const note = document.getElementById('adminNote').value;
        const response = await apiService.request(`/admin/review-user/${selectedUserId}`, {
            method: 'POST',
            body: JSON.stringify({
                status,
                note,
                action: status === 'approved' ? '批准' : '拒绝'
            })
        });
        if (response.success) {
            closeModal();
            loadData(); // Reload current tab's data
        } else {
            showError(response.message || '审核操作失败');
        }
    } catch (error) {
        showError(error.message || '审核操作失败');
    }
}
// --- End of User Review Functions ---


// --- Organization Membership Review Functions ---
function renderPendingOrgMemberships(responseData) {
    const tableContainer = document.getElementById('userTable'); // Reusing the same table container
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
    // const membershipId = row.dataset.membershipId; // Can use this if API supports update by membershipId

    const action = button.classList.contains('approve-org-member-button') ? 'approved' : 'rejected';
    // For this admin action, role is 'member' by default upon approval, as set by user during registration request.
    // If admin needs to set a different role, the UI would need a role selector for this action.
    const roleToSet = (action === 'approved') ? 'member' : undefined;

    if (!confirm(`确定要 ${action === 'approved' ? '批准' : '拒绝'} 这个用户的组织申请吗?`)) {
        return;
    }

    try {
        const payload = { status_in_org: action };
        // Only include role_in_org if approving and a specific role is to be set.
        // The service `updateOrganizationMember` expects `role_in_org` and/or `status_in_org`.
        // If role is not changing, don't send it. For initial approval, it's usually to 'member'.
        if (roleToSet) { // This means if action is 'approved'
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
            showError(response.message || `组织成员申请已${action === 'approved' ? '批准' : '拒绝'}。`, 'success'); // Use 'success' type
            loadData(); // Reload current tab's data
        } else {
            showError(response.message || '操作失败');
        }
    } catch (error) {
        showError('操作时发生错误: ' + error.message);
    }
}
// --- End of Organization Membership Review Functions ---

// --- Manage Organizations Functions ---
async function loadOrganizations() {
    try {
        const response = await apiService.request('/api/admin/organizations');

        if (response.success && response.data && response.data.organizations && Array.isArray(response.data.organizations)) {
            renderOrganizations(response.data.organizations);
            // If response.data.message exists and indicates success, it's usually not displayed as a notification.
            // showError(response.data.message, 'success'); // Optional: if you want to show success messages
        } else {
            // Error path: either API call failed, or data structure is wrong
            let clientErrorMessage = '获取组织列表失败'; // Default client-side error prefix

            if (response.success && response.data) {
                // API call was "successful" (e.g. HTTP 200) but data is malformed client-side
                if (!response.data.organizations) {
                    clientErrorMessage = '获取组织列表失败：响应中缺少组织数据。';
                } else if (!Array.isArray(response.data.organizations)) {
                    clientErrorMessage = '获取组织列表失败：组织数据格式不正确（不是数组）。';
                    console.error('Expected response.data.organizations to be an array, received:', response.data.organizations);
                }
                // Do NOT append response.data.message or response.message if it's a success message from backend.
                // However, if response.data.success is false, then response.data.message is an error.
                if (response.data.success === false && response.data.message) {
                    clientErrorMessage = response.data.message; // Use specific error from backend data payload
                }

            } else if (!response.success && response.message) {
                // apiService itself marked it as not successful (e.g. HTTP error, network error)
                // response.message should be an actual error message from apiService or backend
                clientErrorMessage = response.message;
            } else {
                // Fallback for other unexpected scenarios
                clientErrorMessage = '获取组织列表失败：未知错误或响应结构不匹配。';
            }
            showError(clientErrorMessage, 'error');
            document.getElementById('userTable').innerHTML = `<p class="error-message">${clientErrorMessage}</p>`;
        }
    } catch (error) {
        console.error('Error loading organizations:', error);
        showError(`加载组织列表失败: ${error.message}`);
        document.getElementById('userTable').innerHTML = '<p class="error-message">加载组织列表时发生错误。</p>';
    }
    // Clear pagination for organization list as it's not paginated in this design
    document.getElementById('pagination').innerHTML = '';
}

function renderOrganizations(organizations) {
    const tableContainer = document.getElementById('userTable');
    let html = `
        <div class="organizations-list-container">
            <h2>组织列表</h2>
            <ul class="organizations-list">
    `;

    if (organizations.length === 0) {
        html += `<li class="no-data"><i class="fas fa-sitemap"></i> 没有找到任何组织。</li>`;
    } else {
        organizations.forEach(org => {
            html += `
                <li class="organization-item" data-org-id="${org.id}" data-org-name="${org.name}">
                    <span class="org-name">${org.name}</span>
                    <span class="org-id">(ID: ${org.id})</span>
                </li>
            `;
        });
    }
    html += `
            </ul>
        </div>
        <div class="organization-members-container">
            <h3 id="orgMembersHeader" style="display:none;">组织成员</h3>
            <div id="organizationMembersList">
                <!-- Members will be loaded here -->
            </div>
        </div>
    `;
    tableContainer.innerHTML = html;

    document.querySelectorAll('.organization-item').forEach(item => {
        item.addEventListener('click', () => {
            // Highlight clicked organization
            document.querySelectorAll('.organization-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            handleOrganizationClick(item.dataset.orgId, item.dataset.orgName);
        });
    });
}

async function handleOrganizationClick(orgId, orgName) {
    const membersListDiv = document.getElementById('organizationMembersList');
    const membersHeader = document.getElementById('orgMembersHeader');

    // Store current org details for later use (e.g., role change)
    currentOrgId = orgId;
    currentOrgName = orgName;

    membersListDiv.innerHTML = '<p>正在加载成员...</p>'; // Show loading indicator
    membersHeader.textContent = `"${orgName}" 的成员`;
    membersHeader.style.display = 'block';

    try {
        const response = await apiService.request(`/api/admin/organizations/${currentOrgId}/members`);
        if (response.success && response.data) {
            renderOrganizationMembers(response.data, membersListDiv, currentOrgId, currentOrgName); // Pass orgId and orgName
        } else {
            showError(response.message || `获取组织 ${currentOrgName} 成员失败`);
            membersListDiv.innerHTML = `<p class="error-message">无法加载组织 ${currentOrgName} 的成员。</p>`;
        }
    } catch (error) {
        console.error(`Error loading members for organization ${orgId}:`, error);
        showError(`加载组织 ${currentOrgName} 成员失败: ${error.message}`);
        membersListDiv.innerHTML = `<p class="error-message">加载组织 ${currentOrgName} 成员时发生错误。</p>`;
    }
}

function renderOrganizationMembers(members, containerDiv, orgId, orgName) { // Added orgId, orgName
    let html = '';
    if (members.length === 0) {
        html = '<p class="no-data"><i class="fas fa-users"></i> 该组织没有成员。</p>';
    } else {
        html = `
            <table class="members-table">
                <thead>
                    <tr>
                        <th><i class="fas fa-user"></i> 用户名</th>
                        <th><i class="fas fa-id-card"></i> 用户ID</th>
                        <th><i class="fas fa-user-tag"></i> 组织角色</th>
                        <th><i class="fas fa-info-circle"></i> 组织状态</th>
                        <th><i class="fas fa-edit"></i> 修改角色</th>
                    </tr>
                </thead>
                <tbody>
        `;
        members.forEach(member => {
            const currentRole = member.role_in_org;
            const userId = member.user?.id;

            html += `
                <tr data-user-id="${userId}">
                    <td>${member.user?.username || 'N/A'}</td>
                    <td>${userId || 'N/A'}</td>
                    <td>${currentRole || 'N/A'}</td>
                    <td>${member.status_in_org || 'N/A'}</td>
                    <td>
                        ${userId ? `
                        <select class="role-select" data-user-id="${userId}">
                            <option value="member" ${currentRole === 'member' ? 'selected' : ''}>Member</option>
                            <option value="org_admin" ${currentRole === 'org_admin' ? 'selected' : ''}>Org Admin</option>
                        </select>
                        ` : 'N/A'}
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table>';
    }
    containerDiv.innerHTML = html;

    // Add event listeners to the new dropdowns
    containerDiv.querySelectorAll('.role-select').forEach(selectElement => {
        selectElement.addEventListener('change', async (event) => {
            const newSelectedRole = event.target.value;
            const userIdToUpdate = event.target.dataset.userId;
            // orgId and orgName are available from the outer scope (currentOrgId, currentOrgName)

            if (!currentOrgId || !userIdToUpdate) {
                showError('无法更新角色：缺少组织或用户信息。');
                return;
            }

            try {
                const response = await apiService.request(
                    `/api/admin/organizations/${currentOrgId}/members/${userIdToUpdate}`,
                    {
                        method: 'PUT',
                        body: JSON.stringify({ role_in_org: newSelectedRole })
                    }
                );

                if (response.success) {
                    showError('角色更新成功！', 'success');
                    // Refresh the member list to show the updated role
                    // Pass currentOrgId and currentOrgName which are stored at a higher scope
                    handleOrganizationClick(currentOrgId, currentOrgName);
                } else {
                    showError(response.message || '角色更新失败。');
                    // Revert dropdown if needed, or refresh to show original state
                    handleOrganizationClick(currentOrgId, currentOrgName);
                }
            } catch (error) {
                console.error('Error updating role:', error);
                showError(`角色更新时发生错误: ${error.message}`);
                // Revert dropdown or refresh
                handleOrganizationClick(currentOrgId, currentOrgName);
            }
        });
    });
}
// --- End Manage Organizations Functions ---

// --- Utility and Pagination Functions (existing, ensure they are global or accessible) ---
function renderPagination(total, currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    let html = `
        <button class="pagination-button" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i> 上一页
        </button>
        <span>第 ${currentPage} 页 / 共 ${totalPages} 页 (总计 ${total} 项)</span>
        <button class="pagination-button" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            下一页 <i class="fas fa-chevron-right"></i>
        </button>
    `;
    pagination.innerHTML = html;
}

window.changePage = function(page) { // Make it global
    if (page < 1) return;
    // A check for totalPages might be good here if known: if (page > totalPages) return;
    currentPage = page;
    loadData();
}

function showError(message, type = 'error') { // Modified to accept type
    const existingMessage = document.querySelector('.message-banner');
    if (existingMessage) {
        existingMessage.remove();
    }
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-banner ${type}`; // Use type for class
    messageDiv.textContent = message;

    const container = document.querySelector('.admin-container') || document.body;
    container.insertAdjacentElement('afterbegin', messageDiv); // Insert at top of admin container

    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => messageDiv.remove(), 500); // Fade out then remove
    }, 3000);
}

// Ensure global functions are explicitly set on window if not already
// window.closeModal = closeModal; (already global via onclick)
// window.handleReview = handleReview; (already global)
// window.changePage = changePage; (already global)
