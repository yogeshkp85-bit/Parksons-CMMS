# Google Transaction Mapping

This document lists the transaction tables discovered in the Parksons Maintenance Log Google Sheet. 
**Note:** As per instructions, these tables will NOT be synchronized yet.

| Sheet Name | Rows | Columns | Description |
|---|---|---|---|
| Form Responses 1 | 1001 | 27 | Raw form entries (likely Google Forms backend). |
| For Review | 970 | 26 | Pending approvals / breakdowns awaiting review. |
| Raw_Data | 1396 | 26 | Main transactional log. Headers include: Timestamp, Ref_ID, Date, Shift, Machine_Type, Machine_Name, Unit, Problem_Type, Category, Description, Action_Taken, Root_Cause, Time_Start, Time_End, Duration_Min, Attended_By, Submitted_By, Remarks, Status. |
| Final_Data | 11461 | 26 | Processed and finalized breakdown records. Headers include: Month_Year, Total_Repair_Time, Available_Time_Min, BD_Flag, BD_Downtime_Min, MTTR_Contribution, Availability_Loss_Min. |
| Historical_KPI | 1000 | 26 | Pre-calculated KPIs. Headers include: FY, Month, Machine, Available_Time, Breakdown_Time, Breakdown_Count, Uptime, MTTR, MTBF, Availability. |

## Machine History / PM Records
| Sheet Name | Rows | Columns | Description |
|---|---|---|---|
| Annual PM Record 24-25 | 997 | 41 | Preventive Maintenance Schedule 2024-25 |
| Pm Record 24-25 | 1000 | 26 | Preventive Maintenance Execution Logs 2024-25 |
| Annual PM Record 25-26 | 997 | 40 | Preventive Maintenance Schedule 2025-26 |
| Annual PM Record 2026-27 | 997 | 41 | Preventive Maintenance Schedule 2026-27 |

> Note: There are also unused/empty sheets such as `Sheet6` and `Sheet1` that were skipped.
