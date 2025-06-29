import { AuthManager } from './auth.js';
import { apiService } from './apiService.js';
import { config } from './config.js';
import { initNavbar } from './navbar.js';
import { showNotification, formatDateTime } from './utils.js';
import { modalHandler, tabHandler, formHandler } from './eventHandler.js';

const auth = AuthManager.getInstance();
let editingServerId = null;

let currentModalServerInfo = { id: null, isOwner: false, isSiteAdmin: false, members: [] };

if (!auth.isAuthenticated()) {
    window.location.href = '/login';
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!auth.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    initNavbar();
    loadServers();

    // 使用通用表单处理
    document.getElementById('serverForm').addEventListener('submit', (event) => {
        formHandler.handleSubmit(event, handleServerFormSubmit);
    });

    // 初始化标签页
    tabHandler.init('.sidebar-tabs', {
        'members': () => loadServerMembers(currentModalServerInfo.id),
        'requests': () => loadJoinRequests(currentModalServerInfo.id)
    });

    // 将全局函数暴露给HTML
    window.showAddServerModal = showAddServerModal;
    window.joinServer = joinServer;
    window.showServerDetail = showServerDetail;
    window.editServer = editServer;
    window.deleteServer = deleteServer;
    window.closeModal = () => modalHandler.close('addServerModal');
    window.closeServerDetailModal = () => modalHandler.close('serverDetailModal');
});

async function loadServers() {
    try {
        const response = await apiService.request('/api/rooms/list');

        if (response.success) {
            renderServers(response.data || []);
        } else {
            showNotification(response.message || '加载服务器列表失败');
            console.error('Error loading servers:', response.message);
        }
    } catch (error) {
        console.error('Exception in loadServers:', error);
        showNotification('加载服务器列表时发生错误');
    }
}

