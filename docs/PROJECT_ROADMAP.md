# Project Roadmap

This roadmap outlines the phased approach to converting the legacy Google Apps Script CMMS into an enterprise-ready system. 

> **Important**: Current phase is Architecture and Preparation only. No AWS deployment, production database connections, or infrastructure configurations are active.

## Phase 1: Architecture Extraction & Preparation (Current)
- [x] Analyze the live Google Apps Script codebase.
- [x] Establish target folder structure.
- [x] Document System Architecture, Folder Structure, Module Breakdown, Roadmap.

## Phase 2: Database & Core Design (Current)
- **Database Strategy**:
  - Current development: SQLite or PostgreSQL locally.
  - Target production: AWS RDS PostgreSQL.
  - Maintain UUID-based schema. Avoid SQLite-specific redesign.
- [ ] Document Database Design.
- [ ] Document Role/Permission Matrix.
- [ ] Document Audit Log Design.

## Phase 3: Workflow & Engine Design
- [ ] Document Breakdown & PM Workflows.
- [ ] Document KPI & Reporting Engines.

## Phase 4: API & System Integrations Design
- [ ] Document API Specifications.
- [ ] Document Authentication, Notification, and Email modules.

## Phase 5: Cloud Migration Strategy
- [ ] Finalize Migration Strategy from Apps Script to AWS.
- [ ] Define AWS Architecture Placeholder.

## Migration Flow (Long-Term Goal)
```text
Google Apps Script Production
  ↓
Business Logic Extraction
  ↓
Documentation
  ↓
Architecture
  ↓
Git Repository
  ↓
Backend + Frontend Development
  ↓
Testing
  ↓
Corporate IT Review
  ↓
AWS Infrastructure
  ↓
PostgreSQL RDS
  ↓
Parallel Run
  ↓
Final Cutover
```
