import { DataTypes } from 'sequelize';

export default (sequelize, User) => {
    const Friendship = sequelize.define('Friendship', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        friendId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'blocked'),
            defaultValue: 'pending'
        },
        actionUserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        }
    });

    Friendship.addHook('beforeValidate', (friendship, options) => {
        if (friendship.userId > friendship.friendId) {
            [friendship.userId, friendship.friendId] = [friendship.friendId, friendship.userId];
        }
    });

    return Friendship;
};
