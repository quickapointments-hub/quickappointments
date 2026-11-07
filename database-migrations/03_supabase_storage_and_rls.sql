-- ============================================================================
-- QUICK APPOINTMENTS — SUPABASE STORAGE & ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- 1. CREATE SUPABASE STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('kyc-documents', 'kyc-documents', false),
    ('service-images', 'service-images', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Public Reading of Service Images and Avatars
CREATE POLICY "Public Read Service Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

CREATE POLICY "Public Read Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated Users can upload documents
CREATE POLICY "Authenticated Users Upload Documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN ('kyc-documents', 'avatars') AND auth.role() = 'authenticated');

-- 2. ENABLE ROW LEVEL SECURITY (RLS) ON APPLICATION TABLES
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

-- 3. RLS POLICIES FOR PUBLIC DATA (CATALOG & SERVICES)
CREATE POLICY "Public Read Active Categories"
ON categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Public Read Active Services"
ON services FOR SELECT
USING (is_active = true);

CREATE POLICY "Public Read Approved Providers"
ON provider_profiles FOR SELECT
USING (verification_status = 'APPROVED' AND is_accepting_bookings = true);

CREATE POLICY "Public Read Provider Working Hours"
ON provider_working_hours FOR SELECT
USING (true);

-- 4. RLS POLICIES FOR CUSTOMERS
CREATE POLICY "Customers Manage Own Profile"
ON customer_profiles FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Customers View Own Bookings"
ON bookings FOR SELECT
USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Customers Hold Slot Reservations"
ON slot_reservations FOR ALL
USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));

-- 5. RLS POLICIES FOR PROVIDERS
CREATE POLICY "Providers View Assigned Bookings"
ON bookings FOR SELECT
USING (provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Providers Manage Working Hours"
ON provider_working_hours FOR ALL
USING (provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Providers View Own Earnings"
ON provider_earnings FOR SELECT
USING (provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid()));

-- 6. FULL SERVICE ROLE ACCESS (Used by Backend API & SuperAdmin)
-- The backend uses the SUPABASE_SERVICE_ROLE_KEY to coordinate concurrency locks and KYC verifications.
