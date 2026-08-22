# Mission 5: Monthly Reports, BI & Executive Portal

This mission focuses on transforming operational data (visits, evidences, audits) into strategic business intelligence for industries and administrators.

## Technical Details

### Database Schema Expansion
- `monthly_reports`: Stores snapshots of performance metrics for a specific industry and month.
- `monthly_report_checklists`: (Optional/View) Detailed log of execution per store in the reporting period.
- `monthly_report_versions`: History of published versions for auditability.

### New & Updated Routes
- `admin/reports/index.tsx`: List and management of monthly reports.
- `admin/reports/new.tsx`: Wizard to create a new report from real-time data.
- `admin/reports/$reportId.tsx`: Detailed view, editing, and publishing controls.
- `industry/reports/index.tsx`: List of published reports for the industry user.
- `industry/reports/$reportId.tsx`: The executive view of the published report.
- `api/public/reports/pdf`: Server function to generate PDFs on-demand.

### Key Logic
- **Snapshotting**: When a report is "Published", current metrics (counts, rates) are saved to a JSONB field or dedicated columns to prevent historical changes from affecting published results.
- **PDF Generation**: Using a lightweight library (like `jspdf` or server-side rendering to PDF) to create a professional executive summary.
- **90-Day Retention**: Clear marking of expired evidences in reports.

## Implementation Steps

### 1. Database & Migrations
- Create `monthly_reports` table with status tracking and snapshot storage.
- Add RLS policies for role-based access (Industries only see published reports).
- Seed initial report structures if necessary.

### 2. Admin Module: Reports Management
- Build the "Relatórios Mensais" dashboard.
- Implement the "New Report" logic: fetching real data for a selected industry and month.
- Implement the Review & Publish workflow.

### 3. Industry Portal: Executive View
- Overhaul `/industry` to focus on Monthly Reports.
- Create a high-fidelity report detail view with charts (recharts).
- Add "Download PDF" functionality.

### 4. Polish & PDF
- Finalize the PDF layout and generation logic.
- Implement the 90-day retention labels.
- Conduct E2E tests with Admin and Industry roles.
