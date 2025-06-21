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
            // Check for apiService success, then backend success, then actual data presence
            if (result.success && result.data && result.data.success && result.data.data && result.data.data.access_token) {
                // Now correctly accessing the nested data object from the backend's response
                this.#saveAuthData(
                    result.data.data.access_token,
                    result.data.data.refresh_token,
                    result.data.data.username,
                    result.data.data.role
                );
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
        console.log('[AuthManager] isAuthenticated: Called.');
        const token = this.getToken();
        console.log('[AuthManager] isAuthenticated: Token from getToken():', token ? token.substring(0, 20) + '...' : null);

        if (!token) {
            console.log('[AuthManager] isAuthenticated: No token found, returning false.');
            return false;
        }

        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                console.log('[AuthManager] isAuthenticated: Invalid token structure, removing auth data.');
                this.#removeAuthData();
                return false;
            }
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);
            console.log('[AuthManager] isAuthenticated: Parsed JWT payload:', payload);

            if (typeof payload.exp !== 'number') {
                console.log('[AuthManager] isAuthenticated: Invalid expiry in token, removing auth data.');
                this.#removeAuthData();
                return false;
            }
            const expiry = payload.exp * 1000;
            const now = Date.now();
            console.log('[AuthManager] isAuthenticated: Token expiry:', new Date(expiry), 'Current time:', new Date(now));
            console.log('[AuthManager] isAuthenticated: Time to expiry (ms):', expiry - now);

            if (expiry - Date.now() < 3600000) { // 1 hour
                console.log('[AuthManager] isAuthenticated: Token nearing expiry, calling refreshToken().');
                this.refreshToken().catch(e => console.error('[Auth] Refresh token error during isAuthenticated check:', e));
            }
            const isValid = expiry > now;
            console.log('[AuthManager] isAuthenticated: Returning isValid:', isValid);
            return isValid;
        } catch (error) {
            console.error('[AuthManager] isAuthenticated: Error during token parsing or validation, removing auth data.', error);
            this.#removeAuthData();
            return false;
        }
    }

    /**
     * 刷新认证令牌
     */
    async refreshToken() {
        console.log('[AuthManager] refreshToken: Called.');
        try {
            const storedRefreshToken = localStorage.getItem(this.refreshTokenKey);
            console.log('[AuthManager] refreshToken: Retrieved storedRefreshToken:', storedRefreshToken ? storedRefreshToken.substring(0, 20) + '...' : null);
            if (!storedRefreshToken) {
                console.error('[AuthManager] refreshToken: No refresh token found for refreshing session.');
                this.#removeAuthData(); // Clear all auth data if refresh token is missing
                return false;
            }

            const result = await this.apiService.request('/auth/refresh', {
                method: 'POST',
                body: JSON.stringify({ refresh_token: storedRefreshToken })
            });
            console.log('[AuthManager] refreshToken: API call result:', JSON.stringify(result, null, 2));

            if (result.success && result.data && result.data.access_token && result.data.refresh_token) {
                console.log('[AuthManager] refreshToken: Refresh successful, saving new tokens.');
                this.#saveAuthData(
                    result.data.access_token,
                    result.data.refresh_token,
                    result.data.username,
                    result.data.role
                );
                return true;
            } else if (result.success) { // Successful HTTP but missing tokens in data
                console.log('[AuthManager] refreshToken: Refresh API call HTTP successful but token data missing in response.');
                console.error('[AuthManager] refreshToken: Refresh API call successful but token data missing in response:', result.data); // duplicate console.error for emphasis
                return false;
            } else { // result.success is false from apiService but no error thrown (should be rare if apiService throws on non-ok)
                 console.log('[AuthManager] refreshToken: API call indicated failure (result.success=false).');
                 return false;
            }
        } catch (error) {
            console.error('[AuthManager] refreshToken: Catch block. Error message:', error.message, 'Clearing tokens.');
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
        console.log('[AuthManager] #saveAuthData: Saving access_token:', token ? token.substring(0, 20) + '...' : null);
        console.log('[AuthManager] #saveAuthData: Saving refresh_token:', refreshToken ? refreshToken.substring(0, 20) + '...' : null);
        console.log('[AuthManager] #saveAuthData: Saving username:', username);
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
        console.log('[AuthManager] #removeAuthData: Clearing all auth tokens and user info. Access token before clear:', localStorage.getItem(this.tokenKey) ? localStorage.getItem(this.tokenKey).substring(0,20)+'...' : null, 'Refresh token before clear:', localStorage.getItem(this.refreshTokenKey) ? localStorage.getItem(this.refreshTokenKey).substring(0,20)+'...' : null);
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
        const token = localStorage.getItem(this.tokenKey);
        console.log('[AuthManager] getToken: Retrieved access_token:', token ? token.substring(0, 20) + '...' : null);
        return token;
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
