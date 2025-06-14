import { AuthManager } from './auth.js';
import { initNavbar } from './navbar.js';
import { socketManager } from './socket.js';
import { ChatManager } from './chat.js';
import { apiService } from './apiService.js';
import { store } from './store.js';
// import { initChatSidebar, updateSidebarServerDetails } from './chatSidebar.js';

const auth = AuthManager.getInstance();
let chatManager;
let currentServerDetails = null;

if (!auth.isAuthenticated()) {
    window.location.href = '/login';
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded 事件触发');
    if (!auth.isAuthenticated()) { // Double check, though top-level check might have redirected
        window.location.href = '/login';
        return;
    }
    initNavbar();

    const urlParams = new URLSearchParams(window.location.search);
    const serverId = urlParams.get('serverId');

    if (!serverId) {
        store.addNotification('未指定服务器ID，无法进入聊天室。', 'error');
        window.location.href = '/servers';
        return;
    }

    socketManager.connect();
    chatManager = new ChatManager(socketManager);
    const serverData = await loadServerDetails(serverId);
    if (!serverData) {
        document.getElementById('currentServerName').textContent = '错误：无法加载服务器信息';
        store.addNotification('无法加载服务器详情，聊天页面初始化失败。', 'error');
        return;
    }
    currentServerDetails = serverData; // 存储获取到的服务器详情

    // 加入服务器
    chatManager.joinServer(serverId);
    document.getElementById('currentServerName').textContent = currentServerDetails.name;

    // initChatSidebar(serverId, currentServerDetails, auth);

    const leaveButton = document.getElementById('leaveServerButton');
    console.log('离开服务器按钮:', leaveButton);
    
    if (leaveButton) {
        leaveButton.addEventListener('click', async () => {
            console.log('离开服务器按钮被点击');
            const serverId = new URLSearchParams(window.location.search).get('serverId');
            console.log('当前服务器ID:', serverId);
            
            if (serverId) {
                try {
                    console.log('调用离开服务器API...');
                    // 调用后端API离开服务器
                    const response = await apiService.request(`/servers/${serverId}/leave`, {
                        method: 'POST'
                    });
                    
                    console.log('API响应:', response);
                    
                    if (response.success) {
                        chatManager.leaveServer();
                        store.addNotification(response.data?.message || '成功离开服务器', 'success');
                        window.location.href = '/servers';
                    } else {
                        store.addNotification(response.message || '离开服务器失败', 'error');
                    }
                } catch (error) {
                    console.error('离开服务器失败:', error);
                    store.addNotification('离开服务器时出错', 'error');
                }
            } else {
                console.log('没有服务器ID，直接跳转');
                chatManager.leaveServer();
                window.location.href = '/servers';
            }
        });
    } else {
        console.error('找不到离开服务器按钮');
    }
});

async function loadServerDetails(serverId) {
    try {
        const response = await apiService.request(`/servers/${serverId}`);
        if (response.success) {
            // updateSidebarServerDetails(response.data);
            return response.data;
        } else {
            store.addNotification(`加载服务器详情失败: ${response.message}`, 'error');
            return null;
        }
    } catch (error) {
        store.addNotification('加载服务器详情时出错。', 'error');
        return null;
    }
}