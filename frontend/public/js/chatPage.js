import { AuthManager } from './auth.js';
import { initNavbar } from './navbar.js';
import { socketManager } from './socket.js';
import { ChatManager } from './chat.js';
import { apiService } from './apiService.js';
import { showNotification } from './utils.js';
import { initVoiceChat, joinVoiceRoom, leaveVoiceRoom, toggleMute, setVoiceUsersUpdateCallback } from './voiceService.js';

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
        showNotification('未指定服务器ID，无法进入聊天室。', 'error');
        window.location.href = '/servers';
        return;
    }

    socketManager.connect();
    chatManager = new ChatManager(socketManager);

    // Initialize Voice Service
    const socket = socketManager.getSocket();
    if (socket) {
        initVoiceChat(socket); // Initialize with the connected socket
        setVoiceUsersUpdateCallback(updateVoiceUserListUI);
    } else {
        console.error('Socket not available for voice chat initialization after connect call.');
        showNotification('语音聊天系统初始化失败，请刷新页面重试。', 'error');
        // Disable voice chat UI elements if socket is not available
        const toggleVoiceChatButton = document.getElementById('toggle-voice-chat-button');
        if (toggleVoiceChatButton) toggleVoiceChatButton.disabled = true;
    }

    const serverData = await loadServerDetails(serverId);
    if (!serverData) {
        document.getElementById('currentServerName').textContent = '错误：无法加载服务器信息';
        showNotification('无法加载服务器详情，聊天页面初始化失败。', 'error');
        return;
    }
    currentServerDetails = serverData; // 存储获取到的服务器详情

    // 加入服务器
    chatManager.joinServer(serverId);
    document.getElementById('currentServerName').textContent = currentServerDetails.name;

    const leaveButton = document.getElementById('leaveServerButton');

    if (leaveButton) {
        leaveButton.addEventListener('click', async () => {
            const serverId = new URLSearchParams(window.location.search).get('serverId');

            if (serverId) {
                try {
                    // 调用后端API离开服务器
                    const response = await apiService.request(`/api/rooms/${serverId}/leave`, {
                        method: 'POST'
                    });

                    if (response.success) {
                        chatManager.leaveServer();
                        showNotification(response.data?.message || '成功离开服务器', 'success');
                        window.location.href = '/servers';
                    } else {
                        showNotification(response.message || '离开服务器失败', 'error');
                    }
                } catch (error) {
                    console.error('离开服务器失败:', error);
                    showNotification('离开服务器时出错', 'error');
                }
            } else {
                chatManager.leaveServer();
                window.location.href = '/servers';
            }
        });
    } else {
        console.error('找不到离开服务器按钮');
    }

    // --- Voice Chat UI Element Logic ---
    const toggleVoiceChatButton = document.getElementById('toggle-voice-chat-button');
    const toggleMuteButton = document.getElementById('toggle-mute-button');
    let isInVoiceChat = false; // Basic state tracking for UI
    let isMuted = false;

    if (toggleVoiceChatButton) {
        toggleVoiceChatButton.addEventListener('click', async () => { // Made async
            // isInVoiceChat state will be managed by successful join/leave
            if (!isInVoiceChat) { // If currently not in voice, try to join
                if (currentServerDetails?.id) {
                    try {
                        const success = await joinVoiceRoom(currentServerDetails.id);
                        if (success) {
                            isInVoiceChat = true;
                            toggleVoiceChatButton.innerHTML = '<i class="fas fa-phone-slash"></i> Leave Voice';
                            toggleVoiceChatButton.classList.add('in-voice');
                            toggleMuteButton.style.display = 'inline-block';
                            isMuted = false; // Reset mute state on join
                            toggleMuteButton.innerHTML = '<i class="fas fa-microphone"></i> Mute';
                            toggleMuteButton.classList.remove('muted');
                        } else {
                            // joinVoiceRoom handles alerts for media failure, UI should reflect not joined.
                            isInVoiceChat = false; // Ensure state reflects failure
                            toggleVoiceChatButton.innerHTML = '<i class="fas fa-phone"></i> Join Voice';
                            toggleVoiceChatButton.classList.remove('in-voice');
                            toggleMuteButton.style.display = 'none';
                        }
                    } catch (err) { // Catch errors from joinVoiceRoom if it throws any
                        console.error("Error joining voice room:", err);
                        showNotification(err.message || 'Failed to join voice chat.', 'error');
                        isInVoiceChat = false; // Revert UI state on failure
                        toggleVoiceChatButton.innerHTML = '<i class="fas fa-phone"></i> Join Voice';
                        toggleVoiceChatButton.classList.remove('in-voice');
                        toggleMuteButton.style.display = 'none';
                    }
                } else {
                    console.error("Cannot join voice chat: serverId is not available.");
                    showNotification('无法加入语音：服务器信息不明确。', 'error');
                    // Ensure UI reflects not joined
                    isInVoiceChat = false;
                    toggleVoiceChatButton.innerHTML = '<i class="fas fa-phone"></i> Join Voice';
                    toggleVoiceChatButton.classList.remove('in-voice');
                    toggleMuteButton.style.display = 'none';
                }
            } else { // If currently in voice, leave
                try {
                    await leaveVoiceRoom();
                    isInVoiceChat = false;
                    toggleVoiceChatButton.innerHTML = '<i class="fas fa-phone"></i> Join Voice';
                    toggleVoiceChatButton.classList.remove('in-voice');
                    toggleMuteButton.style.display = 'none';
                    toggleMuteButton.innerHTML = '<i class="fas fa-microphone"></i> Mute';
                    toggleMuteButton.classList.remove('muted');
                    isMuted = false;
                } catch (err) {
                    console.error("Error leaving voice room:", err);
                    showNotification(err.message || 'Failed to leave voice chat.', 'error');
                    // UI might be out of sync if leave fails, consider how to handle
                }
            }
        });
    }

    if (toggleMuteButton) {
        toggleMuteButton.addEventListener('click', () => {
            // isMuted state will now be determined by toggleMute's return value
            const newMuteState = toggleMute();
            isMuted = newMuteState;
            if (isMuted) {
                toggleMuteButton.innerHTML = '<i class="fas fa-microphone-slash"></i> Unmute';
                toggleMuteButton.classList.add('muted');
            } else {
                toggleMuteButton.innerHTML = '<i class="fas fa-microphone"></i> Mute';
                toggleMuteButton.classList.remove('muted');
            }
        });
    }
    // --- End of Voice Chat UI Element Logic ---
});

async function loadServerDetails(serverId) {
    try {
        const response = await apiService.request(`/api/rooms/${serverId}`);
        if (response.success) {
            // updateSidebarServerDetails(response.data);
            return response.data;
        } else {
            showNotification(`加载服务器详情失败: ${response.message}`, 'error');
            return null;
        }
    } catch (error) {
        showNotification('加载服务器详情时出错。', 'error');
        return null;
    }
}

function updateVoiceUserListUI(voiceUsers) {
}