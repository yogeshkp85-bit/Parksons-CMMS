# Backend Architecture

This document defines the backend foundation. 

> [!IMPORTANT]
> **No Business Logic Migrated Yet**. This is pure scaffolding.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL (UUID strategy enabled)
- **Security**: JWT-ready, RBAC-ready

## Design Philosophy
The backend strictly separates concerns:
1. **Routes**: Define API endpoints and HTTP methods.
2. **Controllers**: Handle Request/Response parsing and HTTP status codes.
3. **Services**: Contain all core business logic (to be ported from Google Apps Script).
4. **Repositories/Prisma**: Handle database interactions exclusively.
