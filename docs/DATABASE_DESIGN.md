# Database Design

This document describes the target enterprise database design (PostgreSQL via Prisma), which translates the flat Google Sheets structure into a normalized, relational architecture.

## Strategy
- **Primary Keys**: UUID-based IDs (`@db.Uuid`) for all tables to ensure global uniqueness and secure scaling across distributed environments.
- **Foreign Keys**: Enforced at the database level to maintain strict referential integrity (e.g., deleting a Machine cascade-deletes or blocks depending on linked Breakdowns).
- **Extensibility**: Advanced types like `Json` are used for flexible storage (e.g., Audit logs, checkpoint results) while core dimensions are strictly typed.

## Core Schema Entities

### 1. User & Authentication Layer
- **`User`**: Core user accounts. Linked to `Role` and optionally `Plant`. Tracks login details (hashed passwords).
- **`Role`**: Master list of roles (Super Admin, Supervisor, Technician).
- **`Permission`**: Granular system permissions (e.g., `BREAKDOWN_APPROVE`, `USER_MANAGE`).
- **`RolePermission`**: Junction table mapping multiple permissions to roles.

### 2. Master Data (Hierarchical Structure)
- **`Plant`**: Top-level factory location.
- **`Department`**: Groups of sections within a Plant.
- **`Section`**: Specific zones within a Department.
- **`MachineCategory`**: Classifications (Printing, Corrugation).
- **`Machine`**: The physical equipment. Linked to Category, Section, and Plant.
- **`Unit`**: Sub-units within a Machine.
- **`SubAssembly` / `Component`**: Deeper levels for precise breakdown tracking.

### 3. Lookup Masters
- **`BreakdownCategory`**, **`ProblemCategory`**, **`RootCauseCategory`**, **`ActionTakenCategory`**: Standardized lists extracted from Apps Script dropdowns.
- **`ShiftMaster`**: Defines standard working shifts (First, Second, Third) and their time boundaries.
- **`HolidayCalendar`**: Used for accurate MTTR/Downtime calculations excluding non-working days.

### 4. Breakdown Module
- **`BreakdownLog`**: The central transactional table. 
  - Captures `startTime`, `endTime`, `durationMin` (calculated), and relationships to `Machine`, `User` (reporter and approver), and master lookups.
  - State managed via a `status` field (`PENDING_REVIEW`, `APPROVED`, `REJECTED`).
- **`BreakdownSparePartUsed`**: Tracks inventory consumption against specific breakdowns.

### 5. Preventive Maintenance (PM) Module
- **`PmTask`**: Master definitions of maintenance routines and frequencies.
- **`PmSchedule`**: Transactional instances of PM tasks, tracking due dates, completion dates, and check-list results (stored as `Json`).

### 6. Audit & Tracking
- **`AuditLog`**: Centralized, immutable ledger for all CRUD events across critical tables. See `AUDIT_LOG_DESIGN.md`.
