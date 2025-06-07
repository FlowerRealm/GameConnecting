#!/bin/zsh
###
 # @Author: FlowerRealm admin@flowerrealm.top
 # @Date: 2025-06-02 10:00:00
 # @LastEditors: FlowerRealm admin@flowerrealm.top
 # @LastEditTime: 2025-06-02 10:00:00
 # @FilePath: /GameConnecting/switch-env.sh
###

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 设置工作目录
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR"

# 检查是否有执行权限
if [ ! -x "$0" ]; then
    echo "${RED}错误：脚本没有执行权限${NC}"
    echo "请运行: chmod +x $0"
    exit 1
fi

# 检查node和npm是否安装
if ! command -v node > /dev/null; then
    echo "${RED}错误：未安装 Node.js${NC}"
    exit 1
fi

if ! command -v npm > /dev/null; then
    echo "${RED}错误：未安装 npm${NC}"
    exit 1
fi

# 显示菜单
show_menu() {
    echo "${BLUE}=== GameConnecting 环境切换工具 ===${NC}"
    echo "${YELLOW}请选择环境：${NC}"
    echo "1) 开发环境 (Development)"
    echo "2) 生产环境 (Production)"
    echo "0) 退出"
}

# 切换环境
switch_env() {
    local env=$1
    local env_name=$2

    echo "${BLUE}正在切换到${env_name}...${NC}"

    # 后端配置
    echo "${YELLOW}正在生成后端配置...${NC}"
    cd backend
    if [ ! -f "package.json" ]; then
        echo "${RED}错误：未找到后端 package.json${NC}"
        return 1
    fi

    npm run "config:${env}" || {
        echo "${RED}后端配置生成失败${NC}"
        return 1
    }
    cd ..

    # 前端配置
    echo "${YELLOW}正在生成前端配置...${NC}"
    cd frontend
    if [ ! -f "package.json" ]; then
        echo "${RED}错误：未找到前端 package.json${NC}"
        return 1
    fi

    npm run "config:${env}" || {
        echo "${RED}前端配置生成失败${NC}"
        return 1
    }
    cd ..

    echo "${GREEN}环境切换完成！${NC}"
    echo "当前环境：${env_name}"
    return 0
}

# 主程序
main() {
    # 如果提供了命令行参数
    if [ "$1" = "1" ] || [ "$1" = "2" ]; then
        case $1 in
            1)
                switch_env "dev" "开发环境"
                ;;
            2)
                switch_env "prod" "生产环境"
                ;;
            *)
                echo "${RED}无效的选项${NC}"
                exit 1
                ;;
        esac
        exit 0
    fi

    # 如果没有参数，显示交互式菜单
    while true; do
        show_menu
        read "choice?请输入选项 (0-2): "
        echo

        case $choice in
            1)
                switch_env "dev" "开发环境"
                ;;
            2)
                switch_env "prod" "生产环境"
                ;;
            0)
                echo "${BLUE}再见！${NC}"
                exit 0
                ;;
            *)
                echo "${RED}无效的选项，请重试${NC}"
                ;;
        esac
        echo
    done
}

# 运行主程序
main "$@"
if [ ! -f "$BACKEND_TARGET" ] || [ ! -f "$FRONTEND_TARGET" ]; then
    echo "${RED}错误：目标环境文件不存在${NC}"
    echo "请确保以下文件存在："
    echo "- $BACKEND_TARGET"
    echo "- $FRONTEND_TARGET"
    exit 1
fi


# 切换环境
echo "${GREEN}切换到${1}环境...${NC}"

# 复制后端环境文件
if cp "$BACKEND_TARGET" "$BACKEND_ENV"; then
    echo "${GREEN}✓ 后端环境切换成功${NC}"
else
    echo "${RED}× 后端环境切换失败${NC}"
    # 恢复备份
    [ -f "${BACKEND_ENV}.backup" ] && mv "${BACKEND_ENV}.backup" "$BACKEND_ENV"
    exit 1
fi

# 复制前端环境文件
if cp "$FRONTEND_TARGET" "$FRONTEND_ENV"; then
    echo "${GREEN}✓ 前端环境切换成功${NC}"
else
    echo "${RED}× 前端环境切换失败${NC}"
    # 恢复备份
    [ -f "${FRONTEND_ENV}.backup" ] && mv "${FRONTEND_ENV}.backup" "$FRONTEND_ENV"
    [ -f "${BACKEND_ENV}.backup" ] && mv "${BACKEND_ENV}.backup" "$BACKEND_ENV"
    exit 1
fi

# 清理备份文件
rm -f "${BACKEND_ENV}.backup" "${FRONTEND_ENV}.backup"

echo "${GREEN}环境切换完成！${NC}"

# 主程序
main() {
    while true; do
        show_menu
        read "choice?请输入选项 (0-2): "
        echo

        case $choice in
            1)
                switch_env "dev" "开发环境"
                ;;
            2)
                switch_env "prod" "生产环境"
                ;;
            0)
                echo "${BLUE}再见！${NC}"
                exit 0
                ;;
            *)
                echo "${RED}无效的选项，请重试${NC}"
                ;;
        esac
        echo
    done
}

# 运行主程序
main
