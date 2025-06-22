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
    *   Role system: 'admin' and 'user' roles stored in `user_profiles` and used for UI/navigation.
    *   Admin approval required for new accounts (users created with `status: 'pending'`).
*   **User Profiles (`profile.html`)**:
    *   Users can manage some aspects of their profile (e.g., password change).
    *   Displays user's organization memberships.
*   **Friendship System (`friends.html`)**:
    *   Basic structure and APIs likely in place (`friends.js`, `api/friends.js`). Functionality details not fully explored in recent tasks.
*   **Organizations (Multi-Organization Features)**:
    *   Phase 2 of this feature was recently completed.
    *   Admins can manage organizations and user memberships within them (`admin.html`).
    *   Users can view their own organization memberships (`profile.html`).
    *   Backend API and services exist for organization and membership management (`api/adminOrganizations.js`, `api/organizations.js`).
*   **Rooms/Servers (Chat Rooms)**:
    *   Conceptual shift from "game servers" to more general "rooms".
    *   Users can create rooms (name, description; type defaults to 'public'). Endpoint `POST /api/rooms/create`.
    *   Users can list public rooms. Endpoint `GET /api/rooms/list`. Called by `servers.js`.
    *   Users can join/leave rooms, view members. Backend APIs for these exist (`api/rooms.js`).
    *   Frontend display of rooms on `servers.html` via `servers.js`.
*   **Real-time Chat (`chat.html`, `socket/index.js`)**:
    *   Socket.IO is initialized on the backend server.
    *   Basic chat page HTML exists. Full feature integration and security (e.g., JWT auth for sockets) might be ongoing or pending (as per `PROGRESS.md`).
*   **Admin Panel (`admin.html`)**:
    *   User management (listing users, potentially changing roles/status - exact features explored partially).
    *   Organization management (listing orgs, members, assigning org roles - Phase 2).

## 4. Authentication Flow Detailed

*   **Registration**:
    1.  User submits `username` and `password` via frontend.
    2.  Backend `api/auth.js` (`/register`) receives these.
    3.  `authService.registerUser` generates `placeholderEmail = \`\${normalizedUsername}_<timestampSuffix>@no-reply.example.com\``.
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

## 8. Build & Deployment

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

## 9. Key Environment Variables

*   **Backend**:
    *   `DATABASE_URL`: Full PostgreSQL connection string for `node-pg-migrate` (and potentially other direct DB access). Prioritized over `LOCAL_DB_URL`.
    *   `LOCAL_DB_URL`: Fallback for local development database connection string.
    *   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`: For Supabase client libraries.
    *   `JWT_SECRET`: (Mentioned in `.env.development` but Supabase handles JWTs by default, so its current direct use is unclear without deeper JWT middleware check).
    *   `API_KEY`: Custom API key for backend services.
    *   `PORT`: Port for the backend server (e.g., 10000 on Render).
    *   `NODE_ENV`: 'development' or 'production'.
    *   `FRONTEND_URL`: Primary frontend URL (used for reference, potentially for CORS in future).
*   **Frontend (via `scripts/build-config.js` into `public/js/config.js`)**:
    *   `BACKEND_URL`
    *   `NEXT_PUBLIC_SUPABASE_URL` (or similar for Supabase URL)
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or similar for Supabase Anon Key)

## 10. Recent Major Changes & Refactors

*   Shift to username-only registration (no user-provided email).
*   Implementation of `node-pg-migrate` database migration system, with initial schema based on `extracted_ddl.sql`.
*   Refactoring of frontend `AuthManager` for robust access and refresh token handling in `localStorage`.
*   Resolution of several backend API 404s (e.g., `POST /servers` now `POST /api/rooms/create`).
*   Implementation of role storage in `AuthManager` and groundwork for role-based UI.
*   Fixes to frontend logic for parsing nested API responses from `apiService.js` (e.g., in `AuthManager.login`, `AuthManager.refreshToken`, `register.js` for org list, `servers.js` for room list).

## 11. Known Issues / Current State / Areas for Improvement

*   **Password Recovery**: Not implemented for the username-only system. This is a critical missing feature for user experience.
*   **Comprehensive Testing Needed**: After recent significant auth refactors and feature additions, thorough testing of all user flows (registration, login, admin actions, room interactions, organization interactions, etc.) is essential.
*   **Database Schema on Deployment**: Ensuring the database on Render (or any new environment) is correctly initialized *only* by migrations (i.e., starts with a clean public schema before the first `db:migrate:up`). Previous errors like "relation already exists" indicate this might have been an issue. The "No migrations to run!" message in recent logs suggests the `pgmigrations` table *thinks* the schema is up-to-date.
*   **RLS Policies**: Verification of Supabase Row Level Security policies for tables like `organizations` (for public listing) and others to ensure data is accessible as intended (e.g., the `GET /api/organizations` 500 error was likely RLS, now returning 200 OK with empty array, which is fine if no public orgs exist and RLS allows empty reads).
*   **Frontend `servers.js` - Listing Rooms**: The `loadServers` function was recently fixed to call `GET /api/rooms/list` and parse the response correctly. This needs testing.
*   **Role-Based Navigation & Navbar**: Currently in progress. `AuthManager` stores role. `navbar.js` and `login.js` (for redirection) are the next steps in the active plan.
*   **`PROGRESS.md` Items**: Many features outlined in `PROGRESS.md` (advanced room features, Socket.IO security, etc.) are still pending.
*   **Error Handling**: While some specific error messages have been improved, a more systematic review of error handling and user feedback throughout the application could be beneficial.
*   **Code Cleanup**: Removal of any remaining temporary debug logs (e.g., the `console.log` in `AuthManager.register`).

This document should serve as a good snapshot of my current understanding.
