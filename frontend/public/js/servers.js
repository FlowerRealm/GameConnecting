import { AuthManager } from './auth.js';
import { apiService } from './apiService.js';
import { config } from './config.js';
import { initNavbar } from './navbar.js';
import { store } from './store.js';

const auth = AuthManager.getInstance();
let editingServerId = null;

let currentModalServerInfo = { id: null, isOwner: false, isSiteAdmin: false, members: [] };

if (!auth.isAuthenticated()) {
    window.location.href = '/login';
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!auth.isAuthenticated()) { // Double check
        window.location.href = '/login';
        return;
    }
    initNavbar();
    loadServers();
    document.getElementById('serverForm').addEventListener('submit', handleServerSubmit);

    document.getElementById('serverDetailModal').addEventListener('click', (event) => {
        if (event.target === event.currentTarget) {
            closeServerDetailModal();
        }
    });

    document.querySelectorAll('.sidebar-tabs .tab-button').forEach(button => {
        button.addEventListener('click', handleTabSwitch);
    });
});
function handleTabSwitch(event) {
    const targetTab = event.target.dataset.tab;

    // 移除所有标签页的active类
    document.querySelectorAll('.sidebar-tabs .tab-button').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelectorAll('.sidebar-content > div').forEach(content => {
        content.classList.remove('active');
    });

    event.target.classList.add('active');
    document.querySelector(`.sidebar-content > div[data-tab-content="${targetTab}"]`).classList.add('active');

    const currentServerId = document.getElementById('serverDetailModal').dataset.serverId;
    if (currentServerId) {
        if (targetTab === 'members') {
            loadServerMembers(currentServerId);
        } else if (targetTab === 'requests') {
            loadJoinRequests(currentServerId);
        }
    }
}
async function loadServers() {
    try {
        // 根据用户角色决定加载所有服务器还是仅加入的服务器
        // 这里我们假设普通用户看到的是他们可以加入或已加入的服务器列表
        // 管理员可能看到所有服务器
        const apiResponse = await apiService.request('/servers');
        // apiResponse.data from apiService is the backend's response: { success: boolean, data: array | object, message?: string }
        if (apiResponse.success && apiResponse.data && apiResponse.data.success) {
            renderServers(apiResponse.data.data);
        } else {
            showError(apiResponse.data?.message || apiResponse.message || '加载服务器列表失败');
        }
    } catch (error) {
        showError('加载服务器列表失败');
    }
}

function renderServers(servers) {
    const serverList = document.getElementById('serverList');
    const isAdmin = auth.isAdmin();
    const currentUserId = auth.getUserId();

    let html = '';
    if (servers.length === 0) {
        serverList.innerHTML = '<p class="no-servers-message">暂无可用服务器。您可以尝试创建一个！</p>';
        return;
    }

    servers.forEach(server => {
        const memberCount = server.onlineMembers || 0;
        html += `
            <div class="server-card glassmorphic-container" data-id="${server.id}">
                <div class="server-header">
                    <h3>${server.name}</h3>
                    <div class="server-stats">
                        <span class="member-count"><i class="fas fa-users"></i>${memberCount}</span>
                        <span class="member-count-suffix">位成员在线</span>
                    </div>
                </div>
            </div>
        `;
    });

    serverList.innerHTML = html;

    serverList.querySelectorAll('.server-card').forEach(item => {
        item.addEventListener('click', (e) => {
            showServerDetail(item.dataset.id);
        });
    });
}

async function showServerDetail(serverId) {
    try {
        const response = await apiService.request(`/servers/${serverId}`);
        if (response.success) {
            if (!response.data || !response.data.success || !response.data.data) {
                showError('获取服务器详情失败: 响应数据格式不正确。');
                return;
            }
            const server = response.data.data;
            const currentUserId = auth.getUserId();

            currentModalServerInfo.id = server.id;
            currentModalServerInfo.isOwner = server.createdBy === currentUserId;
            currentModalServerInfo.isSiteAdmin = auth.isAdmin();
            currentModalServerInfo.members = server.members || [];

            const isMember = server.members?.some(member => member.id === currentUserId);

            document.getElementById('detailServerName').textContent = server.name;
            document.getElementById('detailServerDescription').textContent = server.description || '暂无描述';

            const actionsDiv = document.getElementById('serverDetailActions');
            actionsDiv.innerHTML = '';

            const mainActionButton = document.createElement('button');
            mainActionButton.className = 'btn btn-primary';

            if (isMember) {
                mainActionButton.textContent = '进入服务器';
                mainActionButton.onclick = () => {
                    window.location.href = `/chat?serverId=${serverId}`;
                };
            } else {
                mainActionButton.textContent = '加入服务器';
                mainActionButton.onclick = () => joinServer(serverId);
            }
            actionsDiv.appendChild(mainActionButton);

            if (currentModalServerInfo.isSiteAdmin || currentModalServerInfo.isOwner) {
                const editButton = document.createElement('button');
                editButton.className = 'server-button edit-button';
                editButton.innerHTML = '<i class="fas fa-edit"></i> 编辑';
                editButton.onclick = (e) => { e.stopPropagation(); editServer(serverId); };
                actionsDiv.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.className = 'server-button delete-button';
                deleteButton.innerHTML = '<i class="fas fa-trash"></i> 删除';
                deleteButton.onclick = (e) => { e.stopPropagation(); deleteServer(serverId); };
                actionsDiv.appendChild(deleteButton);
            }

            document.getElementById('serverDetailModal').dataset.serverId = serverId;
            document.getElementById('serverDetailModal').style.display = 'block';

            // 默认加载成员列表
            document.querySelector('#serverDetailModal .sidebar-tabs .tab-button[data-tab="members"]').click();
        } else {
            showError(response.message);
        }
    } catch (error) {
        showError('获取服务器详情失败');
    }
}

