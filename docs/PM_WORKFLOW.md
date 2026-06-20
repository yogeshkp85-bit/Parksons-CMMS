# Preventive Maintenance (PM) Workflow

This document details the PM structure, ensuring exact parity with the current system's preventative logic.

## PM Schedule Configuration
The PM engine operates on a strict schedule-based logic.

### Supported Frequencies
The system supports generating recurring schedules based on the following standard frequencies:
- Daily
- Weekly
- Monthly
- Quarterly
- Half-Yearly
- Yearly

## Core Process Steps

### 1. Schedule Generation
- The system defines specific PM task checklists mapped to a specific Machine and Frequency.
- PM Schedules generate due dates based on the calendar and frequency rules.

### 2. Execution (Technician)
- The technician loads the pending PM tasks.
- They execute the task checkpoints specific to that machine's requirements.

### 3. Approval (Supervisor)
- Submitted PM checklists enter a review queue.
- Supervisors verify the execution quality and approve the PM run.

### 4. Downstream Tracking
- **Compliance**: Approved PMs update the overall PM Compliance % score for the department/plant.
- **History**: The PM execution is logged permanently in the machine's maintenance history.
- **Audit Logging**: Sign-offs are immutably logged to ensure safety and quality compliance.

*(Note: Future enhancements like automatic spare part consumption tracking will integrate here without changing the core compliance workflow).*
