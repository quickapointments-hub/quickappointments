# Quick Appointments – Database Architecture & Migration Report (Phase 2)

## 1. Current vs Target Database Topology

| Layer | Previous (Split-Brain) | Target (Single Authoritative Source) |
|---|---|---|
| **Express Backend API (`packages/backend-api`)** | SQLite (`file:./dev.db`) via Prisma + partial `SupabaseStorageService` for catalog/cities | **100% Remote Supabase PostgreSQL & Storage** via `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (`src/db/supabaseDb.ts`); Prisma schema switched to `postgresql` with no SQLite fallback |
| **Admin Web (`packages/admin-web`)** | Mixed direct `supabase` anon client (with broken column names) + Express API + `localStorage` stores (`qa_banners`, `qa_notifications`, `qa_booking_settings`, `qa_payment_settings`, `qa_admin_cities`) | **Authenticated Express Backend API** (`Authorization: Bearer <JWT>`) for all privileged Admin reads/writes + **Supabase Realtime** (`postgres_changes` / broadcast) for instant UI refresh |
| **Mobile Web (`packages/customer-provider-mobile/src`)** | Mixed direct Supabase anon inserts + Express API + static screen fallbacks | **Express Backend API** for all business writes (registration, OTP, KYC Storage upload, availability, bookings, payments, support) + Supabase Realtime for live KYC & booking sync |
| **React Native (`packages/customer-provider-mobile/App.tsx`)** | Direct Supabase inserts bypassing Express validation + hardcoded `BK-1082` / `BK-9941` seed arrays + `123456` demo bypass | **Express Backend API** with real session tokens, live database queries, and Supabase Realtime synchronization |

---

## 2. Live Remote Schema Verification & Conflict Matrix

Inspection of remote Supabase (`https://ugxgtgvykauyydxoqouz.supabase.co`) confirmed the following live schema structure and mismatches:

| Table | Verified Remote Columns / Status | Conflict / Resolution |
|---|---|---|
| `notifications` | `id, user_id, type, title, message, data, is_read, created_at` | `admin-web/src/api.ts` and mobile previously queried `body`. All Backend/Frontend adapters normalized to PostgreSQL column **`message`**. |
| `audit_logs` | `id, user_id, action, entity_type, entity_id, details, ip_address, created_at` | `admin-web/src/api.ts` previously inserted `actor_id, target_type, target_id, metadata_json`. Unified strictly on PostgreSQL columns **`user_id, action, entity_type, entity_id, details, ip_address`**. |
| `provider_profiles` | `id, user_id, provider_type, business_name, tagline, bio, experience_years, rating_avg, rating_count, verification_status, rejection_reason, is_accepting_bookings, city, address, latitude, longitude, service_radius_km, created_at, updated_at` | Defaults verified via Migration 07 (`verification_status = 'PENDING'`, `is_accepting_bookings = false`). Migration 08 adds optional `gst_number`, `pan_number`, `bank_account_last4`, `ifsc_code`, `account_holder_name` metadata and strict trigger/check constraints. |
| `provider_working_hours` | `id, provider_id, day_of_week, open_time, close_time, break_start, break_end, is_closed` | Mobile onboarding writes `09:00 AM` strings while slot generator split on `:`. Added Backend canonical 24h `HH:mm` normalizer and strict persistence via `/api/provider/availability`. |
| `provider_service_rates` | Active table (`provider_services` does **not** exist) | All queries standardized on `provider_service_rates` (including `approval_status`, `custom_price`, `custom_duration_minutes`). |
| `bookings` | `id, booking_ref, customer_id, provider_id, service_id, status, date, start_time, end_time, notes, service_price, discount_amount, tax_amount, total_amount, platform_commission, provider_earnings, payment_status, payment_method, payment_ref, created_at, updated_at, cancellation_reason` | Missing `service_otp`, `branch_id`, `staff_id`, and `DECLINED`/`NO_SHOW` in `status` CHECK constraint. Added idempotently in Migration 08. |
| `user_roles` | `role` CHECK limited to `('CUSTOMER','PROVIDER','ADMIN','SUPERADMIN')` | Extended CHECK in Migration 08 to include `'OPERATIONS_ADMIN'`, `'FINANCE_ADMIN'`, `'SUPPORT_ADMIN'`. |
| `ticket_messages` | Exists (`support_ticket_messages` returned 404) | Backend & Admin standardized exclusively on `support_tickets` + `ticket_messages`. |
| `banners` / `system_settings` | `system_settings` exists (`key`, `value`, `description`, `updated_at`); `banners` table absent | Added `banners` table idempotently in Migration 08 AND backed Admin Settings (`booking_settings`, `payment_settings`, `commission_settings`) in `system_settings` (`key/value` JSONB). |
| `customer_addresses` | Returned 404 (`customer_profiles.default_address` exists) | Added `customer_addresses` table idempotently in Migration 08 (and synced primary address to `customer_profiles.default_address`). |
| **Storage Buckets** | `kyc-documents` (private), `service-images` (public), `avatars` (public) | Backend uses `SUPABASE_SERVICE_ROLE_KEY` to upload raw/compressed files into `kyc-documents/{providerId}/...` and generates short-lived signed URLs for authorized Admin review. |

---

## 3. Row-Level Security (RLS) Hardening Strategy

1. Previously applied migrations `06_fix_users_and_customers_rls.sql` and `07_workflow_integrity_triggers_and_rls.sql` opened `"Allow All ..."` `USING (true)` policies to anonymous REST callers (confirmed by live `HTTP 200` on `GET /rest/v1/users` and `GET /rest/v1/provider_profiles` with anon key).
2. Because this app uses OTP/JWT authentication issued by the Express Backend API rather than Supabase GoTrue `auth.uid()` sessions on every mobile request:
   - **Public Catalog Read-Only:** `categories`, `services`, `cities`, active `banners`, and `APPROVED` + `is_accepting_bookings = true` `provider_profiles` + public `reviews` may remain readable for discovery & Realtime change events.
   - **Privileged / PII Tables Locked Down:** `users`, `user_roles`, `admin_users`, `customer_profiles`, `provider_documents`, `bookings`, `provider_earnings`, `audit_logs`, `notifications`, `support_tickets`, `refunds`, `payout_batches`, `payout_items`, `system_settings` MUST deny anonymous direct PostgREST access once frontend packages route all mutations/private reads through the authenticated Express API (`SUPABASE_SERVICE_ROLE_KEY`).
   - Migration `08_single_source_hardening_and_schema_alignment.sql` provides clean, idempotent DDL + tightened RLS policies + atomic slot/booking protections ready to apply in Supabase SQL Editor.

---

## 4. Zero-Data-Loss Migration Plan

Existing remote rows (`4` users, `2` pending providers, `4` categories, `12` services, `4` cities, `1` customer profile, `1` booking, `1` coupon, `1` review, `1` support ticket, `1` admin user) will **NOT** be truncated or dropped. Migration 08 uses strictly `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS / ADD CONSTRAINT`, and `CREATE OR REPLACE FUNCTION/TRIGGER`.

