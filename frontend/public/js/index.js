/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-31 10:24:24
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-05-31 10:51:08
 * @FilePath: /GameConnecting/frontend/public/js/index.js
 */
import { config } from './config.js';

class SocketManager {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.listeners = new Map();
    }

    connect() {
        if (this.socket) {
            return;
        }

        const options = {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: config.maxRetryAttempts,
            reconnectionDelay: config.reconnectionDelay,
            timeout: config.connectionTimeout,
            auth: {
                token: localStorage.getItem('token')
            }
        };

        this.socket = io(config.socketUrl, options);

        this.socket.on('connect', () => {
            console.log('Connected to socket server');
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from socket server:', reason);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        this.socket?.on(event, callback);
    }

    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
            this.socket?.off(event, callback);
        }
    }

    emit(event, data) {
        this.socket?.emit(event, data);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketManager = new SocketManager();
