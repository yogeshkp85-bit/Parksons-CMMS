# Phase 15.4 Section F - API Matrix

This matrix maps user interface actions to their corresponding Postgres-backed API routes.

## 1. Web Dashboard & Core Routing
| Module | UI Button / Action | Method | API Endpoint | Access Level | Description |
|---|---|---|---|---|---|
| **Auth** | `Login` | POST | `/api/auth/login` | Public | Authenticates credentials, returns JWT. |
| **Auth** | `Register` | POST | `/api/auth/register` | Public | Registers a new internal account. |
| **Dashboard** | `(Page Load)` | GET | `/api/reports/dashboard` | Dashboard | Loads Pareto, KPIs, and Open Breakdowns. |
| **Breakdown Entry** | `Submit Breakdown` | POST | `/api/breakdowns/create` | Create | Creates a new machine breakdown. |
| **Approval** | `Approve Breakdown` | POST | `/api/approvals/approve` | Approve | Moves a breakdown from PENDING to OPEN. |
| **Approval** | `Reject Breakdown` | POST | `/api/approvals/reject` | Approve | Marks an invalid breakdown as REJECTED. |
| **Approval** | `Update Status` | PUT | `/api/approvals/status` | Approve | Adjusts breakdown status dynamically. |

## 2. Preventive Maintenance
| Module | UI Button / Action | Method | API Endpoint | Access Level | Description |
|---|---|---|---|---|---|
| **PM Task Master** | `Save Task` | POST / PUT | `/api/pm/tasks` | PreventiveMaintenance | Creates/Updates a PM task template. |
| **PM Task Master** | `Delete Task` | DELETE | `/api/pm/tasks/:id` | PreventiveMaintenance | Soft-deletes a task template. |
| **PM Schedule** | `Mark Completed` | PUT | `/api/pm/schedules/:id/complete` | PreventiveMaintenance | Records completion remarks and time against a schedule. |

## 3. Reports & Analytics
| Module | UI Button / Action | Method | API Endpoint | Access Level | Description |
|---|---|---|---|---|---|
| **Reports** | `(Page Load)` | GET | `/api/reports/kpi` | Reports | Loads chronological MTTR/MTBF history for charts. |
| **Reports** | `Excel (CSV)` | - | (Browser JS) | Reports | Client-side CSV generation of Table Data. |
| **Reports** | `Export PDF` | - | (Browser JS) | Reports | Client-side Canvas snapshot to PDF format. |

## 4. Configuration & Masters
| Module | UI Button / Action | Method | API Endpoint | Access Level | Description |
|---|---|---|---|---|---|
| **Machine Master** | `Add Machine` | POST | `/api/machines` | Masters | Upserts a new piece of machinery. |
| **Machine Master** | `Edit Machine` | PUT | `/api/machines/:id` | Masters | Patches active machine details or parent mapping. |
| **Machine Master** | `Delete Machine` | DELETE | `/api/machines/:id` | Masters | Soft-deletes machinery from the facility. |
| **App Wide** | `(Dropdown Load)` | GET | `/api/config/masters` | All Auth | Retrieves Categories, Sections, and Units for dynamic selection menus. |

## 5. Mobile Native App Sync
| Module | Trigger Action | Method | API Endpoint | Access Level | Description |
|---|---|---|---|---|---|
| **Mobile Form** | `(App Boot / Online)` | GET | `/api/machines` | Native Auth | Retrieves machine lists for local SQLite cache initialization. |
| **Mobile Form** | `(Sync Worker)` | POST | `/api/breakdowns/create` | Native Auth | Flushes `offline_breakdowns` SQLite cache to main Postgres DB. |
