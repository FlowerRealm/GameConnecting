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
            reconnectionDelay: 1000,
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
