# Mission 3: Weekly Routes and Itineraries

Implement the core business engine for creating, managing, and automating promoter routes.

## User Review Required

> [!IMPORTANT]
> - Should we automatically delete future "planned" visits when a route is updated, or mark them as cancelled? (I'll assume cancel/replace for audit trails).
> - For bi-weekly (quinzenal) frequency, I'll implement a "Start Week" (Week A/B) selection.

## Proposed Changes

### 1. Database Schema Enhancements (SQL)
- Add `status` enum (`draft`, `published`, `archived`) to `routes`.
- Add `itinerary_versions` table to track history.
- Add `extraordinary_routes` table.
- Create a function/trigger to auto-generate `visits` for the next 90 days upon route publication.
- Ensure bi-weekly logic supports a reference start date.

### 2. Admin UI: Routes & Itineraries (`src/routes/_authenticated/admin/routes.tsx`)
- Transform the existing simple routes list into a robust management dashboard.
- **List View**: Promoters, status, validity dates, versioning.
- **Filters**: By promoter, status, date range.
- **Actions**: Create, Duplicate, History, Preview as Promoter, Create Extraordinary.

### 3. Route Editor (`src/components/admin/route-editor.tsx`)
- Multi-step or tabbed interface for Monday-Sunday.
- **Drag-and-drop** reordering of stops (stores) using `@hello-pangea/dnd` or similar.
- Stop-level configuration:
  - Select Store.
  - Add multiple Industries.
  - Set Frequency (Weekly/Bi-weekly).
  - Bi-weekly: select reference week (odd/even or start date).
  - Add operational notes.

### 4. Logic: Automation & Versioning
- **Server Function**: `publishRoute`
  - Validates active stores/industries.
  - Increments version.
  - Cancels future unexecuted visits from the old version.
  - Generates 90 days of `visits` based on weekday/frequency.
- **Extraordinary Routes**: Specific dates that override the weekly template.

### 5. Promoter Preview
- A read-only mode in the admin panel that mimics the promoter's mobile view for validation.

## Technical Details
- **Dependencies**: `lucide-react`, `date-fns`, `@hello-pangea/dnd` (for reordering).
- **Versioning Strategy**: Use a `version` column and a `valid_from` date to determine which itinerary applies to a specific date.
- **Automation**: Generating 90 days of visits ensures the promoter dashboard is always populated. We'll add a cron-like cleanup/extension if needed later, but publication-triggered generation handles the immediate requirement.

## Verification Plan
- **Manual**: Create a route for a test promoter, publish, and check the `visits` table for generated rows.
- **UI**: Verify drag-and-drop ordering updates the `visit_order` correctly in the UI and DB.
- **Edge Case**: Create an extraordinary route and verify it takes precedence in the "Visits for Today" logic.
