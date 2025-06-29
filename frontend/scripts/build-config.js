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
    'FRONTEND_URL',
    'BACKEND_URL',
    'SOCKET_URL'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('错误：缺少必要的环境变量：', missingEnvVars.join(', '));
    process.exit(1);
}

const config = {
    frontendUrl: process.env.FRONTEND_URL,
    backendUrl: process.env.BACKEND_URL,
    socketUrl: process.env.SOCKET_URL,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    env
};

console.log('Environment:', env);
console.log('Config generated:', JSON.stringify(config, null, 2));

const configContent = `export const config = ${JSON.stringify(config, null, 2)};
`;

const outputPath = path.resolve(__dirname, '../public/js/config.js');

fs.writeFileSync(outputPath, configContent);

console.log('Generated config.js at:', outputPath);
