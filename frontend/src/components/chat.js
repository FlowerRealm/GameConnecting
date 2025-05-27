// Chat functionality
export class ChatManager {
    constructor(socket) {
        this.socket = socket;
        this.currentServerId = null;
        this.messagesDiv = document.getElementById('messages');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for chat messages from server
        this.socket.on('message', (msg) => this.displayMessage(msg));

        // Handle chat form submission
        const chatForm = document.getElementById('chat-form');
        if (chatForm) {
            chatForm.addEventListener('submit', (event) => this.handleSendMessage(event));
        }

        // Listen for server join/leave events
        document.addEventListener('serverJoined', (event) => {
            this.currentServerId = event.detail.serverId;
            this.clearMessages();
        });

        document.addEventListener('serverLeft', () => {
            this.currentServerId = null;
            this.clearMessages();
        });
    }

    displayMessage(msg) {
        if (!this.messagesDiv) return;

        const item = document.createElement('div');
        item.className = 'message';
        item.textContent = msg;
        this.messagesDiv.appendChild(item);
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
    }

    handleSendMessage(event) {
        event.preventDefault();
        if (!this.currentServerId) return;

        const messageInput = document.getElementById('message-input');
        const message = messageInput.value;

        if (message) {
            this.socket.emit('chat message', {
                serverId: this.currentServerId,
                message: message
            });
            messageInput.value = '';
        }
    }

    clearMessages() {
        if (this.messagesDiv) {
            this.messagesDiv.innerHTML = '';
        }
    }
}
