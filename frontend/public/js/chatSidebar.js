import { apiService } from './apiService.js';
import { store } from './store.js';

let currentServerDetails = null;
let authInstance = null;
let currentDisplayServerId = null;

function showSuccess(message) {
    store.addNotification(message, 'success');
}

function showError(message) {
    store.addNotification(message, 'error');
}

async function handleTabSwitch(event) {
    const targetTab = event.target.dataset.tab;

    if (!currentDisplayServerId) return;

    document.querySelectorAll('#memberRequestSidebar .sidebar-tabs .tab-button').forEach(button => {
        button.classList.remove('active');
    });

    document.querySelectorAll('#memberRequestSidebar .sidebar-content > div').forEach(content => {
        content.classList.remove('active');
    });

    event.target.classList.add('active');
    const contentElement = document.querySelector(`#memberRequestSidebar .sidebar-content > div[data-tab-content="${targetTab}"]`);
    if (contentElement) {
        contentElement.classList.add('active');
    }

    if (targetTab === 'members') {
        await loadServerMembers(currentDisplayServerId);
    } else if (targetTab === 'requests') {
        await loadJoinRequests(currentDisplayServerId);
    }
}

async function loadServerMembers(serverId) {
    try {
        const response = await apiService.request(`/servers/${serverId}/members`);
        if (response.success) {
            renderServerMembers(response.data);
        } else {
            showError(response.message || '加载成员列表失败');
        }
    } catch (error) {
        showError('加载成员列表时出错');
    }
}

function renderServerMembers(members) {
    const memberListContainer = document.getElementById('memberListContainer');
    if (!memberListContainer) return;

    const currentUserId = authInstance.getUserId();
    const isSiteAdmin = authInstance.isAdmin();

    if (!currentServerDetails) {
        showError("无法渲染成员列表：服务器详情不可用。");
        memberListContainer.innerHTML = '<p>无法加载服务器信息以渲染成员列表。</p>';
        return;
    }
    const isServerOwner = currentServerDetails.createdBy === currentUserId;

    let html = '';
    if (members.length === 0) {
        html = '<p>暂无成员。</p>';
    } else {
        members.sort((a, b) => (a.ServerMember.role === 'owner' ? -1 : 1) - (b.ServerMember.role === 'owner' ? -1 : 1));
        members.forEach(member => {
            const isCurrentUser = member.id === currentUserId;
            const memberRole = member.ServerMember.role;
            const canKick = (isServerOwner || isSiteAdmin) && !isCurrentUser && !(isSiteAdmin && memberRole === 'owner' && member.id !== currentUserId);

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
    }

    memberListContainer.innerHTML = html;

    memberListContainer.querySelectorAll('.kick-button').forEach(button => {
        button.addEventListener('click', handleKickMember);
    });
}

async function loadJoinRequests(serverId) {
    const joinRequestContainer = document.getElementById('joinRequestContainer');
    if (!joinRequestContainer) return;

    if (!currentServerDetails) {
        showError("无法加载加入申请：服务器详情不可用。");
        joinRequestContainer.innerHTML = '<p>无法加载服务器信息以确定权限。</p>';
        return;
    }

    const isServerOwner = currentServerDetails.createdBy === authInstance.getUserId();
    const isSiteAdmin = authInstance.isAdmin();

    if (!isServerOwner && !isSiteAdmin) {
        joinRequestContainer.innerHTML = '<p>只有服务器所有者或管理员可以查看加入申请。</p>';
        return;
    }

    try {
        const response = await apiService.request(`/servers/${serverId}/join-requests`);
        if (response.success) {
            renderJoinRequests(response.data);
        } else {
            showError(response.message || '加载加入申请失败');
        }
    } catch (error) {
        showError('加载加入申请时出错');
    }
}

function renderJoinRequests(requests) {
    const joinRequestContainer = document.getElementById('joinRequestContainer');
    if (!joinRequestContainer) return;
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
            showSuccess(response.message || '申请已批准');
            loadJoinRequests(serverId);
            loadServerMembers(serverId);
        } else {
            showError(response.message || '批准申请失败');
        }
    } catch (error) {
        showError('处理申请时发生错误');
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
            showSuccess(response.message || '申请已拒绝');
            loadJoinRequests(serverId);
        } else {
            showError(response.message || '拒绝申请失败');
        }
    } catch (error) {
        showError('处理申请时发生错误');
    }
}

async function handleKickMember(event) {
    const memberItem = event.target.closest('.member-item');
    const memberId = memberItem.dataset.id;

    if (!currentDisplayServerId) return;
    if (!confirm('确定要将该成员踢出服务器吗？')) return;

    try {
        const response = await apiService.request(`/servers/${currentDisplayServerId}/members/${memberId}`, {
            method: 'DELETE'
        });
        if (response.success) {
            showSuccess(response.message || '成员已踢出');
            loadServerMembers(currentDisplayServerId);
        } else {
            showError(response.message || '踢出成员失败');
        }
    } catch (error) {
        showError('踢出成员时发生错误');
    }
}

export function initChatSidebar(serverId, serverDetails, auth) {
    currentDisplayServerId = serverId;
    currentServerDetails = serverDetails;
    authInstance = auth;

    document.querySelectorAll('#memberRequestSidebar .sidebar-tabs .tab-button').forEach(button => {
        button.addEventListener('click', handleTabSwitch);
    });

    const requestsTabButton = document.querySelector('#memberRequestSidebar .sidebar-tabs .tab-button[data-tab="requests"]');
    if (requestsTabButton) {
        const currentUserId = authInstance.getUserId();
        const isSiteAdmin = authInstance.isAdmin();
        const isServerOwner = currentServerDetails && currentServerDetails.createdBy === currentUserId;
        if (!isSiteAdmin && !isServerOwner) {
            requestsTabButton.style.display = 'none';
        } else {
            requestsTabButton.style.display = '';
        }
    }
    const membersTab = document.querySelector('#memberRequestSidebar .sidebar-tabs .tab-button[data-tab="members"]');
    if (membersTab) {
        membersTab.click();
    } else { // Fallback if members tab isn't found, load members directly
        loadServerMembers(currentDisplayServerId);
    }
}

export function updateSidebarServerDetails(newServerDetails) {
    currentServerDetails = newServerDetails;
    const requestsTabButton = document.querySelector('#memberRequestSidebar .sidebar-tabs .tab-button[data-tab="requests"]');
    if (requestsTabButton && currentServerDetails && authInstance) {
        const currentUserId = authInstance.getUserId();
        const isSiteAdmin = authInstance.isAdmin();
        const isServerOwner = currentServerDetails.createdBy === currentUserId;
        if (!isSiteAdmin && !isServerOwner) {
            requestsTabButton.style.display = 'none';
        } else {
            requestsTabButton.style.display = '';
        }
    }
}