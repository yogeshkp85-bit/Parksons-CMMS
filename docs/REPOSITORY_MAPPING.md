# Repository Mapping

This document maps the physical Google Sheet interactions to the future Prisma Repositories.

## BreakdownRepository
Targets the future `breakdown_logs` table.
- Replaces reads/writes to the `Raw_Data` Google Sheet tab.
- Replaces `getRawSheet()`, `buildStatusMap()`.

## MachineRepository
Targets the future `machines`, `units`, `sections` tables.
- Replaces reads/writes to the `Machine_Data` Google Sheet tab.
- Replaces `getMachineSheet()`, `seedMachineDataIfEmpty()`.

## UserRepository
Targets the future `users` table.
- Replaces reads/writes to the `Admin_Users` Google Sheet tab.
- Replaces `getAdminUsersSheet()`, `seedAdminUsersIfEmpty()`.

## ReportRepository
Targets KPI aggregations.
- Replaces reads from `Final_Data` and `Historical_KPI` Google Sheet tabs.
