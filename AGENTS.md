# Project Understanding: GameConnecting Platform (AGENTS.MD)

This document outlines the current understanding of the GameConnecting project, its architecture, features, and status as of the last interaction.

## 1. Project Overview & Purpose

GameConnecting is a platform designed to facilitate real-time connections for gaming purposes. It appears to involve user authentication, user profiles, friend management, community features through organizations, and chat rooms (evolved from an earlier "servers" concept). The platform aims to allow users to create and join these rooms for interaction. It includes administrative functionalities for user and organization management.

## 2. Technology Stack

*   **Backend**:
    *   Runtime: Node.js
    *   Framework: Express.js
    *   Database: PostgreSQL (managed by Supabase)
    *   Authentication: Supabase Auth
    *   Real-time Communication: Socket.IO (initialized, full feature integration may be ongoing)
    *   Database Migrations: `node-pg-migrate`
    *   Build Utilities: `cross-env` for environment variables in scripts.
*   **Frontend**:
    *   Structure: Vanilla HTML, CSS, and JavaScript (ES Modules).
    *   Page Structure: Separate HTML files for different pages (e.g., `login.html`, `register.html`, `servers.html`).
    *   Static File Server: A simple Node.js/Express server (`frontend/webServer.js`) is used to serve static frontend files.
    *   Build Utilities: `cross-env` for environment variables in config build scripts.
*   **Deployment**:
    *   Backend: Render
    *   Frontend: Vercel
*   **Version Control**: Git (on GitHub)

## 3. Core Features

*   **User Authentication & Authorization**:
    *   Username/Password only registration (user does not provide email).
    *   Backend generates a unique placeholder email (e.g., `username_suffix@no-reply.example.com`) for Supabase Auth.
    *   User creation via `supabaseAdmin.auth.admin.createUser()` with `email_confirm: true`.
    *   Login with username and password; backend translates username to placeholder email for Supabase sign-in.
    *   JWT-based session management (access and refresh tokens handled by `AuthManager.js`).
    *   Role system: 'admin' and 'user' roles stored in `user_profiles` and used for UI/navigation (role storage in `AuthManager` complete; UI updates in progress).
    *   Admin approval required for new accounts (users created with `status: 'pending'`).
*   **User Profiles (`profile.html`)**:
    *   Users can manage their password.
    *   Displays user's organization memberships.
*   **Friendship System (`friends.html`)**:
    *   Basic structure and APIs are in place (`friends.js`, `api/friends.js`). Detailed functionality requires further exploration.
*   **Organizations (Multi-Organization Features)**:
    *   Admins can manage organizations and user memberships within them (`admin.html`).
    *   Users can view their own organization memberships (`profile.html`).
    *   Backend API and services exist for organization and membership management.
*   **Rooms/Servers (Chat Rooms)**:
    *   Users can create rooms (name, description; type defaults to 'public') via `POST /api/rooms/create`.
    *   Users can list public rooms via `GET /api/rooms/list` (used by `servers.js`).
    *   Backend APIs for joining/leaving rooms and viewing members are available.
    *   Frontend display of rooms on `servers.html` via `servers.js`.
*   **Real-time Chat (`chat.html`, `socket/index.js`)**:
    *   Socket.IO is initialized on the backend server.
    *   Basic chat page HTML exists. Full feature integration (e.g., message handling, JWT auth for sockets) is likely developmental or pending.
*   **Admin Panel (`admin.html`)**:
    *   User management functionalities.
    *   Organization management features (listing orgs, members, role assignments).

## 4. Authentication Flow Detailed

*   **Registration**:
    1.  User submits `username` and `password` via frontend.
    2.  Backend `api/auth.js` (`/register`) receives these.
    3.  `authService.registerUser` generates `placeholderEmail = \`${normalizedUsername}_<timestampSuffix>@no-reply.example.com\``.
    4.  `supabaseAdmin.auth.admin.createUser({ email: placeholderEmail, password, email_confirm: true })` is called.
    5.  If successful, a new record is inserted into `public.user_profiles` with the actual `username` and `status: 'pending'`, linked to the Supabase auth user ID.
*   **Login**:
    1.  User submits `username` and `password` via frontend.
    2.  Backend `api/auth.js` (`/login`) receives these.
    3.  `authService.loginUser` first queries `public.user_profiles` to find the `id` (Supabase auth ID) for the given `username`.
    4.  It then calls `supabaseAdmin.auth.admin.getUserById(userId)` to fetch the Supabase user, which includes the `placeholderEmail`.
    5.  It then calls `supabase.auth.signInWithPassword({ email: placeholderEmail, password })`.
    6.  If successful, it fetches the `user_profiles.role` and `user_profiles.status`.
    7.  If `status` is 'active', it returns JWTs (access & refresh tokens), username, and role to the frontend.
    8.  Frontend `AuthManager` stores tokens and role in `localStorage`.
