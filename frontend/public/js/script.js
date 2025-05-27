/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-27 19:28:05
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-05-27 21:14:00
 * @FilePath: /GameConnecting/frontend/public/js/script.js
 */
import { config } from '../../src/config/config.js';
import { Auth } from '../../src/components/auth.js';
import { GameManager } from '../../src/components/game.js';
import { ChatManager } from '../../src/components/chat.js';

// 测试模式提示
if (config.isTestMode) {
    console.log('Running in Test Mode - No backend connection required');
}

// Handle login form (login.html)
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        const result = await Auth.login(username, password);
        if (result.success) {
            window.location.href = '/';
        } else {
            alert(result.message);
        }
    });
}

// Handle registration form (register.html)
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        const result = await Auth.register(username, password);
        if (result.success) {
            alert('Registration successful! You can now log in.');
            window.location.href = '/login';
        } else {
            alert(result.message);
        }
    });
}

// Initialize game and chat functionality (index.html)
const gameContainer = document.getElementById('game-container');
if (gameContainer) {
    // Initialize managers
    window.gameManager = new GameManager();
    const chatManager = new ChatManager();
}
