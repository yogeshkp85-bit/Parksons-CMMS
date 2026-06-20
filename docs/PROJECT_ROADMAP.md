# Project Roadmap

This roadmap outlines the phased approach to converting the legacy Google Apps Script CMMS into an enterprise-ready AWS PostgreSQL system. 

> **Important**: All current phases focus on local development and architecture generation. Production migration will happen in the future once corporate infrastructure is provided.

## Phase 1: Discovery & Architecture (Current Phase)
- [x] Analyze the live Google Apps Script codebase as the single source of truth.
- [x] Extract workflows, KPIs, and master data logic.
- [x] Establish target folder structure.
- [x] Generate Batch 1 Documentation (`SYSTEM_ARCHITECTURE`, `FOLDER_STRUCTURE`, `MODULE_BREAKDOWN`, `PROJECT_ROADMAP`).

## Phase 2: Database Schema & API Design
- [x] Draft `schema.prisma` targeting PostgreSQL, utilizing UUIDs.
- [ ] Document database design and relationships (`DATABASE_DESIGN.md`).
- [ ] Define REST API endpoints and data transfer objects (`API_SPECIFICATION.md`).
- [ ] Define Role-Based Access Control (`ROLE_PERMISSION_MATRIX.md`).

## Phase 3: Business Logic & Workflow Documentation
- [ ] Document the breakdown lifecycle (`BREAKDOWN_WORKFLOW.md`).
- [ ] Document preventive maintenance workflows (`PM_WORKFLOW.md`).
- [ ] Document the mathematical models for reporting (`KPI_ENGINE_DESIGN.md` & `REPORTING_ENGINE_DESIGN.md`).
- [ ] Document security and logging (`AUTHENTICATION_DESIGN.md` & `AUDIT_LOG_DESIGN.md`).

## Phase 4: Backend & Frontend Scaffolding
- [ ] Implement backend controllers, services, and middlewares locally.
- [ ] Build the React frontend foundation (components, routing, context).
- [ ] Connect the frontend to the local backend API.

## Phase 5: Handover Preparation
- [ ] Finalize `MIGRATION_STRATEGY.md`.
- [ ] Document `AWS_ARCHITECTURE_PLACEHOLDER.md`.
- [ ] Ensure all code is cleanly committed to the GitHub repository.

## Phase 6: AWS Corporate Migration (Future)
- [ ] Receive AWS RDS credentials and IAM policies from corporate IT.
- [ ] Run Prisma migrations against live AWS RDS.
- [ ] Deploy Node.js backend.
- [ ] Deploy React frontend.
- [ ] Perform historical data migration from Google Sheets to PostgreSQL.
