import { AuthManager } from './auth.js';
import { initNavbar } from './navbar.js';
import { socketManager } from './socket.js';
import { ChatManager } from './chat.js';
import { apiService } from './apiService.js';
import { store } from './store.js';
import { initChatSidebar, updateSidebarServerDetails } from './chatSidebar.js';

const auth = AuthManager.getInstance();
let chatManager;
let currentServerDetails = null;

if (!auth.isAuthenticated()) {
    window.location.href = '/login';
}

document.addEventListener('DOMContentLoaded', async () => {
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

    initChatSidebar(serverId, currentServerDetails, auth);

    document.getElementById('leaveServerButton').addEventListener('click', () => {
        chatManager.leaveServer();
        window.location.href = '/servers';
    });
});

async function loadServerDetails(serverId) {
    try {
        const response = await apiService.request(`/servers/${serverId}`);
        if (response.success) {
            updateSidebarServerDetails(response.data);
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