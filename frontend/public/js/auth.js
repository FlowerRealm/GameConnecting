import { apiService } from './apiService.js';
import { store } from './store.js';

export class AuthManager {
    static #instance = null;

    constructor() {
        this.apiService = apiService;
        this.tokenKey = 'gameconnecting_token';
        this.usernameKey = 'gameconnecting_username';
        this.refreshTokenKey = 'gameconnecting_refresh_token'; // Added refresh token key
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
                // Pass refresh_token to #saveAuthData
                this.#saveAuthData(result.data.access_token, result.data.refresh_token, result.data.username, result.data.role);
            }
            return result;
        } catch (error) {
            // error here is likely the object thrown by apiService for non-ok responses,
            // which includes statusCode and message from the server.
            return {
                success: false,
                message: error.message || '登录过程中发生错误，请稍后重试', // Use specific message if available
                statusCode: error.statusCode || null // Pass along statusCode if available
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
            const storedRefreshToken = localStorage.getItem(this.refreshTokenKey);
            if (!storedRefreshToken) {
                console.error('[Auth] No refresh token found for refreshing session.');
                this.#removeAuthData(); // Clear all auth data if refresh token is missing
                return false;
            }

            const result = await this.apiService.request('/auth/refresh', {
                method: 'POST',
                body: JSON.stringify({ refresh_token: storedRefreshToken })
            });

            if (result.success && result.data && result.data.access_token && result.data.refresh_token) {
                this.#saveAuthData(
                    result.data.access_token,
                    result.data.refresh_token,
                    result.data.username,
                    result.data.role
                );
                return true;
            } else if (result.success) { // Successful HTTP but missing tokens in data
                console.error('[Auth] Refresh token API call successful but token data missing in response:', result.data);
                return false;
            }
            // If result.success is false, apiService would have thrown if it's an HTTP error,
            // or it's a structured {success: false, ...} response from backend already handled by apiService.
            // If apiService throws, the catch block below will handle it.
            // If apiService returns {success: false}, this path might be hit if not caught as an error by apiService.
            // However, apiService is designed to throw for non-ok HTTP, so usually this path for !result.success is less common.
            return false;
        } catch (error) {
            console.error('[Auth] Error during refreshToken:', error.message || error);
            // If refresh fails (e.g. 401 from backend if refresh token is invalid/expired),
            // consider the session ended and clear auth data.
            this.#removeAuthData();
            return false;
        }
    }

    /**
     * 保存认证数据
     */
    #saveAuthData(token, refreshToken, username, role) { // Added refreshToken parameter
        if (token && this.tokenKey) {
            localStorage.setItem(this.tokenKey, token);
        }
        if (refreshToken && this.refreshTokenKey) { // Store refresh token
            localStorage.setItem(this.refreshTokenKey, refreshToken);
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
        localStorage.removeItem(this.refreshTokenKey); // Remove refresh token on logout
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
