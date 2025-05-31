/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-27 21:04:47
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-05-29 18:25:25
 * @FilePath: /GameConnecting/frontend/src/config/config.js
 */
export const config = {
    // 环境配置
    isDevelopment: process.env.NODE_ENV !== 'production',

    // API 配置
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
    socketUrl: process.env.SOCKET_URL || 'ws://localhost:3001',
    apiKey: process.env.API_KEY || 'FlowerRealmGameConnecting',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Socket配置
    maxRetryAttempts: parseInt(process.env.SOCKET_RECONNECTION_ATTEMPTS) || 3,
    reconnectionDelay: parseInt(process.env.SOCKET_RECONNECTION_DELAY) || 1000,
    connectionTimeout: parseInt(process.env.SOCKET_TIMEOUT) || 5000,
    heartbeatInterval: 30000
};
