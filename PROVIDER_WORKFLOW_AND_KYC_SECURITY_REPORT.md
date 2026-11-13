# Quick Appointments — Provider Workflow & KYC Security Verification Report

**Date:** 2026-11-11
**Verification Scope:** Provider Onboarding, Private KYC Storage Upload, Server-Side `APPROVED` Guard, Admin KYC Review Loop, Schedule & Earnings Synchronization

---

## 1. Provider Registration & Forced `PENDING` Enforcement

- **Backend Authoritative Registration ([`AuthService.registerProvider`](file:///e:/Bizools/Qucik%20Appoptiment/packages/backend-api/src/services/authService.ts#L373-L520)):**
  - Accepts business metadata, working days/hours, optional services, and KYC documents / premise photos.
  - Inserts/updates `users`, grants `PROVIDER` role in `user_roles`, creates or resets `provider_profiles` with server-enforced:
    - `verification_status = 'PENDING'`
    - `is_accepting_bookings = false`
  - Client apps cannot self-approve or force `is_accepting_bookings = true` during registration.
  - Both web (`mobileApi.registerProvider`) and React Native (`packages/customer-provider-mobile/App.tsx` `registerProviderInDb`) route through `/api/auth/register-provider` without direct unauthenticated client inserts into `users`/`provider_profiles`.

---

## 2. Private KYC Document & Premise Photo Storage

- KYC images/PDFs submitted as data URLs or multipart uploads (`POST /api/provider/documents/upload`) are stored via [`SupabaseDb.uploadFile`](file:///e:/Bizools/Qucik%20Appoptiment/packages/backend-api/src/db/supabaseDb.ts) in the private Supabase Storage bucket **`kyc-documents`**, rather than bloated raw base64 blobs inline inside PostgreSQL columns.
- Admin inspection retrieves short-lived signed URLs (3600s TTL) through `GET /api/admin/documents/:docId/signed-url` ([`server.ts`](file:///e:/Bizools/Qucik%20Appoptiment/packages/backend-api/src/server.ts#L1461-L1470)), protecting PII and government IDs (`AADHAAR_CARD`, `PAN_CARD`, `WORK_EXPERIENCE`, `PREMISE_PHOTO`).

---

## 3. Server-Side Approval Guard (`requireApprovedProvider`)

- Implemented [`requireApprovedProvider`](file:///e:/Bizools/Qucik%20Appoptiment/packages/backend-api/src/middleware/auth.ts#L76-L115), querying `provider_profiles` from PostgreSQL on every protected provider request.
- Any provider whose `verification_status !== 'APPROVED'` (`PENDING`, `UNDER_REVIEW`, `NEEDS_INFO`, `REJECTED`) receives HTTP `403` (`PROVIDER_NOT_APPROVED` or `PROVIDER_PROFILE_REQUIRED`) across:
  - `GET /api/provider/dashboard`
  - `GET /api/bookings/provider`
  - `POST /api/provider/bookings/:id/accept`, `/reject`, `PATCH /api/bookings/:id/status`, `POST /api/bookings/:id/verify-otp`
  - `GET` & `PUT /api/provider/availability`
  - `PATCH /api/provider/accepting-bookings`
  - `GET /api/provider/earnings`, `GET /api/provider/reviews`, `GET/POST /api/provider/branches`, `GET/POST /api/provider/staff`
- Furthermore, public provider discovery (`GET /api/providers`) excludes unapproved providers (`verification_status = 'APPROVED'` AND `is_accepting_bookings = true` required).

---

## 4. Admin KYC Lifecycle & Mobile Sync

- **Admin Review Actions (`POST /api/admin/providers/:id/verify`):**
  - `REQUEST_CLARITY` -> transitions status to `NEEDS_INFO`, stores Admin `rejection_reason`, writes `notifications` row for the provider, and logs to `audit_logs`.
  - `REJECT` -> transitions status to `REJECTED` with mandatory reason, sets `is_accepting_bookings = false`, sends notification & audit log.
  - `APPROVE` -> transitions status to `APPROVED`, enables `is_accepting_bookings = true`, broadcasts `PROVIDER_APPROVED` / `providers_updated`, notifies provider, and unlocks all `/api/provider/*` endpoints immediately.
- **Mobile Provider Screens:**
  - [`AuthContext.tsx`](file:///e:/Bizools/Qucik%20Appoptiment/packages/customer-provider-mobile/src/context/AuthContext.tsx) subscribes to `mobileApi.subscribeToSync` so `PROVIDER_APPROVED` / `USER_UPDATED` immediately calls `refreshProfile()`.
  - [`ProviderKycStatusScreen.tsx`](file:///e:/Bizools/Qucik%20Appoptiment/packages/customer-provider-mobile/src/screens/provider/ProviderKycStatusScreen.tsx) displays live status, Admin clarity/rejection notes, and notifications.
  - [`ProviderDashboardScreen.tsx`](file:///e:/Bizools/Qucik%20Appoptiment/packages/customer-provider-mobile/src/screens/provider/ProviderDashboardScreen.tsx) fetches `GET /api/provider/dashboard`, adds an authenticated Online/Offline toggle (`toggleProviderAcceptingBookings`), and enforces the approval gate cleanly.
  - [`ProviderAvailabilityScreen.tsx`](file:///e:/Bizools/Qucik%20Appoptiment/packages/customer-provider-mobile/src/screens/provider/ProviderAvailabilityScreen.tsx) loads and saves `provider_working_hours` via `GET/PUT /api/provider/availability`.

---

## 5. Live E2E Verification Results (Provider Scope)

Verified directly in live cloud E2E run (`scratch/verify_e2e_supabase.js`, exit code 0):
- Provider reg forces `verificationStatus=PENDING` & `isAcceptingBookings=false` (**PASS**)
- Appears immediately in `GET /api/admin/providers?status=PENDING` (**PASS**)
- Uploaded KYC doc retrieved in details + Storage signed URL generated (**PASS**)
- Hidden from public `GET /api/providers` while `PENDING` (**PASS**)
- Protected routes (`/dashboard`, `/bookings/provider`, `/availability`, `/earnings`, `/branches`, `/accepting-bookings`) return `403,403,403,403,403,403` while `PENDING` (**PASS**)
- `REQUEST_CLARITY` -> `NEEDS_INFO`; `APPROVE` -> `APPROVED` + public listing unlocked + working hours saved + wrong OTP rejected (`400`) + real server `serviceOtp` completes booking (`COMPLETED`) (**PASS**)

