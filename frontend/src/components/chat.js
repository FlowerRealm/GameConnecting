/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-29 19:19:45
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-05-29 19:45:08
 * @FilePath: /GameConnecting/frontend/src/components/chat.js
 */

/**
 * 聊天管理类 - 处理实时聊天功能
 */
export class ChatManager {
    #socket;
    #chatBox;
    #messageInput;
    #sendButton;

    /**
     * @param {Socket} socket - Socket.IO 客户端实例
     */
    constructor(socket) {
        this.#socket = socket;
        this.#chatBox = document.getElementById('chatBox'); // 假设有一个聊天框元素
        this.#messageInput = document.getElementById('messageInput'); // 假设有一个消息输入框元素
        this.#sendButton = document.getElementById('sendButton'); // 假设有一个发送按钮元素

        if (this.#sendButton && this.#messageInput) {
            this.#sendButton.addEventListener('click', () => this.#sendMessage());
            this.#messageInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    this.#sendMessage();
                }
            });
        }

        this.#socket.on('message', (message) => {
            this.#displayMessage(message);
        });
    }

    /**
     * 发送聊天消息
     */
    #sendMessage() {
        const message = this.#messageInput.value.trim();
        if (message) {
            // TODO: 需要获取当前所在的服务器ID
            const serverId = 'some-server-id'; // 示例服务器ID
            this.#socket.emit('chat message', { serverId, message });
            this.#messageInput.value = '';
        }
    }

    /**
     * 显示接收到的消息
     * @param {string} message - 接收到的消息内容
     */
    #displayMessage(message) {
        if (this.#chatBox) {
            const messageElement = document.createElement('div');
            messageElement.textContent = message;
            this.#chatBox.appendChild(messageElement);
            this.#chatBox.scrollTop = this.#chatBox.scrollHeight; // 滚动到底部
        }
    }

    /**
     * 启动聊天功能
     */
    start() {
        console.log('聊天功能已启动');
        // 可能需要加入一个默认的聊天频道或服务器
    }

    /**
     * 停止聊天功能
     */
    stop() {
        console.log('聊天功能已停止');
        // 可能需要离开当前的聊天频道或服务器
    }
}