function showAddServerModal() {
    editingServerId = null;
    document.getElementById('modalTitle').textContent = '创建服务器';
    document.getElementById('serverForm').reset();
    document.getElementById('serverModal').style.display = 'block';
}
async function editServer(serverId) {
    event.stopPropagation();
    editingServerId = serverId;
    try {
        const response = await apiService.request(`/servers/${serverId}`);
        if (response.success) {
            const server = response.data;
            document.getElementById('modalTitle').textContent = `编辑服务器: ${server.name}`;
            document.getElementById('serverName').value = server.name;
            document.getElementById('serverDescription').value = server.description || '';
            document.getElementById('serverModal').style.display = 'block';
        } else {
            showError(response.message);
        }
    } catch (error) {
        showError('获取服务器信息失败');
    }
}

async function handleServerSubmit(event) {
    event.preventDefault();

    const serverData = {
        name: document.getElementById('serverName').value,
        description: document.getElementById('serverDescription').value
    };

    try {
        let response;
        if (editingServerId) {
            response = await apiService.request(`/servers/${editingServerId}`, {
                method: 'PUT',
                body: JSON.stringify(serverData)
            });
        } else {
            response = await apiService.request('/servers', {
                method: 'POST',
                body: JSON.stringify(serverData)
            });
        }

        if (response.success) {
            closeModal();
            if (editingServerId) {
                loadServers();
                showSuccess('服务器更新成功');
            } else {
                // 创建服务器成功后立即跳转到聊天页面
                const serverId = response.data.data.id;
                showSuccess('服务器创建成功，正在进入...');
                setTimeout(() => {
                    window.location.href = `/chat?serverId=${serverId}`;
                }, 1000);
            }
        } else {
            showError(response.message);
        }
    } catch (error) {
        showError(editingServerId ? '更新服务器失败' : '创建服务器失败');
    }
}

