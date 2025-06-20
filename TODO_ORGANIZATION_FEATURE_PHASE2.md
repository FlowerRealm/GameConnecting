# TODO: Organization Feature - Phase 2 Remaining Tasks

This file lists the remaining tasks for completing Phase 2 of the multi-organization feature, focusing on membership management by admins and users viewing their own memberships.

## Part B: Assigning Organization Admins (by Global Admin) - Continued

### 1. Admin UI - List Organizations & View Members
   - **Target Files:** `frontend/public/pages/admin.html`, `frontend/public/js/admin.js`
   - **Tasks:**
     - Add a new tab or section in `admin.html` titled "Manage Organizations".
     - In `admin.js`, for this new tab/section:
       - Fetch and display a list of all organizations (using `GET /api/admin/organizations`).
       - Make each organization in the list clickable.
       - When an organization is clicked, fetch and display its members (using `GET /api/admin/organizations/:orgId/members`). The display should include username, user ID, current `role_in_org`, and `status_in_org`.

### 2. Admin UI - Add Controls to Change `role_in_org` for Organization Members
   - **Target File:** `frontend/public/js/admin.js` (enhancing the member list from previous task)
   - **Tasks:**
     - In the UI where members of a selected organization are displayed:
       - For each member, show their current `role_in_org`.
       - Add a UI control (e.g., a dropdown/select menu) allowing the global admin to change this role to 'member' or 'org_admin'.
       - When a role is changed via this UI control, trigger an API call to `PUT /api/admin/organizations/:orgId/members/:userId` with the payload `{ "role_in_org": "newSelectedRole" }`.
       - Upon successful API response, update the UI to reflect the change or refresh the member list.

## Part C: User's View of Their Organizations

### 3. Backend API for User's Memberships
   - **Target Files:** `backend/src/api/users.js` (or a new file like `userProfile.js`), `backend/src/services/userService.js` (or `adminOrganizationService.js` if appropriate)
   - **Tasks:**
     - Create a new API endpoint, e.g., `GET /api/users/me/organizations`.
     - This endpoint must be authenticated (use `authenticateToken`).
     - It should call a new service function, e.g., `getUserOrganizationMemberships(userId)`.

### 4. Service Logic for User's Memberships
   - **Target File:** `backend/src/services/userService.js` (create if it doesn't exist, or add to `adminOrganizationService.js` or `authService.js` if more appropriate, though `userService` is good).
   - **Tasks:**
     - Implement `getUserOrganizationMemberships(userId)`.
     - This function will query the `user_organization_memberships` table for the given `userId`.
     - It should join with the `organizations` table to fetch details like organization name and description.
     - It should return a list, where each item contains details like `{ org_id, org_name, org_description, role_in_org, status_in_org }`.

### 5. Frontend Profile Page Update
   - **Target Files:** `frontend/public/pages/profile.html`, `frontend/public/js/profile.js`
   - **Tasks:**
     - Add a new section in `profile.html` titled "My Organizations".
     - In `profile.js`, when the profile page loads:
       - Make an API call to the new `GET /api/users/me/organizations` endpoint.
       - Display the fetched list of organization memberships, showing the organization name, the user's role in that org, and their membership status.

## Part D: Submit Phase 2

### 6. Submit All Phase 2 Changes
   - After all the above backend and frontend tasks are completed and tested, commit them as the completion of Phase 2 for the organization feature.
