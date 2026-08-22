# Mission 2 Plan: Users, Access, and Invitations

Enhance the administrative user management module to handle real authentication, role-based access, and a secure invitation flow (email and WhatsApp).

## Technical Details

### 1. Database & Security
- **RLS Policies**: Ensure `profiles` and `user_roles` are strictly protected.
- **Server Functions**: Implement `inviteUser` server function using Supabase Admin SDK (service role) to create users and generate invite links safely.
- **Admin Safety**: Add check to prevent the last active administrator from being deleted or blocked.

### 2. User Management UI (`/admin/users`)
- **Enhanced Listing**: Show full name, email, role, linked entity (Promoter/Industry), status, creation date, and last access.
- **Improved Invite Dialog**:
  - Dynamic fields based on role selection.
  - Required linking for Promoter and Industry roles.
  - Confirmation step for new Administrators.
- **Action Menu**: Add "Resend invite", "Copy invite link", "Copy WhatsApp message", "Block/Unblock", and "Delete".

### 3. Invitation Flow
- **Email**: Send official Supabase invite email for password setup.
- **WhatsApp**: Generate a template message with a secure, one-time invite link.
- **Status Tracking**: Track `pending`, `active`, `blocked`, and `expired` states.

### 4. Integration
- **Promoters/Industries CRUD**: Add "Invite for Access" button in the listings that opens the user invite dialog pre-filled with the entity's data.
- **Linking**: Ensure `profiles` table has `promoter_id` and `industry_id` foreign keys correctly populated upon invite.

### 5. Authentication Guards
- **Redirects**: Role-based redirection after login (`/admin`, `/promoter`, `/industria`).
- **Data Isolation**: Industry users can only query data where `industry_id` matches their profile.

## User-facing changes
- New user management interface for administrators.
- Ability to invite staff and partners via WhatsApp.
- Professional login and password setup flow for invited users.
- Automatic redirection to the correct dashboard based on the user's role.
