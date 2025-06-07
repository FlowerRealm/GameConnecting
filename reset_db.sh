#!/bin/bash
###
 # @Author: FlowerRealm admin@flowerrealm.top
 # @Date: 2025-06-07 07:40:50
 # @LastEditors: FlowerRealm admin@flowerrealm.top
 # @LastEditTime: 2025-06-07 07:49:30
 # @FilePath: /GameConnecting/reset_db.sh
###

# 应用程序数据库配置 (新数据库的所有者)
APP_DB_NAME="gameconnecting"
APP_DB_USER="gameconnecting"
# APP_DB_PASS="your_password" # APP_DB_USER 的密码, 应用程序连接时可能需要

# PostgreSQL 管理员用户 (拥有删除/创建数据库权限的用户)
ADMIN_DB_USER="postgres"  # 本地开发环境通常是 'postgres'
ADMIN_DB_PASS="cz201010101103!" # 请替换为您的 ADMIN_DB_USER 的实际密码
DB_HOST="localhost"
DB_PORT="5432"

# 设置PGPASSWORD环境变量，这样psql不会提示输入密码
# 注意：在脚本中硬编码密码是不安全的，仅适用于受控的开发环境。
export PGPASSWORD=$ADMIN_DB_PASS

echo "警告：此脚本将永久删除数据库 '$APP_DB_NAME' 中的所有数据！"
read -p "确定要继续吗？ (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "操作已取消。"
    exit 0
fi

echo "正在删除数据库 '$APP_DB_NAME' (如果存在)..."
# 使用管理员用户连接到 'postgres' 数据库来执行 DROP DATABASE
psql -h $DB_HOST -p $DB_PORT -U "$ADMIN_DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$APP_DB_NAME\";"
if [ $? -ne 0 ]; then
    echo "错误：删除数据库 '$APP_DB_NAME' 失败。请确保用户 '$ADMIN_DB_USER' 有足够权限，并且密码 '$ADMIN_DB_PASS' 正确。"
    exit 1
fi
echo "数据库 '$APP_DB_NAME' 已成功删除 (或之前不存在)。"

echo "正在创建数据库 '$APP_DB_NAME' 并将所有者设置为 '$APP_DB_USER'..."
# 使用管理员用户连接到 'postgres' 数据库来执行 CREATE DATABASE，并指定所有者
psql -h $DB_HOST -p $DB_PORT -U "$ADMIN_DB_USER" -d postgres -c "CREATE DATABASE \"$APP_DB_NAME\" OWNER \"$APP_DB_USER\";"
if [ $? -ne 0 ]; then
    echo "错误：创建数据库 '$APP_DB_NAME' 失败。请确保用户 '$ADMIN_DB_USER' 有足够权限，并且用户 '$APP_DB_USER' 存在。"
    exit 1
fi
echo "数据库 '$APP_DB_NAME' 已成功创建，所有者为 '$APP_DB_USER'。"

echo "数据库重置完成。"