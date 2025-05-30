import { ApiService } from '../api/apiService.js';

/**
 * 游戏管理类
 */
export class GameManager {
    #apiService;
    #socket;
    #currentServerId;
    #serverListDiv;
    #canvas;
    #ctx;
    #gameLoop;
    #players = new Map();

    constructor() {
        this.#apiService = new ApiService();
        this.#socket = this.#apiService.getSocketConnection();
        this.#currentServerId = null;
        this.#serverListDiv = document.getElementById('server-list');
        this.#initCanvas('gameCanvas');
        this.setupEventListeners();
    }

    #initCanvas(canvasId) {
        this.#canvas = document.getElementById(canvasId);
        if (!this.#canvas) return;

        this.#ctx = this.#canvas.getContext('2d');
        this.#resizeCanvas();
        window.addEventListener('resize', () => this.#resizeCanvas());
    }

    #resizeCanvas() {
        if (!this.#canvas) return;
        this.#canvas.width = window.innerWidth;
        this.#canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        // Handle receiving server list
        this.#socket.on('server list', (servers) => this.updateServerList(servers));

        // Handle server creation form
        const createServerForm = document.getElementById('create-server-form');
        if (createServerForm) {
            createServerForm.addEventListener('submit', (event) => this.handleCreateServer(event));
        }

        if (!this.#socket) return;

        this.#socket.on('playerJoined', player => this.#addPlayer(player));
        this.#socket.on('playerLeft', playerId => this.#removePlayer(playerId));
        this.#socket.on('playerMoved', data => this.#updatePlayerPosition(data));

        document.addEventListener('keydown', e => this.#handleKeyPress(e));
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

    start() {
        if (this.#gameLoop) return;
        this.#gameLoop = setInterval(() => this.#update(), 1000 / 60);
    }

    stop() {
        if (this.#gameLoop) {
            clearInterval(this.#gameLoop);
            this.#gameLoop = null;
        }
    }

    #update() {
        if (!this.#ctx || !this.#canvas) return;

        // 清空画布
        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);

        // 绘制所有玩家
        for (const [_, player] of this.#players) {
            this.#drawPlayer(player);
        }
    }

    #drawPlayer(player) {
        if (!this.#ctx) return;

        this.#ctx.fillStyle = player.color || '#00ff00';
        this.#ctx.beginPath();
        this.#ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
        this.#ctx.fill();
    }

    #handleKeyPress(event) {
        if (!this.#socket) return;

        const movement = {
            ArrowUp: { x: 0, y: -5 },
            ArrowDown: { x: 0, y: 5 },
            ArrowLeft: { x: -5, y: 0 },
            ArrowRight: { x: 5, y: 0 }
        }[event.key];

        if (movement) {
            this.#socket.emit('playerMove', movement);
        }
    }

    #addPlayer(player) {
        this.#players.set(player.id, player);
    }

    #removePlayer(playerId) {
        this.#players.delete(playerId);
    }

    #updatePlayerPosition(data) {
        const player = this.#players.get(data.id);
        if (player) {
            Object.assign(player, data.position);
        }
    }
}
