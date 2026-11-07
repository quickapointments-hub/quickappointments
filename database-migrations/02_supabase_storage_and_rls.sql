-- ============================================================================
-- QUICK APPOINTMENTS — SUPABASE STORAGE & ROW LEVEL SECURITY (RLS) POLICIES
-- Fully Idempotent: Can be run multiple times safely without 42710 errors.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE SUPABASE STORAGE BUCKETS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('kyc-documents', 'kyc-documents', false),
    ('service-images', 'service-images', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Public Reading of Service Images and Avatars
DROP POLICY IF EXISTS "Public Read Service Images" ON storage.objects;
CREATE POLICY "Public Read Service Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

DROP POLICY IF EXISTS "Public Read Avatars" ON storage.objects;
CREATE POLICY "Public Read Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated Users Upload Documents" ON storage.objects;
CREATE POLICY "Authenticated Users Upload Documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN ('kyc-documents', 'avatars') AND auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY (RLS) ON APPLICATION TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. RLS POLICIES FOR PUBLIC DATA (CATALOG & SERVICES)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public Read Active Categories" ON categories;
CREATE POLICY "Public Read Active Categories"
ON categories FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Public Read Active Services" ON services;
CREATE POLICY "Public Read Active Services"
ON services FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Public Read Approved Providers" ON provider_profiles;
CREATE POLICY "Public Read Approved Providers"
ON provider_profiles FOR SELECT
USING (verification_status = 'APPROVED' AND is_accepting_bookings = true);

DROP POLICY IF EXISTS "Public Read Provider Working Hours" ON provider_working_hours;
CREATE POLICY "Public Read Provider Working Hours"
ON provider_working_hours FOR SELECT
USING (true);

-- ----------------------------------------------------------------------------
-- 4. RLS POLICIES FOR CUSTOMERS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers Manage Own Profile" ON customer_profiles;
CREATE POLICY "Customers Manage Own Profile"
ON customer_profiles FOR ALL
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Customers View Own Bookings" ON bookings;
CREATE POLICY "Customers View Own Bookings"
ON bookings FOR SELECT
USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Customers Hold Slot Reservations" ON slot_reservations;
CREATE POLICY "Customers Hold Slot Reservations"
ON slot_reservations FOR ALL
USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- 5. RLS POLICIES FOR PROVIDERS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Providers View Assigned Bookings" ON bookings;
CREATE POLICY "Providers View Assigned Bookings"
ON bookings FOR SELECT
USING (provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Providers Manage Working Hours" ON provider_working_hours;
CREATE POLICY "Providers Manage Working Hours"
ON provider_working_hours FOR ALL
USING (provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Providers View Own Earnings" ON provider_earnings;
CREATE POLICY "Providers View Own Earnings"
ON provider_earnings FOR SELECT
USING (provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid()));
