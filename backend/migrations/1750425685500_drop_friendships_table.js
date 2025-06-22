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
  await pgm.sql(`
    DROP TABLE IF EXISTS public.friendships;
  `);
  // Note: The trigger on friendships table (set_timestamp) will be automatically dropped
  // when the table is dropped. If it were a standalone function not tied to other tables,
  // we might need to drop it separately, but here it's fine.
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = async (pgm) => {
  // Recreate the friendships table
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

  // Recreate the trigger for the friendships table
  // Assumes trigger_set_timestamp() function still exists from the initial migration.
  // If not, it should be recreated here or in a dependency migration.
  // Based on initial-schema.js, trigger_set_timestamp is created before any table.
  await pgm.sql(`
    CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.friendships
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_timestamp();
  `);
};
