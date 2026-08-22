# Plan: Real Administrative Modules for "Rota do Promotor"

Transform the administrative dashboard into a fully functional system with real modules, routing, and Supabase integration.

## User Review Required

> [!IMPORTANT]
> - Should we use a specific UI library for advanced charts in the dashboard, or stick to simple stats for now?
> - For the "Invite User" flow, should I implement a simulated email preview or just trigger the Supabase invite?

## Technical Details

### 1. Layout & Navigation
- Create `src/routes/_authenticated/admin/route.tsx` as a pathless layout for all admin modules.
- Implement a responsive sidebar with mobile support (Sheet/Drawer).
- Define the navigation structure for all modules requested.

### 2. Database Schema Refinements (SQL)
- Ensure all tables (`promoters`, `stores`, `industries`, `routes`, `route_stops`, `visits`, `occurrences`, `billing`) have proper RLS policies for administrators.
- Add triggers for `updated_at` timestamps where missing.
- Add `active` column to tables that require soft-deletion/inactivation.

### 3. Module Implementation
- **Promotores**: List with filters, Create/Edit forms, "Ver roteiro" integration.
- **Lojas**: List with filters, Create/Edit forms, Industry links.
- **Indústrias**: List, Create/Edit forms, Industry portal preview.
- **Usuários e Acessos**: Refine existing view, add invite logic (linking to promoters/industries), block/reactivate functionality.
- **Rotas e Roteiros**: Weekly scheduler (Mon-Sun), store selection, industry/task assignment, versioning.
- **Dashboard**: Make cards clickable, implement filtered views for visits and occurrences.

### 4. Integration & Polish
- Connect all forms to Supabase server functions or direct client calls (where appropriate).
- Implement real-time updates for critical modules (Visits, Occurrences) if possible.
- Add comprehensive error handling and loading states (Skeleton loaders).
- Seed real-world DF (Brasília) stores and data for a better initial experience.

## Order of Execution
1. Shared Admin Layout & Responsive Sidebar.
2. Master Data Modules (Promoters, Stores, Industries).
3. User & Access Management (with invitations).
4. Route & Schedule Management.
5. Dashboard Interactivity (Linking cards to filtered lists).
