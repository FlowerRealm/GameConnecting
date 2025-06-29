import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(__dirname, `../.env.${env}`);
dotenv.config({ path: envPath });

// 检查必要的环境变量
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('错误：缺少必要的环境变量：', missingEnvVars.join(', '));
    process.exit(1);
}

const config = {
    env,
    isDevelopment: env === 'development',
    server: {
        port: parseInt(process.env.PORT || '3001', 10),
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        apiKey: process.env.API_KEY
    },
    supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY
    },
    socket: {
        pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT || '60000', 10),
        pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || '25000', 10),
        cors: {
            origin: [
                process.env.FRONTEND_URL || 'http://localhost:3000'
            ],
            methods: ['GET', 'POST'],
            credentials: true
        }
    }
};

console.log('Environment:', env);
console.log('Config generated:', JSON.stringify(config, null, 2));

const configContent = `export const config = ${JSON.stringify(config, null, 2)};
`;

const outputPath = path.resolve(__dirname, '../src/config.js');

fs.writeFileSync(outputPath, configContent);

console.log('Generated config.js at:', outputPath);
