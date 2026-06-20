# Role & Permission Matrix

This document outlines the Role-Based Access Control (RBAC) model for the Parksons Maintenance System.

## Roles Defined

| Role | Code | Description |
|---|---|---|
| **Super Admin** | `SUPER_ADMIN` | Full system access. Can manage users, alter master data, and configure system settings. |
| **Plant Admin** | `PLANT_ADMIN` | Full access within a specific Plant. |
| **Supervisor** | `SUPERVISOR` | Can review, edit, approve, and reject breakdowns. Views dashboards and reports. |
| **Technician** | `TECHNICIAN` | Enters breakdown data via the mobile/tablet form. Cannot approve or edit finalized data. |

## Core Permissions

The system enforces permissions at the API middleware level. A Role maps to multiple Permissions.

### Breakdown Management
- `BREAKDOWN_CREATE`: Submit a new breakdown log.
- `BREAKDOWN_READ`: View breakdown logs (Plant-restricted or global).
- `BREAKDOWN_REVIEW`: Access the pending queue. Edit breakdown details before approval.
- `BREAKDOWN_APPROVE`: Change breakdown status to `APPROVED` or `REJECTED`.

### PM Management
- `PM_SCHEDULE_CREATE`: Create new PM tasks.
- `PM_LOG_EXECUTE`: Mark a PM schedule as completed and submit checklist results.

### Master Data
- `MASTER_DATA_READ`: View dropdowns/lists for Machines, Units, Categories.
- `MASTER_DATA_WRITE`: Add/Edit/Delete master data (Machines, Categories). *Restricted to Admins.*

### Reporting & Dashboards
- `DASHBOARD_VIEW`: Access real-time metric screens.
- `REPORTS_EXPORT`: Download raw data or formatted reports in Excel/CSV.

### User Management
- `USER_READ`: View the directory of users.
- `USER_MANAGE`: Create new users, reset passwords, change roles. *Restricted to Super Admin.*

## Implementation Approach
When a user authenticates, the backend API issues a JWT containing their `roleId` and an array of assigned permission codes. The Express middleware (e.g., `authorize('BREAKDOWN_APPROVE')`) intercepts requests and validates the token's permission array before allowing the controller to execute.
