import { apiService } from './apiService.js';
import { store } from './utils.js';

export class AuthManager {
    static #instance = null;
    #memoryCache = {
        username: null,
        role: null,
        userId: null
    };

    constructor() {
        this.apiService = apiService;
        this.usernameKey = 'gameconnecting_username';
        this.roleKey = 'gameconnecting_role';
        this.userIdKey = 'gameconnecting_userId';

        this.#loadCacheFromStorage();

        if (this.isAuthenticated()) {
            this.#setupApiHeaders();
        }
    }

    static getInstance() {
        if (!AuthManager.#instance) {
            AuthManager.#instance = new AuthManager();
        }
        return AuthManager.#instance;
    }

    #loadCacheFromStorage() {
        this.#memoryCache.username = localStorage.getItem(this.usernameKey);
        this.#memoryCache.role = localStorage.getItem(this.roleKey);
        this.#memoryCache.userId = localStorage.getItem(this.userIdKey);
    }

    #setupApiHeaders() {
        this.apiService.setDefaultHeaders({
            'X-User-Id': this.#memoryCache.userId,
            'X-Username': this.#memoryCache.username,
            'X-User-Role': this.#memoryCache.role
        });
    }

    async login(username, password) {
        try {
            const result = await this.apiService.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            if (result.success && result.data) {
                this.#saveAuthData(
                    result.data.username,
                    result.data.role,
                    result.data.userId
                );
                this.#setupApiHeaders();
                return result;
            }
            return result;
        } catch (error) {
            return {
                success: false,
                message: error.message || '登录失败'
            };
        }
    }

    async register(userData) {
        try {
            return await this.apiService.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        } catch (error) {
            return {
                success: false,
                message: '注册失败'
            };
        }
    }

    logout() {
        this.#removeAuthData();
        this.apiService.clearDefaultHeaders();
    }

    async changePassword(newPassword) {
        try {
            return await this.apiService.request('/users/me/password', {
                method: 'POST',
                body: JSON.stringify({ password: newPassword })
            });
        } catch (error) {
            return {
                success: false,
                message: '更改密码失败'
            };
        }
    }

    isAuthenticated() {
        return !!this.#memoryCache.username;
    }

    #saveAuthData(username, role, userId) {
        if (username) localStorage.setItem(this.usernameKey, username);
        if (role) localStorage.setItem(this.roleKey, role);
        if (userId) localStorage.setItem(this.userIdKey, userId);

        this.#memoryCache.username = username;
        this.#memoryCache.role = role;
        this.#memoryCache.userId = userId;

        window.dispatchEvent(new CustomEvent('auth:login', {
            detail: { username, role }
        }));
    }

    #removeAuthData() {
        localStorage.removeItem(this.usernameKey);
        localStorage.removeItem(this.roleKey);
        localStorage.removeItem(this.userIdKey);

        this.#memoryCache.username = null;
        this.#memoryCache.role = null;
        this.#memoryCache.userId = null;

        store.clearState();
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    getUsername() {
        return this.#memoryCache.username;
    }

    getRole() {
        return this.#memoryCache.role;
    }

    getUserId() {
        return this.#memoryCache.userId;
    }

    isAdmin() {
        return this.#memoryCache.role === 'admin';
    }
}