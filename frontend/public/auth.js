import { ApiService } from './apiService.js';

/**
 * 认证管理类
 */
export class AuthManager {
    static #instance;
    #apiService;
    #token = null;
    #username = null;

    constructor() {
        if (AuthManager.#instance) return AuthManager.#instance;
        this.#apiService = ApiService.getInstance();
        AuthManager.#instance = this;
        this.#loadToken();
        this.#loadUsername();
    }

    static getInstance() {
        return AuthManager.#instance || new AuthManager();
    }

    async login(username, password) {
        try {
            const result = await this.#apiService.login(username, password);
            if (result.success && result.data?.token) {
                this.#setToken(result.data.token);
                this.#setUsername(username);
            }
            return result;
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed' };
        }
    }

    async register(username, password) {
        try {
            return await this.#apiService.register(username, password);
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Registration failed' };
        }
    }

    logout() {
        this.#token = null;
        this.#username = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        window.location.href = '/login.html';
    }

    isAuthenticated() {
        return !!this.#token;
    }

    getToken() {
        return this.#token;
    }

    getUsername() {
        return this.#username;
    }

    #setToken(token) {
        this.#token = token;
        localStorage.setItem('authToken', token);
    }

    #setUsername(username) {
        this.#username = username;
        localStorage.setItem('username', username);
    }

    #loadToken() {
        this.#token = localStorage.getItem('authToken');
    }

    #loadUsername() {
        this.#username = localStorage.getItem('username');
    }
}