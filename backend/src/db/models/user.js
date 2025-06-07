import { DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';

export default (sequelize) => {
    const User = sequelize.define('User', {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        note: {
            type: DataTypes.STRING,
            allowNull: true
        },
        role: {
            type: DataTypes.ENUM('admin', 'user'),
            defaultValue: 'user'
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending'
        },
        approvedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        approvedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        adminNote: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        }
    });

    User.prototype.validatePassword = async function (password) {
        try {
            return await bcrypt.compare(password, this.password);
        } catch (error) {
            console.error('密码验证错误:', error);
            if (error.message.includes('data and hash arguments required')) {
                console.error('bcrypt.compare 参数错误，可能是存储的密码无效。');
                return false;
            }
            throw error; // 抛出其他未知错误
        }
    };

    return User;
};
