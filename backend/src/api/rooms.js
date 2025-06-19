import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
    createRoom,
    listPublicRooms,
    joinRoom,
    leaveRoom,
    getRoomMembers,
    deleteRoom,
} from '../services/roomService.js';

const router = express.Router();

// POST /create - Create a new room
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { name, description, room_type } = req.body;
        const creatorId = req.user.userId; // Assuming authenticateToken sets req.user.userId

        if (!name || !room_type) {
            return res.status(400).json({ success: false, message: 'Room name and type are required.' });
        }
        if (!['public', 'private'].includes(room_type)) {
            return res.status(400).json({ success: false, message: "Invalid room type. Must be 'public' or 'private'." });
        }

        const result = await createRoom(name, description, room_type, creatorId);

        if (result.success) {
            res.status(201).json({ success: true, message: 'Room created successfully.', data: result.data });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('API Error - /rooms/create:', error);
        res.status(500).json({ success: false, message: 'Failed to create room due to server error.' });
    }
});

// GET /list - Get a list of public rooms
router.get('/list', async (req, res) => { // No auth needed for listing public rooms
    try {
        const result = await listPublicRooms();
        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('API Error - /rooms/list:', error);
        res.status(500).json({ success: false, message: 'Failed to list rooms due to server error.' });
    }
});

// POST /join/:roomId - Join a room
router.post('/join/:roomId', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.userId;

        if (!roomId) {
            return res.status(400).json({ success: false, message: 'Room ID is required.' });
        }

        const result = await joinRoom(roomId, userId);

        if (result.success) {
            res.json({ success: true, message: 'Successfully joined room.', data: result.data });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('API Error - /rooms/join/:roomId:', error);
        res.status(500).json({ success: false, message: 'Failed to join room due to server error.' });
    }
});

// POST /leave/:roomId - Leave a room
router.post('/leave/:roomId', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.userId;

        if (!roomId) {
            return res.status(400).json({ success: false, message: 'Room ID is required.' });
        }

        const result = await leaveRoom(roomId, userId);

        if (result.success) {
            res.json({ success: true, message: result.message });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('API Error - /rooms/leave/:roomId:', error);
        res.status(500).json({ success: false, message: 'Failed to leave room due to server error.' });
    }
});

// GET /:roomId/members - Get members of a specific room
router.get('/:roomId/members', authenticateToken, async (req, res) => {
    // Auth is good here to ensure only logged-in users can see members,
    // could be further restricted to room members only if needed via service logic.
    try {
        const { roomId } = req.params;
        if (!roomId) {
            return res.status(400).json({ success: false, message: 'Room ID is required.' });
        }

        const result = await getRoomMembers(roomId);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('API Error - /rooms/:roomId/members:', error);
        res.status(500).json({ success: false, message: 'Failed to get room members due to server error.' });
    }
});

// DELETE /:roomId - Delete a room (only by creator)
router.delete('/:roomId', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.userId;

        if (!roomId) {
            return res.status(400).json({ success: false, message: 'Room ID is required.' });
        }

        const result = await deleteRoom(roomId, userId);

        if (result.success) {
            res.json({ success: true, message: result.message });
        } else {
            res.status(result.error.status || 500).json({ success: false, message: result.error.message });
        }
    } catch (error) {
        console.error('API Error - /rooms/:roomId (DELETE):', error);
        res.status(500).json({ success: false, message: 'Failed to delete room due to server error.' });
    }
});

export default router;