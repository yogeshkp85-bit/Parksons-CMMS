# Breakdown Workflow

This workflow documents exactly how the breakdown process functions in the Google Apps Script production system, which acts as the absolute single source of truth.

## Standard Status Flow
The lifecycle of a breakdown ticket strictly adheres to this state machine:

```text
Technician Entry
  ↓
PENDING_REVIEW (Default state upon submission)
  ↓
Supervisor Review
  ↓
Edit if Required
  ↓
APPROVED / REJECTED
  ↓
Dashboard Update
  ↓
Email Reports
  ↓
Machine History
  ↓
Audit Logs
  ↓
CLOSED
```

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
- Only `APPROVED` records flow downstream.

### 4. Downstream Systems Update
Once a record is Approved, it triggers the exact behaviors currently used:
- **Dashboards**: The approved record updates the live metrics.
- **Reports**: Data is included in Daily Email and Excel Power Query extracts.
- **Machine History**: The specific machine's historical ledger is updated.
- **Audit Logs**: An immutable audit trail of the approval is created.

---

## Future Enhancements
*Note: The following capabilities are planned for future phases and will be built as additive features. They will NOT alter the core flow defined above.*
- Attachments (Photo/Manual uploads)
- QR code support for rapid machine identification
- Spare consumption tracking
- Dedicated mobile application front-end
