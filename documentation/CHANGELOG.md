# QUICK APPOINTMENTS — CHANGELOG

## [1.0.0] - 2026-11-07
### Added
- **Design System**: Full chromatic token extraction from official Quick Appointments logo (`#65B32E` green, `#111114` charcoal).
- **Backend API**:
  - Express + TypeScript architecture with centralized error handling.
  - Prisma relational schema with foreign key integrity.
  - Multi-role JWT authentication and OTP verification engine.
  - Concurrency slot reservation mutex with 10-minute pessimistic lock.
  - Background `SlotCleanupWorker` for automatic expiry release.
  - HMAC-SHA256 Razorpay payment webhook processing with idempotency protection.
  - Automated platform fee splits and provider settlement ledger.
  - Admin KYC verification cockpit with immutable audit logs.
  - Supabase integration configured for project `ugxgtgvykauyydxoqouz` in `ap-southeast-1`.
- **Admin Web Console**:
  - Executive SaaS operations dashboard with gross volume and platform revenue metrics.
  - KYC document verification desk with 1-click approvals and rejection audit logs.
  - Dynamic category and service catalog manager.
  - Dynamic commission take-rate slider (10% default).
- **Customer & Provider Mobile App**:
  - Mobile device simulator frame with notch, status bar, and responsive full-width toggle.
  - Dual-mode architecture with one-tap Customer ⇄ Provider role switching.
  - Service discovery across 4 launch categories: Salon & Grooming, Healthcare & Wellness, Home Repairs & AC, Auto Care & Detailing.
  - Live slot picker excluding lunch breaks (13:00-14:00) and off-duty days.
  - Provider cockpit with live appointment queue and status transitions.

