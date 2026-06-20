# Audit Log Design

This document details the strategy for recording system changes to ensure accountability, compliance, and accurate historical tracking.

## Objective
To maintain an immutable, searchable ledger of all critical actions performed by users in the system, specifically targeting breakdown edits, approvals, and master data changes.

## Schema Definition

The `AuditLog` table uses a flexible structure, leveraging PostgreSQL's `JSONB` for payload storage.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key. |
| `userId` | UUID | Foreign Key linking to the User who performed the action. |
| `module` | VARCHAR | The subsystem involved (e.g., "Breakdown Log", "Machine Master", "User Auth"). |
| `action` | VARCHAR | The action type (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `APPROVE`). |
| `targetId` | VARCHAR | The primary key (UUID) or reference number (e.g., PKS-2026...) of the affected record. |
| `oldValue` | JSON | A JSON snapshot of the record's state *before* the action (null for CREATE). |
| `newValue` | JSON | A JSON snapshot of the record's state *after* the action (null for DELETE). |
| `ipAddress` | VARCHAR | The IP address of the requesting client. |
| `userAgent` | VARCHAR | Browser/Device information string. |
| `createdAt` | TIMESTAMP | Auto-generated timestamp of the event. |

## Tracking Triggers

The system will intercept actions at the Service layer (Node.js/Express) and write to the AuditLog asynchronously to prevent blocking the main HTTP response.

### Key Monitored Events
1. **Breakdown Approvals/Edits**: 
   - When a Supervisor updates a Technician's log before approval (e.g., altering `downtimeMin` or `rootCause`), the `oldValue` vs `newValue` JSON will explicitly show what was changed.
2. **Master Data Modifications**:
   - Adding or retiring a machine.
   - Changing machine hierarchies.
3. **Authentication**:
   - Tracking `LOGIN_SUCCESS`, `LOGIN_FAILED`, and `LOGOUT` events for security monitoring.

## Data Retention Strategy
Audit logs grow rapidly. Future implementations should consider:
- Partitioning the `AuditLog` table by month/year in PostgreSQL.
- Exporting logs older than 2 years to AWS S3 (Cold Storage) to maintain database performance.
