import express from 'express';

import {
    getAllServersForAdmin,
    createRoom,
    updateServerByAdmin,
    deleteServerByAdmin,
    getRoomMembers,
    kickMemberByAdmin // Added kickMemberByAdmin
} from '../services/roomService.js';
import { deleteCache } from '../utils/cache.js';

const router = express.Router();

// POST /api/admin/servers - Create server by admin
router.post('/', async (req, res) => {
    const { name, description, room_type, adminUserId } = req.body;

    if (!name) {
        return res.status(400).json({ success: false, message: 'Server name is required.' });
    }
    if (room_type && !['public', 'private'].includes(room_type)) {
        return res.status(400).json({ success: false, message: "Invalid room_type. Must be 'public' or 'private'." });
    }

    try {
        const result = await createRoom(name, description, room_type || 'public', adminUserId);
        if (result.success) {
            deleteCache('servers_list'); // Invalidate servers list cache
            res.status(201).json({ success: true, data: result.data, message: 'Server created successfully by admin.' });
        } else {
            res.status(result.error?.status || 500).json({ success: false, message: result.error?.message || 'Failed to create server by admin.' });
        }
    } catch (error) {
        console.error('Error in POST /api/admin/servers route:', error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred on the server while creating room.' });
    }
});

// GET /api/admin/servers - List all servers for admin view (with pagination)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Default limit to 10

        const result = await getAllServersForAdmin({ page, limit });

        if (result.success) {
            // The service now returns an object like { servers: [], total: ..., page: ..., ... } in result.data
            res.json({
                success: true,
                data: result.data, // This correctly passes the whole pagination object
                message: result.message || "Servers retrieved successfully."
            });
        } else {
            res.status(result.error?.status || 500).json({ success: false, message: result.error?.message || 'Failed to fetch servers for admin.' });
        }
    } catch (error) {
        console.error('Error in GET /api/admin/servers route:', error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred on the server.' });
    }
});

// DELETE /api/admin/servers/:serverId/members/:userId - Kick a member from a server by admin
router.delete('/:serverId/members/:userId', async (req, res) => {
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
router.get('/:serverId/members', async (req, res) => {
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
router.delete('/:serverId', async (req, res) => {
    const { serverId } = req.params;

    if (!serverId) { // Should be caught by route structure, but good practice
        return res.status(400).json({ success: false, message: 'Server ID is required in path.' });
    }

    try {
        const result = await deleteServerByAdmin(serverId);
        if (result.success) {
            deleteCache('servers_list'); // Invalidate servers list cache
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
router.put('/:serverId', async (req, res) => {
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
            deleteCache('servers_list'); // Invalidate servers list cache
            res.json({ success: true, data: result.data, message: 'Server updated successfully by admin.' });
        } else {
            res.status(result.error?.status || 500).json({ success: false, message: result.error?.message || 'Failed to update server by admin.' });
        }
    } catch (error) {
        console.error(`Error in PUT /api/admin/servers/${serverId} route:`, error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred on the server while updating room.' });
    }
});



export default router;
