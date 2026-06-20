# Enterprise System Architecture

This document defines the high-level architecture of the Parksons Maintenance System, outlining both the current production environment (Google Apps Script) and the target enterprise environment (AWS PostgreSQL).

## Current Production Architecture (Google Apps Script)

The current system is a serverless application hosted entirely within the Google Workspace ecosystem.

### Data Flow
1. **Data Entry**: Technicians use a standalone, offline-capable HTML5 form (`Parksons_Maintenance_Form_v4.html`) to log maintenance activities.
2. **Backend**: Google Apps Script (`Code.gs`) receives POST requests from the form.
3. **Database**: Data is appended to a Google Sheet (`Raw_Data` tab). An `ARRAYFORMULA` auto-cleans the data into a `Final_Data` tab.
4. **Presentation**: 
   - A live web dashboard (`Dashboard.html`) is served by Apps Script, reading from `Final_Data`.
   - Management uses an Excel file (`.xlsm`) connected via Power Query to the Google Sheet for advanced KPI reporting.
5. **Admin**: An Admin panel (`Admin.html`) handles approvals, machine configuration (`Machine_Data`), and user management (`Admin_Users`).

## Target Enterprise Architecture (AWS)

To ensure scalability, data integrity, and enterprise security, the system will be migrated to a modern cloud-native stack.

### Layer 1: Frontend (Client)
- **Framework**: React 19 + TypeScript + Vite.
- **Styling**: TailwindCSS.
- **Data Visualization**: Chart.js for live dashboards.
- **Role**: Replaces the HTML forms, Google Apps Script HTML dashboards, and Excel Power Query reports with a unified web application.

### Layer 2: Backend (Server)
- **Framework**: Node.js + Express + TypeScript.
- **Role**: Replaces `Code.gs`. Handles API routing, data validation, business logic, email notifications, and authorization.

### Layer 3: Database & ORM
- **Database**: PostgreSQL (Target: AWS RDS). Local development utilizes SQLite/PostgreSQL depending on the environment.
- **ORM**: Prisma.
- **Role**: Replaces Google Sheets. Ensures relational data integrity (foreign keys between breakdowns, machines, and users), prevents concurrent write issues, and enables complex SQL querying.

### Layer 4: Infrastructure (Target AWS)
- **Database Hosting**: AWS RDS (PostgreSQL).
- **Backend Hosting**: AWS EC2, Elastic Beanstalk, or ECS.
- **Frontend Hosting**: AWS S3 + CloudFront (or similar CDN).
- **Authentication**: JWT-based initially, extensible to corporate SSO (AWS Cognito/SAML) in the future.
