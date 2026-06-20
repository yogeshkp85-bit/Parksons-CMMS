# API Mapping

This document maps the legacy Action payload endpoints to the future REST API endpoints.

| Legacy Payload Action | HTTP Method | Future API Route | Controller Method |
|---|---|---|---|
| `submit` (No action key) | `POST` | `/api/breakdowns` | `BreakdownController.create` |
| `getPending` | `GET` | `/api/breakdowns/pending` | `BreakdownController.getPending` |
| `approve` | `POST` | `/api/approvals/breakdowns/:id/approve` | `ApprovalController.approve` |
| `reject` | `POST` | `/api/approvals/breakdowns/:id/reject` | `ApprovalController.reject` |
| `update` | `PUT` | `/api/breakdowns/:id` | `BreakdownController.update` |
| `updateApprove` | `POST` | `/api/approvals/breakdowns/:id/update-and-approve` | `ApprovalController.updateAndApprove` |
| `getMachineData` | `GET` | `/api/machines` | `MachineController.getAll` |
| `saveMachineData` | `POST` | `/api/machines` | `MachineController.save` |
| `deleteMachineData` | `DELETE` | `/api/machines/:id` | `MachineController.delete` |
| `loginAdmin` | `POST` | `/api/auth/login` | `AuthController.login` |
| `getAdminUsers` | `GET` | `/api/users/admins` | `UserController.getAdmins` |
| `saveAdminUser` | `POST` | `/api/users/admins` | `UserController.saveAdmin` |
| `deleteAdminUser` | `DELETE` | `/api/users/admins/:id` | `UserController.deleteAdmin` |
| `getHistoricalData` | `GET` | `/api/reports/historical` | `ReportController.getHistorical` |
