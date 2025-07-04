-- ###################################################################################
-- # IMPORTANT NOTE:                                                                 #
-- # This file contains an extraction of the DDL schema as of a certain point in time. #
-- # The database schema for this project is now actively managed by                 #
-- # `node-pg-migrate`.                                                              #
-- #                                                                                 #
-- # Please refer to the migration scripts in the `backend/migrations` directory     #
-- # for the authoritative schema definition and for making schema changes.          #
-- #                                                                                 #
-- # This file is kept for historical reference only.                                #
-- # Do NOT apply this file manually to a database managed by migrations.            #
-- ###################################################################################

-- Original content of the file starts below...
-- Function to automatically update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table: user_profiles
-- Stores public user information, extending auth.users
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

DROP TRIGGER IF EXISTS set_timestamp ON public.user_profiles;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Table: friendships
-- Manages relationships between users
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

DROP TRIGGER IF EXISTS set_timestamp ON public.friendships;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.friendships
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Table: rooms
-- Stores information about game rooms or communities
CREATE TABLE IF NOT EXISTS public.rooms (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 1000),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- User who created the room
  room_type TEXT NOT NULL DEFAULT 'public' CHECK (room_type IN ('public', 'private')), -- Type of the room
  last_active_at TIMESTAMPTZ DEFAULT now() NOT NULL, -- Tracks recent activity for sorting/filtering
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS set_timestamp ON public.rooms;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Table: room_members
-- Manages user membership and roles within rooms
CREATE TABLE IF NOT EXISTS public.room_members (
  id BIGSERIAL PRIMARY KEY,
  room_id BIGINT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin', 'owner')), -- Role within the room
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_active TIMESTAMPTZ DEFAULT now() NOT NULL, -- Tracks user's last activity within the room
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (room_id, user_id) -- Ensures a user is only listed once per room
);

DROP TRIGGER IF EXISTS set_timestamp ON public.room_members;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.room_members
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Table: room_join_requests
-- Manages requests from users to join private rooms
CREATE TABLE IF NOT EXISTS public.room_join_requests (
  id BIGSERIAL PRIMARY KEY,
  room_id BIGINT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')), -- Status of the join request
  requested_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (room_id, user_id) -- Prevents duplicate join requests
);

DROP TRIGGER IF EXISTS set_timestamp ON public.room_join_requests;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.room_join_requests
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
