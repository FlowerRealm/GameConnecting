import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('Environment variables loaded:', {
    NODE_ENV: process.env.NODE_ENV,
    BACKEND_URL: process.env.BACKEND_URL,
    SOCKET_URL: process.env.SOCKET_URL,
    FRONTEND_URL: process.env.FRONTEND_URL
});

const configContent = `
export const config = {
    isDevelopment: ${process.env.NODE_ENV !== 'production'},
    backendUrl: '${process.env.BACKEND_URL}',
    socketUrl: '${process.env.SOCKET_URL}',
    apiKey: '${process.env.API_KEY}',
    frontendUrl: '${process.env.FRONTEND_URL}',
    maxRetryAttempts: ${process.env.SOCKET_RECONNECTION_ATTEMPTS || 3},
    reconnectionDelay: ${process.env.SOCKET_RECONNECTION_DELAY || 1000},
    connectionTimeout: ${process.env.SOCKET_TIMEOUT || 5000},
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
`;

const outputPath = path.resolve(__dirname, '../public/js/config.js');

fs.writeFileSync(outputPath, configContent);

console.log('Generated config.js');
