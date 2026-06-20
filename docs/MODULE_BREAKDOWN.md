# Module Breakdown

The enterprise CMMS is divided into the following modules, extracted from the Google Apps Script production logic.

1. **Breakdown Module**: Handles entry, tracking, duration calculation, and problem categorization of machine breakdowns.
2. **PM Module**: Manages preventive maintenance scheduling, checkpoints, and completion logging.
3. **KPI Engine Module**: Mathematical core for calculating MTTR, MTBF, Availability %, and Downtime hours based on raw logs.
4. **Dashboard Module**: Live visualization engine aggregating data for management viewing.
5. **Reporting Module**: Historical reporting, Excel integrations, and custom date-range analytics.
6. **Notification Module**: Real-time alerts (in-app or via other channels) for critical breakdowns.
7. **Audit Log Module**: Tracking every CRUD action (who, what, when) to ensure data integrity and compliance.
8. **User Management Module**: CRUD for users, mapping users to plants, and handling active/inactive states.
9. **Master Data Module**: Configuration of plants, departments, sections, units, machines, shift masters, and problem categories.
10. **Authentication Module**: Secure login, session management, and JWT token issuing.
11. **Approval Workflow Module**: Supervisor queue for reviewing pending logs and approving or rejecting them to finalize data.
12. **Machine History Module**: Dedicated view for the lifecycle and maintenance history of individual machines.
13. **Email Report Module**: Automated cron jobs summarizing daily metrics and emailing stakeholders (replacing the Apps Script trigger).
14. **Configuration Module**: System-wide settings, default limits, and feature toggles.
15. **Future Integration Module**: Extensibility layer for future ERP (e.g., SAP) or SSO integrations.
