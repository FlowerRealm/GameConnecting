import { createClient } from '@supabase/supabase-js';
import { config } from './config.js'; // Assuming this is the generated config

// Check if Supabase config is available
if (!config.supabase || !config.supabase.url || !config.supabase.anonKey) {
  throw new Error('Supabase URL or Anon Key is missing in the configuration. Make sure backend/src/config.js is generated correctly.');
}

export const supabase = createClient(config.supabase.url, config.supabase.anonKey, {
  auth: {
    // Typically, for backend usage, you might want to persist session to handle user context
    // However, for anon key, it's often used for public data access or service-level tasks.
    // If using Supabase Auth for user sessions, this setup might need adjustment or be handled per request.
    // For now, we'll use the basic setup. Service role key might be needed for more privileged operations.
    persistSession: false, // Usually true for client-side, false or handled differently for server-side if not managing user sessions directly here.
    autoRefreshToken: false, // Similarly, often true for client-side.
  }
});
