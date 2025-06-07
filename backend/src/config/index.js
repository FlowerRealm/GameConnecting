import { config } from '../config.js';

export function getConfig(path, defaultValue) {
    const keys = path.split('.');
    let value = config;

    for (const key of keys) {
        if (value === undefined || value === null) {
            return defaultValue;
        }
        value = value[key];
    }

    return value !== undefined ? value : defaultValue;
}

export function getServerConfig() {
    return config.server;
}

export function getDatabaseConfig() {
    return config.database;
}

export function getAuthConfig() {
    return config.auth;
}

export function getSocketConfig() {
    return config.socket;
}

export default config;
