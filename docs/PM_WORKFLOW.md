# Preventive Maintenance (PM) Workflow

This document details the PM structure, ensuring exact parity with the current system's preventative logic.

## PM Schedule Configuration
The PM engine operates on a strict schedule-based logic mapping to machine requirements.

### Standard Status Flow
```text
PM Schedule
  ↓
Frequency (Daily, Weekly, Monthly, Quarterly, Half-Yearly, Yearly)
  ↓
Execution
  ↓
Checkpoints
  ↓
Compliance
  ↓
Approval
  ↓
History
  ↓
Audit Logging
  ↓
Closed
```

## Core Process Steps

### 1. Schedule Generation
- The system defines specific PM task checklists mapped to a specific Machine and Frequency (Daily, Weekly, Monthly, Quarterly, Half-Yearly, Yearly).

### 2. Execution & Checkpoints (Technician)
- The technician executes the task checkpoints specific to that machine's requirements.

### 3. Approval & Compliance (Supervisor)
- Supervisors verify the execution quality and approve the PM run.
- Approved PMs update the overall PM Compliance score.

### 4. Downstream Tracking
- **History**: The PM execution is logged permanently in the machine's maintenance history.
- **Audit Logging**: Sign-offs are immutably logged to ensure safety compliance.

---

## Future Enhancements
*Note: The following capabilities are planned for future phases and will be built as additive features. They will NOT alter the core flow defined above.*
- Spare consumption tracking tied directly to PM orders
- SAP / ERP integration
- QR codes for physical machine verification during PM runs
