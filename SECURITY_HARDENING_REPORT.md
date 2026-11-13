# Quick Appointments — Security Hardening Report

**Date:** 2026-11-11
**Verification Scope:** Authentication, Authorization, Input Sanitization, Secret Isolation, Rate Limiting, and KYC Privacy Controls

---

## 1. Authentication & Secret Hardening

- **Removed Static Admin Backdoors:** Stripped `dev_admin_token`, `mock_admin_token`, and `supabase_admin_token` acceptance from backend middleware ([`auth.ts`](file:///e:/Bizools/Qucik%20Appoptiment/packages/backend-api/src/middleware/auth.ts)) and frontend admin clients (`packages/admin-web/src/api.ts`, `App.tsx`). All `/api/admin/*` endpoints now enforce cryptographic JWT verification (`jwt.verify`) and role authorization (`requireRole`).
- **Production JWT Policy:** [`auth.ts`](file:///e:/Bizools/Qucik%20Appoptiment/packages/backend-api/src/middleware/auth.ts#L9-L11) enforces `JWT_SECRET` length >= 32 characters when `NODE_ENV === 'production'`.
- **Admin Password Verification:** [`AuthService.adminLogin`](file:///e:/Bizools/Qucik%20Appoptiment/packages/backend-api/src/services/authService.ts#L739-L808) validates `password_hash` via `bcryptjs.compare` and performs a one-time hashed upgrade for the legacy seeded null-hash admin account. Wrong passwords return HTTP `401`.
- **OTP & Service OTP Security:**
  - Customer/Provider login OTPs are generated via `crypto.randomInt(100000, 1000000)` with 5-minute TTL and 5-attempt lockout; static `'123456'` client bypasses were removed across Web & React Native (`App.tsx`, `AuthContext.tsx`, `BookingModal.tsx`).
  - Booking completion `serviceOtp` is generated server-side with `crypto.randomInt` (`BookingService.confirmBooking`), never hardcoded on the client, and verified strictly on the server with provider ownership verification (`POST /api/bookings/:id/verify-otp`).

---

## 2. Role & Approval Access Controls

- **Provider Approval Gate ([`requireApprovedProvider`](file:///e:/Bizools/Qucik%20Appoptiment/packages/backend-api/src/middleware/auth.ts#L76-L115)):** Queries `provider_profiles.verification_status` directly from PostgreSQL and rejects non-approved providers (`PENDING`, `UNDER_REVIEW`, `NEEDS_INFO`, `REJECTED`) with HTTP `403 PROVIDER_NOT_APPROVED`.
- **Booking Ownership Checks:** Customers can only confirm/cancel/reschedule/review their own bookings; providers can only accept/reject/verify-otp on bookings assigned to their `providerProfile.id`.
- **Service Role Key Isolation:** `SUPABASE_SERVICE_ROLE_KEY` is restricted exclusively to `packages/backend-api`; neither `packages/admin-web` nor `packages/customer-provider-mobile` contains or uses the service role key.

---

## 3. Transport, Input Sanitization & Rate Limiting ([`security.ts`](file:///e:/Bizools/Qucik%20Appoptiment/packages/backend-api/src/middleware/security.ts))

- **Security Headers (`securityHeaders`):** Sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`, and removes `X-Powered-By`.
- **Request Body Sanitizer (`sanitizeRequestBody`):** Strips null/control bytes and `<script>` tags while safely preserving legitimate `data:` image URLs, and blocks prototype pollution keys (`__proto__`, `constructor`, `prototype`).
- **Rate Limiters (`createRateLimiter`):** Protects `authRateLimiter` and `otpRateLimiter` routes by client IP bucket and emits standard `Retry-After` + HTTP `429 RATE_LIMITED`.

---

## 4. KYC Storage Privacy & RLS Alignment

- KYC files and workplace photos upload into private Supabase Storage bucket **`kyc-documents`**, accessible to Admins only via server-issued short-lived signed URLs (`GET /api/admin/documents/:docId/signed-url`).
- [`08_single_source_hardening_and_schema_alignment.sql`](file:///e:/Bizools/Qucik%20Appoptiment/database-migrations/08_single_source_hardening_and_schema_alignment.sql) defines hardened RLS policies restricting public anonymous reads to catalog/active-cities/approved-providers while locking user PII tables (`users`, `customer_profiles`, `provider_documents`, `bookings`, `audit_logs`) behind service-role / owner access.

