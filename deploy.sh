#!/bin/zsh

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "${YELLOW}开始部署 GameConnecting...${NC}"

# 1. 前端部署 (Vercel)
echo "${GREEN}开始部署前端...${NC}"
cd frontend
# 设置生产环境
cp .env.production .env
# 安装依赖
npm install
# 部署到Vercel
vercel --prod

# 2. 后端部署 (Render)
echo "${GREEN}开始部署后端...${NC}"
cd ../backend
# 设置生产环境
cp .env.production .env
# 安装依赖
npm install
# Render会自动从Git仓库部署，不需要额外命令

echo "${GREEN}部署脚本执行完成！${NC}"
echo "${YELLOW}请检查以下内容：${NC}"
echo "1. 前端已部署到: https://game.flowerrealm.top"
echo "2. 后端已部署到: https://gameconnecting.onrender.com"
echo "3. 环境变量是否正确设置"
echo "4. 数据库连接是否正常"
echo "5. Socket.IO连接是否正常"
