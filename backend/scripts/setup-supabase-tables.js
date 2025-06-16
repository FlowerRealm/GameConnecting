import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.development
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.development') });

// Supabase connection details
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use service role key for admin tasks

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_KEY is not defined in your environment variables.');
  console.error('Please ensure these are set in backend/.env.development or your environment.');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    // detectSessionInUrl: false // Important if running in Node.js environment
  }
});

// Helper function to execute raw SQL
async function executeSQL(sql) {
  try {
    // Supabase uses pg_meta.query for direct SQL, but rpc should also work for DDL.
    // If rpc 'sql' doesn't work for some DDL, direct query or Supabase CLI might be alternatives.
    const { data, error } = await supabase.rpc('sql', { sql });

    if (error) {
      // Check if the error is because the table/type/function/trigger already exists
      // Common PostgreSQL error codes for "already exists":
      // 42P07: duplicate_table (for CREATE TABLE)
      // 42710: duplicate_function (for CREATE FUNCTION)
      // 42723: duplicate_object (can be for types, etc.)
      // 23505: unique_violation (can happen with CREATE UNIQUE INDEX IF NOT EXISTS if not careful)
      if (error.code === '42P07' || error.code === '42710' || error.code === '42723' || error.message.includes('already exists')) {
        console.warn(`Warning (might be ignorable if script is re-run): ${error.message}`);
        return { data: null, error: null, warning: error.message }; // Indicate success with warning
      }
      console.error(`Error executing SQL: ${error.message}`, error);
      throw error; // Re-throw for critical errors
    }
    console.log(`Successfully executed: ${sql.substring(0, 120).replace(/\n/g, " ")}...`);
    return { data, error: null };
  } catch (err) {
    console.error(`Exception during SQL execution for "${sql.substring(0, 120).replace(/\n/g, " ")}...": ${err.message}`);
    throw err; // Re-throw to stop script on critical errors
  }
}

// Main function to create tables
async function setupTables() {
  console.log('Starting Supabase table setup...');

  try {
    // --- Create user_profiles table ---
    // Stores public user information, extending auth.users
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS public.user_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Links to Supabase auth.users
        username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 50),
        note TEXT CHECK (char_length(note) <= 500), -- Optional user note or bio
        role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')), -- User role
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'banned')), -- User account status
        approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin who approved the profile (if applicable)
        approved_at TIMESTAMPTZ, -- Timestamp of approval
        admin_note TEXT CHECK (char_length(admin_note) <= 1000), -- Notes by admin for this user
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
      );
    `);
    console.log('Table "user_profiles" setup process completed.');

    // --- Create friendships table ---
    // Manages relationships between users
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS public.friendships (
        id BIGSERIAL PRIMARY KEY,
        user_id_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        user_id_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')), -- Friendship status
        action_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- User who performed the last action
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        CONSTRAINT user_order_check CHECK (user_id_1 < user_id_2), -- Ensures unique pairs regardless of order
        UNIQUE (user_id_1, user_id_2) -- Ensures a unique friendship pair
      );
    `);
    console.log('Table "friendships" setup process completed.');

    // --- Create servers table ---
    // Stores information about game servers or communities
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS public.servers (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
        description TEXT CHECK (char_length(description) <= 1000),
        created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- User who created the server
        last_activity TIMESTAMPTZ DEFAULT now() NOT NULL, -- Tracks recent activity for sorting/filtering
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
      );
    `);
    console.log('Table "servers" setup process completed.');

    // --- Create server_members table ---
    // Manages user membership and roles within servers
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS public.server_members (
        id BIGSERIAL PRIMARY KEY,
        server_id BIGINT NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin', 'owner')), -- Role within the server
        joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        last_active TIMESTAMPTZ DEFAULT now() NOT NULL, -- Tracks user's last activity within the server
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        UNIQUE (server_id, user_id) -- Ensures a user is only listed once per server
      );
    `);
    console.log('Table "server_members" setup process completed.');

    // --- Create server_join_requests table ---
    // Manages requests from users to join private servers
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS public.server_join_requests (
        id BIGSERIAL PRIMARY KEY,
        server_id BIGINT NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')), -- Status of the join request
        requested_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        UNIQUE (server_id, user_id) -- Prevents duplicate join requests
      );
    `);
    console.log('Table "server_join_requests" setup process completed.');

    // --- RLS (Row Level Security) ---
    // It's CRITICAL to enable RLS for all tables that store sensitive data
    // and define appropriate policies.
    // Example for user_profiles (you'll need to adapt and extend this for all tables):
    // await executeSQL(`ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;`);
    // await executeSQL(`
    //   CREATE POLICY "Public profiles are viewable by everyone."
    //   ON public.user_profiles FOR SELECT USING (true);
    // `); // This is a very permissive read policy, adjust as needed.
    // await executeSQL(`
    //   CREATE POLICY "Users can insert their own profile."
    //   ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
    // `);
    // await executeSQL(`
    //   CREATE POLICY "Users can update their own profile."
    //   ON public.user_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    // `);
    // console.log('RLS policies for "user_profiles" (example) setup process completed.');


    // --- Create functions for created_at and updated_at ---
    // This function will be called by triggers to automatically update the 'updated_at' column
    await executeSQL(`
      CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('Function "trigger_set_timestamp" setup process completed.');

    // --- Apply triggers to tables for updated_at ---
    const tablesWithUpdatedAt = ['user_profiles', 'friendships', 'servers', 'server_members', 'server_join_requests'];
    for (const tableName of tablesWithUpdatedAt) {
      // Drop existing trigger first to make script idempotent
      await executeSQL(`DROP TRIGGER IF EXISTS set_timestamp ON public.${tableName};`);
      await executeSQL(`
        CREATE TRIGGER set_timestamp
        BEFORE UPDATE ON public.${tableName}
        FOR EACH ROW
        EXECUTE FUNCTION public.trigger_set_timestamp();
      `);
      console.log(`Trigger "set_timestamp" applied to "${tableName}".`);
    }

    console.log('Supabase table setup script finished successfully!');

  } catch (error) {
    console.error('Failed to complete Supabase table setup:', error.message);
    // If any step fails, we exit with an error code
    process.exit(1);
  }
}

// Run the setup
setupTables();
