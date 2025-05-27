// Authentication related functionality
import { config } from '../config/config.js';
import { MockServices } from '../services/mockServices.js';

export class Auth {
    static async #sendAuthRequest(endpoint, username, password) {
        if (config.isTestMode) {
            return MockServices[endpoint](username, password);
        }

        try {
            const response = await fetch(`${config.backendUrl}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.text();
            return {
                success: response.ok,
                message: result
            };
        } catch (error) {
            console.error(`${endpoint} error:`, error);
            return {
                success: false,
                message: `An error occurred during ${endpoint}`
            };
        }
    }

    static async login(username, password) {
        return this.#sendAuthRequest('login', username, password);
    }

    static async register(username, password) {
        return this.#sendAuthRequest('register', username, password);
    }
}