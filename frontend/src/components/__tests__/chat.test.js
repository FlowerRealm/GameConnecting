import { ChatManager } from '../chat.js';
import { jest } from '@jest/globals';

describe('ChatManager', () => {
    let chatManager;
    let mockSocket;

    beforeEach(() => {
        // 模拟 DOM 元素
        document.body.innerHTML = `
            <div id="messages"></div>
            <form id="chat-form">
                <input id="message-input" type="text">
                <button type="submit">Send</button>
            </form>
        `;

        // 模拟 socket
        mockSocket = {
            on: jest.fn(),
            emit: jest.fn()
        };

        chatManager = new ChatManager(mockSocket);
    });

    test('应该正确设置事件监听器', () => {
        expect(mockSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
    });

    test('发送消息时应该触发socket事件', () => {
        const messageInput = document.getElementById('message-input');
        messageInput.value = 'test message';

        const form = document.getElementById('chat-form');
        form.dispatchEvent(new Event('submit'));

        expect(mockSocket.emit).toHaveBeenCalledWith('chat message', {
            serverId: null,
            message: 'test message'
        });
        expect(messageInput.value).toBe('');
    });

    test('接收消息时应该显示在界面上', () => {
        const testMessage = 'Hello, world!';
        mockSocket.on.mock.calls[0][1](testMessage);

        const messagesDiv = document.getElementById('messages');
        expect(messagesDiv.innerHTML).toContain(testMessage);
    });
});
