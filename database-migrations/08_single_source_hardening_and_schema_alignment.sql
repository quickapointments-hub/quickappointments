-- ============================================================================
-- Migration 08: Single Source of Truth Hardening, Schema Alignment & RLS Lock
-- Idempotent / Zero-Data-Loss migration for Remote Supabase PostgreSQL
-- ============================================================================

-- 1. Bookings Schema Alignment (OTP verification + Branch/Staff tracking)
ALTER TABLE IF EXISTS public.bookings
  ADD COLUMN IF NOT EXISTS service_otp TEXT,
  ADD COLUMN IF NOT EXISTS branch_id UUID,
  ADD COLUMN IF NOT EXISTS staff_id UUID;

-- 2. Provider Profiles Compliance Metadata Alignment
ALTER TABLE IF EXISTS public.provider_profiles
  ADD COLUMN IF NOT EXISTS pan_number TEXT,
  ADD COLUMN IF NOT EXISTS gst_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_holder TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number_last4 TEXT,
  ADD COLUMN IF NOT EXISTS ifsc_code TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID;

-- 3. Provider Documents Review Metadata
ALTER TABLE IF EXISTS public.provider_documents
  ADD COLUMN IF NOT EXISTS rejection_note TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Expand user_roles CHECK constraint to support all Admin & Staff RBAC roles
DO $$
DECLARE
  c_name TEXT;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'public.user_roles'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%role%';
  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.user_roles DROP CONSTRAINT %I', c_name);
  END IF;
  ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_role_check
    CHECK (role IN ('CUSTOMER', 'PROVIDER', 'ADMIN', 'SUPERADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'));
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- 5. Expand bookings status CHECK constraint to include DECLINED & NO_SHOW
DO $$
DECLARE
  c_name TEXT;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'public.bookings'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';
  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.bookings DROP CONSTRAINT %I', c_name);
  END IF;
  ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_status_check
    CHECK (status IN ('PENDING', 'HELD', 'AWAITING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'SETTLED', 'CANCELLED', 'RELEASED', 'DECLINED', 'EXPIRED', 'RESCHEDULED', 'NO_SHOW'));
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- 6. Dedicated Promotional Banners Table (Replaces Admin localStorage qa_banners)
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  cta_text TEXT NOT NULL DEFAULT 'Book Now',
  image_url TEXT NOT NULL DEFAULT '',
  target_screen TEXT NOT NULL DEFAULT 'Search',
  target_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  city TEXT NOT NULL DEFAULT 'All Cities',
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Customer Saved Addresses Table
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  address_line TEXT NOT NULL,
  area TEXT,
  city TEXT NOT NULL,
  state TEXT,
  pincode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Seed Default System Settings (Idempotent — never overwrites existing values)
INSERT INTO public.system_settings (key, value, description)
VALUES
  (
    'booking_settings',
    '{"slotDurationMinutes":30,"maxAdvanceBookingDays":30,"minCancellationNoticeHours":2,"allowInstantBooking":true,"requireOtpVerification":true,"providerAcceptSlaMinutes":5}'::jsonb,
    'Platform booking, SLA, and OTP verification configuration'
  ),
  (
    'payment_settings',
    '{"platformCommissionPercent":15,"taxPercent":18,"minPayoutThreshold":500,"payoutCycle":"T+1","razorpayEnabled":true,"cashOnServiceEnabled":true}'::jsonb,
    'Platform commission, tax, payout, and payment method configuration'
  )
ON CONFLICT (key) DO NOTHING;

-- 9. Re-assert Provider Approval Trigger (Database-level anti-bypass safety net)
CREATE OR REPLACE FUNCTION public.enforce_provider_approval_rules()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status IS DISTINCT FROM 'APPROVED' THEN
    NEW.is_accepting_bookings := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_provider_approval ON public.provider_profiles;
CREATE TRIGGER trg_enforce_provider_approval
  BEFORE INSERT OR UPDATE ON public.provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_provider_approval_rules();

-- 10. Harden Row Level Security (Drop permissive anon "Allow All" rules)
-- Backend API uses SUPABASE_SERVICE_ROLE_KEY and bypasses RLS cleanly.
-- Direct anon REST access is strictly restricted to public discovery catalog data.

DO $$
DECLARE
  pol RECORD;
  tbl TEXT;
  target_tables TEXT[] := ARRAY[
    'users','user_roles','admin_users','customer_profiles','customer_addresses',
    'provider_profiles','provider_documents','provider_working_hours',
    'provider_branches','provider_staff','provider_service_rates','provider_earnings',
    'categories','services','cities','banners','coupons','bookings',
    'booking_status_history','slot_reservations','reviews','notifications',
    'audit_logs','support_tickets','ticket_messages','system_settings',
    'commission_settings','refunds','payout_batches','payout_items'
  ];
BEGIN
  FOREACH tbl IN ARRAY target_tables LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      FOR pol IN
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- Public Read-Only Policies (Catalog & Approved Providers only)
CREATE POLICY "Public read active categories" ON public.categories
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public read active services" ON public.services
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public read active cities" ON public.cities
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public read active banners" ON public.banners
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public read active coupons" ON public.coupons
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public read approved providers" ON public.provider_profiles
  FOR SELECT USING (verification_status = 'APPROVED' AND is_accepting_bookings = TRUE);

CREATE POLICY "Public read working hours of approved providers" ON public.provider_working_hours
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.provider_profiles p
      WHERE p.id = provider_working_hours.provider_id AND p.verification_status = 'APPROVED'
    )
  );

CREATE POLICY "Public read approved provider service rates" ON public.provider_service_rates
  FOR SELECT USING (is_active = TRUE AND approval_status = 'APPROVED');

CREATE POLICY "Public read reviews" ON public.reviews
  FOR SELECT USING (TRUE);

-- Note: Sensitive/PII tables (users, user_roles, admin_users, customer_profiles,
-- customer_addresses, provider_documents, bookings, notifications, audit_logs,
-- provider_earnings, support_tickets, system_settings, refunds, payout_batches)
-- have RLS enabled with NO anon/public policies, ensuring zero direct PostgREST
-- exposure while Express Backend (service_role) retains full authoritative access.
