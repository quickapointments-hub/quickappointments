# QUICK APPOINTMENTS — AUTHENTICATION & MULTI-ROLE FLOW

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Customer / Provider)
    participant Client as Mobile App / Admin Web
    participant API as Backend Auth Module
    participant DB as Relational Database

    User->>Client: Enters mobile number (+91XXXXXXXXXX)
    Client->>API: POST /api/auth/otp/request
    API->>DB: Record OTP code with 10-minute expiry
    API-->>Client: 200 OK: OTP dispatched

    User->>Client: Enters 6-digit OTP
    Client->>API: POST /api/auth/otp/verify
    API->>DB: Verify OTP has not expired and mark isUsed = true
    alt User Does Not Exist
        API->>DB: Create User and assign initial role (CUSTOMER or PROVIDER)
    else User Exists
        API->>DB: Retrieve roles and existing profiles
    end
    API->>API: Sign JWT Access Token (7d) & Refresh Token (30d)
    API->>DB: Create UserSession record
    API-->>Client: 200 OK: Access Token, User Profile & activeRole

    Note over User,Client: Dual-Role Switching (Single Identity)
    User->>Client: Taps "Switch to Provider Mode"
    Client->>API: POST /api/auth/switch-role (targetRole = "PROVIDER")
    API->>DB: Ensure PROVIDER role exists on user profile
    API->>API: Issue updated JWT with activeRole = "PROVIDER"
    API-->>Client: 200 OK: New Access Token
    Client->>Client: Hot-reload navigation to Provider Cockpit
```

## Security Rules
1. **Single Account per Phone Number**: Duplicate user rows for the same phone number are blocked by database unique constraints.
2. **Short-Lived OTPs**: OTPs automatically expire after 10 minutes and cannot be reused (`isUsed = true`).
3. **Role Guards (RBAC)**: Administrative endpoints enforce `requireRole(['ADMIN', 'SUPERADMIN'])` on every request.

