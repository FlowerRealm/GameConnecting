import { DataTypes } from 'sequelize';
import sequelize from '../index.js';
import User from './user.js';

const Server = sequelize.define('Server', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: false
    },
    port: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    createdBy: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        },
        allowNull: false
    }
});

User.hasMany(Server, { foreignKey: 'createdBy' });
Server.belongsTo(User, { foreignKey: 'createdBy' });

export default Server;