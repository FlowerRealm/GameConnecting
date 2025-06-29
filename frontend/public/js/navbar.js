import { AuthManager } from './auth.js';

const auth = AuthManager.getInstance();

export function initNavbar() {
    const navbarElement = document.querySelector('nav.navbar');
    if (navbarElement && !navbarElement.classList.contains('glassmorphic-container')) {
        navbarElement.classList.add('glassmorphic-container');
    }

    const navMenu = document.getElementById('navMenu');
    const authButtons = document.getElementById('authButtons');

    const toggleDropdown = () => {
        const dropdown = document.getElementById('userDropdown');
        dropdown?.classList.toggle('show');
    };

    if (auth.isAuthenticated()) {
        const userRole = auth.getRole();

        // 根据用户角色显示不同的导航菜单
        if (userRole === 'admin') {
            navMenu.innerHTML = `
                <a href="/administrator/server" class="nav-item">服务器管理</a>
                <a href="/administrator/user" class="nav-item">用户管理</a>
            `;
        } else { // Normal user
            navMenu.innerHTML = `
                <a href="/server" class="nav-item">服务器</a>
                <a href="/user" class="nav-item">所有用户</a>
            `;
        }

        authButtons.innerHTML = `
            <div class="dropdown">
                <div class="user-avatar" id="userAvatar">
                    <span>${auth.getUsername()?.charAt(0).toUpperCase() || '?'}</span>
                </div>
                <div class="dropdown-content" id="userDropdown">
                    <a href="/profile">个人资料</a>
                    <a href="#" id="logoutButton">退出登录</a>
                </div>
            </div>
        `;

        document.getElementById('userAvatar')?.addEventListener('click', toggleDropdown);
        // If "个人资料" is a main nav item, it could be removed from dropdown for less redundancy,
        // but keeping it is also fine for quick access. For now, it's kept as per original structure.

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
