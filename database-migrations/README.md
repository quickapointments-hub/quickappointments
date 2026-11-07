# Quick Appointments — Production Database Setup (Zero Seed Data)

This directory contains the production database DDL schema, storage bucket configuration, and Row Level Security (RLS) policies for **PostgreSQL** and **Supabase**.

> **Note**: These scripts are 100% clean and contain **ZERO mock/seeded data** (no fake users, no test providers, and no demo bookings).

---

## 📁 Migration Files

| File | Description | Seed Data? |
|---|---|:---:|
| **[`run_supabase_migration.sql`](file:///e:/Bizools/Qucik%20Appoptiment/database-migrations/run_supabase_migration.sql)** | **Primary 1-Click Setup Script**: All 21 production tables, automatic `updated_at` triggers, performance indexes, Supabase storage buckets (`kyc-documents`, `service-images`, `avatars`), and RLS policies. | ❌ **0% (Pure Clean Setup)** |
| **[`01_init_schema.sql`](file:///e:/Bizools/Qucik%20Appoptiment/database-migrations/01_init_schema.sql)** | Clean DDL tables, relationships, constraints, indexes, and triggers. | ❌ **0% (Pure DDL)** |
| **[`02_supabase_storage_and_rls.sql`](file:///e:/Bizools/Qucik%20Appoptiment/database-migrations/02_supabase_storage_and_rls.sql)** | Supabase Storage buckets & Row Level Security policies. | ❌ **0% (Pure Security)** |

---

## 🚀 How to Run in Supabase (1-Click)

1. Open your **[Supabase Project Dashboard](https://supabase.com/dashboard/project/ugxgtgvykauyydxoqouz)**.
2. In the left navigation sidebar, click **SQL Editor**.
3. Click **New Query**.
4. Copy the entire contents of **[`run_supabase_migration.sql`](file:///e:/Bizools/Qucik%20Appoptiment/database-migrations/run_supabase_migration.sql)** and paste it into the editor.
5. Click **Run** (or press `Ctrl + Enter`).

All tables, triggers, storage buckets, and policies are created cleanly and immediately ready for production use.
