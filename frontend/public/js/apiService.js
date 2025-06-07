import { config } from './config.js';
import { store } from './store.js';
import { ErrorHandler } from './errorHandler.js';

/**
 * API 服务类 - 处理所有与后端的通信
 */
class ApiService {
    static #instance = null;

    constructor() {
        if (ApiService.#instance) {
            return ApiService.#instance;
        }
        if (!config.backendUrl) {
            throw new Error('Backend URL is not defined in config');
        }
        this.baseUrl = config.backendUrl;
        this.apiKey = config.apiKey;
        this.requestQueue = new Set();

        ApiService.#instance = this;
    }

    static getInstance() {
        if (!ApiService.#instance) {
            ApiService.#instance = new ApiService();
        }
        return ApiService.#instance;
    }

    updateLoadingState() {
        store.setState('isLoading', this.requestQueue.size > 0);
    }

    async request(endpoint, options = {}) {
        const requestId = Date.now().toString();
        this.requestQueue.add(requestId);
        this.updateLoadingState();

        try {
            const token = localStorage.getItem('gameconnecting_token');
            const headers = {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey,
                'X-Request-ID': requestId,
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers
            };

            const requestOptions = {
                ...options,
                headers,
                credentials: 'include',
                mode: 'cors'
            };

            const response = await fetch(`${this.baseUrl}${endpoint}`, requestOptions);
            let data;
            let isJsonResponse = true;

            try {
                data = await response.json();
            } catch (error) {
                isJsonResponse = false;
            }

            if (!response.ok) {
                const error = {
                    statusCode: response.status,
                    message: isJsonResponse && data?.message ? data.message : this.#getDefaultErrorMessage(response.status),
                    data: isJsonResponse ? data : null
                };
                throw error;
            }
            return {
                success: response.ok,
                data: response.ok ? data : null,
                message: isJsonResponse && data?.message ? data.message : this.#getDefaultErrorMessage(response.status),
                statusCode: response.status
            };

        } catch (error) {
            ErrorHandler.handleApiError(error, `API request ${endpoint}`);
            throw error;
        } finally {
            this.requestQueue.delete(requestId);
            this.updateLoadingState();
        }
    }

    #getDefaultErrorMessage(status) {
        const errorMessages = {
            400: 'Bad Request',
            401: 'Unauthorized, please login again',
            403: 'Forbidden',
            404: 'Resource not found',
            500: 'Internal Server Error',
            503: 'Service Unavailable'
        };
        return errorMessages[status] || '请求失败，请稍后重试';
    }
}
export const apiService = ApiService.getInstance();
