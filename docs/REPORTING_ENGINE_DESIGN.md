# Reporting Engine Design

This document outlines the reporting output layers of the CMMS. Enhancements are additive and will not disturb the current reporting pipelines.

## Current Authoritative Reports (Preserved)

1. **Dashboard Reports**:
   - The primary visual interface, serving real-time status and high-level KPIs based on `Final_Data`.
2. **Daily Email Reports**:
   - Time-driven summaries dispatched via email (e.g., 8:00 AM dispatch).
   - Summarizes total entries, breakdown counts, total downtime, and plant MTTR for the preceding 24 hours.
3. **Excel Power Query Reports**:
   - Heavy analytical lifting occurs via `.xlsm` files tied into the raw data feeds, producing management charts and deep-dives.

## Future Enterprise Reports (Additive Enhancements)

The new backend architecture will natively support the following enhancements over time, operating independently of the legacy Google Sheet bounds:

- **PDF Reports**: Automated generation of perfectly formatted PDFs for shift handovers and management briefings.
- **Native Excel Export**: API endpoints delivering raw dataset dumps (`.xlsx` or `.csv`) directly from the PostgreSQL database.
- **Scheduled Aggregations**:
  - Weekly Summaries
  - Monthly Executive Reports
- **Trend Reports**: Year-over-year or month-over-month comparisons.
- **Exception Reports**: Alerts highlighting anomalies (e.g., machines exceeding MTTR thresholds by 200%).
- **Dashboard APIs**: Open REST or GraphQL endpoints allowing corporate BI tools (like PowerBI or Tableau) direct, read-only access to the data warehouse.
