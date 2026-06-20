# Service Mapping

This document assigns the legacy Google Apps Script functions to the future Node.js Service Layer classes.

## BreakdownService
Handles raw data entry and modifications.
- `writeFormSubmission(data)` -> `BreakdownService.createLog()`
- `getPendingEntries()` -> `BreakdownService.getPendingLogs()`
- `updateEntry(data)` -> `BreakdownService.updateLog()`

## ApprovalService (New Module)
Handles the status lifecycle of records.
- `approveEntry(data)` -> `ApprovalService.approveLog()`
- `rejectEntry(data)` -> `ApprovalService.rejectLog()`
- `updateAndApprove(data)` -> `ApprovalService.updateAndApprove()`

## DashboardService
Handles data aggregation for views.
- `getDashboardData()` -> `DashboardService.getLiveMetrics()`

## MachineService (Master Data)
Handles equipment CRUD.
- `getMachineData()` -> `MachineService.getAllHierarchy()`
- `saveMachineData(params)` -> `MachineService.upsertMachine()`
- `deleteMachineData(params)` -> `MachineService.deleteMachine()`

## UserService (Admin Users)
Handles admin directory.
- `getAdminUsers()` -> `UserService.getAllAdmins()`
- `saveAdminUser(params)` -> `UserService.upsertAdmin()`
- `deleteAdminUser(params)` -> `UserService.deleteAdmin()`

## AuthService
Handles authentication.
- `loginAdmin(params)` -> `AuthService.authenticate()`

## ReportService
Handles scheduled and triggered outputs.
- `getHistoricalData()` -> `ReportService.getHistoricalKpis()`
- `sendDailyEmailReport()` -> `ReportService.generateDailySummaryHtml()`
- `sendDailyDataExport()` -> `ReportService.generateDailyCsvExport()`
