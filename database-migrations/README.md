# Quick Appointments — Production Database Migrations

This directory contains the production database DDL schema, storage bucket configuration, and Row Level Security (RLS) policies for **PostgreSQL** and **Supabase**.

> **Note**: These migration scripts contain **ZERO mock/seeded data** (no fake users, no test providers, and no demo bookings).

---

## 📁 Migration Files & Execution Sequence

| Sequence | File | Description |
|---|---|---|
| **01** | **[`01_init_schema.sql`](file:///e:/Bizools/Qucik%20Appoptiment/database-migrations/01_init_schema.sql)** | Complete DDL schema: core tables (`users`, `customer_profiles`, `provider_profiles`, `categories`, `services`, `bookings`, `reviews`, `cities`, `coupons`, `support_tickets`, `admin_users`), constraints, foreign keys, triggers, and B-tree indexes. |
| **02** | **[`02_supabase_storage_and_rls.sql`](file:///e:/Bizools/Qucik%20Appoptiment/database-migrations/02_supabase_storage_and_rls.sql)** | Supabase Storage buckets (`kyc-documents`, `service-images`, `avatars`) and baseline Row Level Security (RLS) policies. |
| **03** | **[`03_blueprint_extensions.sql`](file:///e:/Bizools/Qucik%20Appoptiment/database-migrations/03_blueprint_extensions.sql)** | Blueprint schema additions: provider branches, staff assignments, custom rates, working hours, and commission tiers. |
| **04** | **[`04_complete_rls_and_rpc.sql`](file:///e:/Bizools/Qucik%20Appoptiment/database-migrations/04_complete_rls_and_rpc.sql)** | Production-grade security policies and atomic stored procedures (RPCs) for slot booking, race condition prevention, and provider verification. |
| **05** | **[`05_fix_category_and_services_rls.sql`](file:///e:/Bizools/Qucik%20Appoptiment/database-migrations/05_fix_category_and_services_rls.sql)** | Resolves PGRST116 (`Cannot coerce the result to a single JSON object`) by establishing full, reliable RLS policies for `categories` and `services`. |
| **06** | **[`06_fix_users_and_customers_rls.sql`](file:///e:/Bizools/Qucik%20Appoptiment/database-migrations/06_fix_users_and_customers_rls.sql)** | Resolves user registration not reflecting in admin panel by establishing public SELECT/INSERT/UPDATE policies for `users`, `user_roles`, `customer_profiles`, and `provider_profiles`. |
| **07** | **[`07_workflow_integrity_triggers_and_rls.sql`](file:///e:/Bizools/Qucik%20Appoptiment/database-migrations/07_workflow_integrity_triggers_and_rls.sql)** | Enforces `provider_profiles` `PENDING` + `is_accepting_bookings = FALSE` guard triggers, auto-generates `notifications` & `audit_logs` on status transitions, creates `check_phone_registered_rpc`, sets document/notification RLS policies, and enables Realtime publication. |
| **Archived** | **[`../no-need/database/run_supabase_migration.sql`](file:///e:/Bizools/Qucik%20Appoptiment/no-need/database/run_supabase_migration.sql)** | Archived monolithic 1-click bootstrap script moved to `no-need/database/`. |

---

## 🚀 How to Execute Migrations in Supabase

1. Open your **[Supabase Project Dashboard](https://supabase.com/dashboard/project/ugxgtgvykauyydxoqouz)**.
2. In the left navigation sidebar, click **SQL Editor**.
3. Execute migrations sequentially from `01` to `07`.
4. All tables, functions, triggers, storage buckets, and policies will be active and synchronized.
