import { AuthManager } from './auth.js';
import { initNavbar } from './navbar.js';
import { apiService } from './apiService.js';
import { store } from './store.js'; // For notifications, if needed

document.addEventListener('DOMContentLoaded', () => {
    const auth = AuthManager.getInstance();

    if (!auth.isAuthenticated() || !auth.isAdmin()) {
        // Redirect if not an authenticated admin
        if (!auth.isAuthenticated()) {
            window.location.href = '/login';
        } else {
            window.location.href = '/'; // Redirect non-admin to homepage or an unauthorized page
        }
        return; // Stop further execution
    }

    initNavbar();

    const serverListContainer = document.getElementById('serverListContainer');
    const createServerBtn = document.getElementById('createServerBtn');
    const paginationContainer = document.getElementById('serverListPagination');

    let currentPage = 1;
    const itemsPerPage = 10; // Or make this configurable if needed
    let totalItems = 0;
    let totalPages = 1;


    async function loadAndDisplayServers(page = 1) {
        currentPage = page; // Update current page state
        if (!serverListContainer) {
            console.error('Server list container not found in the DOM.');
            store.addNotification('页面错误：无法找到服务器列表容器。', 'error');
            return;
        }
        serverListContainer.innerHTML = '<p>正在加载服务器列表...</p>';

        try {
            const response = await apiService.request('/api/admin/servers', 'GET');
            // console.log('API Response for /api/admin/servers:', response); // Kept for debugging if needed

            // Expected structure from backend: { success: true, data: SERVER_ARRAY_HERE }
            // apiService.js might wrap this, let's assume apiService returns:
            // { success: true (http ok), data: { success: true (backend ok), data: SERVER_ARRAY_HERE }, message?, statusCode? }
            // OR if apiService directly returns the backend's JSON:
            // { success: true (backend ok), data: SERVER_ARRAY_HERE }

            // console.log('API Response for /api/admin/servers:', response);

            // Backend returns { success: true, data: { servers: [], total: ..., page: ..., totalPages: ..., limit: ... } }
            if (response.success && response.data && response.data.servers) {
                if (Array.isArray(response.data.servers)) {
                    totalItems = response.data.total || 0;
                    totalPages = response.data.totalPages || 1;
                    currentPage = response.data.page || 1; // Ensure currentPage state is updated from response

                    renderServerList(response.data.servers);
                    renderPaginationControls();
                } else {
                    console.error('Expected response.data.servers to be an array, but received:', response.data.servers);
                    serverListContainer.innerHTML = `<p class="error-message">服务器列表数据格式不正确。</p>`;
                    store.addNotification('服务器列表数据格式不正确。', 'error');
                }
            } else {
                let errorMessage = '无法加载服务器列表';
                if (response.data && response.data.message) {
                     errorMessage += `: ${response.data.message}`;
                } else if (response.message) {
                     if (!(response.message === "请求失败，请稍后重试" && response.data && response.data.message)) {
                        errorMessage += `: ${response.message}`;
                    }
                } else {
                    errorMessage += ': 未知错误或数据结构不匹配。';
                }
                serverListContainer.innerHTML = `<p class="error-message">${errorMessage}</p>`;
                store.addNotification(errorMessage, 'error');
                if (paginationContainer) paginationContainer.innerHTML = ''; // Clear pagination on error too
            }
        } catch (error) {
            console.error('Error fetching servers:', error);
            serverListContainer.innerHTML = '<p class="error-message">加载服务器列表时发生网络或服务器错误。</p>';
            store.addNotification('加载服务器列表时发生网络或服务器错误。', 'error');
            if (paginationContainer) paginationContainer.innerHTML = ''; // Clear pagination on error too
        }
    }

    function renderServerList(servers) {
        if (!serverListContainer) return; // Should have been caught by loadAndDisplayServers

        if (servers.length === 0 && currentPage === 1) { // Only show "no servers" if on page 1 and it's truly empty
            serverListContainer.innerHTML = '<p>目前没有服务器。</p>';
            if (paginationContainer) paginationContainer.innerHTML = ''; // Clear pagination if no servers
            return;
        }
        // If not page 1 and servers is empty, it means user paged beyond available data,
        // pagination controls should ideally prevent this, or show a message.
        // For now, an empty table will be rendered if servers is empty on non-first page.

        const table = document.createElement('table');
        table.className = 'admin-table'; // For styling
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
            row.insertCell().textContent = server.creatorUsername || 'N/A'; // Corrected field name
            row.insertCell().textContent = server.member_count !== undefined ? server.member_count : 'N/A';
            row.insertCell().textContent = new Date(server.created_at).toLocaleString();
            row.insertCell().textContent = new Date(server.last_active_at).toLocaleString();

            const actionsCell = row.insertCell();
            actionsCell.className = 'actions-cell';

            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fas fa-edit"></i> 编辑';
            editBtn.className = 'button small-button edit-button';
            editBtn.dataset.serverId = server.id;
            // Pass the whole server object to handleEditServer to easily prefill form
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

        serverListContainer.innerHTML = ''; // Clear loading message
        serverListContainer.appendChild(table);
    }

    // Initial load
    loadAndDisplayServers();

    // Modal elements for server creation/editing
    const serverModal = document.getElementById('serverModal');
    const serverModalTitle = document.getElementById('serverModalTitle');
    const serverNameInput = document.getElementById('serverName');
    const serverDescriptionInput = document.getElementById('serverDescription');
    // const serverTypeInput = document.getElementById('serverType'); // Removed
    const serverForm = document.getElementById('serverForm');
    const closeServerModalBtn = document.getElementById('closeServerModalBtn');
    const serverIdInput = document.getElementById('serverId'); // Hidden input for server ID in edit mode

    // Function to open the server modal for creation
    function openCreateServerModal() {
        serverModalTitle.textContent = '创建新服务器';
        serverForm.reset(); // Clear any previous data
        serverIdInput.value = ''; // Ensure serverId is empty for creation
        serverModal.style.display = 'block';
    }

    // Function to close the server modal
    function closeServerModal() {
        serverModal.style.display = 'none';
    }

    // Event listener for "Create New Server" button
    if (createServerBtn) {
        createServerBtn.addEventListener('click', openCreateServerModal);
    }

    // Event listener for closing the server modal
    if (closeServerModalBtn) {
        closeServerModalBtn.addEventListener('click', closeServerModal);
    }
    // Also close modal if user clicks outside of it (optional, standard modal behavior)
    window.addEventListener('click', (event) => {
        if (event.target === serverModal) {
            closeServerModal();
        }
        // Add similar logic for membersModal if it's implemented in the same way
    });

    // Function to open the server modal for editing
    function handleEditServer(server) {
        serverModalTitle.textContent = '编辑服务器';
        serverForm.reset(); // Clear any previous data
        serverIdInput.value = server.id; // Set the server ID for submission

        // Populate form fields
        serverNameInput.value = server.name;
        serverDescriptionInput.value = server.description || '';
        // serverTypeInput.value = server.room_type; // Removed

        serverModal.style.display = 'block';
    }

    // Handle Server Form Submission (Create/Edit)
    if (serverForm) {
        serverForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(serverForm);
            const serverDataFromForm = Object.fromEntries(formData.entries()); // Contains name, description, room_type, serverId (if editing)

            // Basic client-side validation (can be enhanced)
            if (!serverDataFromForm.name || serverDataFromForm.name.trim().length < 3) {
                store.addNotification('服务器名称至少需要3个字符。', 'error');
                return;
            }

            // Prepare data for API (only send relevant fields for update)
            const payload = {
                name: serverDataFromForm.name,
                description: serverDataFromForm.description
                // room_type is no longer sent from the form
            };

            const currentServerId = serverIdInput.value; // This is reliable now
            let result;

            try {
                if (currentServerId) {
                    // EDIT operation
                    result = await apiService.request(`/api/admin/servers/${currentServerId}`, 'PUT', payload);
                } else {
                    // CREATE operation
                    result = await apiService.request('/api/admin/servers', 'POST', payload);
                }

                if (result.success) {
                    store.addNotification(currentServerId ? '服务器更新成功！' : '服务器创建成功！', 'success');
                    closeServerModal();
                    loadAndDisplayServers(); // Refresh the list
                } else {
                    store.addNotification(result.message || (currentServerId ? '更新失败' : '创建失败'), 'error');
                }
            } catch (error) {
                console.error('Error submitting server form:', error);
                store.addNotification('提交服务器信息时出错。', 'error');
            }
        });
    }

    // Function to handle server deletion
    async function handleDeleteServer(serverId, serverName) {
        if (!confirm(`您确定要删除服务器 "${serverName}" (ID: ${serverId})吗？此操作无法撤销。`)) {
            return;
        }

        try {
            const result = await apiService.request(`/api/admin/servers/${serverId}`, 'DELETE');
            if (result.success) {
                store.addNotification(`服务器 "${serverName}" 已成功删除。`, 'success');
                loadAndDisplayServers(); // Refresh the list
            } else {
                store.addNotification(result.message || `删除服务器 "${serverName}" 失败。`, 'error');
            }
        } catch (error) {
            console.error(`Error deleting server ${serverId}:`, error);
            store.addNotification(`删除服务器 "${serverName}" 时出错。`, 'error');
        }
    }

    // Modal elements for member management
    const membersModal = document.getElementById('membersModal');
    const membersModalTitle = document.getElementById('membersModalTitle');
    const membersModalServerName = document.getElementById('membersModalServerName');
    const memberListContainer = document.getElementById('memberListContainer');
    const closeMembersModalBtn = document.getElementById('closeMembersModalBtn');
    let currentManagingServerId = null; // To store serverId for member management

    // Function to open the manage members modal
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
                store.addNotification(`无法加载成员列表: ${response.message || '未知错误'}`, 'error');
            }
        } catch (error) {
            console.error(`Error fetching members for server ${serverId}:`, error);
            memberListContainer.innerHTML = '<p class="error-message">加载成员列表时发生网络或服务器错误。</p>';
            store.addNotification('加载成员列表时发生网络或服务器错误。', 'error');
        }
    }

    // Function to render the member list in the modal
    function renderMemberList(members, serverId) {
        if (members.length === 0) {
            memberListContainer.innerHTML = '<p>此服务器没有成员。</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'admin-table members-table'; // For styling
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
            row.insertCell().textContent = member.role; // Role in room
            row.insertCell().textContent = new Date(member.joinedAt).toLocaleString();
            row.insertCell().textContent = member.status; // User's global status

            const kickCell = row.insertCell();
            // Prevent kicking self (if admin is listed as a member, though unlikely for this flow)
            // More importantly, prevent kicking the owner if the API/service didn't already block it.
            // The service layer `kickMemberByAdmin` already prevents kicking the owner.
            const kickBtn = document.createElement('button');
            kickBtn.innerHTML = '<i class="fas fa-user-slash"></i> 踢出';
            kickBtn.className = 'button small-button delete-button';
            kickBtn.dataset.userId = member.userId;
            kickBtn.dataset.username = member.username;
            kickBtn.addEventListener('click', () => handleKickMember(serverId, member.userId, member.username));
            kickCell.appendChild(kickBtn);
        });
        table.appendChild(tbody);

        memberListContainer.innerHTML = ''; // Clear loading message
        memberListContainer.appendChild(table);
    }

    // Function to handle kicking a member
    async function handleKickMember(serverId, userId, username) {
        if (!confirm(`您确定要从服务器踢出用户 "${username}" (ID: ${userId}) 吗？`)) {
            return;
        }

        try {
            const result = await apiService.request(`/api/admin/servers/${serverId}/members/${userId}`, 'DELETE');
            if (result.success) {
                store.addNotification(`用户 "${username}" 已被踢出服务器。`, 'success');
                // Refresh the member list in the modal
                openManageMembersModal(serverId, membersModalServerName.textContent);
                // Optionally, refresh the main server list if member count is displayed and needs update
                loadAndDisplayServers();
            } else {
                store.addNotification(result.message || `踢出用户 "${username}" 失败。`, 'error');
            }
        } catch (error) {
            console.error(`Error kicking member ${userId} from server ${serverId}:`, error);
            store.addNotification(`踢出用户 "${username}" 时出错。`, 'error');
        }
    }

    // Event listener for closing the members modal
    if (closeMembersModalBtn) {
        closeMembersModalBtn.addEventListener('click', () => {
            membersModal.style.display = 'none';
            currentManagingServerId = null; // Reset
        });
    }
    // Also close members modal if user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target === serverModal) { // Existing from create/edit
            closeServerModal();
        }
        if (event.target === membersModal) {
            membersModal.style.display = 'none';
            currentManagingServerId = null; // Reset
        }
    });
});
