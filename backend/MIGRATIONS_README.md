# Database Schema Migrations

This project uses `node-pg-migrate` to manage database schema changes.
The migration scripts are located in the `backend/migrations` directory.
The configuration for `node-pg-migrate` is in `backend/migrate-pg-config.js`.

## Prerequisites

Before working with migrations, ensure you have:
1.  Set up your local PostgreSQL instance.
2.  Configured the necessary environment variables for database connection as described in `backend/MIGRATION_ENV_SETUP.md`.
3.  Installed backend dependencies (`npm install` in the `backend` directory).

## Common Commands

All migration commands should be run from the `backend` directory.

**1. Apply All Pending Migrations:**
   Brings the database schema to the latest version.
   ```bash
   npm run db:migrate:up
   ```
   The `reset_db.sh` script (located in the project root) also runs this command automatically after successfully recreating the database.

**2. Revert the Last Applied Migration:**
   Rolls back the most recent migration.
   ```bash
   npm run db:migrate:down
   ```
   You can also specify a number of migrations to roll back, e.g., `npm run db:migrate:down -- 2` to roll back the last two.

**3. Check Migration Status:**
   Lists all migrations and shows which ones have been applied.
   ```bash
   npm run db:migrate:status
   ```

**4. Create a New Migration:**
   Generates a new timestamped migration file in the `backend/migrations` directory.
   Replace `YourMigrationName` with a descriptive name for your migration (e.g., `add_users_table`, `add_email_to_profiles`).
   ```bash
   npm run db:migrate:create -- YourMigrationName
   ```
   After creating the file, you will need to edit it to define the schema changes in the `up` and `down` methods. Refer to the `node-pg-migrate` documentation for details on writing migration operations.

## Workflow for Schema Changes

1.  **Create a new migration:** `npm run db:migrate:create -- descriptive_name_for_change`
2.  **Write the migration:** Edit the newly generated file in `backend/migrations`.
    *   Implement the `up()` method to apply your changes.
    *   Implement the `down()` method to revert your changes.
3.  **Test the migration:**
    *   Apply the migration: `npm run db:migrate:up`
    *   Verify the changes in your database.
    *   (Optional) Test rollback: `npm run db:migrate:down`, then `npm run db:migrate:up` again.
4.  **Commit the migration file** along with any other related code changes.

## Resetting the Database

The `reset_db.sh` script in the project root will:
1.  Drop and recreate your local development database (`gameconnecting` by default).
2.  Automatically run `npm run db:migrate:up` from the `backend` directory to apply all migrations to the fresh database.

This ensures that a reset database is always up-to-date with the latest schema.

## User Registration and Authentication Notes

*   **Registration Method**: User registration is based on **username and password only**. Users do not provide an email address during sign-up.
*   **Login Method**: User login is based on **username and password**. The system internally looks up the placeholder email associated with the username to authenticate with Supabase.
*   **Placeholder Emails**: To integrate with Supabase Auth (which requires an email for its user records), the backend automatically generates a unique, non-functional placeholder email for each user (e.g., `username_suffix@no-reply.example.com`). This email is stored in Supabase's `auth.users` table, is programmatically marked as confirmed during creation (to allow login if Supabase project requires email confirmation), and is not used for communication with the user.
*   **Admin Approval**: All new user registrations are set to a 'pending' status. An administrator must approve these accounts (e.g., by updating the `status` field in the `public.user_profiles` table) before users can log in and fully use the application.
*   **Password Recovery**: Due to the use of placeholder emails, standard Supabase email-based password recovery (e.g., "forgot password" links sent to email) **will not work**. If password recovery functionality is needed, it will require a custom implementation (e.g., an admin-driven password reset process).
