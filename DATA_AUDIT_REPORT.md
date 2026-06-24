# CMMS Data Integrity Audit Report

Generated on: 2026-06-21T03:25:47.619Z

## 1. Database Record Counts

| Table / Entity | Record Count |
| :--- | :---: |
| **Raw Breakdown Logs (RawData)** | 10 |
| **Finalized OEE Logs (FinalData)** | 1 |
| **Machine Master (MachineData)** | 81 |
| **Admin Users (AdminUsers)** | 4 |
| **Historical KPI (HistoricalKPI)** | 2 |

## 2. Breakdown Status Distribution

| Status Flag | Counts |
| :--- | :---: |
| RE-REVIEW | 7 |
| PENDING_REVIEW | 2 |
| APPROVED | 1 |

## 3. Month-wise Activity (FinalData)

| Month-Year | Count |
| :--- | :---: |
| Jun-26 | 1 |

## 4. Validation & Sanitization Anomalies

- **Duplicate Ref_IDs in RawData**: 0 
- **Duplicate Ref_IDs in FinalData**: 0 
- **Logs with Empty Description**: 0
- **Logs with Empty Machine Name**: 0
- **Logs with Empty Date string**: 0
- **Logs with Invalid Slashed Dates (Null Timestamp)**: 0
- **Breakdown Entries referencing missing Machine Master**: 0

## 5. Computed KPI OEE Metrics (FinalData)

| Metric Metric | Value |
| :--- | :---: |
| **Mean Time to Repair (MTTR)** | 30.00 mins |
| **Mean Time Between Failures (MTBF)** | 44610.00 mins |
| **Availability Percentage** | 99.93% |
| **Total Breakdown Time** | 30.00 mins |
| **Total Available Time** | 44640.00 mins |
| **Unique Machines Audited** | 1 |

## 6. Failure Frequency Summary

### Top 5 Breakdown-Prone Machinery:
- **PrintKBA1**: 9 breakdown events
- **Champion**: 1 breakdown events

### Most Common Breakdown Categories:
- **Breakdown**: 10 occurrences

## 7. Recommendations

> [!NOTE]
> **Availability and MTTR Targets**: Ensure Availability stays above OEE baseline target (e.g. 95%) and that MTTR tracks downward with proper preventative PM schedules.
