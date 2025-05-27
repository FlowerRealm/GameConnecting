const express = require('express');
const path = require('path');
const http = require('http'); // Import http module
const socketIo = require('socket.io'); // Import socket.io

const app = express();
// Create an HTTP server explicitly for socket.io
const server = http.createServer(app);
const io = socketIo(server); // Initialize socket.io with the server

const port = process.env.PORT || 3000; // Use environment variable for port

// Simple in-memory user storage (for demonstration purposes)
const users = [];

// Simple in-memory server storage
const gameServers = [];

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files from the 'frontend' directory
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Serve registration page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

// Handle registration requests
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    console.log('Registration attempt:', { username, password });

    // Check if username already exists
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        return res.status(400).send('Username already exists');
    }

    // Add new user to storage
    users.push({ username, password });
    console.log('Users:', users);
    res.status(201).send('Registration successful');
});

// Handle login requests
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });

    // Find user
    const user = users.find(user => user.username === username);

    // Check if user exists and password matches
    if (!user || user.password !== password) {
        return res.status(401).send('Invalid username or password');
    }

    res.status(200).send('Login successful');
});

// Socket.io logic
io.on('connection', (socket) => {
    console.log('a user connected');

    // Send current server list to the new user
    socket.emit('server list', gameServers);

    // Handle creating a new server
    socket.on('create server', (serverName) => {
        if (!serverName) return;
        const newServer = { id: Date.now(), name: serverName, users: [] };
        gameServers.push(newServer);
        io.emit('server list', gameServers); // Broadcast updated list
        console.log('Server created:', serverName);
    });

    // Handle joining a server
    socket.on('join server', (serverId) => {
        const server = gameServers.find(s => s.id === serverId);
        if (server) {
            // Add user to server (basic implementation)
            server.users.push(socket.id); // Using socket.id as a placeholder user identifier
            socket.join(serverId); // Join the socket.io room for the server
            io.to(serverId).emit('message', `User ${socket.id} joined ${server.name}`); // Notify server users
            console.log(`User ${socket.id} joined server ${server.name}`);
        }
    });

    // Handle chat messages within a server
    socket.on('chat message', ({ serverId, message }) => {
        io.to(serverId).emit('message', `User ${socket.id}: ${message}`); // Broadcast message to server room
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        // TODO: Remove user from servers and update server list
    });
});

// For Vercel deployment, export the server instance
// module.exports = server;

// Start the server only if this file is run directly (not imported as a module)
if (require.main === module) {
    server.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
}

// Export the app for Vercel (or other serverless platforms)
module.exports = app;
