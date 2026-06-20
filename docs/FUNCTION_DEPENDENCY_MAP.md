# Function Dependency Map

This document outlines the internal dependencies of the core business logic within `Code.gs`.

## API Routing Dependencies
- **`doGet(e)` / `doPost(e)`** -> depends on -> `handleGetAction(params)` -> depends on -> Feature Functions (`getPendingEntries`, `loginAdmin`, etc.)
- **`doPost(e)`** -> depends on -> `writeFormSubmission(data)` (if no specific action is passed).

## Dashboard Dependencies
- **`serveDashboard()`** -> depends on -> `getDashboardData()`
- **`getDashboardData()`** -> depends on -> `buildStatusMap()` -> depends on -> `getRawSheet()`

## Approval Workflow Dependencies
- **`approveEntry(data)`** -> depends on -> `setStatus(data, statusValue)` -> depends on -> `getRawSheet()`
- **`rejectEntry(data)`** -> depends on -> `setStatus(data, statusValue)` -> depends on -> `getRawSheet()`
- **`updateEntry(data)`** -> depends on -> `writeEdits(sheet, rowNum, data)` -> depends on -> Format Helpers (`fmtTimeStr`, `parseDateSafe`).
- **`updateAndApprove(data)`** -> depends on -> `writeEdits(sheet, rowNum, data)` & `setStatus(data, statusValue)`.

## Form Submission Dependencies
- **`writeFormSubmission(data)`** -> depends on -> `setupHeaders()` (if sheet is missing) -> depends on -> `getRawSheet()`.

## Email Reporting Dependencies
- **`sendDailyEmailReport()`** -> depends on -> `getDashboardData()` -> depends on -> `buildStatusMap()`.
