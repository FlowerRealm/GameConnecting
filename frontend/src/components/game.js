import { ApiService } from '../api/apiService.js';

export class GameManager {
    #apiService;
    #socket;
    #currentServerId;
    #serverListDiv;

    constructor() {
        this.#apiService = new ApiService();
        this.#socket = this.#apiService.getSocketConnection();
        this.#currentServerId = null;
        this.#serverListDiv = document.getElementById('server-list');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle receiving server list
        this.#socket.on('server list', (servers) => this.updateServerList(servers));

        // Handle server creation form
        const createServerForm = document.getElementById('create-server-form');
        if (createServerForm) {
            createServerForm.addEventListener('submit', (event) => this.handleCreateServer(event));
        }
    }

    updateServerList(servers) {
        if (!this.#serverListDiv) return;

        this.#serverListDiv.innerHTML = '';
        servers.forEach(server => {
            const serverElement = document.createElement('div');
            serverElement.className = 'server-item';
            serverElement.innerHTML = `
                <h4>${server.name}</h4>
                <div class="server-info">
                    <span>${server.users.length} users</span>
                    <button onclick="gameManager.joinServer(${server.id})">Join</button>
                </div>
            `;
            this.#serverListDiv.appendChild(serverElement);
        });
    }

    async joinServer(serverId) {
        const result = await this.#apiService.joinServer(serverId);
        if (result.success) {
            this.#currentServerId = serverId;
            this.updateUIForJoinedServer();

            // Notify chat manager that we've joined a server
            document.dispatchEvent(new CustomEvent('serverJoined', {
                detail: { serverId: serverId }
            }));
        }
    }

    async leaveServer() {
        if (this.#currentServerId) {
            const result = await this.#apiService.leaveServer(this.#currentServerId);
            if (result.success) {
                this.#currentServerId = null;
                this.updateUIForLeftServer();
                document.dispatchEvent(new CustomEvent('serverLeft'));
            }
        }
    }

    async handleCreateServer(event) {
        event.preventDefault();
        const serverNameInput = document.getElementById('server-name');
        const serverName = serverNameInput.value;
        const result = await this.#apiService.createServer(serverName);
        if (result.success) {
            serverNameInput.value = '';
        }
    }

    updateUIForJoinedServer() {
        document.getElementById('server-list').style.display = 'none';
        document.getElementById('create-server-form').style.display = 'none';
        document.getElementById('chat-container').style.display = 'block';
    }

    updateUIForLeftServer() {
        document.getElementById('server-list').style.display = 'block';
        document.getElementById('create-server-form').style.display = 'block';
        document.getElementById('chat-container').style.display = 'none';
    }
}
