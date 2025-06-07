import { DataTypes } from 'sequelize';

export default (sequelize, { User, Server }) => {
    const ServerJoinRequest = sequelize.define('ServerJoinRequest', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        serverId: {
            type: DataTypes.INTEGER,
            references: {
                model: Server, // Assumes Server model is passed correctly
                key: 'id'
            },
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            references: {
                model: User, // Assumes User model is passed correctly
                key: 'id'
            },
            allowNull: false
        },
        requestedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        }
    });

    return ServerJoinRequest;
};