*   **Session Management**:
    *   Access tokens are short-lived. Refresh tokens are used to get new access tokens via `/auth/refresh`.
    *   `AuthManager.isAuthenticated()` checks access token validity and attempts proactive refresh.
*   **Admin Approval**: New users remain in 'pending' status and cannot fully log in (will get "awaiting approval" message) until an admin changes their status to 'active' in `user_profiles`.

## 5. Database Schema Overview

*   **`auth.users`**: Managed by Supabase for core authentication (stores placeholder email, hashed password).
*   **`public.user_profiles`**: Extends `auth.users`. Stores `username` (unique), application `role` ('user', 'admin', 'moderator'), `status` ('pending', 'active', 'suspended', 'banned'), notes, etc.
*   **`public.rooms`**: Information about chat rooms (name, description, `room_type` ('public', 'private'), `creator_id`).
*   **`public.room_members`**: Junction table for users and rooms, storing their role in the room (e.g., 'owner', 'member').
*   **`public.room_join_requests`**: For private rooms (if implemented).
*   **`public.organizations`**: Information about organizations.
*   **`public.user_organization_memberships`**: Junction table for users and organizations, storing their role and status in the org.
*   **`public.friendships`**: Manages user-to-user friend relationships and their status.
*   **`public.pgmigrations`**: Tracks applied database migrations for `node-pg-migrate`.
*   **`public.trigger_set_timestamp()`**: PostgreSQL function to automatically update `updated_at` columns.

## 6. Backend API Structure

*   Main router file: `backend/server.js`
*   Key Routers (mostly under `/api` or `/auth`):
    *   `/auth`: Handles `/register`, `/login`, `/refresh`, `/logout` (in `src/api/auth.js`).
    *   `/api/rooms`: Handles room creation, listing, joining, leaving, members, deletion (in `src/api/rooms.js`).
    *   `/api/organizations`: Public listing of organizations (in `src/api/organizations.js`).
    *   `/api/admin/organizations`: Admin-specific organization management (in `src/api/adminOrganizations.js`).
    *   `/admin`: General admin tasks (in `src/api/admin.js`).
    *   `/friends`: Friendship management (in `src/api/friends.js`).
    *   `/users`: User-specific data, password changes (in `src/api/users.js`).
*   Middleware:
    *   `authenticateToken`: Verifies JWTs for protected routes.
    *   `verifyApiKey`: (Present but not globally applied) Checks for `X-API-Key`.
    *   CORS: Configured in `server.js` with a static list of allowed origins.
    *   `express.json()`: For parsing JSON request bodies.

## 7. Frontend Structure

*   Page Structure: Multi-page application with separate HTML files in `frontend/public/pages/`.
*   JavaScript: Vanilla JavaScript, ES Modules. Key shared modules:
    *   `apiService.js`: Centralized API request handling, wraps `fetch`.
    *   `AuthManager.js`: Singleton for managing auth state, tokens, login/logout, registration calls.
    *   `store.js`: Simple state management (e.g., for notifications, loading state).
    *   `config.js`: For frontend configuration (backend URL, Supabase keys).
    *   Page-specific JS files (e.g., `login.js`, `register.js`, `servers.js`, `admin.js`).
*   Static Server: `frontend/webServer.js` (Node.js/Express) serves the `frontend/public` directory.

## 8. File and Directory Inventory

This inventory provides an overview of key files and directories within the GameConnecting project structure.

### Root Directory (`/`)

*   `.gitignore`: Specifies intentionally untracked files that Git should ignore.
*   `AGENTS.md`: This document, providing an evolving understanding of the project.
*   `DEPLOYMENT_SUMMARY.md`: Summarizes deployment configurations and procedures.
*   `PROGRESS.md`: Tracks project progress, completed tasks, and outlines future plans.
*   `README.md`: Main project readme, offering an overview and setup instructions for developers.
*   `TODO_ORGANIZATION_FEATURE_PHASE2.md`: (Historical) Specific todos for the recently completed Phase 2 of the organization feature.
*   `backend/`: Contains all backend server-side code, services, and API logic.
*   `frontend/`: Contains all frontend client-side code, HTML pages, and static assets.
*   `package.json`: Root Node.js project file, defines dependencies (e.g., `concurrently`) and scripts for managing both frontend and backend development environments together.
*   `package-lock.json`: Records exact versions of dependencies for reproducible installs at the root level.
*   `reset_db.sh`: Shell script designed to drop and recreate the local PostgreSQL database, now also triggers database migrations.
*   `switch-env.sh`: Shell script likely used for switching between different environment configuration files (e.g., development, production).
*   `extracted_ddl.sql`: A snapshot of the database schema DDL, now marked as historical as the schema is managed by `node-pg-migrate`.

