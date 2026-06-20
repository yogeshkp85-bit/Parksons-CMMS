# Scheduler Engine Design

The Scheduler Module is identified during reverse engineering to replace the Google Apps Script Time-Driven Triggers.

## Legacy Triggers Replaced
- `sendDailyEmailReport` (Triggered 8 AM - 9 AM)
- `sendDailyDataExport` (Triggered 8 AM - 9 AM)

## Future Enterprise Architecture
- **Technology**: Node.js `node-cron` or `BullMQ` (Redis-based job queue).
- **Service**: `SchedulerService` - Registers cron patterns on server startup.
- **Execution**: At the defined cron time (e.g., `0 8 * * *` for 8:00 AM), the `SchedulerService` invokes the `ReportService.generateDailySummaryHtml()` and dispatches the email via SMTP/AWS SES.

## Philosophy
No feature additions. The scheduler will only execute the two exact daily email reports currently present in the Google Apps Script system.
