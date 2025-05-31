import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const configContent = `
export const config = {
    isDevelopment: ${process.env.NODE_ENV !== 'production'},
    backendUrl: '${process.env.BACKEND_URL || 'http://localhost:3001'}',
    socketUrl: '${process.env.SOCKET_URL || 'ws://localhost:3001'}',
    apiKey: '${process.env.API_KEY || 'FlowerRealmGameConnecting'}',
    frontendUrl: '${process.env.FRONTEND_URL || 'http://localhost:3000'}',
    maxRetryAttempts: ${parseInt(process.env.SOCKET_RECONNECTION_ATTEMPTS) || 3},
    reconnectionDelay: ${parseInt(process.env.SOCKET_RECONNECTION_DELAY) || 1000},
    connectionTimeout: ${parseInt(process.env.SOCKET_TIMEOUT) || 5000},
    heartbeatInterval: 30000
};
`;

const outputPath = path.resolve(__dirname, '../public/js/config.js');

fs.writeFileSync(outputPath, configContent);

console.log('Generated config.js');
