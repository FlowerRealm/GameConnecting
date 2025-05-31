/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-29 19:19:45
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-05-31 10:50:09
 * @FilePath: /GameConnecting/frontend/public/js/auth.js
 */
import { apiService } from './apiService.js'; // 修正导入路径

/**
 * 认证管理类 - 处理用户登录、注册、会话管理
 */
export class AuthManager {
    static #instance = null;
    #apiService;
    #tokenKey = 'gameconnecting_token';
    #usernameKey = 'gameconnecting_username';

    constructor() {
        if (AuthManager.#instance) {
            return AuthManager.#instance;
        }
        this.#apiService = apiService.getInstance();
        AuthManager.#instance = this;
    }

    static getInstance() {
        if (!AuthManager.#instance) {
            AuthManager.#instance = new AuthManager();
        }
        return AuthManager.#instance;
    }

    /**
     * 登录
     * @param {string} username
     * @param {string} password
     * @returns {Promise<{success: boolean, message?: string, data?: {token: string, username: string}}>}
     */
    async login(username, password) {
        try {
            const result = await this.#apiService.login(username, password);
            if (result.success && result.data) {
                this.#saveAuthData(result.data.token, result.data.username);
            }
            return result;
        } catch (error) {
            console.error('登录失败:', error);
            return { success: false, message: error.message || '登录失败' };
        }
    }

    /**
     * 注册
     * @param {string} username
     * @param {string} password
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    async register(username, password) {
        try {
            const result = await this.#apiService.register(username, password);
            return result;
        } catch (error) {
            console.error('注册失败:', error);
            return { success: false, message: error.message || '注册失败' };
        }
    }

    /**
     * 退出登录
     */
    logout() {
        this.#removeAuthData();
    }

    /**
     * 检查用户是否已认证
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * 获取存储的 token
     * @returns {string | null}
     */
    getToken() {
        return localStorage.getItem(this.#tokenKey);
    }

    /**
     * 获取存储的用户名
     * @returns {string | null}
     */
    getUsername() {
        return localStorage.getItem(this.#usernameKey);
    }

    /**
     * 保存认证数据到本地存储
     * @param {string} token
     * @param {string} username
     */
    #saveAuthData(token, username) {
        localStorage.setItem(this.#tokenKey, token);
        localStorage.setItem(this.#usernameKey, username);
    }

    /**
     * 从本地存储移除认证数据
     */
    #removeAuthData() {
        localStorage.removeItem(this.#tokenKey);
        localStorage.removeItem(this.#usernameKey);
    }
}
