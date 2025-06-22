/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-31 09:54:18
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-06-08 08:35:17
 * @FilePath: /GameConnecting/backend/server.js
 */
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import cors from 'cors';
import authRouter from './src/api/auth.js';
import roomsRouter from './src/api/rooms.js';
import adminRouter from './src/api/admin.js'; // General admin routes
import adminOrganizationsRouter from './src/api/adminOrganizations.js'; // Admin routes for organizations
import organizationsRouter from './src/api/organizations.js'; // Public routes for organizations
import friendsRouter from './src/api/friends.js';
import usersRouter from './src/api/users.js';
import { initSocket } from './src/socket/index.js';
import { getConfig, getServerConfig } from './src/config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const serverConfig = getServerConfig(); // Keep for other configs like apiKey, port

// Define allowed origins for CORS
const allowedOrigins = [
  'https://game.flowerrealm.top', // Production frontend
  'https://game-connecting-git-backend-refa-bf604e-flowercountrys-projects.vercel.app', // Vercel preview/branch URL for frontend
  'http://localhost:12000',       // Local development for frontend
  'http://127.0.0.1:12000',      // Local development alias for frontend
  'https://game-connecting.vercel.app' // New URL added
];

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // and requests from allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // Explicitly list common methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'] // Include necessary headers
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Optional: Handle preflight requests across all routes,
// though app.use(cors(corsOptions)) should generally cover this for subsequent routes.
// app.options('*', cors(corsOptions));

const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== serverConfig.apiKey) {
        return res.status(401).json({
            success: false,
            message: '无效的 API Key'
        });
    }
    next();
};

app.use(express.json());

// Apply API Key verification middleware (example, if needed for all routes or specific ones)
// app.use('/api', verifyApiKey); // Example: protect all /api routes

app.use('/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/admin', adminRouter); // Keep for existing general admin tasks if any
app.use('/api/admin/organizations', adminOrganizationsRouter); // New route for admin org management
app.use('/api/organizations', organizationsRouter); // New public route for organizations
app.use('/friends', friendsRouter);
app.use('/users', usersRouter);

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

const server = createServer(app);
initSocket(server);

const port = serverConfig.port;
server.listen(port, '0.0.0.0', () => {
    console.log('环境:', getConfig('env'));
    console.log('Allowed CORS origins:', allowedOrigins);
    console.log(`后端服务器运行在: http://0.0.0.0:${port}`);
});
