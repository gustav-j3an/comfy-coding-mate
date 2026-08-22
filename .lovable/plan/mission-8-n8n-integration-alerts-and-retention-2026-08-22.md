# Mission 8: n8n Integration, Alerts, and Retention

Implement secure integration with n8n for external automation and a background data retention policy.

## User Experience

- **Admins:** New "Automation" area to monitor webhook status, failure history, and retention settings. Receive proactive alerts about pending visits and expired data.
- **Promoters:** Receive notifications about daily routes and occurrences via n8n-triggered external services.
- **Industries:** Get notified when monthly reports are published or billing is near due date.

## Technical Details

### 1. Database Schema Extensions
- `webhook_logs`: Record every event sent to n8n (ID, event_type, payload_meta, status, response, attempts).
- `automation_settings`: Store n8n URL, shared secret (encrypted/server-only), and retention days (default 90).

### 2. Secure Webhook Infrastructure
- **Server Utility:** `src/lib/automation.server.ts` to handle signing payloads and executing outgoing fetch calls.
- **Event Hook:** Centralized trigger function called from existing server functions (e.g., `approveVisit`, `publishReport`).
- **Safety:** Payload sanitization to ensure no private media URLs or PII are sent to the external webhook.

### 3. n8n Automation Scaffolding
- Define the standardized JSON payload for events:
  ```json
  {
    "event": "visit.approved",
    "timestamp": "ISO-8601",
    "signature": "hmac-sha256",
    "data": { "id": "uuid", "meta": { ... } }
  }
  ```

### 4. Background Retention Routine
- **Postgres Function:** `cleanup_expired_data()` to identify and delete/anon details older than 90 days.
- **Integration:** Trigger "Retention Warnings" via webhook 15 and 3 days before scheduled cleanup.

### 5. Administrative UI
- **Route:** `src/routes/_authenticated/admin/automation.tsx`
- **Features:** 
  - Connectivity test button.
  - Audit trail of last 50 webhook calls.
  - Configuration for which events trigger external notifications.

## Constraints & Security
- No media (photos/PDFs) in webhook payloads.
- Authentication via HMAC signature using a shared secret stored in `process.env`.
- RLS ensures only admins can see automation logs.
