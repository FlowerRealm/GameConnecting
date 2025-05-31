#!/bin/zsh

# 设置颜色
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# 根据参数切换环境
if [ "$1" = "dev" ]; then
    echo "${GREEN}切换到开发环境...${NC}"
    cp backend/.env.development backend/.env
    cp frontend/.env.development frontend/.env
elif [ "$1" = "prod" ]; then
    echo "${GREEN}切换到生产环境...${NC}"
    cp backend/.env.production backend/.env
    cp frontend/.env.production frontend/.env
else
    echo "使用方法: ./switch-env.sh [dev|prod]"
    exit 1
fi

echo "${GREEN}环境切换完成！${NC}"
