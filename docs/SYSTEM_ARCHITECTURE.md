# Enterprise System Architecture

This document defines the high-level architecture of the Parksons Maintenance System. 

> [!IMPORTANT]
> **Current Google Apps Script production system remains operational and will not be modified during migration.** This architecture is extracted for future deployment.

## Current Production Architecture (Google Apps Script)

The current system acts as the single source of truth, hosted entirely within the Google Workspace ecosystem.

### Current Data Flow
```text
Technician
  → HTML Form (Parksons_Maintenance_Form_v4.html)
  → Code.gs
  → Raw_Data (Google Sheet Tab)
  → Final_Data (Google Sheet Tab via ARRAYFORMULA)
  → Dashboard.html
  → Excel Power Query Reports
```

## Target Enterprise Architecture (AWS)

To ensure scalability, data integrity, and enterprise security, the system will eventually be migrated to a modern cloud-native stack.

### Future Architecture Flow
```text
React (Frontend Application)
  ↓
Node.js API (Express Backend)
  ↓
Prisma ORM
  ↓
PostgreSQL
  ↓
AWS RDS
  ↓
Reports and Dashboards
```

### Layer Details
- **Frontend**: React + TypeScript + Tailwind + Chart.js.
- **Backend**: Node.js + Express + TypeScript.
- **Database & ORM**: PostgreSQL via Prisma.
- **Infrastructure**: Target AWS RDS PostgreSQL (No AWS deployment or configurations at this phase).
