/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-27 21:04:47
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-05-29 18:25:25
 * @FilePath: /GameConnecting/frontend/src/config/config.js
 */
export const config = {
    // 环境配置
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',

    // API 配置
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
    apiKey: 'FlowerRealmGameConnecting',

    // 应用配置
    maxRetryAttempts: 3,
    connectionTimeout: 5000,
    heartbeatInterval: 30000
};
