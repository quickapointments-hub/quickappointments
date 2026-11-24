-- ============================================================================
-- Migration 09: Location Master & Admin-Controlled Location Registration
-- Idempotent / Zero-Data-Loss schema for remote Supabase PostgreSQL
-- ============================================================================

-- 1. Create Location Master Table
CREATE TABLE IF NOT EXISTS public.location_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast registration lookup and admin management
CREATE INDEX IF NOT EXISTS idx_location_master_pincode ON public.location_master(pincode);
CREATE INDEX IF NOT EXISTS idx_location_master_active ON public.location_master(is_active);
CREATE INDEX IF NOT EXISTS idx_location_master_city_state ON public.location_master(state, city);
CREATE INDEX IF NOT EXISTS idx_location_master_district ON public.location_master(district);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_location_master_updated_at ON public.location_master;
CREATE TRIGGER trg_location_master_updated_at
BEFORE UPDATE ON public.location_master
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Add location metadata columns to provider_profiles if missing
ALTER TABLE IF EXISTS public.provider_profiles
    ADD COLUMN IF NOT EXISTS pincode VARCHAR(10),
    ADD COLUMN IF NOT EXISTS state VARCHAR(100),
    ADD COLUMN IF NOT EXISTS district VARCHAR(100),
    ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India',
    ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.location_master(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_provider_profiles_pincode ON public.provider_profiles(pincode);

-- 3. Add location metadata columns to customer_profiles if missing
ALTER TABLE IF EXISTS public.customer_profiles
    ADD COLUMN IF NOT EXISTS pincode VARCHAR(10),
    ADD COLUMN IF NOT EXISTS state VARCHAR(100),
    ADD COLUMN IF NOT EXISTS district VARCHAR(100),
    ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India',
    ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.location_master(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customer_profiles_pincode ON public.customer_profiles(pincode);

-- 4. Enable RLS on location_master
ALTER TABLE public.location_master ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active locations" ON public.location_master;
CREATE POLICY "Public read active locations" ON public.location_master
    FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin full control on locations" ON public.location_master;
CREATE POLICY "Admin full control on locations" ON public.location_master
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('ADMIN', 'SUPERADMIN', 'OPERATIONS_ADMIN')
        )
    );
