// API Service for handling all backend communication
import { config } from '../config/config.js';

/**
 * API 服务类 - 处理所有与后端的通信
 */
export class ApiService {
    static #instance = null;
    #baseUrl;

    constructor() {
        if (ApiService.#instance) {
            return ApiService.#instance;
        }
        this.#baseUrl = config.backendUrl;
        ApiService.#instance = this;
    }

    static getInstance() {
        if (!ApiService.#instance) {
            ApiService.#instance = new ApiService();
        }
        return ApiService.#instance;
    }

    async #fetchJson(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.#baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            const data = await response.json();
            return {
                success: response.ok,
                data: response.ok ? data : null,
                message: response.ok ? 'Operation successful' : (data.message || 'Operation failed')
            };
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            return {
                success: false,
                data: null,
                message: 'Network error occurred'
            };
        }
    }

    // Auth APIs
    async login(username, password) {
        return this.#fetchJson('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async register(username, password) {
        return this.#fetchJson('/register', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    // Server APIs
    async getServerList() {
        return this.#fetchJson('/getServerList');
    }

    async createServer(name) {
        return this.#fetchJson('/createServer', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
    }

    async joinServer(serverId) {
        return this.#fetchJson('/joinServer', {
            method: 'POST',
            body: JSON.stringify({ serverId })
        });
    }

    async leaveServer(serverId) {
        return this.#fetchJson('/leaveServer', {
            method: 'POST',
            body: JSON.stringify({ serverId })
        });
    }

    // Chat APIs
    async sendMessage(serverId, message) {
        return this.#fetchJson('/sendMessage', {
            method: 'POST',
            body: JSON.stringify({ serverId, message })
        });
    }
}
