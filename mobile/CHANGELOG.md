# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Mobile Approval Workflow**: Implemented a new feature allowing authorized users to approve or reject pending breakdown entries directly from the mobile application.
    - Created `mobile/screens/PendingApprovalScreen.tsx` to display a list of pending items and handle approval/rejection logic.
    - Added new API call definitions in `mobile/api/breakdownApi.ts` for `getPendingBreakdowns`, `approveBreakdown`, and `rejectBreakdown`.
    - Integrated the new screen into the main navigation stack in `mobile/navigation/AppNavigator.tsx`.
    - Added a conditional link to the "Pending Approvals" screen in the `mobile/screens/DashboardScreen.tsx` sidebar, visible only to users with the `approve_breakdown` permission.
- **Historical Breakdown Data Screen**: Added a new screen for viewing and filtering all breakdown entries.
    - Created `mobile/screens/HistoricalDataScreen.tsx` with UI for filtering by date and viewing a list of historical entries.
    - Added a `getBreakdowns` function to `mobile/api/breakdownApi.ts` to fetch data based on filter parameters.
    - Integrated the new screen into the main navigation stack in `mobile/navigation/AppNavigator.tsx`.
    - Added a link to the "Breakdown History" screen in the `mobile/screens/DashboardScreen.tsx` sidebar.

### Changed
- **Pending Approvals Visibility**: Modified the mobile app to make the "Pending Approvals" screen visible to all users, not just administrators.
    - Removed the permission check for the navigation link in `mobile/screens/DashboardScreen.tsx`.
    - Added a permission check within `mobile/screens/PendingApprovalScreen.tsx` to ensure only authorized users can see and use the 'Approve' and 'Reject' action buttons.

### Documentation

- **Local Setup Guide**: Created a new `RUN_LOCALLY.md` file in the project root with comprehensive instructions for setting up and running the backend and mobile application on a local machine.
- **Automation Script**: Added `start-local.sh` to automate the process of launching the backend and frontend servers for local development.
- **Windows Automation Script**: Added `start-local.bat` for easy one-click startup on Windows systems.

### Fixed
- **Startup Scripts Location**: Moved `start-local.bat` and `start-local.sh` from the `/mobile` directory to the project root to fix execution path errors.

### Added
- **API Client Configuration**: Created `mobile/api/apiClient.ts` to configure the mobile app's connection to the local backend server (`http://localhost:5000`). This is essential for features like login to work correctly in a local development environment.
- **CORS Backend Fix**: Installed and configured the `cors` package in `backend/src/server.ts` to allow API requests from the frontend (`http://localhost:8081`), resolving the login issue.