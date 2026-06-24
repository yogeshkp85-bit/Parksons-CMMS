# Production-Grade Role-Based Access Control (RBAC) Design

This document details the system design for enforcing granular permission-based security across backend REST APIs and frontend views.

---

## 1. Roles & Permissions Matrix

We map the **6 system roles** to **8 permissions** representing critical system actions:

| Role | Dashboard | Create | Edit | Delete | Approve | Reports | Masters | Users |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **superadmin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **manager** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **supervisor** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **technician** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **viewer** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 2. Permissions Definition

* **`Dashboard`**: Access to read dashboard panels and OEE metrics.
* **`Create`**: Ability to log new breakdowns.
* **`Edit`**: Ability to update active breakdown log details.
* **`Delete`**: Ability to delete data records (restricted to Admin/Superadmin).
* **`Approve`**: Ability to review, approve, or reject pending breakdowns.
* **`Reports`**: Access to historical KPI trends, PM schedules, and OEE reports.
* **`Masters`**: Access to configure machines and sub-assemblies.
* **`Users`**: Access to manage (view/add/delete) admin user profiles.

---

## 3. Security Flow

### Backend Route Guarding:
1. When a user requests an API endpoint, the request header must contain a `Bearer <JWT_TOKEN>`.
2. The `authenticate` middleware verifies the token and binds the decoded user details (containing user `level`) to `req.user`.
3. The `authorize(permission)` middleware checks `req.user.level` against the `ROLE_PERMISSIONS` matrix defined in [rbac.middleware.ts](file:///d:/Parksons-CMMS-Dev/backend/src/middlewares/rbac.middleware.ts).
4. If the permission matches, `next()` is called. Otherwise, a `403 Forbidden` JSON response is returned.

### Frontend Route Guarding:
1. In React, routes in `App.tsx` are wrapped in `<PermissionRoute requiredPermission="...">`.
2. If the user possesses the required permission string inside their `permissions` array, they see the page.
3. If they lack the permission, they are immediately redirected to `/unauthorized` (rendered by the `Unauthorized` component).
4. Sidebar navigation items are dynamically filtered using `permissions.includes(item.permission)` to hide inaccessible tabs.

---

## 4. Code Examples

### Backend Middleware Usage (`backend/src/routes/index.ts`):
```typescript
import { authorize } from '../middlewares/rbac.middleware';

// Only roles with 'Create' permission (superadmin, admin, supervisor, technician) can log breakdowns
router.post('/breakdowns/create', authorize('Create'), (req, res) => breakdownCtrl.create(req, res));

// Only roles with 'Users' permission (superadmin, admin) can list users
router.get('/users', authorize('Users'), (req, res) => userCtrl.getAll(req, res));
```

### Frontend Utility Usage (`frontend/src/utils/permissions.ts`):
```typescript
import { hasPermission } from '../utils/permissions';

if (hasPermission(user.role.code, 'Approve')) {
  // render Approve action elements
}
```
