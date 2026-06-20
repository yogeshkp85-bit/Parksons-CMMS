# Google Apps Script Function Mapping

This document maps every core function in `Code.gs` to its future enterprise equivalent.

| Function Name | Purpose | Inputs | Outputs | Dependencies | Sheet Usage | Future Controller | Future Service | Future Repository |
|---|---|---|---|---|---|---|---|---|
| `doGet(e)` / `doPost(e)` | Web App Router. Routes HTTP requests to internal handlers. | HTTP Event `e` | JSON or HTML | `handleGetAction`, `writeFormSubmission` | None directly | Handled by Express Router | N/A | N/A |
| `handleGetAction(params)`| API Router. Dispatches actions like `getPending`, `approve`, etc. | Action object | JSON string | Internal handlers | None directly | Express Router | N/A | N/A |
| `serveDashboard()` | Renders the live dashboard UI. | None | HTML | `getDashboardData` | `Final_Data` | `DashboardController.getDashboard` | `DashboardService.getDashboardData` | `DashboardRepository` |
| `getDashboardData()` | Reads and formats data for the dashboard. | None | JSON array | `buildStatusMap` | `Final_Data`, `Raw_Data` | `DashboardController.getDashboard` | `DashboardService.getDashboardData` | `DashboardRepository` |
| `serveAdmin()` | Renders the Admin Panel UI. | None | HTML | None | None | N/A (Frontend React) | N/A | N/A |
| `getPendingEntries()` | Fetches logs awaiting supervisor review. | None | JSON array | None | `Raw_Data` | `BreakdownController.getPending` | `BreakdownService.getPendingLogs` | `BreakdownRepository` |
| `approveEntry(data)` | Changes log status to APPROVED. | `{rowNum, refId}`| JSON Status | `setStatus` | `Raw_Data` | `ApprovalController.approve` | `ApprovalService.approveLog` | `BreakdownRepository` |
| `rejectEntry(data)` | Changes log status to REJECTED. | `{rowNum, refId}`| JSON Status | `setStatus` | `Raw_Data` | `ApprovalController.reject` | `ApprovalService.rejectLog` | `BreakdownRepository` |
| `updateEntry(data)` | Saves supervisor edits to a pending log. | Breakdown fields | JSON Status | `writeEdits` | `Raw_Data` | `BreakdownController.update` | `BreakdownService.updateLog` | `BreakdownRepository` |
| `updateAndApprove(data)` | Saves edits and sets status to APPROVED. | Breakdown fields | JSON Status | `writeEdits`, `setStatus`| `Raw_Data` | `ApprovalController.updateAndApprove`| `ApprovalService.updateAndApprove` | `BreakdownRepository` |
| `writeFormSubmission(data)` | Creates a new breakdown log. | Form payload | JSON `{refId}` | `setupHeaders` | `Raw_Data` | `BreakdownController.create` | `BreakdownService.createLog` | `BreakdownRepository` |
| `getMachineData()` | Fetches master machine hierarchy. | None | JSON Object | `seedMachineDataIfEmpty` | `Machine_Data`| `MachineController.getAll` | `MachineService.getAll` | `MachineRepository` |
| `saveMachineData(params)`| Creates or updates a machine definition. | `{machineType, machineName, units}` | JSON Status | `seedMachineDataIfEmpty` | `Machine_Data`| `MachineController.save` | `MachineService.save` | `MachineRepository` |
| `deleteMachineData(params)`| Deletes a machine definition. | `{machineName}` | JSON Status | None | `Machine_Data`| `MachineController.delete` | `MachineService.delete` | `MachineRepository` |
| `loginAdmin(params)` | Authenticates admin users. | `{email, password, level}` | JSON `{user}` | `seedAdminUsersIfEmpty` | `Admin_Users` | `AuthController.login` | `AuthService.login` | `UserRepository` |
| `getAdminUsers()` | Fetches directory of admins/supervisors. | None | JSON array | `seedAdminUsersIfEmpty` | `Admin_Users` | `UserController.getAll` | `UserService.getAll` | `UserRepository` |
| `saveAdminUser(params)` | Creates/Updates an admin user. | User payload | JSON Status | `seedAdminUsersIfEmpty` | `Admin_Users` | `UserController.save` | `UserService.save` | `UserRepository` |
| `sendDailyEmailReport()` | Sends daily morning KPI summary via email. | None | Email dispatch | `getDashboardData` | `Final_Data` | `ReportController.triggerDaily` | `ReportService.sendDailyEmail` | `DashboardRepository` |
| `sendDailyDataExport()` | Sends daily raw CSV export via email. | None | Email dispatch | None | `Raw_Data` | `ReportController.triggerExport` | `ReportService.sendCsvExport` | `BreakdownRepository` |
| `getHistoricalData()` | Fetches KPI comparison data. | None | JSON array | None | `Historical_KPI`| `ReportController.getHistorical` | `ReportService.getHistoricalKpi` | `ReportRepository` |
