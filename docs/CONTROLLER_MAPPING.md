# Controller Mapping

Controllers process the incoming HTTP requests and route them to Services. This maps the legacy `doGet`/`doPost`/`handleGetAction` routing logic to specific controllers.

## BreakdownController
Handles: `submit`, `getPending`, `update`

## ApprovalController
Handles: `approve`, `reject`, `updateApprove`

## DashboardController
Handles: `serveDashboard`, `getDashboardData`

## MachineController
Handles: `getMachineData`, `saveMachineData`, `deleteMachineData`

## UserController
Handles: `getAdminUsers`, `saveAdminUser`, `deleteAdminUser`

## AuthController
Handles: `loginAdmin`

## ReportController
Handles: `getHistoricalData`, `serveKPI`
