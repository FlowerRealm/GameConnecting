import { apiService } from './apiService.js';
import { store } from './store.js';

export class AuthManager {
    static #instance = null;

    constructor() {
        this.apiService = apiService;
        this.tokenKey = 'gameconnecting_token';
        this.usernameKey = 'gameconnecting_username';
    }

    static getInstance() {
        if (!AuthManager.#instance) {
            AuthManager.#instance = new AuthManager();
        }
        return AuthManager.#instance;
    }

    /**
     * 登录
     */
    async login(username, password) { // Changed 'email' to 'username'
        try {
            const result = await this.apiService.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }) // Changed 'email' to 'username'
            });

            // Corrected parsing of backend response structure
            if (result.success && result.data && result.data.access_token) {
                this.#saveAuthData(result.data.access_token, result.data.username, result.data.role);
            }
            return result;
        } catch (error) {
            return {
                success: false,
                message: '登录过程中发生错误，请稍后重试'
            };
        }
    }

    /**
     * 注册
     */
    async register(userData) {
        try {
            console.log('AuthManager.register: Sending userData:', JSON.stringify(userData, null, 2));
            const result = await this.apiService.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            return result;
        } catch (error) {
            return {
                success: false,
                message: '注册过程中发生错误，请稍后重试'
            };
        }
    }

    /**
     * 退出登录
     */
    logout() {
        this.apiService.request('/auth/logout', { method: 'POST' })
            .catch(error => console.warn('Backend logout request failed:', error));

        this.#removeAuthData();
    }

    /**
     * 更改当前用户密码
     */
    async changePassword(newPassword) {
        try {
            // The backend endpoint must be authenticated
            const result = await this.apiService.request('/api/users/me/password', {
                method: 'POST',
                body: JSON.stringify({ password: newPassword })
            });

            // If successful, the backend might return a success message.
            // If the token becomes invalid due to password change, the user might need to log in again,
            // or the backend could return a new token if session invalidation is not immediate.
            // For now, just return the result. The caller (profile.js) will handle messages.
            return result;
        } catch (error) {
            // apiService.request already handles and logs errors via ErrorHandler
            // Return a generic failure object or rethrow if specific handling is needed here
            return {
                success: false,
                message: error.message || '更改密码过程中发生未知错误，请稍后重试。'
            };
        }
    }

    /**
     * 检查用户是否已认证
     */
    isAuthenticated() {
        const token = this.getToken();

        if (!token) {
            return false;
        }

        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                this.#removeAuthData();
                return false;
            }
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);

            if (typeof payload.exp !== 'number') {
                this.#removeAuthData();
                return false;
            }
            const expiry = payload.exp * 1000;
            const now = Date.now();
            if (expiry - Date.now() < 3600000) {
                this.refreshToken().catch(e => console.error('[Auth] Refresh token error:', e));
            }
            const isValid = expiry > now;
            return isValid;
        } catch (error) {
            this.#removeAuthData();
            return false;
        }
    }

    /**
     * 刷新认证令牌
     */
    async refreshToken() {
        try {
            const result = await this.apiService.request('/auth/refresh', {
                method: 'POST'
            });

            if (result.success && result.data?.token) {
                this.#saveAuthData(result.data.token, result.data.username);
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * 保存认证数据
     */
    #saveAuthData(token, username, role) {
        if (token && this.tokenKey) {
            localStorage.setItem(this.tokenKey, token);
        }
        if (username && this.usernameKey) localStorage.setItem(this.usernameKey, username);

        window.dispatchEvent(new CustomEvent('auth:login', {
            detail: { username }
        }));
    }

    /**
     * 移除认证数据
     */
    #removeAuthData() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.usernameKey);
        store.clearState();
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    /**
     * 获取存储的 token
     */
    getToken = () => {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * 获取存储的用户名
     */
    getUsername() {
        return localStorage.getItem(this.usernameKey);
    }
    /**
     * 获取存储的用户 ID
     */
    getUserId() {
        try {
            const token = this.getToken();
            if (!token) return null;

            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);
            return payload.userId || null;
        } catch (error) {
            return null;
        }
    }

    /**
     * 检查用户是否是管理员
     */
    isAdmin() {
        const username = this.getUsername();
        return username === 'admin';
    }
}
