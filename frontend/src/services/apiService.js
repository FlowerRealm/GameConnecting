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
class ApiService {
    constructor() {
        this.baseUrl = config.backendUrl;
        this.apiKey = config.apiKey;
    }

    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'API请求失败');
            }

            return await response.json();
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }

    // 认证相关
    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async logout() {
        localStorage.removeItem('token');
    }

    // 服务器相关
    async getServers() {
        return this.request('/servers');
    }

    async createServer(serverData) {
        return this.request('/servers', {
            method: 'POST',
            body: JSON.stringify(serverData)
        });
    }

    async updateServer(serverId, serverData) {
        return this.request(`/servers/${serverId}`, {
            method: 'PUT',
            body: JSON.stringify(serverData)
        });
    }

    async deleteServer(serverId) {
        return this.request(`/servers/${serverId}`, {
            method: 'DELETE'
        });
    }
}

export const apiService = new ApiService();
