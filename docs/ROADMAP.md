# Parksons CMMS — Development Roadmap

## ✅ Tier 1 — Core (Completed / In Progress)
Essential masters that drive the Breakdown form, PM module, and Dashboard.

| Module | Status |
|--------|--------|
| Plant master | ✅ DB seeded |
| Department master | ✅ DB seeded |
| Machine hierarchy (Dept → Machine → Unit) | ✅ DB seeded |
| Shift configuration | ✅ DB seeded |
| Financial Year | ✅ DB seeded |
| Breakdown Categories | ✅ DB seeded |
| Problem Types | ✅ DB seeded |
| Root Cause Categories | ✅ DB seeded |
| Action Taken Categories | ✅ DB seeded |
| Technician master | ✅ DB seeded |
| PM Frequencies | ✅ DB seeded |
| Master Setup UI (Organisation) | 🔲 In development |
| Master Setup UI (Machine) | 🔲 In development |
| Master Setup UI (Maintenance) | 🔲 In development |
| Breakdown form → API driven | 🔲 In development |

## 🔲 Tier 2 — Extended (Next 3 months post-handover)
Modules that add significant value but are not blockers for go-live.

| Module | Priority |
|--------|----------|
| Spare Parts catalogue (part number, UOM, min/max stock) | High |
| Vendor master (OEM, service, AMC) | High |
| PM Checklist builder (configurable from UI) | High |
| Notification template management | Medium |
| Email configuration from UI | Medium |
| Advanced Reports (8 report types, CSV/PDF export) | Medium |
| KPI Comparison page (multi-year FY trend) | Medium |
| Mobile app (Android — React Native/Expo) | Medium |
| Google Sheets continuous sync (4-hourly cron) | Low |

## 🔮 Tier 3 — Future Roadmap (6–12 months post-handover)
Enterprise-grade extensions. See MDM specification for full details.

| Module | Description |
|--------|-------------|
| Safety | Permit Type, LOTO, Risk Category, Safety Checklist, PPE |
| Quality | Defect Category, Inspection Type, Quality Parameter, Calibration Standard |
| Engineering Knowledge Base | Machine Manuals, Drawings, PLC Backup, SOPs, Photos, Videos |
| HR & Attendance | Employee, Contractor, Skill Matrix, Holiday Calendar |
| Utilities monitoring | Boiler, Compressor, Chiller, Transformer, DG |
| AI-assisted maintenance | Failure prediction, anomaly detection |
| Multi-plant dashboard | Aggregate KPIs across Pune, Chakan |
| Mobile — Play Store release | After internal testing complete |

## Reference Documents
- `Parksons_CMMS_MDM.docx` — Full MDM specification from GLM Turbo AI
- `backend/prisma/schema.prisma` — Database schema
- `frontend/src/config/masterConfig.ts` — Frontend master data config (fallback)
- Original GAS project: `parksons-maintenance-system` repo (master branch)
