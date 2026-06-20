# Audit Log Design

This document details the tracking strategy to maintain an immutable ledger of all system actions. 

## Tracking Principles
- **Immutable Ledger**: Audit logs should **never** be physically deleted.
- **Database Strategy**: Uses `JSONB` native to PostgreSQL to cleanly store complex snapshot data.

## Recorded Data Points
For every critical action, the system records:
1. **Who performed action**: Foreign key `userId`.
2. **When**: Precise timestamp.
3. **Old value**: The state before the change.
4. **New value**: The state after the change.
5. **Affected table**: The entity modified (e.g., Breakdown, User).
6. **Affected record ID**: The specific UUID or Reference ID.
7. **Action type**: E.g., `CREATE`, `UPDATE`, `DELETE`, `APPROVE`, `LOGIN`.

## Future Support Enhancements
The schema is designed to scale to capture:
- **IP address**: Sourced from the HTTP request headers.
- **Device information**: Sourced from the `User-Agent` string to track mobile vs. desktop usage.
