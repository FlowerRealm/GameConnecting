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

// getDatabaseConfig removed as config.database is obsolete
// getAuthConfig removed as config.auth (JWT secret, etc.) is obsolete

export function getSocketConfig() {
    return config.socket;
}

export default config;
