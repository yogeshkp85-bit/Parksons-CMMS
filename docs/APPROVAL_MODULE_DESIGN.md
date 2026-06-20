# Approval Module Design

The Approval Module is a dedicated domain identified during application reverse engineering. In the legacy system, approvals are tightly coupled with the `Code.gs` breakdown logic (`approveEntry`, `updateAndApprove`). In the enterprise system, this becomes a distinct service.

## Core Responsibility
To manage the state machine lifecycle of records requiring supervisor review.

## Architecture
- **Controller**: `ApprovalController` - Exposes REST endpoints to change statuses.
- **Service**: `ApprovalService` - Validates that the user has the `BREAKDOWN_APPROVE` permission, writes the new status via the Repository, and subsequently creates an `AuditLog` entry.

## Target Flow (Migration First)
1. Fetch pending log via `BreakdownService`.
2. Supervisor submits `POST /api/approvals/breakdowns/:id/approve`.
3. `ApprovalService` updates status from `PENDING_REVIEW` to `APPROVED`.
4. Downstream triggers (if any) are invoked.
