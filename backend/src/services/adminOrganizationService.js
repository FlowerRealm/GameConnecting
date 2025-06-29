import { supabaseAdmin } from '../supabaseAdminClient.js'; // Changed to use supabaseAdmin client
// Using supabaseAdmin client for all operations in this service to ensure admin privileges
// and bypass RLS if necessary for admin-level data access.

const DEFAULT_PAGE_SIZE = 10;

/**
 * Lists all organizations with pagination.
 * @param {object} queryParams - Query parameters for pagination (page, limit).
 * @returns {Promise<object>} Result object.
 */
export async function listAllOrganizations(queryParams = {}) {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * limit;

    try {
        const { data, error, count } = await supabaseAdmin // Changed to supabaseAdmin
            .from('organizations')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return {
            success: true,
            data: {
                organizations: data,
                total: count,
                page,
                totalPages: Math.ceil(count / limit),
                limit,
            },
            message: "Organizations retrieved successfully."
        };
    } catch (error) {
        console.error('Error listing organizations:', error);
        return { success: false, message: error.message, status: 500 };
    }
}

/**
 * Gets a single organization by its ID.
 * @param {string} orgId - The UUID of the organization.
 * @returns {Promise<object>} Result object.
 */
export async function getOrganizationById(orgId) {
    try {
        const { data, error } = await supabaseAdmin // Changed to supabaseAdmin
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // Not found
                return { success: false, message: 'Organization not found.', status: 404 };
            }
            throw error;
        }
        return { success: true, data, message: "Organization retrieved successfully." };
    } catch (error) {
        console.error(`Error getting organization by ID ${orgId}:`, error);
        return { success: false, message: error.message, status: 500 };
    }
}

/**
 * Creates a new organization.
 * @param {object} orgData - Data for the new organization {name, description, is_publicly_listable}.
 * @param {string} creatorId - The UUID of the user creating the organization.
 * @returns {Promise<object>} Result object.
 */
export async function createOrganization(orgData, creatorId) {
    const { name, description, is_publicly_listable = true } = orgData;
    const orgInsertPayload = {
        name,
        description,
        is_publicly_listable,
        created_by: creatorId
    };

    try {
        const { data: newOrganization, error } = await supabaseAdmin
            .from('organizations')
            .insert([orgInsertPayload])
            .select()
            .single();

        if (error) {
            throw error;
        }

        if (!newOrganization) {
            return { success: false, message: '创建组织失败：未能从数据库取回已创建的组织信息。', status: 500 };
        }

        const membershipPayload = {
            user_id: creatorId,
            organization_id: newOrganization.id,
            role_in_org: 'org_admin',
            status_in_org: 'approved'
        };

        const { error: memberError } = await supabaseAdmin
            .from('user_organization_memberships')
            .insert(membershipPayload);

        if (memberError) {
            console.warn(`[createOrganization] Failed to add creator as admin to new org ${newOrganization.id}: ${memberError.message}. Organization was created, but admin membership failed.`);
        }

        return { success: true, data: newOrganization, message: "Organization created successfully.", status: 201 };

    } catch (error) {
        return { success: false, message: error.message, status: (error.code === '23505' ? 409 : 500) };
    }
}

/**
 * Updates an existing organization.
 * @param {string} orgId - The UUID of the organization to update.
 * @param {object} updateData - Fields to update {name, description, is_publicly_listable}.
 * @returns {Promise<object>} Result object.
 */
export async function updateOrganization(orgId, updateData) {
    try {
        const { data: updatedOrganization, error } = await supabaseAdmin // Changed to supabaseAdmin
            .from('organizations')
            .update(updateData)
            .eq('id', orgId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') return { success: false, message: 'Organization not found for update.', status: 404 };
            throw error;
        }
        return { success: true, data: updatedOrganization, message: "Organization updated successfully." };
    } catch (error) {
        console.error(`Error updating organization ${orgId}:`, error);
        return { success: false, message: error.message, status: (error.code === '23505' ? 409 : 500) };
    }
}

