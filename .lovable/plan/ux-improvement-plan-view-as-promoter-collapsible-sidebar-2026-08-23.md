# UX Improvement Plan: "View as Promoter" & Collapsible Sidebar

## User Experience Improvements

### 1. "View as Promoter" Mode
Enable administrators to safely preview the promoter's app experience for a selected promoter without switching accounts or compromising security.

- **Admin Selection**: Admins will select a promoter from the "Routes and Itineraries" page.
- **Preview Activation**: A "View as Promoter" button will be enabled only when a promoter is selected.
- **Contextual Preview**: The app will render the promoter's dashboard and visit screens as if that promoter was logged in, but with restricted write access.
- **Preview Indicator**: A fixed top banner will indicate the current preview mode and provide a "Return to Admin" button.
- **Security**: The backend will verify that the requesting user is an admin and that the target promoter exists. Destructive actions (check-ins, photo uploads, completions) will be disabled or mocked.

### 2. Collapsible Sidebar
Optimize dashboard space by allowing the main navigation sidebar to be collapsed.

- **Toggle Control**: A button at the top of the sidebar will switch between expanded and collapsed states.
- **Collapsed View**: Only icons will be visible, with tooltips appearing on hover to show the module name.
- **State Persistence**: The user's preference (collapsed/expanded) will be saved in `localStorage` to persist across sessions and page reloads.
- **Responsive Design**: On mobile devices, the sidebar will act as a sliding drawer that closes automatically after a selection is made.

## Technical Tasks

### Security & State Management
- Implement a `usePreviewMode` hook or update `AuthContext` to manage the "impersonation" state.
- Create a server function to validate admin privileges and fetch the target promoter's metadata.
- Update data fetching logic to respect the preview promoter ID when in preview mode.

### UI Components
- **PreviewBanner**: A new global component visible only during promoter preview.
- **Sidebar**: Refactor `Sidebar` to handle a `collapsed` state and add the toggle button.
- **Tooltip**: Ensure all sidebar items have accessible tooltips in collapsed mode.

### Route Protection
- Ensure preview mode is only accessible by authenticated users with the `admin` role.
- Implement read-only guards for operational actions (e.g., `approveVisit`, `syncOfflineData`) when in preview mode.
