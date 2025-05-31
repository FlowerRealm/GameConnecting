
export const config = {
    isDevelopment: false,
    backendUrl: 'https://gameconnecting.onrender.com',
    socketUrl: 'wss://gameconnecting.onrender.com',
    apiKey: 'FlowerRealmGameConnecting',
    frontendUrl: 'https://game.flowerrealm.top',
    maxRetryAttempts: 3,
    reconnectionDelay: 1000,
    connectionTimeout: 5000,
    heartbeatInterval: 30000,
    production: {
        backendUrl: 'https://gameconnecting.onrender.com',
        socketUrl: 'wss://gameconnecting.onrender.com',
        frontendUrl: 'https://game.flowerrealm.top'
    },
    development: {
        backendUrl: 'http://localhost:3001',
        socketUrl: 'ws://localhost:3001',
        frontendUrl: 'http://localhost:3000'
    }
};
