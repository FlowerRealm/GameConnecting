/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = async (pgm) => {
  // Function trigger_set_timestamp
  await pgm.sql(`
    CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Table: user_profiles
  await pgm.sql(`
    CREATE TABLE public.user_profiles (
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
  await pgm.sql(`
    CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_timestamp();
  `);

  // Table: friendships
  await pgm.sql(`
    CREATE TABLE public.friendships (
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
  await pgm.sql(`
    CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.friendships
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_timestamp();
  `);

  // Table: rooms
  await pgm.sql(`
    CREATE TABLE public.rooms (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 100),
      description TEXT CHECK (char_length(description) <= 1000),
      creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      room_type TEXT NOT NULL DEFAULT 'public' CHECK (room_type IN ('public', 'private')),
      last_active_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
    );
  `);
  await pgm.sql(`
    CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_timestamp();
  `);

  // Table: room_members
  await pgm.sql(`
    CREATE TABLE public.room_members (
      id BIGSERIAL PRIMARY KEY,
      room_id BIGINT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin', 'owner')),
      joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      last_active TIMESTAMPTZ DEFAULT now() NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      UNIQUE (room_id, user_id)
    );
  `);
  await pgm.sql(`
    CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.room_members
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_timestamp();
  `);

  // Table: room_join_requests
  await pgm.sql(`
    CREATE TABLE public.room_join_requests (
      id BIGSERIAL PRIMARY KEY,
      room_id BIGINT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      requested_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      UNIQUE (room_id, user_id)
    );
  `);
  await pgm.sql(`
    CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.room_join_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_timestamp();
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = async (pgm) => {
  // Drop in reverse order of creation
  await pgm.sql('DROP TRIGGER IF EXISTS set_timestamp ON public.room_join_requests;');
  await pgm.sql('DROP TABLE IF EXISTS public.room_join_requests;');

  await pgm.sql('DROP TRIGGER IF EXISTS set_timestamp ON public.room_members;');
  await pgm.sql('DROP TABLE IF EXISTS public.room_members;');

  await pgm.sql('DROP TRIGGER IF EXISTS set_timestamp ON public.rooms;');
  await pgm.sql('DROP TABLE IF EXISTS public.rooms;');

  await pgm.sql('DROP TRIGGER IF EXISTS set_timestamp ON public.friendships;');
  await pgm.sql('DROP TABLE IF EXISTS public.friendships;');

  await pgm.sql('DROP TRIGGER IF EXISTS set_timestamp ON public.user_profiles;');
  await pgm.sql('DROP TABLE IF EXISTS public.user_profiles;');

  await pgm.sql('DROP FUNCTION IF EXISTS public.trigger_set_timestamp();');
};
