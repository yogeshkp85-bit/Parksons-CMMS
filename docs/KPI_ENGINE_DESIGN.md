# KPI Engine Design

This document outlines the core Key Performance Indicators. 

> [!IMPORTANT]
> **No formula redesign.** The Google Apps Script formulas remain authoritative. All calculations in the enterprise Node.js/PostgreSQL backend will preserve the exact mathematical models currently used in production. There will be no formula optimization, no new calculations, and no AI recommendations in the core engine.

## Core Preserved Metrics

### 1. MTTR (Mean Time To Repair)
Calculates the average time required to fix a breakdown.

### 2. MTBF (Mean Time Between Failures)
Calculates the reliability of a machine between breakdown events.

### 3. Availability %
Percentage of scheduled time the machine is actually available for production.

### 4. Downtime
The absolute sum of time lost to technical breakdowns.

### 5. Breakdown Count
The raw frequency of failure events.

### 6. PM Compliance
Measures adherence to the preventive maintenance schedules.

## Preserved Analytical Dimensions
The KPI engine will group, aggregate, and filter the above metrics exactly as currently done:
- **Machine Ranking**: Worst vs Best performing assets.
- **Section Ranking**: Aggregation by plant sections.
- **Department Ranking**: Aggregation by broader departments.
- **Plant Analysis**: Top-level executive view.
- **Top Problems**: Pareto analysis of most frequent issues.
- **Monthly Trends**: Time-series analysis over the fiscal year.
- **Shift Analysis**: Breakdown correlation by working shift.

---

## Future Enhancements
*Note: Any future KPIs, predictive models, or altered calculations will be built as entirely separate analytical modules and will not modify these authoritative core formulas.*
