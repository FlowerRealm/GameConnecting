import { AuthManager } from './auth.js';
import { initNavbar } from './navbar.js';
import { apiService } from './apiService.js';
import { store } from './store.js'; // For notifications

document.addEventListener('DOMContentLoaded', async () => {
    const auth = AuthManager.getInstance();
    if (!auth.isAuthenticated()) {
        window.location.href = '/login';
        return; // Stop further execution if not authenticated
    }

    initNavbar();

    const userListContainer = document.getElementById('user-list-container');
    if (!userListContainer) {
        console.error('User list container not found.');
        store.addNotification('页面结构错误，无法显示用户列表。', 'error');
        return;
    }

    try {
        const response = await apiService.request('/api/users/list', 'GET');

        if (response.success && response.data) {
            const users = response.data;
            if (users.length === 0) {
                userListContainer.innerHTML = '<p>目前没有其他活动用户。</p>';
            } else {
                const ul = document.createElement('ul');
                ul.className = 'user-list'; // Add a class for potential styling

                users.forEach(user => {
                    const li = document.createElement('li');
                    li.className = 'user-list-item'; // Add a class for potential styling

                    // Create a simple display for username, could be expanded
                    const usernameSpan = document.createElement('span');
                    usernameSpan.className = 'username';
                    usernameSpan.textContent = user.username;

                    // Example: Add user ID (mostly for debugging or if needed later)
                    // const userIdSpan = document.createElement('small');
                    // userIdSpan.className = 'user-id';
                    // userIdSpan.textContent = ` (ID: ${user.id})`;

                    li.appendChild(usernameSpan);
                    // li.appendChild(userIdSpan);

                    // Future: Could add profile picture, status indicator, link to profile etc.
                    // Example: Link to a (non-existent yet) user profile page
                    // const profileLink = document.createElement('a');
                    // profileLink.href = `/profile/${user.id}`; // or /users/${user.username}
                    // profileLink.textContent = user.username;
                    // li.appendChild(profileLink);

                    ul.appendChild(li);
                });
                userListContainer.innerHTML = ''; // Clear "Loading..." message
                userListContainer.appendChild(ul);
            }
        } else {
            console.error('Failed to fetch user list:', response.message);
            userListContainer.innerHTML = `<p class="error-message">无法加载用户列表: ${response.message || '未知错误'}</p>`;
            store.addNotification(`无法加载用户列表: ${response.message || '未知错误'}`, 'error');
        }
    } catch (error) {
        console.error('Error fetching user list:', error);
        userListContainer.innerHTML = '<p class="error-message">加载用户列表时发生网络或服务器错误。</p>';
        store.addNotification('加载用户列表时发生网络或服务器错误。', 'error');
    }
});
