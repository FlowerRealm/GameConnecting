import express from 'express';
// It's better to import only the specific function if the service file grows large,
// but for now, importing all from adminOrganizationService is fine as listPublicOrganizations is there.
import * as organizationService from '../services/adminOrganizationService.js';

const router = express.Router();

// GET / - List all publicly listable organizations
router.get('/', async (req, res) => {
    try {
        // For public listing, no admin rights or auth needed.
        // The service function listPublicOrganizations handles filtering by 'is_publicly_listable = true'.
        const result = await organizationService.listPublicOrganizations();

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            // Use the status from the service if available, otherwise default to 500
            res.status(result.status || 500).json({ success: false, message: result.message });
        }
    } catch (error) {
        // This catch block handles unexpected errors from the service call itself,
        // though the service functions are designed to return error objects.
        console.error('Public list organizations API error:', error);
        res.status(500).json({ success: false, message: 'Failed to list organizations due to a server error.' });
    }
});

export default router;
