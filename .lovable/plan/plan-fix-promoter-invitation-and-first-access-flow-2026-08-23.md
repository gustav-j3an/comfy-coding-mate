# Plan: Fix Promoter Invitation and First Access Flow

This plan addresses the broken relationship between `profiles` and `user_roles`, fixes the `localhost` redirection in invitations, and implements a dedicated `/primeiro-acesso` page with PWA installation instructions.

## Technical Details

### 1. Database & Role Fix
- Investigate `public.profiles` and `public.user_roles` structure.
- Update `fetchRole` and `fetchProfile` in `src/lib/auth/auth-context.tsx` to ensure safe, role-based loading without assuming nonexistent relationships.
- Refactor `src/routes/_authenticated/admin/users.tsx` to fetch roles and profiles independently and join them in memory, avoiding the `schema cache` error.
- Ensure `user_roles` check in RLS/server functions uses the `has_role` security definer function.

### 2. Secure Invitations
- Update `src/lib/users.functions.ts` to:
  - Enforce admin validation for `inviteUser`.
  - Use `process.env.SITE_URL` for `redirectTo`, falling back to `lovable.app` preview URL logic if undefined (never `localhost`).
  - Implement validation for `promoter_id` link during invitation.
- Update `src/routes/_authenticated/admin/users.tsx`:
  - Fetch available (unlinked) promoters for the link dropdown.
  - Make `promoter_id` mandatory for the 'promoter' role.

### 3. First Access Page (/primeiro-acesso)
- Create `src/routes/primeiro-acesso.tsx` as a public/authenticated route.
- Implement logic to detect PWA support and display installation instructions for Android/Chrome and iOS/Safari.
- Add "Install App" button with native PWA prompt trigger.
- Add "Open App" button if already in standalone mode.
- Redirect to the respective dashboard after password creation or when the app is already installed.

### 4. Auth & Redirects
- Update `src/routes/auth/reset-password.tsx` (if needed) to ensure proper flow into `/primeiro-acesso` for new users.
- Verify Supabase Auth URL configuration (handled via Lovable Cloud instructions).

## Proposed Changes

### Database & Backend
- Add `GRANT` and `POLICY` checks for `user_roles` if missing.
- Refine `inviteUser` server function for production-ready URLs.

### Frontend
- **Auth Context**: Robust role/profile fetching.
- **Admin Users Page**: Fix relationship error and enhance invitation modal.
- **New Route**: `/primeiro-acesso` for onboarding and PWA setup.

## Verification Plan
1. Test User Management page loads without errors.
2. Test inviting a promoter with a valid link to an existing record.
3. Verify the invitation link points to the preview/production URL.
4. Verify the `/primeiro-acesso` page renders and detects PWA status.
5. Verify role-based redirection after first login.
