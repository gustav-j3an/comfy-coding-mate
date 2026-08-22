# Plan: First Admin Account Flow ("Primeiro Acesso")

Implement the initial administrator creation process, ensuring that the `/primeiro-acesso` route is only available when no administrators exist in the system.

## User Review Required

> [!IMPORTANT]
> This flow will allow the first person who accesses the site to become the system administrator. Once the first admin is created, this route will be automatically blocked.

- Does the password strength requirement need to follow a specific pattern (e.g., min length, symbols)?
- Should the system send a verification email before allowing the first admin to log in? (Enabled by default in Supabase).

## Proposed Changes

### Database & Security (Supabase)

- Create a SQL function `public.get_admin_count()` to safely check if any admin exists.
- Add an RLS policy or logic to ensure that even if someone bypasses the UI, creating an admin profile is only possible if the count is zero.

### New Route: `/primeiro-acesso`

- Create `src/routes/primeiro-acesso.tsx`.
- Implement a loader that checks for existing administrators. If any exist, redirect to `/admin` (login).
- Build a "Create Initial Admin" form:
  - Full Name, Email, Password, Confirm Password.
  - Strong password validation (min 8 chars, 1 number, 1 symbol).
  - Integration with Supabase Auth `signUp`.
  - Automatic creation of the `user_roles` entry as `admin`.

### Components & UI Updates

- **Login Form (`src/components/auth/login-form.tsx`)**:
  - Add a check to see if administrators exist.
  - Display the "Primeiro acesso? Criar conta do administrador inicial" link only when no admins are present.
- **Auth Context (`src/lib/auth/auth-context.tsx`)**:
  - Add a helper method/state to check for "initial setup" mode.

### Verification Steps

1. Visit the site in a fresh state (no users).
2. Confirm the "Primeiro acesso" link appears on the login page.
3. Access `/primeiro-acesso` and create a user.
4. Verify the user is created in Supabase Auth and assigned the `admin` role.
5. Confirm that visiting `/primeiro-acesso` again redirects to the login page.
6. Confirm the link is removed from the login page.

## Technical Details

- **Admin Check**: `SELECT count(*) FROM user_roles WHERE role = 'admin'`.
- **Redirects**: Use TanStack Router's `redirect` in the loader for server-side/early blocking.
- **Supabase**: Use `auth.signUp` which triggers the `profiles` and `user_roles` creation (depending on existing triggers or handled manually in the handler).

```sql
-- Security check function
CREATE OR REPLACE FUNCTION public.can_create_initial_admin()
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
