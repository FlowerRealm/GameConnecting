import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import {
    getAllServersForAdmin,
    createRoom,
    updateServerByAdmin,
    deleteServerByAdmin,
    getRoomMembers,
    kickMemberByAdmin // Added kickMemberByAdmin
} from '../services/roomService.js';

const router = express.Router();

// GET /api/admin/servers - List all servers for admin view
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await getAllServersForAdmin();
        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(result.error?.status || 500).json({ success: false, message: result.error?.message || 'Failed to fetch servers for admin.' });
        }
    } catch (error) {
        console.error('Error in GET /api/admin/servers route:', error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred on the server.' });
    }
});

// DELETE /api/admin/servers/:serverId/members/:userId - Kick a member from a server by admin
router.delete('/:serverId/members/:userId', authenticateToken, isAdmin, async (req, res) => {
    const { serverId, userId } = req.params;

    if (!serverId || !userId) { // Should be caught by route structure
        return res.status(400).json({ success: false, message: 'Server ID and User ID are required.' });
    }

    try {
        const result = await kickMemberByAdmin(serverId, userId);
        if (result.success) {
            res.json({ success: true, message: result.message || 'Member kicked successfully by admin.' });
        } else {
            res.status(result.error?.status || 500).json({ success: false, message: result.error?.message || 'Failed to kick member by admin.' });
        }
    } catch (error) {
        console.error(`Error in DELETE /api/admin/servers/${serverId}/members/${userId} route:`, error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred on the server while kicking member.' });
    }
});

// GET /api/admin/servers/:serverId/members - Get members of a specific server for admin view
router.get('/:serverId/members', authenticateToken, isAdmin, async (req, res) => {
    const { serverId } = req.params;

    if (!serverId) { // Should be caught by route structure
        return res.status(400).json({ success: false, message: 'Server ID is required.' });
    }

    try {
        const result = await getRoomMembers(serverId); // Reusing existing service function
        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(result.error?.status || 500).json({ success: false, message: result.error?.message || 'Failed to fetch server members for admin.' });
        }
    } catch (error) {
        console.error(`Error in GET /api/admin/servers/${serverId}/members route:`, error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred on the server while fetching server members.' });
    }
});

// DELETE /api/admin/servers/:serverId - Delete server by admin
router.delete('/:serverId', authenticateToken, isAdmin, async (req, res) => {
    const { serverId } = req.params;

    if (!serverId) { // Should be caught by route structure, but good practice
        return res.status(400).json({ success: false, message: 'Server ID is required in path.' });
    }

    try {
        const result = await deleteServerByAdmin(serverId);
        if (result.success) {
            res.json({ success: true, message: result.message || 'Server deleted successfully by admin.' });
        } else {
            res.status(result.error?.status || 500).json({ success: false, message: result.error?.message || 'Failed to delete server by admin.' });
        }
    } catch (error) {
        console.error(`Error in DELETE /api/admin/servers/${serverId} route:`, error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred on the server while deleting room.' });
    }
});

// PUT /api/admin/servers/:serverId - Update server by admin
router.put('/:serverId', authenticateToken, isAdmin, async (req, res) => {
    const { serverId } = req.params;
    const updates = req.body; // Should contain fields like name, description, room_type

    // Basic validation for updates object
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: 'Request body must be an object with fields to update.' });
    }
    // Further validation (e.g., specific fields, types, lengths) is handled by the service layer

    try {
        const result = await updateServerByAdmin(serverId, updates);
        if (result.success) {
            res.json({ success: true, data: result.data, message: 'Server updated successfully by admin.' });
        } else {
            res.status(result.error?.status || 500).json({ success: false, message: result.error?.message || 'Failed to update server by admin.' });
        }
    } catch (error) {
        console.error(`Error in PUT /api/admin/servers/${serverId} route:`, error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred on the server while updating room.' });
    }
});

// Placeholder for other admin server routes (create, update, delete, members)
// POST / - Create server by admin
// PUT /:serverId - Update server by admin
// DELETE /:serverId - Delete server by admin
// GET /:serverId/members - Get server members for admin
// DELETE /:serverId/members/:userId - Kick member by admin

// POST /api/admin/servers - Create server by admin
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    const { name, description, room_type } = req.body;
    const adminUserId = req.user.id; // Admin's user ID from token

    if (!name) {
        return res.status(400).json({ success: false, message: 'Server name is required.' });
    }
    if (room_type && !['public', 'private'].includes(room_type)) {
        return res.status(400).json({ success: false, message: "Invalid room_type. Must be 'public' or 'private'." });
    }

    try {
        const result = await createRoom(name, description, room_type || 'public', adminUserId);
        if (result.success) {
            res.status(201).json({ success: true, data: result.data, message: 'Server created successfully by admin.' });
        } else {
            res.status(result.error?.status || 500).json({ success: false, message: result.error?.message || 'Failed to create server by admin.' });
        }
    } catch (error) {
        console.error('Error in POST /api/admin/servers route:', error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred on the server while creating room.' });
    }
});

export default router;
