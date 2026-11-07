# QUICK APPOINTMENTS — PRODUCT REQUIREMENTS DOCUMENT (PRD)

## 1. System Goals & Functional Scope
- **Unified Identity**: Single phone-number account architecture supporting both Customer and Provider personas with instant role switching (`CUSTOMER` ⇄ `PROVIDER`).
- **Concurrency & Pessimistic Locks**: 10-minute temporary reservation lock preventing double bookings across simultaneous user requests.
- **Provider Working Hours Engine**: Discrete time slot matrix based on provider working hours, excluding lunch breaks (13:00 - 14:00) and off-duty days (e.g. Sundays).
- **KYC Verification Pipeline**: Identity documentation uploads (Aadhaar, Trade License) with administrative audit stamps before a provider is allowed to accept live appointments.
- **Financial Architecture**: Gross transaction breakdown, platform commission calculation (configurable via admin), net provider earnings ledger, and automated refund reversal.

