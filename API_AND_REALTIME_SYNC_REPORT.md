# Quick Appointments — API & Real-Time Synchronization Report

**Date:** 2026-11-11
**Verification Scope:** Authoritative Backend Express REST API (`packages/backend-api`), PostgREST Data Access (`supabaseDb.ts`), Real-Time Sync Broadcasts, and Client API Clients

---

## 1. Single Authoritative API Path

All Admin (`packages/admin-web/src/api.ts`), Mobile Web (`packages/customer-provider-mobile/src/api.ts`), and React Native (`packages/customer-provider-mobile/App.tsx`) workflows route mutations and privileged reads exclusively through `packages/backend-api` (`/api/...`), which reads and writes solely against remote Supabase PostgreSQL (`SupabaseDb`) and Supabase Storage (`kyc-documents` / `avatars`).

- Removed SQLite runtime usage (`datasource db` set to `postgresql` in `packages/backend-api/prisma/schema.prisma`, `[Single-DB Policy]` guard in `packages/backend-api/src/prisma.ts` rejecting `file:` URLs).
- Eliminated client-side fake business state `localStorage` fallbacks (`qa_registered_users`, `qa_admin_cities`, `qa_banners`, `qa_notifications`, `qa_booking_settings`, `qa_payment_settings`).

---

## 2. Core API Endpoints Verified

| Group | Key Endpoints | Auth / Guard |
|---|---|---|
| Health & Catalog | `GET /api/health`, `GET /api/catalog/categories`, `GET /api/catalog/services`, `GET /api/catalog/cities`, `GET /api/banners`, `GET /api/providers`, `GET /api/providers/:id/slots` | Public (`APPROVED` + `is_accepting_bookings` enforced on providers) |
| Auth & Registration | `POST /api/auth/check-phone`, `/otp/request`, `/otp/verify`, `/register-customer`, `/register-provider`, `/switch-role`, `GET /api/auth/me` | `authRateLimiter` / `otpRateLimiter`, JWT on `/switch-role` & `/me` |
| Customer Profile & Bookings | `PUT /api/users/me`, `GET/POST/DELETE /api/customer/addresses*`, `POST /api/bookings/reserve`, `POST /api/bookings/confirm`, `GET /api/bookings/customer`, `POST /api/bookings/:id/cancel`, `/reschedule`, `/review` | `authenticateToken` |
| Provider Operations | `GET /api/provider/status`, `POST /api/provider/documents/upload`, `GET /api/provider/dashboard`, `GET /api/bookings/provider`, `PUT/GET /api/provider/availability`, `PATCH /api/provider/accepting-bookings`, `POST /api/bookings/:id/verify-otp` | `authenticateToken` + `requireRole([PROVIDER])` + `requireApprovedProvider` (except `/status` & `/documents/upload`) |
| Admin Governance | `POST /api/admin/auth/login`, `PATCH /profile`, `POST /change-password`, `GET /api/admin/providers`, `POST /api/admin/providers/:id/verify`, `GET /api/admin/documents/:docId/signed-url`, `GET/PATCH /api/admin/customers*`, `GET/POST/PATCH/DELETE /api/admin/banners*`, `GET/PUT /api/admin/settings*`, `GET /api/admin/audit-logs`, `GET /api/admin/bookings` | `authenticateToken` + `requireRole(...)` |

---

## 3. Schema Alignment Fixes Confirmed Against Live Supabase

1. **`system_settings.value` (`TEXT` vs `JSONB`) Compatibility:** Live Supabase stores `system_settings.value` as `TEXT`. Added `AdminService.parseSettingValue` & JSON string serialization in [`adminService.ts`](file:///e:/Bizools/Qucik%20Appoptiment/packages/backend-api/src/services/adminService.ts#L624-L660) and JSON parsing in [`bookingService.ts`](file:///e:/Bizools/Qucik%20Appoptiment/packages/backend-api/src/services/bookingService.ts#L122-L132) so both pre- and post-Migration-08 settings & banners persist cleanly.
2. **Reservation Token / UUID Resolution:** [`BookingService.confirmBooking`](file:///e:/Bizools/Qucik%20Appoptiment/packages/backend-api/src/services/bookingService.ts#L64-L72) resolves both `reservation_token` and UUID `id` on `slot_reservations`, matching what [`BookingModal.tsx`](file:///e:/Bizools/Qucik%20Appoptiment/packages/customer-provider-mobile/src/components/BookingModal.tsx#L172-L178) sends.
3. **`notifications.message` & `audit_logs` Schema:** Aligned backend inserts with live Supabase column names (`notifications.message`, `audit_logs.user_id/entity_type/entity_id/details`).

---

## 4. Real-Time Synchronization Architecture

- [`SupabaseDb.broadcastSync`](file:///e:/Bizools/Qucik%20Appoptiment/packages/backend-api/src/db/supabaseDb.ts) publishes mutations to the Supabase Realtime `quick-appointments-sync` channel (`customers_updated`, `providers_updated`, `PROVIDER_APPROVED`, `USER_UPDATED`, `bookings_updated`, `banners_updated`, `settings_updated`).
- [`AuthContext.tsx`](file:///e:/Bizools/Qucik%20Appoptiment/packages/customer-provider-mobile/src/context/AuthContext.tsx), [`ProviderDashboardScreen.tsx`](file:///e:/Bizools/Qucik%20Appoptiment/packages/customer-provider-mobile/src/screens/provider/ProviderDashboardScreen.tsx), [`CustomerHomeScreen.tsx`](file:///e:/Bizools/Qucik%20Appoptiment/packages/customer-provider-mobile/src/screens/customer/CustomerHomeScreen.tsx), and Admin [`App.tsx`](file:///e:/Bizools/Qucik%20Appoptiment/packages/admin-web/src/App.tsx) / `CustomersPage` / `VerificationPage` subscribe to `subscribeToSync` so updates propagate without polling or stale cache.