### `backend/` Directory

*   `.env`, `.env.development`, `.env.production`: Environment variable files for different backend environments (Supabase keys, API keys, database connection strings for the application, etc.). `FRONTEND_URL` is also set here.
*   `MIGRATIONS_README.md`: Documentation for using the `node-pg-migrate` database migration system.
*   `MIGRATION_ENV_SETUP.md`: Instructions for setting up local environment variables required for database migrations (e.g., `DATABASE_URL`, `LOCAL_DB_URL`).
*   `migrate-pg-config.js`: Configuration file for `node-pg-migrate`, specifying database connection details (prioritizing `DATABASE_URL`) and migration settings.
*   `migrations/`: Directory containing all database migration scripts (e.g., `1750425685438_initial-schema.js`).
*   `package.json`: Backend-specific Node.js project file, listing dependencies like `express`, `@supabase/supabase-js`, `cors`, `dotenv`, `socket.io`, and devDependencies such as `nodemon`, `cross-env`, `node-pg-migrate`.
*   `scripts/`: Utility scripts for the backend.
    *   `build-config.js`: Generates `src/config.js` from environment variables for runtime configuration.
    *   `dump-db.js`: Likely a script for creating database backups or dumps.
    *   `setup-supabase-tables.js`: **(Potentially Unused)** An older script, possibly for initial table setup, likely superseded by the `node-pg-migrate` system.
