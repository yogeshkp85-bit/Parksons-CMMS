# KPI Engine Design

This document outlines the core Key Performance Indicators. 

> [!IMPORTANT]
> **No formula redesign.** The Google Apps Script formulas remain authoritative. All calculations in the enterprise Node.js/PostgreSQL backend will preserve the exact mathematical models currently used in production.

## Core Preserved Metrics

### 1. MTTR (Mean Time To Repair)
Calculates the average time required to fix a breakdown.
- **Inputs**: Total Downtime Hours, Total Breakdown Events.

### 2. MTBF (Mean Time Between Failures)
Calculates the reliability of a machine between breakdown events.
- **Inputs**: Total Available Operating Time, Total Breakdown Events.

### 3. Availability %
Percentage of scheduled time the machine is actually available for production.
- **Inputs**: (Available Time - Downtime) / Available Time * 100.

### 4. Downtime (Total Hours/Minutes)
The absolute sum of time lost to technical breakdowns.

### 5. Breakdown Count
The raw frequency of failure events.

### 6. PM Compliance %
Measures adherence to the preventive maintenance schedules.
- **Inputs**: (Completed PMs on time / Total Scheduled PMs) * 100.

## Preserved Analytical Dimensions
The KPI engine must group, aggregate, and filter the above metrics exactly as currently done:
- **Top Problems**: Pareto analysis of most frequent issues.
- **Machine Ranking**: Worst vs Best performing assets.
- **Section Ranking**: Aggregation by plant sections.
- **Monthly Trends**: Time-series analysis over the fiscal year.
- **Shift Analysis**: Breakdown correlation by working shift.
- **Department Analysis**: Aggregation by broader departments.
- **Plant Analysis**: Top-level executive view.
