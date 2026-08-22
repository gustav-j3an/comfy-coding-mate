# Mission 4: Registration of Visits, Evidence, and Occurrences

Implementation of the field operation module, focusing on data integrity, execution evidence, and administrative auditing.

## User Interface & Experience

### Promoter Dashboard (`/promoter`)
- **Today's Itinerary**: List of scheduled stores for the current date.
- **Status Indicators**: Visual cues for `planned`, `submitted`, `approved`, and `rejected`.
- **Visit Execution**: Access to the specialized execution screen.

### Visit Execution (`/promoter/visit/$visitId`)
- **Evidence Capture**:
  - Photo (max 2MB, optimized).
  - Video (max 30MB).
  - PDF/Documents (max 10MB).
- **Occurrence Reporting**: Quick triggers for "Ruptura", "Vencido", etc.
- **Location Guard**: Automatic GPS coordinate capture during check-in/submission.
- **Feedback**: Success notification after submission to admin conference.

### Admin Audit (`/admin/visits`)
- **Submission Queue**: View of all visits pending conference.
- **Evidence Viewer**: Dialog to inspect photos, videos, and PDFs using secure signed URLs.
- **Decision Engine**: Approve or Reject (with required reason).
- **History**: Permanent audit log of who approved/rejected and when.

## Technical Details

### Data Integrity & Relationships
- **Promoter Link**: `visits.promoter_id` now correctly references the `promoters` table (not the auth profile).
- **Executor Tracking**: Added `executor_id` to `visits` to record the actual user performing the visit (for accountability).
- **Audit Logging**: Created `visit_audits` table to track decision history.

### Storage & Security
- **Bucket**: `visit-evidences` (private).
- **Access Control**: RLS policies allowing promoters to upload, and admins/industry-owners to read specific files.
- **Secure Retrieval**: `getSignedUrl` server function to generate temporary links for protected files.

### Backend Functions
- `submitVisit`: Processes metadata, uploads evidence records, and creates occurrences in a transaction-like flow.
- `auditVisit`: Updates visit status and records the auditor's identity and reasoning.

## Phases

1.  **Schema Stabilization**: Fix FK relationships and storage buckets. (Done)
2.  **Promoter Experience**: Build the dashboard and execution UI. (Done)
3.  **Admin Audit**: Implement the review and decision interface. (Done)
4.  **Industry View**: Update industry portal to see validated evidence. (In Progress)