*   `server.js`: The main entry point for the backend Express.js server. It initializes middleware (CORS, JSON parsing, authentication), sets up API routes, and starts the HTTP and Socket.IO servers.
*   `src/`: Contains the core source code for the backend application.
    *   `api/`: Defines API route handlers for different modules/features.
        *   `admin.js`: General admin-related routes.
        *   `adminOrganizations.js`: Routes for administrative management of organizations.
        *   `auth.js`: Handles authentication routes (`/register`, `/login`, `/refresh`, `/logout`).
        *   `friends.js`: Routes for friendship management.
        *   `organizations.js`: Public-facing routes for organizations (e.g., listing).
        *   `rooms.js`: Routes for room/server management (create, list, join, leave, members, delete).
        *   `users.js`: Routes for user-specific actions (e.g., password changes, fetching user's organizations).
    *   `config/`: Contains `index.js` which exports a getter for the generated `config.js` file.
    *   `config.js`: (Generated file by `scripts/build-config.js`) Holds environment-specific backend configuration.
    *   `middleware/`: Contains Express middleware.
        *   `auth.js`: Includes `authenticateToken` middleware for verifying JWTs on protected routes.
    *   `services/`: Houses the business logic and database interaction layer.
        *   `adminOrganizationService.js`: Service logic for admin management of organizations.
        *   `authService.js`: Service logic for user registration (username/password only, placeholder email generation), login (username to placeholder email lookup), and token refresh.
        *   `friendService.js`: Service logic for friendship features.
        *   `roomService.js`: Service logic for room/server operations.
        *   `userService.js`: Service logic for user-related operations (e.g., password updates, fetching user memberships).
    *   `socket/`: Contains the server-side setup for Socket.IO.
        *   `index.js`: Initializes the Socket.IO server and likely defines event handlers for real-time communication.
    *   `supabaseAdminClient.js`: Initializes and exports the Supabase admin client (using the service role key for privileged operations).
    *   `supabaseClient.js`: Initializes and exports the standard Supabase client (using the anonymous key for client-side and RLS-protected operations).

### `frontend/` Directory

*   `.env.development`, `.env.production`: Environment variable files used by `scripts/build-config.js` to generate frontend configuration.
*   `.gitignore`: Frontend-specific Git ignore rules.
*   `package.json`: Frontend-specific Node.js project file, typically for managing development tools and the static web server (dependencies: `express`, `dotenv`, `socket.io-client`; devDependencies: `nodemon`, `cross-env`).
*   `public/`: The root directory for all static assets served to the client.
    *   `images/`: Contains image assets for the frontend.
    *   `js/`: Contains client-side JavaScript files, organized by page or shared functionality.
        *   Core modules: `apiService.js` (API interaction), `AuthManager.js` (auth state), `store.js` (simple state), `socket.js` (Socket.IO client).
        *   Page-specific scripts: `admin.js`, `chat.js`, `friends.js`, `login.js`, `profile.js`, `register.js`, `servers.js`, etc.
        *   `config.js`: (Generated file by `scripts/build-config.js`) Holds environment-specific frontend configuration (e.g., backend URL).
    *   `pages/`: Contains the HTML files for the application's various pages (e.g., `index.html`, `login.html`, `servers.html`).
    *   `styles/`: Contains CSS stylesheets, possibly structured into base styles, components, layouts, and page-specific styles.
*   `scripts/`: Utility scripts for the frontend.
    *   `build-config.js`: Generates `public/js/config.js` from environment variables.
*   `vercel.json`: Configuration file for deployments to the Vercel platform.
*   `webServer.js`: A simple Express.js server used to serve the `frontend/public` directory during local development.

## 9. Build & Deployment

*   **Backend (`backend/`)**:
    *   `npm install` for dependencies.
    *   `npm run build` (runs `scripts/build-config.js` with `NODE_ENV=production`) generates `src/config.js`.
    *   `npm run db:migrate:up` (uses `node-pg-migrate` with `migrate-pg-config.js`) applies database migrations. This is part of Render build command.
    *   `npm start` (runs `node server.js`) for production.
    *   Deployed on Render.
*   **Frontend (`frontend/`)**:
    *   `npm install` for dependencies.
    *   `npm run build` (runs `scripts/build-config.js` with `NODE_ENV=production`) generates `public/js/config.js`.
    *   `npm start` (runs `node webServer.js`) or served as static site.
    *   Deployed on Vercel.
*   **Root**: `npm run install-deps` likely installs for root, backend, and frontend. Root `npm start/dev` probably uses `concurrently`.

## 10. Key Environment Variables

*   **Backend**:
    *   `DATABASE_URL`: Full PostgreSQL connection string for `node-pg-migrate` (and potentially other direct DB access). Prioritized over `LOCAL_DB_URL`.
    *   `LOCAL_DB_URL`: Fallback for local development database connection string.
    *   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`: For Supabase client libraries.
    *   `JWT_SECRET`: (Mentioned in `.env.development` but Supabase handles JWTs by default, so its current direct use is unclear).
    *   `API_KEY`: Custom API key for backend services.
    *   `PORT`: Port for the backend server (e.g., 10000 on Render).
    *   `NODE_ENV`: 'development' or 'production'.
    *   `FRONTEND_URL`: Primary frontend URL (used for reference, potentially for CORS in future).
*   **Frontend (via `scripts/build-config.js` into `public/js/config.js`)**:
    *   `BACKEND_URL`
    *   `NEXT_PUBLIC_SUPABASE_URL` (or similar for Supabase URL)
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or similar for Supabase Anon Key)

## 11. Recent Key System Characteristics
*(Formerly "Recent Major Changes & Refactors")*

*   The authentication system uses username-only registration and login, with placeholder emails for Supabase Auth compatibility.
*   Database schema is managed by `node-pg-migrate`.
*   Frontend `AuthManager.js` handles JWT access/refresh tokens and user role storage in `localStorage`.
*   Frontend API response parsing has been updated to handle a nested data structure from `apiService.js`.

## 12. Current Status, Known Issues, & Potential Next Steps

*   **Key Missing Feature**: Password recovery for the username-only system is not implemented.
*   **Testing**: Comprehensive end-to-end testing is crucial after recent authentication and feature updates.
*   **Deployment & DB Initialization**: Ensuring database schemas in deployment environments (like Render) are exclusively managed and initialized via `node-pg-migrate` from a clean state is critical.
*   **RLS Policies**: Ongoing verification of Supabase Row Level Security policies is needed to ensure correct data access.
*   **Role-Based UI**:
    *   `AuthManager.js` now stores user roles.
    *   The immediate next steps in the active plan involve updating `navbar.js` for role-based link display and `login.js` for role-based redirection. *(This point should be updated once those tasks are confirmed complete by the other agent/plan.)*
*   **`PROGRESS.md` Review**: Many items listed in `PROGRESS.md` (e.g., advanced room features, Socket.IO security enhancements) are likely still pending development.
*   **Error Handling**: A systematic review and enhancement of error handling and user feedback across the application would be beneficial.
*   **Code Cleanup**: Any remaining temporary diagnostic logs should be removed (e.g., the `console.log` in `AuthManager.register` should be removed if not already).

This document should serve as a good snapshot of my current understanding.

## 13. Future State / Planned Features

*(This section will be populated based on user input and items from `PROGRESS.md` not yet fully implemented, e.g., advanced room features, password recovery, Socket.IO security enhancements, etc.)*