/**
 * Deletes an organization.
 * @param {string} orgId - The UUID of the organization to delete.
 * @returns {Promise<object>} Result object.
 */
export async function deleteOrganization(orgId) {
    try {
        const { error, count } = await supabaseAdmin // Changed to supabaseAdmin
            .from('organizations')
            .delete({ count: 'exact' })
            .eq('id', orgId);

        if (error) throw error;
        if (count === 0) return { success: false, message: 'Organization not found for deletion.', status: 404 };

        return { success: true, message: "Organization deleted successfully." };
    } catch (error) {
        console.error(`Error deleting organization ${orgId}:`, error);
        return { success: false, message: error.message, status: 500 };
    }
}

/**
 * Lists members of an organization with pagination.
 * @param {string} orgId - The UUID of the organization.
 * @param {object} queryParams - Query parameters for pagination (page, limit).
 * @returns {Promise<object>} Result object.
 */
export async function listOrganizationMembers(orgId, queryParams = {}) {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * limit;

    try {
        const { data, error, count } = await supabaseAdmin // Changed to supabaseAdmin
            .from('user_organization_memberships')
            .select(`
                user_id,
                role_in_org,
                status_in_org,
                created_at,
                user_profiles ( username )
            `, { count: 'exact' })
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        const members = data.map(m => ({
            userId: m.user_id,
            username: m.user_profiles?.username,
            roleInOrg: m.role_in_org,
            statusInOrg: m.status_in_org,
            joinedAt: m.created_at, // Using memberships.created_at as joined_at
        }));

        return {
            success: true,
            data: {
                members,
                total: count,
                page,
                totalPages: Math.ceil(count / limit),
                limit,
            },
            message: "Organization members retrieved successfully."
        };
    } catch (error) {
        console.error(`Error listing members for organization ${orgId}:`, error);
        return { success: false, message: error.message, status: 500 };
    }
}

/**
 * Adds a user to an organization.
 * @param {string} orgId - The UUID of the organization.
 * @param {string} userId - The UUID of the user to add.
 * @param {string} role_in_org - The role of the user in the organization.
 * @returns {Promise<object>} Result object.
 */
