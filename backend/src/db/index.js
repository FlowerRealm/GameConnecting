import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5秒

const sequelize = new Sequelize(
    process.env.POSTGRES_DB || 'gameconnecting',
    process.env.POSTGRES_USER || 'postgres',
    process.env.POSTGRES_PASSWORD || 'postgres',
    {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: process.env.POSTGRES_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.DB_LOGGING === 'true',
        pool: {
            max: parseInt(process.env.DB_POOL_MAX || '5'),
            min: parseInt(process.env.DB_POOL_MIN || '0'),
            acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
            idle: parseInt(process.env.DB_POOL_IDLE || '10000')
        },
        retry: {
            max: parseInt(process.env.DB_RETRY_MAX || '3')
        }
    }
);

export const initDb = async () => {
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            await sequelize.authenticate();
            console.log('数据库连接成功。');
            await sequelize.sync();
            console.log('数据库表同步完成。');
            return;
        } catch (error) {
            retries++;
            console.error(`数据库连接失败 (尝试 ${retries}/${MAX_RETRIES}):`, error);
            if (retries === MAX_RETRIES) {
                console.error('达到最大重试次数，退出程序。');
                process.exit(1);
            }
            console.log(`${RETRY_INTERVAL/1000}秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
        }
    }
};

export default sequelize;