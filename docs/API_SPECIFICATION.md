# API Specification

This document outlines the API endpoints that will reproduce the current Google Apps Script functions. 

> [!IMPORTANT]
> This specification documents the expected REST endpoints only. No implementation is present. There are no AWS or SSO assumptions built into these endpoints.

## 1. Authentication API
- `POST /api/auth/login` - Authenticates user and initiates session.
- `POST /api/auth/logout` - Terminates user session.

## 2. Master Data API
- `GET /api/master/machines` - Retrieves hierarchy of Plant > Department > Section > Machine > Unit.
- `GET /api/master/categories` - Retrieves Breakdown, Problem, Action, and Root Cause categories.

## 3. Breakdown API
- `POST /api/breakdowns` - Submit a new breakdown log (Technician Entry -> PENDING_REVIEW).
- `GET /api/breakdowns` - Retrieve breakdown logs.
- `PUT /api/breakdowns/:id` - Edit a breakdown log (Supervisor Review).
- `POST /api/breakdowns/:id/approve` - Approve a breakdown log.
- `POST /api/breakdowns/:id/reject` - Reject a breakdown log.

## 4. Preventive Maintenance (PM) API
- `GET /api/pm/schedules` - Retrieve due/upcoming PM schedules.
- `POST /api/pm/execute` - Submit PM checklist execution data.
- `POST /api/pm/:id/approve` - Approve a completed PM execution.

## 5. Dashboard API
- `GET /api/dashboard/metrics` - Retrieve real-time dashboard aggregates (Downtime, Count, Availability).

## 6. Reports API
- `GET /api/reports/historical` - Retrieve historical raw data matching current Excel Power Query extracts.

## 7. Users API
- `GET /api/users` - Retrieve directory of system users.

## 8. Audit Logs API
- `GET /api/audit-logs` - Retrieve the immutable ledger of system actions.

## 9. Notifications API
- `GET /api/notifications` - Retrieve recent system notifications.

## 10. Configuration API
- `GET /api/config` - Retrieve global application settings.
