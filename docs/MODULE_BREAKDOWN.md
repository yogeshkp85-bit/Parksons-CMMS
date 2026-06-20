# Module Breakdown

Based on the analysis of the production Google Apps Script system (`Code.gs`), the CMMS is divided into the following core enterprise modules.

## 1. Data Entry & Submission Module
- **Current State**: Handled via `Parksons_Maintenance_Form_v4.html`.
- **Target Architecture**: A React-based form with offline-capabilities or progressive web app (PWA) features.
- **Responsibilities**:
  - Capture breakdown details (Machine Type, Machine Name, Unit, Problem Type, Category, Action Taken, Root Cause, Times).
  - Calculate downtime duration.
  - Automatically flag status as `PENDING_REVIEW`.

## 2. Review & Approval Module
- **Current State**: Handled in `Admin.html` via `approveEntry`, `rejectEntry`, and `updateAndApprove` functions in `Code.gs`.
- **Target Architecture**: Admin Dashboard with role-based access control (RBAC).
- **Responsibilities**:
  - Fetch all `PENDING_REVIEW` logs.
  - Allow Supervisors/Admins to edit log details (e.g., refining root cause or time).
  - Update status to `APPROVED` or `REJECTED`.

## 3. Machine & Master Data Management
- **Current State**: Seeded dynamically from `MACHINES_DEFAULT` JSON in `Code.gs` into the `Machine_Data` sheet.
- **Target Architecture**: Relational database tables (`Machine`, `Section`, `Unit`, `MachineCategory`).
- **Responsibilities**:
  - Manage a hierarchy: Plant -> Department -> Section -> Machine -> Unit.
  - Expose API endpoints for CRUD operations on master data.

## 4. User & Authentication Module
- **Current State**: Hardcoded admin password (`PKS@2026`) and `Admin_Users` sheet.
- **Target Architecture**: JWT-based authentication with bcrypt password hashing.
- **Responsibilities**:
  - Secure login mechanism.
  - RBAC (Super Admin, Supervisor, Technician).

## 5. KPI & Dashboard Engine
- **Current State**: Reads from `Final_Data` and `Historical_KPI` sheets, served via `Dashboard.html`.
- **Target Architecture**: React dashboard pulling aggregated data from Express API endpoints.
- **Responsibilities**:
  - Calculate real-time KPIs (MTTR, MTBF, Uptime).
  - Filter breakdowns by shift, date, and machine category.

## 6. Automated Reporting Module
- **Current State**: Time-driven trigger (`sendDailyEmailReport`) sending CSVs/HTML emails at 8 AM.
- **Target Architecture**: Node.js cron jobs (e.g., `node-cron`) generating reports.
- **Responsibilities**:
  - Daily summarization of total entries, breakdowns, total downtime, and average MTTR.
  - Automated email dispatch.
