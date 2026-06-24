# Google Sheet Mapping

This document maps all the master data sheets discovered in the Parksons Maintenance Log Google Sheet.

| Sheet Name | Rows | Columns | Target Prisma Model | Sync Status |
|---|---|---|---|---|
| Machine_Data | 999 | 26 | Machine | Pending |
| Admin_Users | 1000 | 26 | User | Pending |
| Config | 1000 | 26 | Settings / Shift / Category / ProblemType (TBD) | Pending |

## Data Structure Details

### Machine_Data
**Headers**: `machine_type | machine_name | units`
- Maps to Prisma `Machine` model.

### Admin_Users
**Headers**: `name | email | password | level`
- Maps to Prisma `User` model.

### Config
**Headers**: None discovered in row 1. Data format requires manual inspection.

---

> Note: Other master data models (Categories, Problem Types, Shifts, Departments) may either be hardcoded in the frontend or managed within the Config sheet. We will provide robust UPSERT sync services for all requested entities.
