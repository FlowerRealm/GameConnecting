export const config = {
    // 环境配置
    isDevelopment: process.env.NODE_ENV === 'development',
    isTestMode: process.env.TEST_MODE === 'true',

    // API 配置
    backendUrl: process.env.BACKEND_URL || 'YOUR_BACKEND_URL',

    // 测试模式配置
    testMode: {
        simulateDelay: 500, // 模拟网络延迟（毫秒）
        defaultUsername: 'TestUser',
        mockServers: [
            { id: 1, name: '测试服务器 1', users: [] },
            { id: 2, name: '测试服务器 2', users: [] },
            { id: 3, name: '测试服务器 3', users: [] }
        ]
    }
};
