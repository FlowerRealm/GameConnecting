import { Sequelize } from 'sequelize';
import { getDatabaseConfig } from '../config/index.js';
import initUserModel from './models/user.js';
import initServerModel from './models/server.js';
import initServerJoinRequestModel from './models/serverJoinRequest.js';
import initFriendshipModel from './models/friendship.js';

const dbConfig = getDatabaseConfig();

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    username: dbConfig.username,
    password: dbConfig.password,
    logging: dbConfig.logging ? console.log : false,
    pool: dbConfig.pool,
    retry: {
        max: dbConfig.retryMax
    }
});

const db = { sequelize };

function setupAssociations(models) {
    const { User, Server, ServerMember, ServerJoinRequest, Friendship } = models;

    // User 相关关联
    User.belongsTo(User, {
        as: 'approvedByUser',
        foreignKey: 'approvedBy'
    });

    // Server 相关关联
    User.belongsToMany(Server, {
        through: ServerMember,
        as: 'joinedServers'
    });
    Server.belongsToMany(User, {
        through: ServerMember,
        as: 'members'
    });
    User.hasMany(Server, { foreignKey: 'createdBy', as: 'ownedServers' });
    Server.belongsTo(User, { foreignKey: 'createdBy', as: 'owner' });

    // ServerJoinRequest 相关关联
    Server.hasMany(ServerJoinRequest, { foreignKey: 'serverId', as: 'joinRequests' });
    ServerJoinRequest.belongsTo(Server, { foreignKey: 'serverId', as: 'server' });
    User.hasMany(ServerJoinRequest, { foreignKey: 'userId', as: 'serverJoinRequests' });
    ServerJoinRequest.belongsTo(User, { foreignKey: 'userId', as: 'requester' });

    // Friendship 相关关联
    Friendship.belongsTo(User, { as: 'user', foreignKey: 'userId' });
    Friendship.belongsTo(User, { as: 'friend', foreignKey: 'friendId' });
    Friendship.belongsTo(User, { as: 'actionUser', foreignKey: 'actionUserId' });
}

async function initDb() {
    try {
        console.log('正在连接数据库...');
        await sequelize.authenticate();
        console.log('数据库连接成功');

        const User = initUserModel(sequelize);
        const { Server, ServerMember } = initServerModel(sequelize, User);
        const ServerJoinRequest = initServerJoinRequestModel(sequelize, { User, Server });
        const Friendship = initFriendshipModel(sequelize, User);

        Object.assign(db, {
            User,
            Server,
            ServerMember,
            ServerJoinRequest,
            Friendship
        });

        setupAssociations(db);

        if (process.env.NODE_ENV === 'development') {
            console.warn('开发环境：使用 { force: true } 同步数据库，将删除所有现有表和数据！');
            await sequelize.sync({ force: true });
        } else {
            await sequelize.sync({ alter: true });
        }
        console.log('数据库模型同步完成。');

        const adminUser = await User.findOne({ where: { username: 'admin' } });
        if (!adminUser) {
            const initialAdminPassword = process.env.ADMIN_INITIAL_PASSWORD;
            if (initialAdminPassword) {
                console.log('未找到默认管理员账户，正在使用 ADMIN_INITIAL_PASSWORD 创建...');
                await User.create({
                    username: 'admin',
                    password: initialAdminPassword,
                    role: 'admin',
                    status: 'approved',
                    approvedAt: new Date()
                });
                console.log("默认管理员账户 'admin' 已创建。请确保 ADMIN_INITIAL_PASSWORD 安全存储且仅用于首次设置。");
            } else {
                console.warn(
                    "警告：未找到默认管理员账户 'admin'，且未设置 ADMIN_INITIAL_PASSWORD 环境变量。" +
                    "无法自动创建管理员账户。请手动创建或设置该环境变量后重启。"
                );
            }
        } else {
            console.log("默认管理员账户 'admin' 已存在。");
        }

    } catch (error) {
        console.error('数据库连接失败:', error);
        process.exit(1);
    }
}

export { sequelize, db, initDb };