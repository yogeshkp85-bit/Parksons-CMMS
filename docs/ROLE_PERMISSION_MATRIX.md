# Role & Permission Matrix

This document outlines the permission-based access control model. The system avoids hardcoded roles, opting for a flexible "Roles consume Permissions" architecture to mirror and scale the Google Apps Script logic.

## Permission Mapping Strategy
Future roles are constructed by assigning a specific set of granular permissions.

### Core Permissions
**Breakdown Operations:**
- `BREAKDOWN_CREATE`
- `BREAKDOWN_EDIT`
- `BREAKDOWN_APPROVE`
- `BREAKDOWN_DELETE`

**Preventive Maintenance (PM):**
- `PM_CREATE`
- `PM_EXECUTE`
- `PM_APPROVE`

**Master Data:**
- `MASTERDATA_VIEW`
- `MASTERDATA_EDIT`

**User Administration:**
- `USER_CREATE`
- `USER_EDIT`

**Analytics:**
- `REPORT_VIEW`
- `REPORT_EXPORT`
- `DASHBOARD_VIEW`

**System & Compliance:**
- `AUDIT_VIEW`
- `ADMIN_ACCESS`
- `CONFIGURATION_EDIT`

## Future Enterprise Roles
By mapping the above permissions, we can easily construct exact replicas of existing roles and scale to new ones:
- Corporate Admin
- Plant Admin
- Department Head
- Maintenance Engineer
- Planner
- Technician
- Viewer
