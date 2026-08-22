# Plan: Improved Authentication & User Management

Enhance the authentication flow and implement a dedicated administrative area for user management ("Usuários e acessos") according to the new requirements.

## Phase 1: Database Schema Enhancements
- Update `profiles` table:
    - Add `status` enum: `pending`, `active`, `blocked`.
    - Add `last_access` timestamp.
- Add `GRANT` statements for any new schema changes.
- Ensure `user_roles` and `profiles` are linked correctly for admin management.

## Phase 2: Enhanced Login UI
- Update `src/components/auth/login-form.tsx`:
    - Add `MapPin` icon/logo.
    - Implement Show/Hide password toggle.
    - Add "Lembrar meu acesso" (Remember me) checkbox.
    - Add "Esqueci minha senha" (Forgot password) link.
    - Improve error messages for specific cases (invalid credentials, blocked user, etc.).
    - Remove any public registration links.
- Create recovery and set-password routes:
    - `src/routes/auth/forgot-password.tsx`
    - `src/routes/auth/reset-password.tsx`
    - `src/routes/auth/set-password.tsx` (for invite flow).

## Phase 3: Admin User Management ("Usuários e acessos")
- Update `src/routes/_authenticated/admin/index.tsx` to add a navigation link to "Usuários e Acessos".
- Create `src/routes/_authenticated/admin/users.tsx`:
    - List all users with search (name, email) and filters (role, status).
    - "Convidar usuário" modal: Name, Email, Role selection.
    - Link to Industry for 'industry' role.
    - Link to Promoter for 'promoter' role.
    - Actions: Re-send invite, Block/Unblock, Change Email, Reset Password.
    - View last access date and status.

## Phase 4: Invitation & Auth Flows
- Implement the invitation logic using Supabase Auth.
- Configure redirect after login based on `user_roles`.
- Ensure strict RLS policies:
    - Only Admins can see/manage all users.
    - Users can see their own profile.

## Technical Details
- Use `lucide-react` for icons.
- Use `shadcn` components (Checkbox, Dialog, Select, etc.).
- `supabase.auth.signInWithPassword` for login.
- `supabase.auth.resetPasswordForEmail` for forgot password.
- `supabase.auth.admin.inviteUserByEmail` (via server function or direct if role allowed) for invitations.
    - *Note: Invitation usually requires service role or specific permissions. If not possible directly from client, I will simulate it by creating a profile with 'pending' status and using Supabase's invite system.*
