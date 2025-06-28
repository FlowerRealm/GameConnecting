# Migration Environment Setup

Database migrations are configured in `backend/migrate-pg-config.js`. This configuration prioritizes connection settings using environment variables. Ensure these are set in your `backend/.env.development` or a similar `.env` file loaded by `dotenv` in `migrate-pg-config.js`.

## Priority 1: `DATABASE_URL` (For Hosted Environments like Render)

If a `DATABASE_URL` environment variable is set, `node-pg-migrate` will use this connection string.
Hosting platforms like Render often provide this variable automatically for their managed database services.
It should be a complete PostgreSQL connection string, e.g.:
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```
**If `DATABASE_URL` is present, it will override `LOCAL_DB_URL` and individual local parameters for the main `databaseUrl` setting in `node-pg-migrate`.**

---

## Priority 2: `LOCAL_DB_URL` (For Local Development when `DATABASE_URL` is not set)

If `DATABASE_URL` is NOT set, `node-pg-migrate` will then look for `LOCAL_DB_URL`.
This is intended for your **local PostgreSQL instance** (the one targeted by `reset_db.sh`).
Set the `LOCAL_DB_URL` in your `backend/.env.development` (or a similar `.env` file):

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

## Using Individual Parameters (Local Development - Alternative to `LOCAL_DB_URL` when `DATABASE_URL` is not set)

If neither `DATABASE_URL` nor `LOCAL_DB_URL` are set, `node-pg-migrate` can use individual parameters for your **local PostgreSQL instance**. You would need to uncomment them in `migrate-pg-config.js` and set them in your environment:

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
