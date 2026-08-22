# Mission 9: PWA, Mobile, and Production Readiness

Implement PWA functionality, optimize for mobile use, and prepare the application for production deployment.

## User Interface & Experience
- **Mobile-First Design**: Ensure `/promoter` dashboard and all interactions are optimized for one-handed mobile use with large touch targets.
- **Connection Status**: Add a visual indicator for online/offline/reconnecting states.
- **Upload Feedback**: Implement progress indicators and double-tap prevention for media uploads.
- **PWA Integration**:
  - Configure `vite-plugin-pwa` for manifest and service worker generation.
  - Setup app icons, theme colors, and background colors.
  - Implement a discrete "Install App" prompt.
- **Diagnostics Page**: Create `/admin/diagnostics` for administrators to check Supabase, Storage, n8n, and PWA status.

## Security & Data Integrity
- **Cache Management**: Configure Service Worker to cache only static UI assets, strictly excluding sensitive data (photos, PDFs, financial records).
- **Session Cleanup**: Ensure local sensitive data is wiped upon logout.
- **Role-Based Redirects**: Logic to route users to `/admin`, `/promoter`, or `/industry` upon app launch based on their profile.
- **Permission Handling**: Implementation of GPS and Camera request flows only when needed, with clear guidance if permissions are denied.

## Technical Details
- **Retention Guard**: Confirm cleanup routines don't touch visit data tied to active/paid billings.
- **Environment Config**: Setup production-ready variables and documentation for custom domains and n8n connections.
- **PWA Manifest**:
  - `name`: Rota do Promotor
  - `display`: standalone
  - `theme_color`: #0F172A

## Schema & Infrastructure
- No new tables required, but `automation_settings` metadata will be used for diagnostics.
- Ensure `delete_user_safely` and cleanup functions are production-ready.
