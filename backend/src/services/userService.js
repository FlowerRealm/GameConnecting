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
