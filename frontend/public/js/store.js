class Store {
    constructor() {
        this.state = {
            user: null,
            servers: [],
            activeServer: null,
            friends: [],
            notifications: [],
            connectionStatus: 'disconnected',
            isLoading: false,
            error: null
        };
        this.listeners = new Map();
    }

    static getInstance() {
        if (!Store.instance) {
            Store.instance = new Store();
        }
        return Store.instance;
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
        return () => this.listeners.get(key).delete(callback);
    }

    notify(key) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                try {
                    if (key === 'notifications') {
                        this.renderNotifications(this.state[key]);
                    }
                    callback(this.state[key]);
                } catch (error) {
                }
            });
        }
    }

    setState(key, value) {
        this.state[key] = value;
        this.notify(key);
        if (key !== 'isLoading' && key !== 'error') {
            this.saveToLocalStorage(key);
        }
    }

    getState(key) {
        return this.state[key];
    }

    saveToLocalStorage(key) {
        const persistentKeys = ['user', 'servers', 'friends'];
        if (persistentKeys.includes(key)) {
            try {
                localStorage.setItem(`gc_${key}`, JSON.stringify(this.state[key]));
            } catch (error) {
            }
        }
    }

    loadFromLocalStorage() {
        ['user', 'servers', 'friends'].forEach(key => {
            try {
                const value = localStorage.getItem(`gc_${key}`);
                if (value) {
                    this.state[key] = JSON.parse(value);
                }
            } catch (error) {
            }
        });
    }

    clearState() {
        this.state = {
            user: null,
            servers: [],
            activeServer: null,
            friends: [],
            notifications: [],
            connectionStatus: 'disconnected',
            isLoading: false,
            error: null
        };
        ['user', 'servers', 'friends'].forEach(key => {
            localStorage.removeItem(`gc_${key}`);
        });
    }

    addNotification(message, type = 'info', duration = 5000) {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        };
        this.setState('notifications', [...this.state.notifications, notification]);

        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, duration);
        }
    }

    removeNotification(id) {
        this.setState('notifications',
            this.state.notifications.filter(n => n.id !== id)
        );
    }

    renderNotifications(notifications) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        container.innerHTML = '';

        notifications.forEach(notification => {
            const notificationEl = document.createElement('div');
            notificationEl.className = `notification-item ${notification.type}`;
            notificationEl.textContent = notification.message;
            notificationEl.dataset.id = notification.id;
            container.appendChild(notificationEl);
        });
    }
}
export const store = Store.getInstance();
