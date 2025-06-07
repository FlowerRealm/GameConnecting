import { AuthManager } from './auth.js';

const auth = AuthManager.getInstance();

export function initNavbar() {
    const navbarElement = document.querySelector('nav.navbar');
    if (navbarElement && !navbarElement.classList.contains('glassmorphic-container')) {
        navbarElement.classList.add('glassmorphic-container');
    }


    const navMenu = document.getElementById('navMenu');
    const authButtons = document.getElementById('authButtons');

    if (auth.isAuthenticated()) {
        // 根据用户角色显示不同的导航菜单
        if (auth.isAdmin()) {
            navMenu.innerHTML = `
                <a href="/servers" class="nav-item">服务器管理</a>
                <a href="/admin" class="nav-item">用户管理</a>
            `;
        } else {
            navMenu.innerHTML = `
                <a href="/servers" class="nav-item">服务器</a>
                <a href="/users" class="nav-item">用户列表</a>
            `;
        }

        authButtons.innerHTML = `
            <div class="dropdown">
                <div class="user-avatar" onclick="toggleDropdown()">
                    <span>${auth.getUsername()?.charAt(0).toUpperCase() || '?'}</span>
                </div>
                <div class="dropdown-content" id="userDropdown">
                    <a href="/profile">个人资料</a>
                    <a href="#" id="logoutButton">退出登录</a>
                </div>
            </div>
        `;

        document.getElementById('logoutButton')?.addEventListener('click', (e) => {
            e.preventDefault();
            auth.logout();
            window.location.href = '/';
        });
    } else {
        navMenu.innerHTML = '';
        authButtons.innerHTML = `
            <a href="/login" class="auth-button">登录</a>
            <a href="/register" class="auth-button primary">注册</a>
        `;
    }
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('href') === currentPath) {
            item.classList.add('active');
        }
    });
}

window.toggleDropdown = function () {
    const dropdown = document.getElementById('userDropdown');
    dropdown?.classList.toggle('show');
};
document.addEventListener('click', (event) => {
    if (!event.target.matches('.user-avatar')) {
        const dropdowns = document.getElementsByClassName('dropdown-content');
        for (const dropdown of dropdowns) {
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        }
    }
});
