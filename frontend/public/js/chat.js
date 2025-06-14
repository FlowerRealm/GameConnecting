export class ChatManager {
    #socket;
    #chatBox;
    #messageInput;
    #sendButton;
    #memberList;
    #currentServer;
    #messageTemplate;
    #memberTemplate;
    #memberRequestSidebar;
    #messageHandler;
    #memberJoinedHandler;
    #memberLeftHandler;
    #errorHandler;

    constructor(socketManager) {
        this.#socket = socketManager;
        this.#chatBox = document.getElementById('chatBox');
        this.#messageInput = document.getElementById('messageInput');
        this.#sendButton = document.getElementById('sendButton');
        this.#memberRequestSidebar = document.getElementById('memberRequestSidebar');
        this.#currentServer = null;
        this.#messageTemplate = document.getElementById('messageTemplate');
        this.#memberTemplate = document.getElementById('memberTemplate');
        this.#bindEventHandlers();
        this.#setupSocketListeners();
    }

    #bindEventHandlers() {
        if (this.#sendButton && this.#messageInput) {
            this.#sendButton.addEventListener('click', () => this.#sendMessage());
            this.#messageInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    this.#sendMessage();
                }
            });
        }
    }

    #setupSocketListeners() {
        // 先移除可能存在的旧监听器
        this.#removeSocketListeners();
        
        // 保存监听器引用以便后续移除
        this.#messageHandler = (data) => {
            this.#displayMessage(data);
        };
        
        this.#memberJoinedHandler = (data) => {
            this.#displaySystemMessage(`${data.username} 加入了服务器`);
            this.#updateMemberCount(data.onlineCount);
        };
        
        this.#memberLeftHandler = (data) => {
            this.#displaySystemMessage(`${data.username} 离开了服务器`);
            this.#updateMemberCount(data.onlineCount);
        };
        
        this.#errorHandler = (error) => {
            this.#displaySystemMessage(error, 'error');
        };

        this.#socket.on('message', this.#messageHandler);
        this.#socket.on('memberJoined', this.#memberJoinedHandler);
        this.#socket.on('memberLeft', this.#memberLeftHandler);
        this.#socket.on('error', this.#errorHandler);
    }
    
    #removeSocketListeners() {
        if (this.#messageHandler) {
            this.#socket.off('message', this.#messageHandler);
        }
        if (this.#memberJoinedHandler) {
            this.#socket.off('memberJoined', this.#memberJoinedHandler);
        }
        if (this.#memberLeftHandler) {
            this.#socket.off('memberLeft', this.#memberLeftHandler);
        }
        if (this.#errorHandler) {
            this.#socket.off('error', this.#errorHandler);
        }
    }

    #sendMessage() {
        const message = this.#messageInput.value.trim();
        if (message && this.#currentServer) {
            this.#socket.emit('serverMessage', {
                serverId: this.#currentServer,
                message,
                type: 'text'
            });
            this.#messageInput.value = '';
        }
    }

    #displayMessage(data) {
        if (!this.#chatBox || !this.#messageTemplate) return null;

        const { type, username, message, timestamp } = data;
        const msgTime = new Date(timestamp).toLocaleTimeString();

        const fragment = this.#messageTemplate.content.cloneNode(true);
        const msgContainer = fragment.querySelector('.message');
        const actualMessageElement = fragment.firstElementChild;

        if (!actualMessageElement || !msgContainer) {
            return null;
        }

        const usernameElement = msgContainer.querySelector('.username');
        const timeElement = msgContainer.querySelector('.time');
        const contentElement = msgContainer.querySelector('.content');
        if (type === 'system') {
            msgContainer.classList.add('system-message');
            if (usernameElement) usernameElement.style.display = 'none';
            if (timeElement) timeElement.style.display = 'none';
            if (contentElement) contentElement.textContent = message;
        } else {
            if (usernameElement) {
                usernameElement.style.display = '';
                usernameElement.textContent = username;
            }
            if (timeElement) {
                timeElement.style.display = '';
                timeElement.textContent = msgTime;
            }
            if (contentElement) contentElement.textContent = message;
        }
        this.#chatBox.appendChild(fragment);
        this.#chatBox.scrollTop = this.#chatBox.scrollHeight;
        return actualMessageElement;
    }

    /**
     * 显示系统消息
     * @param {string} message - 系统消息内容
     * @param {string} [type='info'] - 消息类型
     */
    #displaySystemMessage(message, type = 'info') {
        const systemMessageData = {
            type: 'system',
            username: 'System',
            message,
            timestamp: new Date(),
            messageType: type
        };

        const appendedElement = this.#displayMessage(systemMessageData);

        if (appendedElement) {
            setTimeout(() => {
                appendedElement.style.transition = 'opacity 0.5s ease-in-out';
                appendedElement.style.opacity = '0';
                setTimeout(() => {
                    if (appendedElement.parentNode === this.#chatBox) {
                        this.#chatBox.removeChild(appendedElement);
                    }
                }, 500);
            }, 5000);
        }
    }

    #updateMemberCount(count) {
        const counterElem = document.getElementById('memberCount');
        if (counterElem) {
            counterElem.textContent = count;
        }
    }

    joinServer(serverId) {
        if (this.#currentServer === serverId) return;

        if (this.#currentServer) {
            this.#socket.emit('leaveServer', this.#currentServer);
        }

        this.#currentServer = serverId;
        this.#socket.emit('joinServer', serverId);

        if (this.#chatBox) {
            this.#chatBox.innerHTML = '';
        }
        this.#displaySystemMessage('正在连接到服务器...');
    }

    leaveServer() {
        if (this.#currentServer) {
            this.#socket.emit('leaveServer', this.#currentServer);
            this.#currentServer = null;
            if (this.#chatBox) {
                this.#chatBox.innerHTML = '';
            }
        }
    }

    destroy() {
        this.leaveServer();
        this.#removeSocketListeners();
    }

    getCurrentServerId() {
        return this.#currentServer;
    }
    getCurrentServer() {
        return null;
    }
}
