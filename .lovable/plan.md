# Plan - Fix Internal Server Error in /admin/users

The `/admin/users` route is returning an `Internal Server Error`. This usually happens when a server function fails or an import is broken. The recent implementation of "Temporary Access" involved new server functions and database schema changes.

## Investigation Points
1. **Broken Imports**: Check if `src/lib/users.functions.ts` or its dependencies are failing to load.
2. **Server Function Errors**: Verify that `createServerFn` usage is strictly following the "thin wrapper" rule.
3. **Database Schema**: Confirm the `must_change_password` column and related permissions.
4. **Auth Middleware**: Check if `requireSupabaseAuth` is causing issues in the server context.

## Proposed Changes

### 1. Fix Server Functions (`src/lib/users.functions.ts`)
- Ensure all business logic and node-only imports (like `crypto`) are strictly inside the `.handler()` or separated into a `.server.ts` file if they are complex.
- Verify `requireSupabaseAuth` usage.
- Add robust error handling to prevent 500s.

### 2. Update Admin Users UI (`src/routes/_authenticated/admin/users.tsx`)
- Separate the list loading from the temporary access generation.
- Wrap data fetching in try-catch blocks to prevent total page failure.
- Ensure the UI handles missing profile data gracefully.

### 3. Verify Database Migration
- Ensure the `must_change_password` column exists and has proper defaults/permissions.

## Technical Details
- The "thin wrapper" rule for TanStack Start server functions is critical.
- `crypto` is a Node-only module; while supported in the Worker runtime with `nodejs_compat`, it should be imported carefully.

## Test Plan
1. Access `/admin/users` as an admin.
2. Verify user list displays correctly.
3. Open "Gerar acesso temporário" modal.
4. Perform a test generation.
5. Verify non-admin roles (Promoter, Industry) are still blocked.
