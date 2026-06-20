# Breakdown Workflow

This workflow documents exactly how the breakdown process functions in the Google Apps Script production system, which acts as the absolute single source of truth.

## Standard Status Flow
The lifecycle of a breakdown ticket strictly adheres to this state machine:

`DRAFT` (Optional future state)
  ↓
`PENDING_REVIEW` (Default state upon Technician submission)
  ↓
`APPROVED` or `REJECTED` (Supervisor action)
  ↓
`CLOSED` (Final archived state)

## Core Process Steps

### 1. Data Entry (Technician)
- The technician inputs the breakdown details (Date, Shift, Machine, Problem, Action Taken, Start/End times) via the form.
- The system defaults the record status to `PENDING_REVIEW`.

### 2. Review Phase (Supervisor)
- The supervisor monitors the dashboard for `PENDING_REVIEW` entries.
- The supervisor reviews the technical details and times.
- **Edit**: If the technician entered an inaccurate root cause or incorrect time, the supervisor modifies the log directly.

### 3. Approval / Rejection
- The supervisor executes an `Approve` or `Reject` action.
- Only `APPROVED` records flow downstream into the final data pipeline.

### 4. Downstream Systems Update
Once a record is Approved, it triggers the following exact behaviors:
- **Dashboards**: The approved record updates the live metrics.
- **Reports**: Data is included in Daily Email and Excel Power Query extracts.
- **Notifications**: Internal alerts are triggered for critical downtimes.
- **Audit Logs**: An immutable audit trail of the approval (and any preceding edits) is created.
- **Machine History**: The specific machine's historical ledger is updated for MTTR/MTBF analysis.

*(Note: Future attachment support for photos/manuals will plug into this workflow without altering the fundamental steps).*
