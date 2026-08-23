# Plan - Itinerary Editor and Weekly Preview Simulation

Investigate and fix issues in the route module: three-dots menu not working, edit route not functional, and implementing a weekly preview for admins.

## User Review Required

> [!IMPORTANT]
> The "Edit Route" functionality will affect only future planned visits. Visits already executed or in progress will remain unchanged to preserve historical integrity.

- Would you like the "Archive Route" option to be a simple status change or a full movement to a separate table? (Defaulting to status change).

## Proposed Changes

### 1. Itinerary Management Enhancements
- **Three-dots menu:** Implement the dropdown menu in `src/routes/_authenticated/admin/routes.tsx` with actions for:
    - **Detail View:** Navigation to a summary page (or modal).
    - **Edit:** Implementation of the edit form.
    - **Duplicate:** Server function to copy a route's structure into a new draft.
    - **Pause/Resume:** Toggle the `active` status of a route.
    - **Archive/Delete:** Safe deletion logic checking for executed visits.
- **Server Functions:** Add `duplicateRoute`, `archiveRoute`, `toggleRouteActive`, and `deleteRouteSafely` to `src/lib/routes.functions.ts`.

### 2. Route Editor (Edit Mode)
- **Unified Editor:** Refactor `src/routes/_authenticated/admin/routes_new.tsx` to handle both "New" and "Edit" modes.
- **Route Parameters:** Add a `routeId` search parameter to the route definition.
- **Data Loading:** If `routeId` is present, fetch the existing route, its stops, and associated tasks to populate the form.
- **Update Logic:** Implement a save function that updates existing records and regenerates future visits only.

### 3. Weekly Preview for Admin
- **Weekly Simulation UI:** In `src/routes/_authenticated/promoter/index.tsx`, add a "Roteiro da Semana" section visible only in `previewPromoter` mode.
- **Day Selector:** Add a horizontal scrollable day selector (Mon-Sun).
- **Mock Scheduling:** Update the data fetching logic to filter visits by the *selected simulation day* instead of just the real `today`.
- **Feedback Banner:** Enhance the preview banner in `src/routes/_authenticated/route.tsx` to show the currently simulated date.

## Technical Details
- **Schema:** Use `routes`, `route_stops`, and `stop_tasks` tables.
- **Auth:** Enforce `admin` role for all management actions and data impersonation.
- **Date Logic:** Use `date-fns` for week calculation and visit generation.
- **Types:** Update interfaces in `routes.tsx` and `routes_new.tsx` to handle nested stop/task data.
