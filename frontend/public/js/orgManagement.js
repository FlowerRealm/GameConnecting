import { apiService } from './apiService.js';
import { showNotification } from './utils.js';

let currentOrgId = null;
let currentOrgName = null;

export async function loadOrganizations() {
    try {
        const response = await apiService.request('/api/admin/organizations');
        if (response.success &&
            response.data &&
            Array.isArray(response.data.organizations)) {
            renderOrganizations(response.data.organizations);
        } else {
            let clientErrorMessage = '获取组织列表失败';
            if (!response.success && response.message) {
                clientErrorMessage = response.message;
            } else if (response.data && response.data.success === false && response.data.message) {
                clientErrorMessage = response.data.message;
            } else if (response.data && !Array.isArray(response.data.organizations)) {
                clientErrorMessage = '获取组织列表失败：组织数据格式不正确。';
                console.error('Expected response.data.organizations to be an array, received:', response.data.organizations);
            } else if (!response.data) {
                clientErrorMessage = '获取组织列表失败：响应中缺少预期的组织数据结构。';
            } else if (response.success && response.data && !response.data.organizations) {
                clientErrorMessage = '获取组织列表失败：响应数据中缺少组织列表。';
            } else {
                clientErrorMessage = '获取组织列表失败：未知错误或响应不完整。';
            }
            showNotification(clientErrorMessage, 'error');
            document.getElementById('userTable').innerHTML = `<p class="error-message">${clientErrorMessage}</p>`;
        }
    } catch (error) {
        console.error('Error loading organizations:', error);
        showNotification(`加载组织列表失败: ${error.message}`, 'error');
        document.getElementById('userTable').innerHTML = '<p class="error-message">加载组织列表时发生错误。</p>';
    }
    document.getElementById('pagination').innerHTML = '';
}

function renderOrganizations(organizations) {
    const tableContainer = document.getElementById('userTable');
    let html = `
        <div class="admin-actions" style="margin-bottom: 1rem;">
            <button id="createNewOrgBtn" class="button primary-button">
                <i class="fas fa-plus-circle"></i> 创建新组织
            </button>
        </div>
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
            </div>
        </div>
    `;
    tableContainer.innerHTML = html;

    document.querySelectorAll('.organization-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.organization-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            handleOrganizationClick(item.dataset.orgId, item.dataset.orgName);
        });
    });

    const createNewOrgBtn = document.getElementById('createNewOrgBtn');
    if (createNewOrgBtn) {
        createNewOrgBtn.addEventListener('click', openCreateOrgModal);
    }
}

function openCreateOrgModal() {
    const createOrgModal = document.getElementById('createOrgModal');
    if (createOrgModal) {
        const createOrgForm = document.getElementById('createOrgForm');
        if (createOrgForm) createOrgForm.reset();
        const orgIsPublicCheckbox = document.getElementById('orgIsPublic');
        if (orgIsPublicCheckbox) orgIsPublicCheckbox.checked = true;
        createOrgModal.style.display = 'block';
    } else {
        console.error('Create Organization Modal not found in DOM.');
        alert('创建组织功能暂不可用，缺少模态框。');
    }
}

export function closeCreateOrgModal() {
    const createOrgModal = document.getElementById('createOrgModal');
    if (createOrgModal) {
        createOrgModal.style.display = 'none';
    }
}

export function initOrgManagement() {
    const createOrgModal = document.getElementById('createOrgModal');
    const closeCreateOrgModalBtn = document.getElementById('closeCreateOrgModalBtn');
    const createOrgForm = document.getElementById('createOrgForm');

    if (closeCreateOrgModalBtn) {
        closeCreateOrgModalBtn.addEventListener('click', closeCreateOrgModal);
    }

    window.addEventListener('click', (event) => {
        if (event.target == createOrgModal) {
            closeCreateOrgModal();
        }
    });

    if (createOrgForm) {
        createOrgForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const orgNameInput = document.getElementById('orgName');
            const orgDescriptionInput = document.getElementById('orgDescription');
            const orgIsPublicCheckbox = document.getElementById('orgIsPublic');

            const name = orgNameInput.value.trim();
            const description = orgDescriptionInput.value.trim();
            const is_publicly_listable = orgIsPublicCheckbox.checked;

            if (!name || name.length < 3) {
                showNotification('组织名称至少需要3个字符。', 'error');
                return;
            }

            const payload = { name, description, is_publicly_listable };

            try {
                const response = await apiService.request('/api/admin/organizations', 'POST', payload);
                if (response.success) {
                    showNotification('组织创建成功！', 'success');
                    closeCreateOrgModal();
                    loadOrganizations();
                } else {
                    showNotification(response.message || '创建组织失败。', 'error');
                }
            } catch (error) {
                console.error('Error creating organization:', error);
                showNotification('创建组织时发生错误。', 'error');
            }
        });
    }
}

async function handleOrganizationClick(orgId, orgName) {
    const membersListDiv = document.getElementById('organizationMembersList');
    const membersHeader = document.getElementById('orgMembersHeader');

    currentOrgId = orgId;
    currentOrgName = orgName;

    membersListDiv.innerHTML = '<p>正在加载成员...</p>';
    membersHeader.textContent = `"${orgName}" 的成员`;
    membersHeader.style.display = 'block';

    try {
        const response = await apiService.request(`/api/admin/organizations/${currentOrgId}/members`);
        if (response.success && response.data) {
            renderOrganizationMembers(response.data, membersListDiv, currentOrgId, currentOrgName);
        } else {
            showNotification(response.message || `获取组织 ${currentOrgName} 成员失败`, 'error');
            membersListDiv.innerHTML = `<p class="error-message">无法加载组织 ${currentOrgName} 的成员。</p>`;
        }
    } catch (error) {
        console.error(`Error loading members for organization ${orgId}:`, error);
        showNotification(`加载组织 ${currentOrgName} 成员失败: ${error.message}`, 'error');
        membersListDiv.innerHTML = `<p class="error-message">加载组织 ${currentOrgName} 成员时发生错误。</p>`;
    }
}

function renderOrganizationMembers(members, containerDiv, orgId, orgName) {
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

    containerDiv.querySelectorAll('.role-select').forEach(selectElement => {
        selectElement.addEventListener('change', async (event) => {
            const newSelectedRole = event.target.value;
            const userIdToUpdate = event.target.dataset.userId;

            if (!currentOrgId || !userIdToUpdate) {
                showNotification('无法更新角色：缺少组织或用户信息。', 'error');
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
                    showNotification('角色更新成功！', 'success');
                    handleOrganizationClick(currentOrgId, currentOrgName);
                } else {
                    showNotification(response.message || '角色更新失败。', 'error');
                    handleOrganizationClick(currentOrgId, currentOrgName);
                }
            } catch (error) {
                console.error('Error updating role:', error);
                showNotification(`角色更新时发生错误: ${error.message}`, 'error');
                handleOrganizationClick(currentOrgId, currentOrgName);
            }
        });
    });
}