# Implementation Plan - Mission 4 Completion & Mission 5 Foundation

Complete the Mission 4 requirements for audit integrity and evidence handling, while preparing the groundwork for Mission 5 (Extraordinary visits and occurrence management).

## User Review Required

> [!IMPORTANT]
> - **Visit Linkage:** We have established `executor_id` (Auth User) as the primary record for WHO executed a visit, while `promoter_id` links to the team member profile. This allows Admins to test the flow without needing a promoter record.
> - **Audit Decision:** Once a visit is Approved or Rejected, should the Admin be able to change the status again? (Currently: No, once audited, the buttons hide to ensure process integrity).

## Proposed Changes

### Database & Security
- Add RLS policies to `visit_evidence` and `visit_audits` to ensure only the creator and admins can read/write.
- Ensure `occurrences` are linked to the industry for reporting.

### Admin Experience
- **Visits Audit:** Refine the Audit Modal in `/admin/visits` to show detailed execution data (geolocation, check-in/out times) and prevent re-auditing.
- **Reports:** Ensure performance calculations include the new `planned` status as the baseline.

### Promoter Experience
- **Visit Execution:** Fix the "Anexar PDF" functionality to correctly filter and upload PDF files.
- **Occurrences:** Implement a specific "Ruptura" occurrence form with SKU/Product details as per Mission 5 requirements.

### Foundation for Mission 5
- Create the public API structure for potential external integrations (WhatsApp/Cron).
- Implement the "Extraordinary Route" logic in the backend.

## Technical Details

### 1. Data Integrity Fixes
- Fix `src/routes/_authenticated/admin/visits.tsx` to handle the `executor_id` join correctly in the audit list.
- Update `src/lib/execution.functions.ts` to include `rejection_reason` in the `visits` table update during audit.

### 2. UI/UX Refinements
- **Promoter Dashboard:** Fix the `Link` component in `visit.$visitId.tsx` to use the standard `@tanstack/react-router` pattern.
- **Admin Users:** Fix the "Invite" flow to correctly populate data when coming from the Promoters list.

### 3. Missing Files & Routes
- Create `src/routes/api/public/webhook.ts` skeleton.
- Create `src/routes/_authenticated/admin/occurrences.tsx` (Occurrence management).
