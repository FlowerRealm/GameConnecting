import { supabaseAdmin } from '../supabaseAdminClient.js'; // Ensure this path and export are correct

/**
 * Updates a user's password using their ID.
 * Requires admin privileges (service role key for Supabase client).
 * @param {string} userId - The UUID of the user.
 * @param {string} newPassword - The new password for the user.
 * @returns {Promise<{success: boolean, message?: string, status?: number}>}
 */
export async function updateUserPassword(userId, newPassword) {
    if (!userId || !newPassword) {
        return { success: false, message: 'User ID and new password are required.', status: 400 };
    }
    // Password length validation should ideally be consistent with Supabase policies.
    // This client-side check is a good first step.
    if (newPassword.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters long.', status: 400 };
    }

    try {
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (error) {
            console.error('Supabase admin updateUserById error:', error);
            // Check for specific common errors if needed, e.g., user not found, weak password.
            // For Supabase, error.message often contains useful info, but might not always be suitable for client.
            // error.status might also be available.
            let clientMessage = 'Failed to update password.';
            // Example: if (error.message.includes('User not found')) clientMessage = 'User not found.';
            // else if (error.message.includes('weak password')) clientMessage = 'New password is too weak.';

            // For now, appending Supabase's error message might give more context during development/debugging
            // but consider if this is too much info for production clients.
            clientMessage += ' Supabase: ' + error.message;

            return { success: false, message: clientMessage, status: error.status || 500 };
        }

        // According to Supabase docs, data should contain the updated user object.
        // If no error, the operation was successful.
        // console.log('Password updated successfully for user:', data?.user?.id);
        return { success: true, message: 'Password updated successfully.' };

    } catch (error) {
        console.error('Unexpected error in updateUserPassword service:', error);
        return { success: false, message: 'An unexpected error occurred while updating the password.', status: 500 };
    }
}

/**
 * Placeholder function to fetch organization memberships for a user.
 * @param {string} userId - The UUID of the user.
 * @returns {Promise<Array>} - A promise that resolves to an array of organization memberships.
 */
export async function getUserOrganizationMemberships(userId) {
  if (!userId) {
    console.error('getUserOrganizationMemberships: userId is required.');
    // Consistently return an error object or throw, based on service patterns.
    // For now, throwing, as the API layer will catch it.
    throw new Error('User ID is required to fetch organization memberships.');
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('user_organization_memberships') // Assuming this is the correct table name
      .select(`
        role_in_org,
        status_in_org,
        organizations (
          id,
          name,
          description
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase error in getUserOrganizationMemberships:', error);
      throw error; // Re-throw the error to be caught by the calling API route
    }

    if (!data) {
      return []; // Should not happen if no error, but good practice
    }

    // Transform the data to match the desired output structure
    return data.map(item => {
      if (!item.organizations) {
        // This case might happen if a membership record exists but the related organization is missing
        // or if the join did not populate organizations (e.g. due to RLS on organizations for the admin role if not set up correctly)
        // For now, log and skip or return partial data.
        console.warn(`Membership data for user ${userId} is missing related organization details for a record. Membership ID might be relevant if available.`);
        return null; // Or some other placeholder for malformed data
      }
      return {
        org_id: item.organizations.id,
        org_name: item.organizations.name,
        org_description: item.organizations.description,
        role_in_org: item.role_in_org,
        status_in_org: item.status_in_org,
      };
    }).filter(item => item !== null); // Filter out any nulls from malformed records

  } catch (error) {
    // Catch any unexpected errors during the process
    console.error('Unexpected error in getUserOrganizationMemberships:', error);
    // Re-throw to allow the API layer to handle the HTTP response
    // Or, return a structured error object if that's the service pattern:
    // return { success: false, message: 'Failed to fetch organization memberships.', error: error };
    throw error;
  }
}
