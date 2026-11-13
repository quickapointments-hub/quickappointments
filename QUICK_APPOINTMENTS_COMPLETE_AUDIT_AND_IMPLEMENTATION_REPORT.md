# Quick Appointments – Complete Audit & Implementation Plan Report (Phase 1)

**Audit Scope:** Full-stack monorepo inspection (`packages/backend-api`, `packages/admin-web`, `packages/customer-provider-mobile`, `packages/shared-types`, `database-migrations/`) and live remote PostgreSQL/Storage inspection against `https://ugxgtgvykauyydxoqouz.supabase.co`.

---

## 1. Executive Architectural Diagnosis

Prior fixes left the platform in a **split-brain database and security state**:

1. **Split-Brain Persistence (Critical):**
   - `packages/backend-api/src/prisma.ts` forces `file:./dev.db` (SQLite) whenever `DATABASE_URL` starts with `file:` (currently configured as `file:./dev.db` in both root `.env` and `packages/backend-api/.env`).
   - Meanwhile, `packages/admin-web` and `packages/customer-provider-mobile` use Supabase PostgREST directly AND merge/fallback to the Express API. Customers or providers created in SQLite were invisible to direct Supabase queries, and records written directly to Supabase missed Express business rules (`slot_reservations`, audit logs, server-side status enforcement).
2. **Broken & Insecure RBAC / Authentication (Critical):**
   - Remote Supabase RLS policies from migrations `06_fix_users_and_customers_rls.sql` and `07_workflow_integrity_triggers_and_rls.sql` leave `users`, `customer_profiles`, `provider_profiles`, `provider_documents`, `bookings`, etc. readable/writable (`USING (true)`) via the public `anon` key.
   - `packages/backend-api/src/middleware/auth.ts` accepts static bypass tokens (`dev_admin_token`, `mock_admin_token`, `supabase_admin_token*`).
   - `packages/backend-api/src/services/authService.ts` does not verify `password_hash` on `adminLogin` and accepts `'123456'` hardcoded OTP fallback in all environments.
   - `POST/PATCH/DELETE` admin endpoints for `/api/admin/categories`, `/api/admin/services`, and `/api/admin/cities` in `packages/backend-api/src/server.ts` lack `authenticateToken` and `requireRole`.
   - Several provider routes (`/api/provider/bookings/:id/reject`, `/api/provider/onboard`, `/api/provider/earnings`, `/api/provider/reviews`, `/api/provider/branches`, `/api/provider/staff`, `/api/bookings/:id/verify-otp`, `/api/bookings/:id/status`) lack uniform server-side `verification_status === 'APPROVED'` and ownership enforcement.
3. **Database Schema Drift Between SQLite Prisma & Live Remote Supabase PostgreSQL:**
   - Live Supabase `notifications` uses column `message`, whereas `admin-web/src/api.ts` and mobile read/write `body`.
   - Live Supabase `audit_logs` uses `(user_id, entity_type, entity_id, details)`, whereas `admin-web/src/api.ts` inserts `(actor_id, target_type, target_id, metadata_json)`.
   - Live Supabase `bookings` lacks `service_otp`, `branch_id`, `staff_id`, and omits `'DECLINED'` / `'NO_SHOW'` in its SQL check constraint.
   - Live Supabase `user_roles` check constraint omits `'OPERATIONS_ADMIN'`, `'FINANCE_ADMIN'`, and `'SUPPORT_ADMIN'`.
   - Remote catalog tables (`provider_services`, `rate_cards`, `banners`, `support_ticket_messages`, `customer_addresses`) returned HTTP `404` (`PGRST205` — actual table names are `provider_service_rates` and `ticket_messages`, while banners/settings belong in `system_settings` or dedicated tables).
4. **Availability Time Format Crash:**
   - `packages/backend-api/src/services/availabilityService.ts` splits `openTime`/`closeTime` on `:` expecting 24-hour `HH:mm`, whereas mobile registration writes `'09:00 AM'` / `'09:00 PM'`, producing `NaN` slot calculations.
5. **Frontend `localStorage` & Mock Fallbacks:**
   - **Admin Web:**
     - `BannersPage.tsx` uses `localStorage` (`qa_banners`) + hardcoded defaults (zero DB persistence).
     - `SettingsPage.tsx` uses `localStorage` (`qa_booking_settings`, `qa_payment_settings`).
     - `NotificationsPage.tsx` reads/writes/deletes notifications in `localStorage` (`qa_notifications`).
     - `AdminProfilePage.tsx` saves profile edits only to `localStorage` (`qa_admin_user`) and does not persist password updates.
     - `admin-web/src/api.ts` falls back to `mock_admin_token` and `qa_admin_cities` / `qa_registered_users` in `localStorage`.
   - **Customer & Provider Mobile Web + RN (`App.tsx`):**
     - `CustomerProfileScreen.tsx` initializes hardcoded `'Pooja Verma'`, `'pooja.verma@example.com'`, and Mumbai street addresses.
     - `BookingModal.tsx` falls back to simulated local Razorpay (`pay_mock_*`) and hardcoded `'123456'` `serviceOtp`.
     - `ProviderAvailabilityScreen.tsx` manages local React state only without saving to or loading from the backend DB.
     - `CategoryProvidersScreen.tsx` filter returns `true` unconditionally at line 55, failing to filter providers by category.
     - Duplicate files exist at `src/screens/CustomerSupportScreen.tsx` and `src/screens/ProviderReviewsScreen.tsx` alongside the canonical `customer/` and `provider/` subfolder files.
     - React Native `App.tsx` still contains static `BK-1082` / `BK-9941` seed objects and hardcoded `'123456'` OTP demo behavior.

