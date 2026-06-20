# Prisma Schema Strategy

## Guidelines
- **PostgreSQL-Ready**: The schema is written explicitly for PostgreSQL (`provider = "postgresql"`).
- **UUIDs**: All primary keys and foreign keys utilize `@db.Uuid` to ensure distributed uniqueness.
- **No Live Migrations**: In the current phase, no `prisma migrate dev` or `prisma db push` is executed against an AWS database.
- **Placeholders**: Required entities (Users, Roles, Permissions, Breakdowns, etc.) have been established, and Phase 6 placeholder tables (Notifications, Reports, Attachments, Configuration, Machine_History) have been appended.
