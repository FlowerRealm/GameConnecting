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
    const { data, error } = await supabase.rpc('sql', { sql });

    if (error) {
      if (error.code === '42P07' || error.code === '42710' || error.code === '42723' || error.message.includes('already exists')) {
        console.warn(`Warning (might be ignorable if script is re-run): ${error.message}`);
        return { data: null, error: null, warning: error.message };
      }
      console.error(`Error executing SQL: ${error.message}`, error);
      throw error;
    }
    console.log(`Successfully executed: ${sql.substring(0, 120).replace(/\n/g, " ")}...`);
    return { data, error: null };
  } catch (err) {
    console.error(`Exception during SQL execution for "${sql.substring(0, 120).replace(/\n/g, " ")}...": ${err.message}`);
    throw err;
  }
}

// Main function to create tables
async function setupTables() {
  console.log('Starting Supabase table setup...');

  try {
    // --- Create user_profiles table ---
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS public.user_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 50),
        note TEXT CHECK (char_length(note) <= 500),
        role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
        approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        approved_at TIMESTAMPTZ,
        admin_note TEXT CHECK (char_length(admin_note) <= 1000),
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
      );
    `);
    console.log('Table "user_profiles" setup process completed.');

    // --- Create friendships table ---
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS public.friendships (
        id BIGSERIAL PRIMARY KEY,
        user_id_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        user_id_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
        action_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        CONSTRAINT user_order_check CHECK (user_id_1 < user_id_2),
        UNIQUE (user_id_1, user_id_2)
      );
    `);
    console.log('Table "friendships" setup process completed.');

    // --- Create rooms table (formerly servers) ---
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS public.rooms (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
        description TEXT CHECK (char_length(description) <= 1000),
        creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Renamed from created_by
        room_type TEXT NOT NULL DEFAULT 'public' CHECK (room_type IN ('public', 'private')), -- Added column
        last_active_at TIMESTAMPTZ DEFAULT now() NOT NULL, -- Renamed from last_activity
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
      );
    `);
    console.log('Table "rooms" setup process completed.');

    // --- Create room_members table (formerly server_members) ---
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS public.room_members (
        id BIGSERIAL PRIMARY KEY,
        room_id BIGINT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE, -- Renamed from server_id
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin', 'owner')),
        joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        last_active TIMESTAMPTZ DEFAULT now() NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        UNIQUE (room_id, user_id) -- Updated for room_id
      );
    `);
    console.log('Table "room_members" setup process completed.');

    // --- Create room_join_requests table (formerly server_join_requests) ---
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS public.room_join_requests (
        id BIGSERIAL PRIMARY KEY,
        room_id BIGINT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE, -- Renamed from server_id
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        requested_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        UNIQUE (room_id, user_id) -- Updated for room_id
      );
    `);
    console.log('Table "room_join_requests" setup process completed.');

    // --- Create organizations table ---
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS public.organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
        description TEXT CHECK (char_length(description) <= 1000),
        created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
        is_publicly_listable BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log('Table "organizations" setup process completed.');

    // --- Create user_organization_memberships table ---
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS public.user_organization_memberships (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
        role_in_org TEXT NOT NULL DEFAULT 'member' CHECK (role_in_org IN ('member', 'org_admin')),
        status_in_org TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status_in_org IN ('pending_approval', 'approved', 'invited', 'rejected', 'left', 'removed')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT user_organization_unique UNIQUE (user_id, organization_id)
      );
    `);
    console.log('Table "user_organization_memberships" setup process completed.');

    // --- RLS (Row Level Security) ---
    // Reminder: Enable RLS and define policies for all tables with sensitive data.
    // Example policies for user_profiles are commented out below for brevity but should be implemented.
    /*
    await executeSQL(`ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;`);
    await executeSQL(`
      CREATE POLICY "Public profiles are viewable by everyone."
      ON public.user_profiles FOR SELECT USING (true);
    `);
    await executeSQL(`
      CREATE POLICY "Users can insert their own profile."
      ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
    `);
    await executeSQL(`
      CREATE POLICY "Users can update their own profile."
      ON public.user_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    `);
    console.log('RLS policies for "user_profiles" (example) setup process completed.');
    */

    // --- Create functions for created_at and updated_at ---
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
    // Updated table names in this array
    const tablesWithUpdatedAt = ['user_profiles', 'friendships', 'rooms', 'room_members', 'room_join_requests', 'organizations', 'user_organization_memberships'];
    for (const tableName of tablesWithUpdatedAt) {
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
    process.exit(1);
  }
}

// Run the setup
setupTables();
