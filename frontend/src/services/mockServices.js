// Mock services for test mode
import { config } from '../config/config.js';

/**
 * 测试模式的模拟服务
 */
class MockStore {
    static #data = {
        simulateDelay: 500,
        defaultUsername: 'TestUser',
        servers: [
            { id: 1, name: '测试服务器 1', users: [], messages: [] },
            { id: 2, name: '测试服务器 2', users: [], messages: [] },
            { id: 3, name: '测试服务器 3', users: [], messages: [] }
        ],
        currentUser: null
    };

    static getData() {
        return this.#data;
    }

    static getServer(id) {
        return this.#data.servers.find(s => s.id === id);
    }

    static addServer(server) {
        this.#data.servers.push(server);
    }

    static setCurrentUser(username) {
        this.#data.currentUser = username;
    }
}

export class MockServices {
    static async #delay() {
        return new Promise(resolve => setTimeout(resolve, MockStore.getData().simulateDelay));
    }

    static #createResponse(success, data = null, message = '') {
        return { success, data, message: message || (success ? 'Operation successful (Test Mode)' : 'Operation failed (Test Mode)') };
    }

    // Auth Services
    static async login(username, password) {
        await this.#delay();
        if (!username || !password) {
            return this.#createResponse(false, null, 'Invalid credentials');
        }
        MockStore.setCurrentUser(username);
        return this.#createResponse(true);
    }

    static async register(username, password) {
        await this.#delay();
        if (!username || !password) {
            return this.#createResponse(false, null, 'Invalid credentials');
        }
        return this.#createResponse(true);
    }

    // Server Services
    static async getServerList() {
        await this.#delay();
        return this.#createResponse(true, MockStore.getData().servers);
    }

    static async createServer(name) {
        await this.#delay();
        if (!name) {
            return this.#createResponse(false, null, 'Server name is required');
        }
        const newServer = {
            id: Date.now(),
            name,
            users: [],
            messages: []
        };
        MockStore.addServer(newServer);
        return this.#createResponse(true, newServer);
    }

    static async joinServer(serverId) {
        await this.#delay();
        const server = MockStore.getServer(serverId);
        if (!server) {
            return this.#createResponse(false, null, 'Server not found');
        }
        const currentUser = MockStore.getData().currentUser;
        if (!currentUser) {
            return this.#createResponse(false, null, 'User not logged in');
        }
        if (!server.users.includes(currentUser)) {
            server.users.push(currentUser);
        }
        return this.#createResponse(true, server);
    }

    // Chat Services
    static async sendMessage(serverId, message) {
        await this.#delay();
        const server = MockStore.getServer(serverId);
        if (!server) {
            return this.#createResponse(false, null, 'Server not found');
        }
        const currentUser = MockStore.getData().currentUser;
        if (!currentUser) {
            return this.#createResponse(false, null, 'User not logged in');
        }
        const newMessage = {
            id: Date.now(),
            user: currentUser,
            content: message,
            timestamp: new Date().toISOString()
        };
        server.messages.push(newMessage);
        return this.#createResponse(true, newMessage);
    }
}
