# Database Design

This document describes the target enterprise database design (PostgreSQL via Prisma), designed to preserve the exact logic of the Google Apps Script production system while scaling.

## Architecture Philosophy
- **Migration First**: No redesign of core concepts.
- **Primary Keys**: UUID-based IDs (`@db.Uuid`) maintained for all tables.
- **Target Production**: PostgreSQL on AWS RDS. Current development runs locally but preserves a strict PostgreSQL schema to avoid redesigning around SQLite limitations.

## Future Hierarchy Structure
The database enforces the following strict hierarchy:
`Plant → Department → Section → Machine → Unit`

## Core Schema Entities
- **Users**: Authentication and profile data.
- **Roles**: Master definitions.
- **Permissions**: Granular system permissions.
- **Plants**: Top-level hierarchy.
- **Departments**: Functional groupings.
- **Sections**: Sub-groupings within departments.
- **Machines**: Master equipment list.
- **Units**: Specific components of a machine.
- **Breakdowns**: Core transactional logs.
- **PM_Schedules**: Defined maintenance routines and frequencies.
- **PM_Execution**: Logs of completed schedules.
- **Machine_History**: Aggregated view for machine lifecycles.
- **Audit_Logs**: Immutable tracking of all system changes.
- **Notifications**: Internal alerts.
- **Reports**: Stored reporting criteria or scheduled reports.
- **Attachments**: Future support for media uploads.
- **Configuration**: System-wide settings.
