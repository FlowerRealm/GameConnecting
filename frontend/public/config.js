/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-27 21:04:47
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-05-29 21:37:41
 * @FilePath: /GameConnecting/frontend/public/config.js
 */
/**
 * 全局配置
 */
export const config = {
    // 环境配置
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',

    // API 配置
    backendUrl: window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://api.gameconnecting.com',

    // 应用配置
    maxRetryAttempts: 3,
    connectionTimeout: 5000,
    heartbeatInterval: 30000
};
