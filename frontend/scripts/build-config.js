import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const env = process.env.NODE_ENV || 'development';

// 检查必要的环境变量
const requiredEnvVars = ['BACKEND_URL', 'SOCKET_URL', 'FRONTEND_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('错误：缺少必要的环境变量：', missingEnvVars.join(', '));
    process.exit(1);
}

// 从环境变量获取配置
const config = {
    isDevelopment: env === 'development',
    backendUrl: process.env.BACKEND_URL,
    socketUrl: process.env.SOCKET_URL,
    frontendUrl: process.env.FRONTEND_URL,
    apiKey: process.env.API_KEY || '',
    socket: {
        maxRetryAttempts: parseInt(process.env.SOCKET_RECONNECTION_ATTEMPTS || '3', 10),
        reconnectionDelay: parseInt(process.env.SOCKET_RECONNECTION_DELAY || '1000', 10),
        connectionTimeout: parseInt(process.env.SOCKET_TIMEOUT || '5000', 10),
        heartbeatInterval: 30000
    }
};

console.log('Environment:', env);
console.log('Config generated:', config);

const configContent = `
export const config = ${JSON.stringify(config, null, 2)};
`;

const outputPath = path.resolve(__dirname, '../public/js/config.js');

fs.writeFileSync(outputPath, configContent);

console.log('Generated config.js');
