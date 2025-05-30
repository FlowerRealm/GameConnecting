/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-29 21:34:14
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-05-29 21:37:37
 * @FilePath: /GameConnecting/frontend/public/chat.js
 */
/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-29 21:34:14
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-05-29 21:37:35
 * @FilePath: /GameConnecting/frontend/public/chat.js
 */
/**
 * 聊天管理类
 */
export class ChatManager {
    #socket;
    #currentServerId = null;
    #messagesDiv;
    #messageInput;
    #chatForm;

    constructor(socket) {
        this.#socket = socket;
        this.#initElements();
        this.#setupEventListeners();
    }

    #initElements() {
        this.#messagesDiv = document.getElementById('messages');
        this.#messageInput = document.getElementById('message-input');
        this.#chatForm = document.getElementById('chat-form');
    }

    #setupEventListeners() {
        // 监听聊天消息
        this.#socket.on('message', msg => this.#displayMessage(msg));

        // 处理聊天表单提交
        this.#chatForm?.addEventListener('submit', e => this.#handleSendMessage(e));

        // 监听服务器加入/离开事件
        document.addEventListener('serverJoined', e => {
            this.#currentServerId = e.detail.serverId;
            this.#clearMessages();
        });

        document.addEventListener('serverLeft', () => {
            this.#currentServerId = null;
            this.#clearMessages();
        });
    }

    #displayMessage(msg) {
        if (!this.#messagesDiv) return;

        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.textContent = typeof msg === 'string' ? msg : `${msg.userId}: ${msg.content}`;
        this.#messagesDiv.appendChild(messageElement);
        this.#messagesDiv.scrollTop = this.#messagesDiv.scrollHeight;
    }

    #handleSendMessage(event) {
        event.preventDefault();
        if (!this.#messageInput || !this.#socket) return;

        const message = this.#messageInput.value.trim();
        if (!message) return;

        this.#socket.emit('chat message', {
            serverId: this.#currentServerId,
            message
        });

        this.#messageInput.value = '';
    }

    #clearMessages() {
        if (this.#messagesDiv) {
            this.#messagesDiv.innerHTML = '';
        }
    }
}
