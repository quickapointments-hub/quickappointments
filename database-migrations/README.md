# Quick Appointments — Database Migrations Guide

This directory contains the production database scripts for **PostgreSQL** and **Supabase**.

---

## 📁 Migration Files Overview

| File | Purpose | Contains Dummy Data? |
|---|---|:---:|
| **`run_supabase_migration.sql`** | **Primary 1-Click Setup Script**: Creates all 21 tables, triggers, indexes, Supabase storage buckets, and RLS policies. | ❌ **NO (100% Clean)** |
| **`00_clean_original_database_setup.sql`** | Standalone clean DDL schema script with automated `updated_at` triggers and indexes. | ❌ **NO (100% Clean)** |
| **`01_create_superadmin.sql`** | Initializes the official SuperAdmin user account with customized phone, email, and admin permissions. | ❌ **NO (Clean Template)** |
| **`02_clean_initial_categories.sql`** | Initializes the 4 official launch categories & standard service catalog. | ❌ **NO (Zero Mock Users/Bookings)** |
| `02_seed_data.sql` *(optional)* | Legacy demo test records (Vikram Sethi, Pooja Verma, demo bookings) for local test environments. | ⚠️ **Mock Data Only** |

---

## 🚀 How to Run in Supabase (1-Click)

1. Open your **[Supabase Project Dashboard](https://supabase.com/dashboard/project/ugxgtgvykauyydxoqouz)**.
2. In the left navigation menu, click **SQL Editor**.
3. Click **New Query**.
4. Open [run_supabase_migration.sql](file:///e:/Bizools/Qucik%20Appoptiment/database-migrations/run_supabase_migration.sql) and copy the entire contents.
5. Paste it into the SQL Editor and click **Run** (or press `Ctrl + Enter`).
6. All 21 production tables, triggers, storage buckets (`kyc-documents`, `service-images`, `avatars`), and RLS policies will be created cleanly.

---

## 👤 Initializing Your SuperAdmin (Optional)

To create your official administrator login:
1. Open [01_create_superadmin.sql](file:///e:/Bizools/Qucik%20Appoptiment/database-migrations/01_create_superadmin.sql).
2. Adjust `v_admin_phone`, `v_admin_email`, and `v_admin_name` to your own details.
3. Run the script in the Supabase SQL Editor.

---

## 🏷️ Initializing Categories & Services (Optional)

To populate the 4 official business categories (Salon & Grooming, Healthcare & Wellness, Home Repairs, Auto Care):
1. Open [02_clean_initial_categories.sql](file:///e:/Bizools/Qucik%20Appoptiment/database-migrations/02_clean_initial_categories.sql).
2. Run it in the Supabase SQL Editor.
