# Plan: PWA Installation Fix and Enhancement

The goal is to fix the "Install App" button on the landing page, ensuring it correctly triggers the native PWA installation prompt when available or provides clear device-specific instructions otherwise. We will also ensure the system follows the "Safe Update" requirement to protect active uploads or pending syncs.

## Proposed Changes

### 1. PWA Logic and Components
- **Create `src/hooks/use-pwa-install.ts`**: A custom hook to manage the `beforeinstallprompt` event, track installation state, and detect device/browser types (iOS, Android, Chrome, etc.).
- **Create `src/components/common/pwa-install-button.tsx`**: A smart button component that:
  - Triggers the native prompt if available.
  - Shows an instructional dialog if not (Safari/iOS, manual install on Chrome).
  - Handles the "App Installed" state.
- **Create `src/components/common/pwa-install-dialog.tsx`**: A dialog (Drawer for mobile, Modal for desktop) showing step-by-step instructions for manual PWA installation.

### 2. Frontend Integration
- **Update `src/routes/index.tsx`**: Replace the current static "Instalar aplicativo" button with the new functional component.

### 3. PWA Configuration
- **Verify `vite.config.ts`**: Ensure icons, maskable icons, and manifest properties are correctly defined for full PWA compatibility.
- **Update `src/routes/__root.tsx`**: Ensure the manifest link and theme-color meta tags are correctly placed in the head.

### 4. Safety and Integrity
- **Maintain `PWAUpdateNotification`**: Keep the current logic in `src/routes/_authenticated/route.tsx` that blocks updates during active visits or syncs.

## Technical Details

### Hook: `usePWAInstall`
- Listen for `beforeinstallprompt` and store the event.
- Detect `appinstalled` event.
- Determine if the app is already running in `standalone` mode.
- Detect platform using `navigator.userAgent`.

### Instructional Dialog
- **iOS Safari**: Instructions to tap the "Share" button and "Add to Home Screen".
- **Android Chrome (Manual)**: Instructions to open the menu and tap "Install app".
- **Desktop Chrome (Manual)**: Instructions to click the "Install" icon in the address bar or the three-dot menu.
- **Incognito/Private**: Warning that installation is not available in private browsing.

### Validation Steps
- Verify manifest via Chrome DevTools (simulated in thought process).
- Test button state transitions.
- Ensure the instructional UI adapts to the user's platform.