export async function addOrganizationMember(orgId, userId, role_in_org) {
    try {
        const { data: newMembership, error } = await supabaseAdmin // Changed to supabaseAdmin
            .from('user_organization_memberships')
            .insert([{
                organization_id: orgId,
                user_id: userId,
                role_in_org: role_in_org,
                status_in_org: 'approved' // Admins add members as approved directly
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data: newMembership, message: "Member added to organization successfully.", status: 201 };
    } catch (error) {
        console.error(`Error adding member ${userId} to organization ${orgId}:`, error);
        return { success: false, message: error.message, status: (error.code === '23505' ? 409 : 500) }; // Handle unique constraint violation
    }
}

/**
 * Updates a user's membership details in an organization.
 * @param {string} orgId - The UUID of the organization.
 * @param {string} userId - The UUID of the user whose membership to update.
 * @param {object} memberData - Fields to update {role_in_org, status_in_org}.
 * @returns {Promise<object>} Result object.
 */
export async function updateOrganizationMember(orgId, userId, memberData) {
    const { role_in_org, status_in_org } = memberData;
    const updatePayload = {};
    if (role_in_org) updatePayload.role_in_org = role_in_org;
    if (status_in_org) updatePayload.status_in_org = status_in_org;

    if (Object.keys(updatePayload).length === 0) {
        return { success: false, message: "No valid fields provided for update.", status: 400 };
    }

    try {
        const { data: updatedMembership, error } = await supabaseAdmin // Changed to supabaseAdmin
            .from('user_organization_memberships')
            .update(updatePayload)
            .eq('organization_id', orgId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') return { success: false, message: 'Membership not found for update.', status: 404 };
            throw error;
        }
        return { success: true, data: updatedMembership, message: "Organization member updated successfully." };
    } catch (error) {
        console.error(`Error updating member ${userId} in organization ${orgId}:`, error);
        return { success: false, message: error.message, status: 500 };
    }
}

/**
 * Removes a user from an organization.
 * @param {string} orgId - The UUID of the organization.
 * @param {string} userId - The UUID of the user to remove.
 * @returns {Promise<object>} Result object.
 */
export async function removeOrganizationMember(orgId, userId) {
    try {
        const { error, count } = await supabaseAdmin // Changed to supabaseAdmin
            .from('user_organization_memberships')
            .delete({ count: 'exact' })
            .eq('organization_id', orgId)
            .eq('user_id', userId);

        if (error) throw error;
        if (count === 0) return { success: false, message: 'Membership not found for removal.', status: 404 };

        return { success: true, message: "Member removed from organization successfully." };
    } catch (error) {
        console.error(`Error removing member ${userId} from organization ${orgId}:`, error);
        return { success: false, message: error.message, status: 500 };
    }
}

/**
 * Lists all publicly listable organizations.
 * @returns {Promise<object>} Result object.
 */
export async function listPublicOrganizations() {
    try {
        const { data, error } = await supabaseAdmin // Changed to supabaseAdmin for consistency, though public might use anon client
            .from('organizations')
            .select('id, name, description') // Select only specific fields for public view
            .eq('is_publicly_listable', true)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching public organizations:', error); // Keep this detailed log
            let detailedMessage = 'Failed to fetch public organizations.';
            // Check if the error message or code hints at RLS, though this is heuristic
            if (error.message && (error.message.includes('permission denied') || error.message.includes('policy'))) {
                detailedMessage += ' This might be due to Row Level Security (RLS) policies. Please check table permissions in Supabase.';
            }
            return { success: false, message: detailedMessage, error: error, status: 500 };
        }
        return { success: true, data: data || [], status: 200 };
    } catch (error) { // Catch unexpected errors
        console.error('Unexpected error in listPublicOrganizations:', error);
        // Ensure the caught error is also passed along if it's different from a Supabase direct error
        return { success: false, message: 'An unexpected error occurred while fetching public organizations.', error: error, status: 500 };
    }
}

/**
 * Lists all organization membership requests with 'pending_approval' status.
 * @param {object} queryParams - Query parameters for pagination (page, limit).
 * @returns {Promise<object>} Result object with pending memberships.
 */
export async function listPendingMemberships(queryParams = {}) {
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * limit;

    try {
        const { data, error, count } = await supabaseAdmin // Changed to supabaseAdmin
            .from('user_organization_memberships')
            .select(`
                id,
                user_id,
                organization_id,
                role_in_org,
                status_in_org,
                created_at,
                user_profiles ( username ),
                organizations ( name )
            `, { count: 'exact' })
            .eq('status_in_org', 'pending_approval')
            .order('created_at', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching pending memberships:', error);
            return { success: false, message: 'Failed to fetch pending memberships.', error, status: 500 };
        }

        const pendingRequests = data.map(req => ({
            membershipId: req.id,
            userId: req.user_id,
            username: req.user_profiles?.username,
            // userEmail: req.user_profiles?.email, // Removed email as it's not in user_profiles
            organizationId: req.organization_id,
            organizationName: req.organizations?.name,
            requestedRole: req.role_in_org,
            status: req.status_in_org,
            requestedAt: req.created_at
        }));

        return {
            success: true,
            data: {
                pendingRequests,
                total: count,
                page,
                totalPages: Math.ceil((count || 0) / limit),
                limit
            },
            message: "Pending memberships retrieved successfully.",
            status: 200
        };
    } catch (error) {
        console.error('Unexpected error in listPendingMemberships:', error);
        return { success: false, message: 'An unexpected error occurred while fetching pending memberships.', error, status: 500 };
    }
}