async function deleteServer(serverId) {
    event.stopPropagation();
    if (!confirm('确定要删除这个服务器吗？这将删除所有聊天记录。')) {
        return;
    }
    try {
        const response = await apiService.request(`/servers/${serverId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            closeServerDetailModal();
            loadServers();
            showSuccess('服务器删除成功');
        } else {
            showError(response.message);
        }
    } catch (error) {
        showError('删除服务器失败');
    }
}

async function joinServer(serverId) {
    try {
        const response = await apiService.request(`/servers/${serverId}/join`, { method: 'POST' });

        if (response.success) {
            const actualMessage = (response.data && response.data.message) || response.message;

            if (actualMessage === '您已经是该服务器的成员') {
                window.location.href = `/chat?serverId=${serverId}`;
            } else if (actualMessage && actualMessage.includes('申请已发送')) {
                showSuccess(actualMessage);
            } else {
                showError(actualMessage || '处理加入请求时发生未知响应。');
            }
        } else {
            showError(response.message || '加入服务器失败');
        }
    } catch (error) {
        if (error && error.message === '您已经是该服务器的成员') {
            window.location.href = `/chat?serverId=${serverId}`;
        } else {
            showError(error.message || '加入服务器失败');
        }
    }
}

async function loadServerMembers(serverId) {
    try {
        const response = await apiService.request(`/servers/${serverId}/members`);
        if (response.success) {
            renderServerMembers(response.data);
        } else {
            showError(response.message);
        }
    } catch (error) {
        showError('加载成员列表失败');
    }
}

function renderServerMembers(members) {
    const memberListContainer = document.getElementById('memberListContainer');
    const currentUserId = auth.getUserId();
    const { isOwner, isSiteAdmin } = currentModalServerInfo;

    let html = '';
    members.forEach(member => {
        const isCurrentUser = member.id === currentUserId;
        const memberRole = member.ServerMember.role;
        const canKick = (isOwner || isSiteAdmin) && !isCurrentUser && !(isSiteAdmin && memberRole === 'owner' && !isOwner);

        html += `
            <div class="member-item" data-id="${member.id}">
                <div class="member-avatar">${member.username.charAt(0).toUpperCase()}</div>
                <div class="member-info">
                    <span class="member-name">${member.username}</span>
                    <span class="member-role">${memberRole === 'owner' ? '群主' : '成员'}</span>
                </div>
                ${canKick ? `
                    <div class="member-actions">
                        <button class="member-action-button kick-button" data-member-id="${member.id}" title="踢出">
                            <i class="fas fa-user-slash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    });

    memberListContainer.innerHTML = html;

    memberListContainer.querySelectorAll('.kick-button').forEach(button => {
        button.addEventListener('click', handleKickMember);
    });
}

async function loadJoinRequests(serverId) {
    const joinRequestContainer = document.getElementById('joinRequestContainer');
    const { isOwner, isSiteAdmin } = currentModalServerInfo;

    if (currentModalServerInfo.id !== serverId) {
        showError('无法加载加入申请：服务器信息不匹配。');
        return;
    }

    if (!isOwner && !siteAdmin) {
        joinRequestContainer.innerHTML = '<p>只有服务器所有者或站点管理员可以查看加入申请。</p>';
        return;
    }

    try {
        const response = await apiService.request(`/servers/${serverId}/join-requests`);
        if (response.success) {
            renderJoinRequests(response.data);
        } else {
            showError(response.message);
        }
    } catch (error) {
        showError('加载加入申请失败');
    }
}

function renderJoinRequests(requests) {
    const joinRequestContainer = document.getElementById('joinRequestContainer');
    let html = '';

    if (requests.length === 0) {
        html = '<p>暂无加入申请。</p>';
    } else {
        requests.forEach(request => {
            const requestedTime = new Date(request.requestedAt).toLocaleString();
            html += `
                <div class="join-request-item" data-request-id="${request.id}" data-server-id="${request.serverId}">
                    <div class="request-info">
                        <span class="requester-name">${request.requester.username}</span>
                        <span class="request-time">${requestedTime}</span>
                    </div>
                    <div class="request-actions">
                        <button class="approve-button">批准</button>
                        <button class="reject-button">拒绝</button>
                    </div>
                </div>
            `;
        });
    }

    joinRequestContainer.innerHTML = html;

    joinRequestContainer.querySelectorAll('.approve-button').forEach(button => {
        button.addEventListener('click', handleApproveRequest);
    });
    joinRequestContainer.querySelectorAll('.reject-button').forEach(button => {
        button.addEventListener('click', handleRejectRequest);
    });
}
async function handleApproveRequest(event) {
    const requestItem = event.target.closest('.join-request-item');
    const requestId = requestItem.dataset.requestId;
    const serverId = requestItem.dataset.serverId;

    try {
        const response = await apiService.request(`/servers/${serverId}/join-requests/${requestId}`, {
            method: 'POST',
            body: JSON.stringify({ action: 'approve' })
        });

        if (response.success) {
            showSuccess(response.message);
            loadJoinRequests(serverId);
            loadServerMembers(serverId);
        } else {
            showError(response.message);
        }
    } catch (error) {
        showError('处理申请失败');
    }
}

async function handleRejectRequest(event) {
    const requestItem = event.target.closest('.join-request-item');
    const requestId = requestItem.dataset.requestId;
    const serverId = requestItem.dataset.serverId;

    try {
        const response = await apiService.request(`/servers/${serverId}/join-requests/${requestId}`, {
            method: 'POST',
            body: JSON.stringify({ action: 'reject' })
        });

        if (response.success) {
            showSuccess(response.message);
            loadJoinRequests(serverId);
        } else {
            showError(response.message);
        }
    } catch (error) {
        showError('处理申请失败');
    }
}

async function handleKickMember(event) {
    const memberItem = event.target.closest('.member-item');
    const memberId = memberItem.dataset.id;
    const currentServerId = document.getElementById('serverDetailModal').dataset.serverId;
    if (!currentServerId) return;

    if (!confirm('确定要将该成员踢出服务器吗？')) {
        return;
    }

    try {
        const response = await apiService.request(`/servers/${currentServerId}/members/${memberId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            showSuccess(response.message);
            loadServerMembers(currentServerId);
        } else {
            showError(response.message);
        }
    } catch (error) {
        showError('踢出成员失败');
    }
}

function closeModal() {
    document.getElementById('serverModal').style.display = 'none';
}

function closeServerDetailModal() {
    document.getElementById('serverDetailModal').style.display = 'none';
}

function showError(message) {
    store.addNotification(message, 'error');
}

function showSuccess(message) {
    store.addNotification(message, 'success');
}

window.showAddServerModal = showAddServerModal;
window.closeModal = closeModal;
window.showServerDetail = showServerDetail;
window.closeServerDetailModal = closeServerDetailModal;
