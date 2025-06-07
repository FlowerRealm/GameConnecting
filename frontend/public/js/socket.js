import { config } from './config.js';
import { io } from 'https://cdn.socket.io/4.7.2/socket.io.esm.min.js';
import { AuthManager } from './auth.js';
import { ErrorHandler } from './errorHandler.js';

class SocketManager {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.listeners = new Map();
        this.connectionState = 'disconnected';
        this.reconnectTimer = null;
    }

    connect() {
        if (this.socket || this.connectionState === 'connecting') {
            return;
        }

        this.connectionState = 'connecting';
        const token = localStorage.getItem('gameconnecting_token');

        if (!token) {
            this.connectionState = 'disconnected';
            // Do not console.warn in production, ErrorHandler might be too much for just a missing token before connection attempt
            return;
        }

        const socketUrl = config.socketUrl;

        const options = {
            transports: ['websocket', 'polling'], // Prefer websocket
            reconnection: false, // We handle reconnection manually
            timeout: config.socket.connectionTimeout, // Connection timeout
            auth: { token }
        };

        this.socket = io(socketUrl, options);
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.socket.on('connect', () => {
            this.connectionState = 'connected';
            this.reconnectAttempts = 0;
            clearTimeout(this.reconnectTimer);
            // Re-register listeners if any were added before connection
            this.listeners.forEach((callbacks, event) => {
                callbacks.forEach(callback => this.socket.on(event, callback));
            });
        });

        this.socket.on('disconnect', (reason) => {
            this.connectionState = 'disconnected';
            this.handleDisconnect(reason);
        });

        this.socket.on('error', (error) => {
            ErrorHandler.handleSocketError(error, 'Socket general error');
            // Specific auth error handling is within handleSocketError or can be added here
            if (error.message === '认证失败' || error.data?.message === '认证失败') {
                this.handleAuthError();
            }
        });
    }

    handleDisconnect(reason) {
        if (['io server disconnect', 'io client disconnect'].includes(reason)) {
            // These are intentional disconnects, or server explicitly closed.
            // If 'io server disconnect' is due to auth failure, error event should handle it.
            return;
        }

        if (this.reconnectAttempts < config.socket.maxRetryAttempts) {
            const delay = Math.min(config.socket.reconnectionDelay * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff with max
            this.reconnectTimer = setTimeout(() => {
                this.reconnectAttempts++;
                if (this.socket) { // Ensure socket object exists
                    this.socket.connect();
                } else {
                    this.connect(); // Or try to re-initialize if socket is null
                }
            }, delay);
        } else {
            ErrorHandler.handleSocketError({ message: '达到最大重连次数' }, 'Socket reconnection failed');
        }
    }

    handleAuthError() {
        AuthManager.getInstance().logout();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login?reason=socket_auth_failed';
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        const eventCallbacks = this.listeners.get(event);
        if (eventCallbacks) eventCallbacks.add(callback);

        this.socket?.on(event, callback);
    }

    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
            if (this.socket) {
                this.socket.off(event, callback);
            }
        }
    }

    emit(event, data) {
        this.socket?.emit(event, data);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
        // Do not set this.socket to null immediately, as 'disconnect' event might still be processing.
        // It will be nullified or replaced on next connect() attempt if needed.
        this.connectionState = 'disconnected';
        clearTimeout(this.reconnectTimer);
        // Listeners map is kept for re-attachment on reconnect.
    }
}

export const socketManager = new SocketManager();
