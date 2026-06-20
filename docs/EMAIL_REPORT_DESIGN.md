# Email Report Design

This document outlines the automated email reporting module, preserving the exact behavior of the Google Apps Script trigger (`sendDailyEmailReport`).

## Current Design

### Trigger Schedule
- **Timing**: Dispatched daily in the morning (e.g., 8:00 AM - 9:00 AM window).

### Included Data
The email payload reproduces the exact daily summaries management relies upon:
- **Daily Breakdown Summary**: High-level snapshot of total entries vs actual breakdowns.
- **KPI Summary**: Includes the calculated plant-wide average MTTR and total Downtime Hours for the preceding 24 hours.
- **Availability Reports**: High-level availability snapshot.

### Distribution List
- **Management Recipients**: Dispatched to a predefined array of management and engineering email addresses (e.g., `yogeshkp85@gmail.com`, `engg.cn@parksonspackaging.com`).

---

## Future Enhancements
*Note: Additional report formats, real-time alerts, or custom recipient schedules will be documented and developed separately as future capabilities. They will not alter this core daily dispatch.*
