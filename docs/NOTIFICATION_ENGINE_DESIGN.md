# Notification Engine Design

This document outlines the notification mechanisms for the CMMS.

## Current Behavior
The authoritative notification flow from the Google Apps Script production system consists of:
- **Daily Email Reports**: Automated dispatches summarizing the previous 24 hours of activity.

---

## Future Enhancements
*Note: The following capabilities are planned for future phases and will be built as additive features. They will NOT modify or replace the existing daily email report behavior.*
- Real-time Email alerts (e.g., immediate trigger upon critical machine breakdown)
- Escalation chains (e.g., alerting Plant Admin if a breakdown is unresolved for X hours)
- PM Reminders to technicians
- WhatsApp integration
- Microsoft Teams / Slack webhooks
- SMS alerts
- Push notifications via mobile application
