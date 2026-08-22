# Implementation Plan - Rota do Promotor

Build a private, mobile-first operational system for merchandising promoters, administrators, and industry partners using TanStack Start and Supabase.

## User Research & Requirements
- **Profiles**: Promoter (field execution), Administrator (management/audit), Industry (portal/reports).
- **Core Workflow**: Fixed weekly/bi-weekly routes, task execution at stores (industries), photo/evidence capture, administrative audit (approve/reject), occurrence management, and industry billing.
- **Constraints**: Private app (no landing page), high security (RLS), mobile-first UI with large buttons, 90-day data retention policy.

## Technical Details
- **Frontend**: TanStack Start (React 19, Router v1), Tailwind CSS v4, Lucide icons.
- **Backend**: Supabase (Auth, PostgreSQL, Storage, RLS).
- **Architecture**: Role-based routing with layout gates.
- **Data Model**:
  - `user_roles`: enum ('admin', 'promoter', 'industry').
  - `profiles`: user details and association to industry (for industry users).
  - `stores`: name, address, coordinates.
  - `industries`: name, status.
  - `routes`: promoter routes with versioning.
  - `route_stops`: scheduling (day, order, frequency).
  - `stop_tasks`: industry assignments per stop.
  - `visits`: execution records (evidence type, observation, location, status).
  - `visit_evidence`: files (photo/video/PDF).
  - `occurrences`: product-specific issues (expired, rupture).
  - `billing`: monthly industry charges.

## Proposed Changes

### Phase 1: Foundation & Auth
- [ ] Create Supabase schema (Tables, Enums, RLS, `has_role` function).
- [ ] Implement Auth flow (Login, Profile initialization).
- [ ] Set up layout gates based on user roles (`_authenticated/_admin`, `_authenticated/_promoter`, `_authenticated/_industry`).

### Phase 2: Promoter Experience (Mobile-First)
- [ ] Implement "My Route Today" dashboard.
- [ ] Build multi-step Evidence Capture (Camera, File attachment, Type selection).
- [ ] Build Visit History with status filters and rejection reasons.

### Phase 3: Administrator Dashboard
- [ ] Build Management Dashboard with KPI cards and charts.
- [ ] Implement Route Planning (Weekly view, stop reordering, versioning/validity dates).
- [ ] Build Visit Audit (Conferência) module with media viewer and approval/rejection flow.
- [ ] Management screens for Promoters, Stores, and Industries.

### Phase 4: Industry Portal & Advanced Features
- [ ] Build Industry-specific Dashboard and Evidence Gallery.
- [ ] Implement Occurrences tracking system.
- [ ] Set up Monthly Billing views.
- [ ] Add data export functionality (Excel/PDF).

### Phase 5: Polish & Demo Data
- [ ] Apply final design system (Sober palette, large buttons, bottom nav for mobile).
- [ ] Seed "Test Data" for initial walkthrough (Promoter João, store Atacadão, industry King).
- [ ] Final navigation check and PWA configuration.
