/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-31 09:54:18
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-06-29 19:01:49
 * @FilePath: /GameConnecting/frontend/public/js/apiService.js
 */
import { config } from './config.js';

/**
 * API 服务类 - 处理所有与后端的通信
 */
class ApiService {
    constructor() {
        this.baseUrl = config.backendUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
        this.cache = new Map();
    }

    setDefaultHeaders(headers) {
        this.defaultHeaders = {
            ...this.defaultHeaders,
            ...headers
        };
    }

    clearDefaultHeaders() {
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    async request(endpoint, options = {}) {
        const cacheKey = `${options.method || 'GET'}:${endpoint}`;

        // 使用缓存(仅GET请求)
        if (options.method === 'GET') {
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < 30000) {
                return cached.data;
            }
        }

        try {
            const url = `${this.baseUrl}${endpoint}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.defaultHeaders,
                    ...(options.headers || {})
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw {
                    statusCode: response.status,
                    message: errorData.message || `请求失败: ${response.status}`
                };
            }

            const result = await response.json();

            // 缓存GET请求结果
            if (options.method === 'GET') {
                this.cache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });
            }

            return result;
        } catch (error) {
            console.error('API request error:', error);
            return {
                success: false,
                message: error.message || '请求失败'
            };
        }
    }
}

export const apiService = new ApiService();
