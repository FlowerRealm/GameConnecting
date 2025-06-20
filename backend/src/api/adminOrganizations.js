import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js'; // Updated import
import * as adminOrgService from '../services/adminOrganizationService.js';

const router = express.Router();

// All routes in this file are protected by admin access
router.use(authenticateToken, isAdmin); // Now uses imported isAdmin

// GET / - List all organizations
router.get('/', async (req, res) => {
    try {
        const result = await adminOrgService.listAllOrganizations(req.query);
        if (result.success) {
            res.json({ success: true, data: result.data, message: result.message });
        } else {
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('Admin list organizations error:', error);
        res.status(500).json({ success: false, message: 'Failed to list organizations.' });
    }
});

// GET /pending-memberships - List all pending organization membership requests
// This route is already protected by authenticateToken and isAdmin due to router.use()
router.get('/pending-memberships', async (req, res) => {
    try {
        // The service function will handle fetching records where status_in_org is 'pending_approval'
        // and joining with user_profiles and organizations tables.
        const result = await adminOrgService.listPendingMemberships(req.query); // Pass query for potential pagination

        if (result.success) {
            res.json({ success: true, data: result.data, message: result.message });
        } else {
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('Admin list pending memberships error:', error);
        res.status(500).json({ success: false, message: 'Failed to list pending membership requests.' });
    }
});

// GET /:orgId - Get details of a specific organization
router.get('/:orgId', async (req, res) => {
    try {
        const { orgId } = req.params;
        const result = await adminOrgService.getOrganizationById(orgId);
        if (result.success) {
            res.json({ success: true, data: result.data, message: result.message });
        } else {
            res.status(result.status || 404).json({ success: false, message: result.message || 'Organization not found.' });
        }
    } catch (error) {
        console.error('Admin get organization details error:', error);
        res.status(500).json({ success: false, message: 'Failed to get organization details.' });
    }
});

// POST / - Create a new organization
router.post('/', async (req, res) => {
    try {
        if (!req.body.name) {
            return res.status(400).json({ success: false, message: 'Organization name is required.' });
        }
        const creatorId = req.user.id; // Get creator_id from authenticated user
        const result = await adminOrgService.createOrganization(req.body, creatorId);
        if (result.success) {
            res.status(201).json({ success: true, data: result.data, message: result.message });
        } else {
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('Admin create organization error:', error);
        res.status(500).json({ success: false, message: 'Failed to create organization.' });
    }
});

// PUT /:orgId - Update an organization's details
router.put('/:orgId', async (req, res) => {
    try {
        const { orgId } = req.params;
        const result = await adminOrgService.updateOrganization(orgId, req.body);
        if (result.success) {
            res.json({ success: true, data: result.data, message: result.message });
        } else {
            res.status(result.status || 404).json({ success: false, message: result.message || 'Organization not found or update failed.' });
        }
    } catch (error) {
        console.error('Admin update organization error:', error);
        res.status(500).json({ success: false, message: 'Failed to update organization.' });
    }
});

// DELETE /:orgId - Delete an organization
router.delete('/:orgId', async (req, res) => {
    try {
        const { orgId } = req.params;
        const result = await adminOrgService.deleteOrganization(orgId);
        if (result.success) {
            res.json({ success: true, message: result.message || 'Organization deleted successfully.' });
        } else {
            res.status(result.status || 404).json({ success: false, message: result.message || 'Organization not found or delete failed.' });
        }
    } catch (error) {
        console.error('Admin delete organization error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete organization.' });
    }
});

// GET /:orgId/members - List members of a specific organization
router.get('/:orgId/members', async (req, res) => {
    try {
        const { orgId } = req.params;
        const result = await adminOrgService.listOrganizationMembers(orgId);
        if (result.success) {
            res.json({ success: true, data: result.data, message: result.message });
        } else {
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('Admin list organization members error:', error);
        res.status(500).json({ success: false, message: 'Failed to list organization members.' });
    }
});

// POST /:orgId/members - Add a user to an organization
router.post('/:orgId/members', async (req, res) => {
    try {
        const { orgId } = req.params;
        const { userId, role_in_org } = req.body;
        if (!userId || !role_in_org) {
            return res.status(400).json({ success: false, message: 'User ID and role are required.' });
        }
        const result = await adminOrgService.addOrganizationMember(orgId, userId, role_in_org);
        if (result.success) {
            res.status(201).json({ success: true, data: result.data, message: result.message });
        } else {
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('Admin add organization member error:', error);
        res.status(500).json({ success: false, message: 'Failed to add member to organization.' });
    }
});

// PUT /:orgId/members/:userId - Update a user's role/status in an organization
router.put('/:orgId/members/:userId', async (req, res) => {
    try {
        const { orgId, userId } = req.params;
        const { role_in_org, status_in_org } = req.body; // Changed to destructure for clarity
        if (!role_in_org && !status_in_org) {
            return res.status(400).json({ success: false, message: 'Either role or status must be provided for update.' });
        }
        const result = await adminOrgService.updateOrganizationMember(orgId, userId, { role_in_org, status_in_org });
        if (result.success) {
            res.json({ success: true, data: result.data, message: result.message });
        } else {
            res.status(result.status || 404).json({ success: false, message: result.message || 'Membership not found or update failed.' });
        }
    } catch (error) {
        console.error('Admin update organization member error:', error);
        res.status(500).json({ success: false, message: 'Failed to update organization member.' });
    }
});

// DELETE /:orgId/members/:userId - Remove a user from an organization
router.delete('/:orgId/members/:userId', async (req, res) => {
    try {
        const { orgId, userId } = req.params;
        const result = await adminOrgService.removeOrganizationMember(orgId, userId);
        if (result.success) {
            res.json({ success: true, message: result.message || 'Member removed from organization successfully.' });
        } else {
            res.status(result.status || 404).json({ success: false, message: result.message || 'Membership not found or removal failed.' });
        }
    } catch (error) {
        console.error('Admin remove organization member error:', error);
        res.status(500).json({ success: false, message: 'Failed to remove member from organization.' });
    }
});

export default router;