function renderServers(servers) {
    const serverListContainer = document.getElementById('serverList');
    serverListContainer.innerHTML = '';

    if (!servers || servers.length === 0) {
        serverListContainer.innerHTML = `
            <table class="server-table">
                <thead>
                    <tr>
                        <th><i class="fas fa-server"></i> 服务器名称</th>
                        <th><i class="fas fa-info-circle"></i> 描述</th>
                        <th><i class="fas fa-users"></i> 成员数</th>
                        <th><i class="fas fa-cog"></i> 操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="4" class="no-data">
                            <i class="fas fa-server"></i>
                            暂无可用服务器
                        </td>
                    </tr>
                </tbody>
            </table>
            <div style="text-align:center;margin-top:20px">
                <button class="btn btn-primary" onclick="showAddServerModal()">
                    <i class="fas fa-plus"></i> 创建服务器
                </button>
            </div>
        `;
        return;
    }

    let html = `
        <table class="server-table">
            <thead>
                <tr>
                    <th><i class="fas fa-server"></i> 服务器名称</th>
                    <th><i class="fas fa-info-circle"></i> 描述</th>
                    <th><i class="fas fa-users"></i> 成员数</th>
                    <th><i class="fas fa-cog"></i> 操作</th>
                </tr>
            </thead>
            <tbody>
    `;

    servers.forEach(server => {
        html += `
            <tr>
                <td>
                    <div class="server-info">
                        <i class="fas fa-server"></i>
                        ${server.name}
                    </div>
                </td>
                <td>${server.description || '暂无描述'}</td>
                <td>${server.member_count || 0}</td>
                <td>
                    <div class="server-actions">
                        <button class="btn btn-primary btn-sm" onclick="joinServer('${server.id}')">
                            <i class="fas fa-sign-in-alt"></i> 加入
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="showServerDetail('${server.id}')">
                            <i class="fas fa-eye"></i> 详情
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    serverListContainer.innerHTML = html;
}

function showAddServerModal() {
    editingServerId = null;
    formHandler.resetForm('serverForm');
    document.getElementById('serverModalTitle').textContent = '创建新服务器';
    document.getElementById('serverSubmitBtn').textContent = '创建';
    modalHandler.show('addServerModal');
}

async function editServer(serverId) {
    try {
        const response = await apiService.request(`/api/rooms/${serverId}`);
        if (response.success && response.data) {
            editingServerId = serverId;
            formHandler.fillForm('serverForm', {
                name: response.data.name,
                description: response.data.description
            });
            document.getElementById('serverModalTitle').textContent = '编辑服务器';
            document.getElementById('serverSubmitBtn').textContent = '保存';
            modalHandler.show('addServerModal');
        } else {
            showNotification('获取服务器信息失败', 'error');
        }
    } catch (error) {
        console.error('Error editing server:', error);
        showNotification('编辑服务器时发生错误', 'error');
    }
}

async function handleServerFormSubmit(data) {
    try {
        const { name, description } = data;
        const endpoint = editingServerId
            ? `/api/rooms/${editingServerId}`
            : '/api/rooms/create';
        const method = editingServerId ? 'PUT' : 'POST';

        const response = await apiService.request(endpoint, {
            method,
            body: JSON.stringify({ name, description })
        });

        if (response.success) {
            showNotification(editingServerId ? '服务器更新成功' : '服务器创建成功', 'success');
            modalHandler.close('addServerModal');
            loadServers();
        } else {
            showNotification(response.message || '操作失败', 'error');
        }
    } catch (error) {
        console.error('Server form submission error:', error);
        showNotification('提交表单时发生错误', 'error');
    }
}

async function deleteServer(serverId) {
    if (!confirm('确定要删除此服务器吗？此操作不可撤销。')) {
        return;
    }

    try {
        const response = await apiService.request(`/api/rooms/${serverId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            showNotification('服务器已删除', 'success');
            modalHandler.close('serverDetailModal');
            loadServers();
        } else {
            showNotification(response.message || '删除服务器失败', 'error');
        }
    } catch (error) {
        console.error('Error deleting server:', error);
        showNotification('删除服务器时发生错误', 'error');
    }
}

async function joinServer(serverId) {
    try {
        const response = await apiService.request(`/api/rooms/join/${serverId}`, {
            method: 'POST'
        });

        if (response.success) {
            showNotification('已成功加入服务器', 'success');
            window.location.href = '/chat.html?server=' + serverId;
        } else {
            showNotification(response.message || '加入服务器失败', 'error');
        }
    } catch (error) {
        console.error('Error joining server:', error);
        showNotification('加入服务器时发生错误', 'error');
    }
}

async function showServerDetail(serverId) {
    try {
        const response = await apiService.request(`/api/rooms/${serverId}`);
        if (response.success && response.data) {
            const server = response.data;
            const currentUserId = auth.getUserId();

            // 更新当前模态框信息
            currentModalServerInfo = {
                id: server.id,
                isOwner: server.creator_id === currentUserId,
                isSiteAdmin: auth.isAdmin(),
                members: server.members || []
            };

            // 填充服务器详情
            document.getElementById('detailServerName').textContent = server.name;
            document.getElementById('detailServerDescription').textContent = server.description || '暂无描述';
            document.getElementById('detailServerCreator').textContent = server.creator?.username || '未知';
            document.getElementById('detailServerCreated').textContent = formatDateTime(server.created_at);

            // 设置操作按钮
            const actionButtons = document.getElementById('serverDetailActions');
            if (currentModalServerInfo.isOwner || currentModalServerInfo.isSiteAdmin) {
                actionButtons.innerHTML = `
                    <button class="btn btn-warning" onclick="editServer('${server.id}')">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="btn btn-danger" onclick="deleteServer('${server.id}')">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                `;
            } else {
                actionButtons.innerHTML = `
                    <button class="btn btn-primary" onclick="joinServer('${server.id}')">
                        <i class="fas fa-sign-in-alt"></i> 加入
                    </button>
                `;
            }

            // 加载成员列表
            loadServerMembers(serverId);

            // 显示模态框
            modalHandler.show('serverDetailModal', { serverId });
        } else {
            showNotification('获取服务器详情失败', 'error');
        }
    } catch (error) {
        console.error('Error showing server details:', error);
        showNotification('获取服务器详情时发生错误', 'error');
    }
}

async function loadServerMembers(serverId) {
    try {
        const response = await apiService.request(`/api/rooms/${serverId}/members`);
        if (response.success) {
            renderServerMembers(response.data || []);
        } else {
            showNotification('获取成员列表失败', 'error');
        }
    } catch (error) {
        console.error('Error loading server members:', error);
        showNotification('加载成员列表时发生错误', 'error');
    }
}

function renderServerMembers(members) {
    const container = document.getElementById('membersList');
    if (!container) return;

    if (!members || members.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>暂无成员</p></div>';
        return;
    }

    let html = '<ul class="members-list">';
    members.forEach(member => {
        const user = member.user || {};
        html += `
            <li class="member-item">
                <div class="member-info">
                    <span class="member-name">${user.username || '未知用户'}</span>
                    <span class="member-role">${member.role || '成员'}</span>
                </div>
                ${currentModalServerInfo.isOwner && member.user_id !== auth.getUserId() ?
                    `<button class="btn btn-danger btn-sm" onclick="kickMember('${member.user_id}')">
                        <i class="fas fa-user-minus"></i> 踢出
                    </button>` : ''}
            </li>
        `;
    });
    html += '</ul>';
    container.innerHTML = html;
}

// 将踢出成员函数暴露给全局
window.kickMember = async function(userId) {
    if (!confirm('确定要将此成员踢出服务器吗？')) {
        return;
    }

    try {
        const serverId = currentModalServerInfo.id;
        const response = await apiService.request(`/api/rooms/${serverId}/kick/${userId}`, {
            method: 'POST'
        });

        if (response.success) {
            showNotification('成员已被踢出', 'success');
            loadServerMembers(serverId);
        } else {
            showNotification(response.message || '踢出成员失败', 'error');
        }
    } catch (error) {
        console.error('Error kicking member:', error);
        showNotification('踢出成员时发生错误', 'error');
    }
};

async function loadJoinRequests(serverId) {
    const joinRequestContainer = document.getElementById('joinRequestContainer');
    const { isOwner, isSiteAdmin } = currentModalServerInfo;

    if (currentModalServerInfo.id !== serverId) {
        showNotification('无法加载加入申请：服务器信息不匹配。', 'error');
        return;
    }

    if (!isOwner && !isSiteAdmin) {
        joinRequestContainer.innerHTML = '<p>只有服务器所有者或站点管理员可以查看加入申请。</p>';
        return;
    }

    // TODO: 实现加入申请功能
    // 目前后端还没有实现这个功能
    joinRequestContainer.innerHTML = '<p>加入申请功能正在开发中...</p>';

    // 原来的代码（暂时注释掉）
    /*
    try {
        const response = await apiService.request(`/servers/${serverId}/join-requests`);
        if (response.success) {
            renderJoinRequests(response.data);
        } else {
            showNotification(response.message, 'error');
        }
    } catch (error) {
        showNotification('加载加入申请失败', 'error');
    }
    */
}


function renderJoinRequests(requests) {
    const container = document.getElementById('joinRequestContainer');
    if (!requests || requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-plus empty-icon"></i>
                <h3>暂无加入申请</h3>
                <p>目前没有待处理的加入申请</p>
            </div>
        `;
        return;
    }

    let html = '';
    requests.forEach(request => {
        html += `
            <div class="join-request-item" data-request-id="${request.id}" data-server-id="${currentModalServerInfo.id}">
                <div class="join-request-info">
                    <i class="fas fa-user"></i>
                    <span class="member-name">${request.username}</span>
                    <span class="member-role">申请加入</span>
                    </div>
                <div class="join-request-actions">
                    <button class="btn btn-success btn-sm" onclick="handleApproveRequest(event)" data-request-id="${request.id}">
                        <i class="fas fa-check"></i> 批准
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="handleRejectRequest(event)" data-request-id="${request.id}">
                        <i class="fas fa-times"></i> 拒绝
                    </button>
                    </div>
                </div>
            `;
    });

    container.innerHTML = html;
}
async function handleApproveRequest(event) {
    // TODO: 实现批准加入申请功能
    // 目前后端还没有实现这个功能
    showNotification('批准加入申请功能正在开发中...', 'info');

    // 原来的代码（暂时注释掉）
    /*
    const requestItem = event.target.closest('.join-request-item');
    const requestId = requestItem.dataset.requestId;
    const serverId = requestItem.dataset.serverId;

    try {
        const response = await apiService.request(`/servers/${serverId}/join-requests/${requestId}`, {
            method: 'POST',
            body: JSON.stringify({ action: 'approve' })
        });

        if (response.success) {
            showNotification(response.message, 'success');
            loadJoinRequests(serverId);
            loadServerMembers(serverId);
        } else {
            showNotification(response.message, 'error');
        }
    } catch (error) {
        showNotification('处理申请失败', 'error');
    }
    */
}

async function handleRejectRequest(event) {
    // TODO: 实现拒绝加入申请功能
    // 目前后端还没有实现这个功能
    showNotification('拒绝加入申请功能正在开发中...', 'info');

    // 原来的代码（暂时注释掉）
    /*
    const requestItem = event.target.closest('.join-request-item');
    const requestId = requestItem.dataset.requestId;
    const serverId = requestItem.dataset.serverId;

    try {
        const response = await apiService.request(`/servers/${serverId}/join-requests/${requestId}`, {
            method: 'POST',
            body: JSON.stringify({ action: 'reject' })
        });

        if (response.success) {
            showNotification(response.message, 'success');
            loadJoinRequests(serverId);
        } else {
            showNotification(response.message, 'error');
        }
    } catch (error) {
        showNotification('处理申请失败', 'error');
    }
    */
}
