import { DataTypes } from 'sequelize';

export default (sequelize, User) => {
    const Server = sequelize.define('Server', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [1, 50]
            }
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len: [0, 200]
            }
        },
        createdBy: {
            type: DataTypes.INTEGER,
            references: {
                model: User, // Assumes User model is passed correctly
                key: 'id'
            },
            allowNull: false
        },
        lastActivity: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        }
    });

    const ServerMember = sequelize.define('ServerMember', {
        role: {
            type: DataTypes.ENUM('owner', 'member'),
            defaultValue: 'member'
        },
        joinedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        lastActive: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });

    return { Server, ServerMember };
};