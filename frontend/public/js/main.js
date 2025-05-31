/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-31 10:54:40
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-05-31 11:08:43
 * @FilePath: /GameConnecting/frontend/public/js/main.js
 */
import { io } from 'https://cdn.socket.io/4.7.2/socket.io.esm.min.js';
import { ChatManager } from './chat.js';
import { GameManager } from './game.js';
import { AuthManager } from './auth.js';
import { config } from './config.js';

const auth = AuthManager.getInstance();
const authButtons = document.getElementById('authButtons');

function updateNavbar() {
    if (auth.isAuthenticated()) {
        authButtons.innerHTML = `
            <div class="dropdown">
                <div class="user-avatar" onclick="toggleDropdown()">
                    <span>${auth.getUsername()?.charAt(0).toUpperCase() || '?'}</span>
                </div>
                <div class="dropdown-content" id="userDropdown">
                    <a href="/profile.html">个人资料</a>
                    <a href="#" onclick="handleLogout()">退出登录</a>
                </div>
            </div>
        `;
    } else {
        authButtons.innerHTML = `
            <a href="/login.html" class="auth-button">登录</a>
            <a href="/register.html" class="auth-button primary">注册</a>
        `;
        window.location.href = '/login.html';
        return;
    }
}

window.toggleDropdown = function () {
    document.getElementById('userDropdown').classList.toggle('show');
};

window.handleLogout = function () {
    auth.logout();
    updateNavbar();
};

// 点击页面其他地方关闭下拉菜单
window.onclick = function (event) {
    if (!event.target.matches('.user-avatar')) {
        const dropdowns = document.getElementsByClassName('dropdown-content');
        for (const dropdown of dropdowns) {
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        }
    }
};

updateNavbar();

if (auth.isAuthenticated()) {
    const socket = io(config.backendUrl, {
        auth: { token: auth.getToken() }
    });

    const gameManager = new GameManager(socket);
    gameManager.start();

    socket.on('disconnect', () => {
        console.log('与服务器断开连接');
        gameManager.stop();
    });
}
