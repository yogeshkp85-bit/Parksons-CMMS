# Phase 15.4 Section G - Google Sheet Synchronization Validation Report

## 1. Overview
The **Google Sheets Data Pipeline** forms the backbone of the legacy system transition. This validation guarantees that the Postgres backend maintains parity with the external `Machine_Data`, `Admin_Users`, `Raw_Data`, `Final_Data`, and `Historical_KPI` Sheets.

## 2. Validation Audit

### Service Routings
The `sync.routes.ts` API actively exposes the synchronization triggers across 5 modules:
1. `/api/sync/test/machines` -> Pulls `Machine_Data`
2. `/api/sync/test/users` -> Pulls `Admin_Users`
3. `/api/sync/test/raw-data` -> Pulls `Raw_Data` (Breakdowns)
4. `/api/sync/test/final-data` -> Pulls `Final_Data` (Reports)
5. `/api/sync/test/kpi` -> Pulls `Historical_KPI` (MTTR/MTBF Trends)

### Backward Compatibility & Sync Logic
* **Upsert Validation:** All scripts under `src/integrations/google/` operate using safe `UPSERT` methods keyed by `refId` or `machineCode`. This ensures updates made on the Web Interface safely write over to Postgres without duplicating records.
* **Idempotency:** Re-running `/api/sync/run-transactions` successfully parses timestamps and drops duplicated inserts.
* **Data Flow Architecture:** The architecture is designed for Google Sheet -> Postgres flow. Postgres is treated as the source of truth for the local application state to enforce performance, while maintaining data parity for historical records.

## 3. Results
✅ Verified mapping of `Raw_Data` translates to `Breakdown` schema (`shift`, `operatorName`, `problemType`).  
✅ Verified `Final_Data` handles completed status mappings bridging to `Report` schema.  
✅ Executable sync batches (`/api/sync/run` and `/api/sync/run-transactions`) successfully encapsulate cross-module parity.

**Status:** Section G Complete. Ready to proceed to Section H.
