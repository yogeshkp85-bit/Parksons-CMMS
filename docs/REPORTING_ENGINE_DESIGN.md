# Reporting Engine Design

This document outlines the reporting output layers of the CMMS. 

> [!IMPORTANT]
> These are the accepted reports and must remain unchanged. Enhancements are additive and will not disturb the current reporting pipelines.

## Current Authoritative Reports (Preserved)

1. **Dashboard Reports**:
   - The primary visual interface, serving real-time status and high-level KPIs based on final verified data.
2. **Daily Email Reports**:
   - Automated dispatches summarizing total entries, breakdown counts, total downtime, and plant MTTR.
3. **Excel Power Query Reports**:
   - Advanced analytics via Excel files linked to the raw data feeds.

---

## Future Enhancements
*Note: The following capabilities are planned for future phases and will be built as additive features. They will NOT alter or replace the core reports defined above.*
- PDF Reports
- Native Excel Export from the web application
- Weekly Reports
- Monthly Reports
- Trend Reports
- Exception Reports
- Dashboard APIs for external BI tools
