import { ApiService } from '../apiService.js';
import { jest } from '@jest/globals';

describe('ApiService', () => {
    let apiService;

    beforeEach(() => {
        apiService = ApiService.getInstance();
        jest.clearAllMocks();
    });

    test('应该是单例模式', () => {
        const instance1 = ApiService.getInstance();
        const instance2 = ApiService.getInstance();
        expect(instance1).toBe(instance2);
    });

    test('测试模式下登录应该成功', async () => {
        const result = await apiService.login('testuser', 'password');
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
    });

    test('测试模式下登录失败应该返回错误', async () => {
        const result = await apiService.login('', '');
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
    });

    test('测试模式下注册应该成功', async () => {
        const result = await apiService.register('newuser', 'password');
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
    });

    test('测试模式下注册失败应该返回错误', async () => {
        const result = await apiService.register('', '');
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
    });

    test('服务器列表应该可以获取', async () => {
        const result = await apiService.getServerList();
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
    });

    test('应该可以创建新服务器', async () => {
        const result = await apiService.createServer('Test Server');
        expect(result.success).toBe(true);
        expect(result.data.name).toBe('Test Server');
    });

    test('创建服务器失败应该返回错误', async () => {
        const result = await apiService.createServer('');
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
    });
});
