/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-29 21:34:15
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-05-29 21:37:33
 * @FilePath: /GameConnecting/frontend/public/js/apiService.js
 */
// API配置
const API_CONFIG = {
    baseUrl: 'http://localhost:3001/api',
    apiKey: 'your-secret-api-key', // 在实际生产环境中应该使用环境变量
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'your-secret-api-key'
    }
};

// API接口
const API = {
    auth: {
        login: '/auth/login',
        register: '/auth/register'
    },
    servers: {
        list: '/servers',
        create: '/servers'
    }
};

// API服务函数
class ApiService {
    static async request(endpoint, options = {}) {
        const url = API_CONFIG.baseUrl + endpoint;
        const defaultOptions = {
            headers: API_CONFIG.headers
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

    static async login(username, password) {
        return this.request(API.auth.login, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    static async register(username, password) {
        return this.request(API.auth.register, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    static async getServers() {
        return this.request(API.servers.list);
    }

    static async createServer(name) {
        return this.request(API.servers.create, {
            method: 'POST',
            body: JSON.stringify({ name })
        });
    }
}

export { ApiService, API_CONFIG };
