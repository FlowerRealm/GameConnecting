/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-29 19:19:45
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-05-29 19:45:24
 * @FilePath: /GameConnecting/frontend/src/api/apiService.js
 */
// API Service for handling all backend communication
import { config } from '../config/config.js';

/**
 * API 服务类 - 处理所有与后端的通信
 */
export class ApiService {
    static #instance = null;
    #baseUrl;
    #headers;

    constructor() {
        if (ApiService.#instance) {
            return ApiService.#instance;
        }
        this.#baseUrl = config.backendUrl;
        this.#headers = {
            'Content-Type': 'application/json',
            'X-API-Key': config.apiKey
        };
        ApiService.#instance = this;
    }

    static getInstance() {
        if (!ApiService.#instance) {
            ApiService.#instance = new ApiService();
        }
        return ApiService.#instance;
    }

    /**
     * 发送 API 请求
     * @param {string} endpoint - API 端点路径
     * @param {object} options - 请求选项
     * @returns {Promise<object>}
     */
    async request(endpoint, options = {}) {
        const url = this.#baseUrl + endpoint;
        const defaultOptions = {
            headers: this.#headers
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '请求失败');
            }

            return data;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }

    /**
     * 登录
     * @param {string} username
     * @param {string} password
     * @returns {Promise<object>}
     */
    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    /**
     * 注册
     * @param {string} username
     * @param {string} password
     * @returns {Promise<object>}
     */
    async register(username, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    /**
     * 获取服务器列表
     * @returns {Promise<object>}
     */
    async getServers() {
        return this.request('/servers');
    }

    /**
     * 创建服务器
     * @param {string} name - 服务器名称
     * @returns {Promise<object>}
     */
    async createServer(name) {
        return this.request('/servers', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
    }
}
