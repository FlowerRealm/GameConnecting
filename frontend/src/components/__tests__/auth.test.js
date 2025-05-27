import { Auth } from '../../components/auth.js';

describe('Auth', () => {
    test('登录成功时应返回成功消息', async () => {
        const result = await Auth.login('testuser', 'password');
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
    });

    test('注册成功时应返回成功消息', async () => {
        const result = await Auth.register('newuser', 'password');
        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
    });

    test('登录失败时应返回错误消息', async () => {
        const result = await Auth.login('', '');
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
    });

    test('注册失败时应返回错误消息', async () => {
        const result = await Auth.register('', '');
        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
    });
});
