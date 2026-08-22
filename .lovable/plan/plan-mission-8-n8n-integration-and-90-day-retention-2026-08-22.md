# Plan - Mission 8: n8n Integration and 90-Day Retention

Implementation of secure outgoing webhooks for system events and a data retention policy to automatically clean up expired records.

## User Review Required

> [!IMPORTANT]
> - The n8n webhook URL and HMAC secret must be configured in the new "Automação n8n" admin panel.
> - The retention policy defaults to 90 days. This will permanently delete visit evidence and operational logs.
> - Webhooks do NOT send media files (photos/videos), only IDs and metadata.

- [ ] Confirm if any other events should trigger n8n webhooks.
- [ ] Confirm if the 90-day retention period should be strictly enforced now.

## Proposed Changes

### Database & Schema
- [x] `automation_settings`: Stores n8n webhook URL, secret, and retention period.
- [x] `webhook_logs`: Audits every webhook attempt (event type, payload, status, error).
- [x] `cleanup_expired_data()`: Postgres function to delete records older than X days.

### Backend (Server Functions)
- [x] `triggerAutomationEvent`: Utility to send sanitized payloads to n8n with HMAC signatures.
- [x] Integrated `triggerAutomationEvent` in:
    - [x] `submitVisit` (visit.submitted)
    - [x] `auditVisit` (visit.approved / visit.rejected)
    - [x] `publishReport` (report.published)
    - [x] `createBilling` (billing.created)
    - [x] `updateBillingStatus` (billing.status_updated)
- [x] `automation.functions.ts`: CRUD for settings, logs, connectivity testing, and manual cleanup trigger.

### UI (Admin Panel)
- [x] `/admin/automation`: New management route for n8n settings and logs.
- [x] Updated `AdminSidebar` with a link to the new module.

## Technical Details

### Security Pattern
Webhooks use a standard HMAC-SHA256 signature passed in the `X-Webhook-Signature` header. The receiver (n8n) should verify this signature using the shared secret to ensure the request originated from the app.

### Data Retention
The `cleanup_expired_data()` function targets:
- `visit_evidence` (metadata and storage files)
- `occurrences`
- `visit_audits`
- `visits` (older than retention threshold)
*Note: Contracts and Billing records are preserved for fiscal history.*

## Verification Plan

### Automated Tests
- [ ] Run `testWebhook` from the UI and verify success log in `webhook_logs`.
- [ ] Check `src/lib/automation.server.ts` for correct payload sanitization (no media URLs).

### Manual Verification
1. Navigate to `/admin/automation`.
2. Configure a dummy webhook URL (e.g., from Webhook.site).
3. Perform a visit audit and check if the event appears in the history table.
4. Verify that the `cleanup_expired_data` RPC can be triggered manually.
