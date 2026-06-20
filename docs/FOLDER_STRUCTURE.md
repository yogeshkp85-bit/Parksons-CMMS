# Folder Structure Specification

This document defines the standardized folder structure for the enterprise CMMS repository. This structure ensures clean separation of concerns and portability for the future AWS migration.

## Root Directory

```text
parksons-cmms-dev/
├── frontend/           # React + TypeScript SPA
├── backend/            # Node.js + Express API
├── database/           # Database migration scripts and seed data
├── docs/               # Enterprise documentation (Architecture, API, Workflows)
├── architecture/       # System diagrams and technical specifications
├── screens/            # UI/UX wireframes and screen specifications
├── reports/            # Specifications for reporting engines and KPIs
├── tests/              # E2E and integration tests
├── github/             # GitHub actions, issue templates, and CI/CD config
└── PROJECT_PROGRESS.md # Master project tracker
```

## Backend Structure (`backend/`)

The backend follows a standard MVC/Service-oriented architecture:

```text
backend/
├── prisma/             # Prisma schema and SQLite/PostgreSQL migrations
├── src/
│   ├── controllers/    # Request handlers (req, res logic)
│   ├── services/       # Core business logic (extracted from Code.gs)
│   ├── routes/         # Express route definitions
│   ├── middlewares/    # Auth, error handling, and RBAC validation
│   ├── validators/     # Zod schema validation
│   ├── types/          # TypeScript interfaces
│   └── utils/          # Helpers (logger, db client)
├── .env                # Environment variables (DB connection, JWT secret)
└── package.json        # Dependencies
```

## Frontend Structure (`frontend/`)

The frontend follows a component-based architecture:

```text
frontend/
├── src/
│   ├── components/     # Reusable UI components (Buttons, Modals, Tables)
│   ├── pages/          # Full page views (Dashboard, Admin, Form)
│   ├── services/       # API integration layer (Axios instances)
│   ├── context/        # React context (Auth, Global State)
│   ├── hooks/          # Custom React hooks
│   ├── assets/         # Images, fonts, static files
│   └── types/          # TypeScript interfaces
├── .env                # API URL configurations
└── package.json        # Dependencies
```

This strict separation ensures that frontend and backend can be developed, tested, and deployed independently.
