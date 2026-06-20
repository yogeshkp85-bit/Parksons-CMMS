# Authentication Design

This document details the authentication and identity strategy for the enterprise CMMS.

## Current Philosophy
The system utilizes a simple authentication methodology paired with Role-Based Access Control (RBAC). 
- Users authenticate using internal application credentials (Email/Password).
- Passwords will be securely hashed in the database.
- Authorization is governed strictly by the granular permission arrays mapped to the user's assigned role.

> [!IMPORTANT]
> The current design explicitly avoids designing around any specific corporate infrastructure.

---

## Future Enhancements
*Note: The following capabilities are planned for future phases when corporate infrastructure is provided. They will be implemented as additive auth strategies without breaking the local auth flow.*
- LDAP Integration
- Active Directory (AD) Integration
- Company SSO (SAML/OIDC)
- Multi-Factor Authentication (MFA)
- Enterprise JWT workflows with strictly managed Refresh Tokens
