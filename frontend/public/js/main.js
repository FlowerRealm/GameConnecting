import { AuthManager } from './auth.js';
import { initNavbar } from './navbar.js';
import { socketManager } from './socket.js'; // Import centralized socket manager

const auth = AuthManager.getInstance();

initNavbar();

if (auth.isAuthenticated()) {
    // Centralized socketManager will handle connection logic.
    // If a global connection is needed here, call socketManager.connect()
    // However, specific pages like admin.js and chatPage.js already do this.
}