---

## 2. Live Remote Supabase Snapshot (Preserved Data)

Probed via `SUPABASE_SERVICE_ROLE_KEY` before making edits (must remain intact):
- `users`: 4 rows (`id, phone, email, full_name, password_hash, avatar_url, is_active, created_at, updated_at`)
- `user_roles`: 4 rows
- `customer_profiles`: 1 row
- `provider_profiles`: 2 rows (both `PENDING`: `0e75e48c-...` and `1c7835f5-...`)
- `provider_documents`: 1 row
- `categories`: 4 rows | `services`: 12 rows | `cities`: 4 rows
- `bookings`: 1 row | `coupons`: 1 row | `reviews`: 1 row | `support_tickets`: 1 row | `admin_users`: 1 row
- Storage Buckets: `kyc-documents` (`public: false`), `service-images` (`public: true`), `avatars` (`public: true`).

---

## 3. Master Remediation Architecture (Phases 2–14)

1. **Single Authoritative Database (Supabase PostgreSQL):**
   - Eliminate all runtime reads/writes to SQLite `dev.db` in `packages/backend-api`.
   - Build an authoritative Backend Supabase Repository (`packages/backend-api/src/db/supabaseDb.ts`) powered by `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, plus convert `prisma/schema.prisma` to `provider = "postgresql"` without a SQLite fallback in `src/prisma.ts`.
   - Author idempotent migration `database-migrations/08_single_source_hardening_and_schema_alignment.sql` aligning constraints, adding `bookings.service_otp` / `bookings.branch_id` / `bookings.staff_id` / `provider_profiles.gst_number` / `provider_profiles.pan_number`, fixing overly permissive anon RLS policies, and adding `banners` / `system_settings` structure.
2. **Backend API Security & Server-Side Enforcement:**
   - Install `helmet` and `express-rate-limit` (or implement robust rate-limiting middleware) on auth/OTP/payment/API endpoints.
   - Verify bcrypt `password_hash` on admin login (with safe first-boot seeded admin provisioning), remove static bypass tokens outside explicit `NODE_ENV === 'test'` test harnesses, disable `'123456'` hardcoded OTP bypass in production, require `authenticateToken` + `requireRole` on ALL `/api/admin/*` routes, and enforce `requireApprovedProvider` + ownership validation across ALL provider operations and endpoints.
   - Store uploaded KYC documents / premise photos / avatars inside **Supabase Storage** (`kyc-documents` private bucket, `avatars`/`service-images` public buckets) and return time-limited **Signed URLs** to authenticated Admins.
   - Enforce 12h/24h time normalization in `AvailabilityService` + atomic slot reservation conflict detection in Supabase PostgreSQL.
3. **Admin Panel 100% Backend-Backed + Realtime:**
   - Route all Admin operations (Auth, Metrics, Customers, Providers, Verification + Signed Document Preview, Categories/Services/Cities CRUD, Rate Cards, Bookings, Banners, Notifications Broadcast & Log, Financial Commission/Refunds/Payouts, Settings, Support Tickets, Admin Users, Audit Logs) through the authenticated Backend API + Supabase Realtime event invalidation.
   - Remove all `localStorage` business-state fallbacks and `mock_admin_token`.
4. **Customer & Provider Mobile (Web & React Native Parity):**
   - Align Mobile Web (`src/*`) and RN `App.tsx` with the Customer Home, Search, and All Categories designs shown in the UI references, powered by live Backend API + Supabase Realtime data.
   - Enforce real KYC document upload -> `PENDING` gate (`ProviderKycStatusScreen`) -> Admin Approval -> unlocked Cockpit (`ProviderDashboardScreen`, DB-persisted `ProviderAvailabilityScreen`, Branches, Staff, Earnings, Reviews).
   - Remove `Pooja Verma` / Mumbai mocks, mock Razorpay fallbacks, duplicate screen files, and unverified provider leaks.
5. **Cloud E2E Verification & Deliverables:**
   - Run TypeScript checks, production Vite builds, Expo config validation, and live Backend <-> Supabase PostgreSQL E2E tests (preserving all pre-existing data).
   - Produce all required Phase 14 reports grounded in observed code and test execution outputs.

