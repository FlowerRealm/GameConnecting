# Migration Environment Setup

To run database migrations using `node-pg-migrate`, you need to ensure the following environment variables are set, typically in your `backend/.env.development` or a dedicated `.env` file that `migrate-pg-config.js` can load.

These should point to your **local PostgreSQL instance** that `reset_db.sh` targets.

## Option 1: Using `LOCAL_DB_URL` (Recommended)

Set the `LOCAL_DB_URL` in your `backend/.env.development` (or a new `.env` file loaded by `dotenv` in `migrate-pg-config.js`):

```
LOCAL_DB_URL=postgresql://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME
```

Replace `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, and `DB_NAME` with your local PostgreSQL details. For example, based on `reset_db.sh`:
User: `gameconnecting`
Password: You'll need to set a password for the `gameconnecting` user in PostgreSQL if it doesn't have one, or use the `postgres` superuser if you know its password and are comfortable using it for migrations (not ideal for table ownership). The `reset_db.sh` uses `ADMIN_DB_USER="postgres"` and `ADMIN_DB_PASS="cz201010101103!"` to create the DB. The `gameconnecting` user is set as owner but no password for it is defined in `reset_db.sh`.
Host: `localhost`
Port: `5432`
Database Name: `gameconnecting`

Example `LOCAL_DB_URL` if `gameconnecting` user has password `mysecretpassword`:
```
LOCAL_DB_URL=postgresql://gameconnecting:mysecretpassword@localhost:5432/gameconnecting
```

## Option 2: Using Individual Parameters (Alternative)

If you don't use `LOCAL_DB_URL`, `node-pg-migrate` can use individual parameters. You would need to uncomment them in `migrate-pg-config.js` and set them in your environment:

```
LOCAL_DB_HOST=localhost
LOCAL_DB_PORT=5432
LOCAL_DB_NAME=gameconnecting
LOCAL_DB_USER=gameconnecting # User that will own the schema objects
LOCAL_DB_PASSWORD=your_password_for_gameconnecting_user
```

**Important for `reset_db.sh` users:**
The `reset_db.sh` script creates the user `gameconnecting` and database `gameconnecting`. You might need to grant this user a password or ensure it can connect. Alternatively, for local development, you *could* use the `postgres` superuser details (like `ADMIN_DB_USER` and `ADMIN_DB_PASS` from `reset_db.sh`) for migrations if you are careful, but it's generally better to use a dedicated application user that owns the schema objects.
Ensure the user specified for migrations has permissions to CREATE tables, types, functions, etc., in the target database.
