import { AuthManager } from './auth.js';
import { initNavbar } from './navbar.js';
import { apiService } from './apiService.js';
import { showNotification, renderPagination } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const auth = AuthManager.getInstance();

    if (!auth.isAuthenticated() || !auth.isAdmin()) {
        if (!auth.isAuthenticated()) {
            window.location.href = '/login';
        } else {
            window.location.href = '/';
        }
        return;
    }

    initNavbar();

    const serverListContainer = document.getElementById('serverListContainer');
    const createServerBtn = document.getElementById('createServerBtn');

    let currentPage = 1;
    const itemsPerPage = 10;
    let totalItems = 0;
    let totalPages = 1;

    async function loadAndDisplayServers(page = 1) {
        currentPage = page;
        if (!serverListContainer) {
            console.error('Server list container not found in the DOM.');
            showNotification('页面错误：无法找到服务器列表容器。', 'error');
            return;
        }
        serverListContainer.innerHTML = '<p>正在加载服务器列表...</p>';

        try {
            const response = await apiService.request(`/api/admin/servers?page=${currentPage}&limit=${itemsPerPage}`, 'GET');

            if (response.success && response.data && Array.isArray(response.data.servers)) {
                totalItems = response.data.total || 0;
                totalPages = response.data.totalPages || 1;
                currentPage = response.data.page || 1;

                renderServerList(response.data.servers);
                renderPagination(totalItems, currentPage, totalPages, loadAndDisplayServers);
            } else {
                const errorMessage = response.message || '无法加载服务器列表: 未知错误或数据结构不匹配。';
                serverListContainer.innerHTML = `<p class="error-message">${errorMessage}</p>`;
                showNotification(errorMessage, 'error');
                renderPagination(0, 1, 1, loadAndDisplayServers); // Clear pagination
            }
        } catch (error) {
            console.error('Error fetching servers:', error);
            serverListContainer.innerHTML = '<p class="error-message">加载服务器列表时发生网络或服务器错误。</p>';
            showNotification('加载服务器列表时发生网络或服务器错误。', 'error');
            renderPagination(0, 1, 1, loadAndDisplayServers); // Clear pagination
        }
    }

    function renderServerList(servers) {
        if (!serverListContainer) return;

        if (servers.length === 0 && currentPage === 1) {
            serverListContainer.innerHTML = '<p>目前没有服务器。</p>';
            renderPagination(0, 1, 1, loadAndDisplayServers);
            return;
        }

        const table = document.createElement('table');
        table.className = 'admin-table';
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>ID</th>
                <th>名称</th>
                <th>类型</th>
                <th>创建者</th>
                <th>成员数</th>
                <th>创建时间</th>
                <th>最后活动</th>
                <th>操作</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        servers.forEach(server => {
            const row = tbody.insertRow();
            row.insertCell().textContent = server.id;
            row.insertCell().textContent = server.name;
            row.insertCell().textContent = server.room_type;
            row.insertCell().textContent = server.creatorUsername || 'N/A';
            row.insertCell().textContent = server.member_count !== undefined ? server.member_count : 'N/A';
            row.insertCell().textContent = new Date(server.created_at).toLocaleString();
            row.insertCell().textContent = new Date(server.last_active_at).toLocaleString();

            const actionsCell = row.insertCell();
            actionsCell.className = 'actions-cell';

            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fas fa-edit"></i> 编辑';
            editBtn.className = 'button small-button edit-button';
            editBtn.dataset.serverId = server.id;
            editBtn.addEventListener('click', () => handleEditServer(server));
            actionsCell.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> 删除';
            deleteBtn.className = 'button small-button delete-button';
            deleteBtn.dataset.serverId = server.id;
            deleteBtn.addEventListener('click', () => handleDeleteServer(server.id, server.name));
            actionsCell.appendChild(deleteBtn);

            const membersBtn = document.createElement('button');
            membersBtn.innerHTML = '<i class="fas fa-users"></i> 成员';
            membersBtn.className = 'button small-button members-button';
            membersBtn.dataset.serverId = server.id;
            membersBtn.dataset.serverName = server.name;
            membersBtn.addEventListener('click', () => openManageMembersModal(server.id, server.name));
            actionsCell.appendChild(membersBtn);
        });
        table.appendChild(tbody);

        serverListContainer.innerHTML = '';
        serverListContainer.appendChild(table);
    }

    loadAndDisplayServers();

    const serverModal = document.getElementById('serverModal');
    const serverModalTitle = document.getElementById('serverModalTitle');
    const serverNameInput = document.getElementById('serverName');
    const serverDescriptionInput = document.getElementById('serverDescription');
    const serverForm = document.getElementById('serverForm');
    const closeServerModalBtn = document.getElementById('closeServerModalBtn');
    const serverIdInput = document.getElementById('serverId');

    function openCreateServerModal() {
        serverModalTitle.textContent = '创建新服务器';
        serverForm.reset();
        serverIdInput.value = '';
        serverModal.style.display = 'block';
    }

    function closeServerModal() {
        serverModal.style.display = 'none';
    }

    if (createServerBtn) {
        createServerBtn.addEventListener('click', openCreateServerModal);
    }

    if (closeServerModalBtn) {
        closeServerModalBtn.addEventListener('click', closeServerModal);
    }

    function handleEditServer(server) {
        serverModalTitle.textContent = '编辑服务器';
        serverForm.reset();
        serverIdInput.value = server.id;

        serverNameInput.value = server.name;
        serverDescriptionInput.value = server.description || '';

        serverModal.style.display = 'block';
    }

    if (serverForm) {
        serverForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(serverForm);
            const serverDataFromForm = Object.fromEntries(formData.entries());

            if (!serverDataFromForm.name || serverDataFromForm.name.trim().length < 3) {
                showNotification('服务器名称至少需要3个字符。', 'error');
                return;
            }

            const payload = {
                name: serverDataFromForm.name,
                description: serverDataFromForm.description
            };

            const currentServerId = serverIdInput.value;
            let result;

            try {
                if (currentServerId) {
                    result = await apiService.request(`/api/admin/servers/${currentServerId}`, 'PUT', payload);
                } else {
                    result = await apiService.request('/api/admin/servers', 'POST', payload);
                }

                if (result.success) {
                    showNotification(currentServerId ? '服务器更新成功！' : '服务器创建成功！', 'success');
                    closeServerModal();
                    loadAndDisplayServers();
                } else {
                    showNotification(result.message || (currentServerId ? '更新失败' : '创建失败'), 'error');
                }
            } catch (error) {
                console.error('Error submitting server form:', error);
                showNotification('提交服务器信息时出错。', 'error');
            }
        });
    }

    async function handleDeleteServer(serverId, serverName) {
        if (!confirm(`您确定要删除服务器 "${serverName}" (ID: ${serverId})吗？此操作无法撤销。`)) {
            return;
        }

        try {
            const result = await apiService.request(`/api/admin/servers/${serverId}`, 'DELETE');
            if (result.success) {
                showNotification(`服务器 "${serverName}" 已成功删除。`, 'success');
                loadAndDisplayServers();
            } else {
                showNotification(result.message || `删除服务器 "${serverName}" 失败。`, 'error');
            }
        } catch (error) {
            console.error(`Error deleting server ${serverId}:`, error);
            showNotification(`删除服务器 "${serverName}" 时出错。`, 'error');
        }
    }

    const membersModal = document.getElementById('membersModal');
    const membersModalTitle = document.getElementById('membersModalTitle');
    const membersModalServerName = document.getElementById('membersModalServerName');
    const memberListContainer = document.getElementById('memberListContainer');
    const closeMembersModalBtn = document.getElementById('closeMembersModalBtn');
    let currentManagingServerId = null;

    async function openManageMembersModal(serverId, serverName) {
        currentManagingServerId = serverId;
        membersModalServerName.textContent = serverName;
        membersModal.style.display = 'block';
        memberListContainer.innerHTML = '<p>正在加载成员列表...</p>';

        try {
            const response = await apiService.request(`/api/admin/servers/${serverId}/members`, 'GET');
            if (response.success && response.data) {
                renderMemberList(response.data, serverId);
            } else {
                memberListContainer.innerHTML = `<p class="error-message">无法加载成员列表: ${response.message || '未知错误'}</p>`;
                showNotification(`无法加载成员列表: ${response.message || '未知错误'}`, 'error');
            }
        } catch (error) {
            console.error(`Error fetching members for server ${serverId}:`, error);
            memberListContainer.innerHTML = '<p class="error-message">加载成员列表时发生网络或服务器错误。</p>';
            showNotification('加载成员列表时发生网络或服务器错误。', 'error');
        }
    }

    function renderMemberList(members, serverId) {
        if (members.length === 0) {
            memberListContainer.innerHTML = '<p>此服务器没有成员。</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'admin-table members-table';
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>用户ID</th>
                <th>用户名</th>
                <th>房间角色</th>
                <th>加入时间</th>
                <th>状态</th>
                <th>操作</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        members.forEach(member => {
            const row = tbody.insertRow();
            row.insertCell().textContent = member.userId;
            row.insertCell().textContent = member.username;
            row.insertCell().textContent = member.role;
            row.insertCell().textContent = new Date(member.joinedAt).toLocaleString();
            row.insertCell().textContent = member.status;

            const kickCell = row.insertCell();
            const kickBtn = document.createElement('button');
            kickBtn.innerHTML = '<i class="fas fa-user-slash"></i> 踢出';
            kickBtn.className = 'button small-button delete-button';
            kickBtn.dataset.userId = member.userId;
            kickBtn.dataset.username = member.username;
            kickBtn.addEventListener('click', () => handleKickMember(serverId, member.userId, member.username));
            kickCell.appendChild(kickBtn);
        });
        table.appendChild(tbody);

        memberListContainer.innerHTML = '';
        memberListContainer.appendChild(table);
    }

    async function handleKickMember(serverId, userId, username) {
        if (!confirm(`您确定要从服务器踢出用户 "${username}" (ID: ${userId}) 吗？`)) {
            return;
        }

        try {
            const result = await apiService.request(`/api/admin/servers/${serverId}/members/${userId}`, 'DELETE');
            if (result.success) {
                showNotification(`用户 "${username}" 已被踢出服务器。`, 'success');
                openManageMembersModal(serverId, membersModalServerName.textContent);
                loadAndDisplayServers();
            } else {
                showNotification(result.message || `踢出用户 "${username}" 失败。`, 'error');
            }
        } catch (error) {
            console.error(`Error kicking member ${userId} from server ${serverId}:`, error);
            showNotification(`踢出用户 "${username}" 时出错。`, 'error');
        }
    }

    if (closeMembersModalBtn) {
        closeMembersModalBtn.addEventListener('click', () => {
            membersModal.style.display = 'none';
            currentManagingServerId = null;
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === serverModal) {
            closeServerModal();
        }
        if (event.target === membersModal) {
            membersModal.style.display = 'none';
            currentManagingServerId = null;
        }
    });
});
