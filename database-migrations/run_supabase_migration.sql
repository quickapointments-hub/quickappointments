-- ============================================================================
-- QUICK APPOINTMENTS — COMPLETE CLEAN SUPABASE PRODUCTION SETUP (ZERO SEED DATA)
-- Platform: Supabase (PostgreSQL 15+)
-- Project ID: ugxgtgvykauyydxoqouz (Singapore ap-southeast-1)
-- Description: Sets up all 21 production tables, auto-updated triggers,
--              concurrency indexes, Supabase storage buckets, and RLS security.
--              Contains ZERO dummy users, mock providers, or test bookings.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: EXTENSIONS & UTILITIES
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- STEP 2: CORE TABLES (DDL)
-- ----------------------------------------------------------------------------

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. User Roles
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('CUSTOMER', 'PROVIDER', 'ADMIN', 'SUPERADMIN')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- 3. OTP Verifications
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_lookup ON otp_verifications(phone, is_used);

-- 4. User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(50),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);

-- 5. Customer Profiles
CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    city VARCHAR(100),
    default_address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_customer_profiles_updated_at ON customer_profiles;
CREATE TRIGGER trg_customer_profiles_updated_at
BEFORE UPDATE ON customer_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Provider Profiles
CREATE TABLE IF NOT EXISTS provider_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_type VARCHAR(20) DEFAULT 'INDIVIDUAL' CHECK (provider_type IN ('INDIVIDUAL', 'BUSINESS')),
    business_name VARCHAR(200),
    tagline VARCHAR(255),
    bio TEXT,
    experience_years INT DEFAULT 1,
    rating_avg NUMERIC(3, 2) DEFAULT 5.00,
    rating_count INT DEFAULT 0,
    verification_status VARCHAR(30) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_INFO')),
    rejection_reason TEXT,
    is_accepting_bookings BOOLEAN DEFAULT TRUE,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    service_radius_km NUMERIC(5, 2) DEFAULT 20.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_provider_search ON provider_profiles(city, verification_status, is_accepting_bookings);

DROP TRIGGER IF EXISTS trg_provider_profiles_updated_at ON provider_profiles;
CREATE TRIGGER trg_provider_profiles_updated_at
BEFORE UPDATE ON provider_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Provider Documents (KYC)
CREATE TABLE IF NOT EXISTS provider_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100),
    file_url TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_provider_docs ON provider_documents(provider_id);

-- 8. Provider Working Hours & Breaks
CREATE TABLE IF NOT EXISTS provider_working_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time VARCHAR(10) NOT NULL,
    close_time VARCHAR(10) NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    break_start VARCHAR(10),
    break_end VARCHAR(10),
    UNIQUE(provider_id, day_of_week)
);
CREATE INDEX IF NOT EXISTS idx_working_hours ON provider_working_hours(provider_id, day_of_week);

-- 9. Categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    image_url TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Master Services
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INT DEFAULT 60,
    base_price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_services_cat ON services(category_id, is_active);

DROP TRIGGER IF EXISTS trg_services_updated_at ON services;
CREATE TRIGGER trg_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Provider Custom Service Rates
CREATE TABLE IF NOT EXISTS provider_service_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    custom_price NUMERIC(10, 2),
    custom_duration INT,
    approval_status VARCHAR(30) DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(provider_id, service_id)
);

-- Provider Branches (Pan-India scale)
CREATE TABLE IF NOT EXISTS provider_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    branch_name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    phone VARCHAR(20),
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_branches_provider ON provider_branches(provider_id);

-- Provider Multiple Staff Members
CREATE TABLE IF NOT EXISTS provider_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES provider_branches(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    role_title VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_provider ON provider_staff(provider_id);

-- 12. Concurrency Slot Reservations (10-minute hold mutex)
CREATE TABLE IF NOT EXISTS slot_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_released BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_slot_concurrency ON slot_reservations(provider_id, date, start_time, is_released);
CREATE INDEX IF NOT EXISTS idx_slot_expiry ON slot_reservations(expires_at, is_released);

-- 13. Master Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_ref VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE RESTRICT,
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    status VARCHAR(30) DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')),
    date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    notes TEXT,
    service_price NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    platform_commission NUMERIC(10, 2) DEFAULT 0.00,
    provider_earnings NUMERIC(10, 2) NOT NULL,
    payment_status VARCHAR(30) DEFAULT 'PAID' CHECK (payment_status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_method VARCHAR(50) DEFAULT 'CASH_ON_SERVICE',
    payment_ref VARCHAR(100),
    service_otp VARCHAR(10), -- 6-digit OTP for provider to start/complete service
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_schedule ON bookings(provider_id, date, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_cust ON bookings(customer_id);

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. Booking Status History
CREATE TABLE IF NOT EXISTS booking_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    reason TEXT,
    changed_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_history_booking ON booking_status_history(booking_id);

-- 15. Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(30) DEFAULT 'SUCCESS',
    gateway VARCHAR(50) DEFAULT 'RAZORPAY',
    gateway_tx_id VARCHAR(150) UNIQUE,
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pay_tx_booking ON payment_transactions(booking_id);

-- 16. Provider Earnings Ledger
CREATE TABLE IF NOT EXISTS provider_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE RESTRICT,
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    gross_amount NUMERIC(10, 2) NOT NULL,
    commission_rate NUMERIC(5, 2) NOT NULL,
    platform_fee NUMERIC(10, 2) NOT NULL,
    net_earnings NUMERIC(10, 2) NOT NULL,
    is_settled BOOLEAN DEFAULT FALSE,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_earnings_prov ON provider_earnings(provider_id);

-- 17. Commission Settings
CREATE TABLE IF NOT EXISTS commission_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(30) DEFAULT 'PERCENTAGE' CHECK (type IN ('PERCENTAGE', 'FIXED')),
    rate NUMERIC(5, 2) DEFAULT 5.00, -- 5% default platform commission
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES provider_profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);

-- 19. Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100),
    permissions VARCHAR(255) DEFAULT 'ALL',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- 21. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_system_settings_updated_at ON system_settings;
CREATE TRIGGER trg_system_settings_updated_at
BEFORE UPDATE ON system_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- STEP 3: SUPABASE STORAGE BUCKETS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('kyc-documents', 'kyc-documents', false),
    ('service-images', 'service-images', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

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
-- STEP 4: ROW LEVEL SECURITY (RLS)
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

-- Catalog Policies
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

-- Customer Policies
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

-- Provider Policies
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

-- ============================================================================
-- BLUEPRINT EXTENSIONS (14 ENTERPRISE TABLES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    rating NUMERIC(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    tags TEXT,
    comment TEXT,
    reply TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id);

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) DEFAULT 'PERCENTAGE' CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
    value NUMERIC(10,2) NOT NULL,
    min_order_amount NUMERIC(10,2) DEFAULT 0.0,
    max_discount_amount NUMERIC(10,2),
    usage_limit INT,
    used_count INT DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'PROCESSING', 'REFUNDED', 'FAILED')),
    gateway_refund_id VARCHAR(100),
    deadline TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ,
    admin_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payout_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_ref VARCHAR(50) UNIQUE NOT NULL,
    settlement_date DATE NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    provider_count INT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'GENERATED', 'PROCESSED', 'FAILED')),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payout_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES payout_batches(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    net_amount NUMERIC(10,2) NOT NULL,
    bank_account_ref VARCHAR(100),
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED')),
    bank_tx_ref VARCHAR(100),
    paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_payout_items_batch_id ON payout_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_provider_id ON payout_items(provider_id);

CREATE TABLE IF NOT EXISTS provider_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID UNIQUE NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    account_holder_name VARCHAR(150) NOT NULL,
    bank_name VARCHAR(150) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    state VARCHAR(100) NOT NULL,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS city_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT TRUE,
    CONSTRAINT uq_city_category UNIQUE(city_id, category_id)
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_ref VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID,
    category VARCHAR(50) NOT NULL CHECK (category IN ('DISPUTE', 'PAYMENT', 'CANCELLATION', 'GENERAL')),
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);

CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_role VARCHAR(30) NOT NULL CHECK (sender_role IN ('CUSTOMER', 'PROVIDER', 'ADMIN')),
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);

CREATE TABLE IF NOT EXISTS device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    device_type VARCHAR(20) DEFAULT 'ANDROID' CHECK (device_type IN ('ANDROID', 'IOS', 'WEB')),
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);

CREATE TABLE IF NOT EXISTS saved_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    label VARCHAR(50) DEFAULT 'Home',
    address_line TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(20),
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_addresses_customer_id ON saved_addresses(customer_id);

CREATE TABLE IF NOT EXISTS provider_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_provider_branches_provider_id ON provider_branches(provider_id);

CREATE TABLE IF NOT EXISTS provider_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES provider_branches(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    specialty VARCHAR(150),
    photo_url TEXT,
    working_days VARCHAR(100) DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_provider_staff_provider_id ON provider_staff(provider_id);

-- ============================================================================
-- STEP 5: COMPREHENSIVE RLS POLICIES & CONCURRENCY RPCS
-- ============================================================================

ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS provider_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS city_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS provider_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS provider_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('ADMIN', 'SUPERADMIN')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unique active reservation lock
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_slot_reservation 
ON slot_reservations(provider_id, date, start_time) 
WHERE status = 'HELD';

-- RPC: Reserve Slot (5-Minute Hold)
CREATE OR REPLACE FUNCTION reserve_slot_rpc(
    p_provider_id UUID,
    p_service_id UUID,
    p_customer_id UUID,
    p_date DATE,
    p_start_time VARCHAR(10)
)
RETURNS JSONB AS $$
DECLARE
    v_existing_booking UUID;
    v_existing_hold UUID;
    v_token VARCHAR(64);
    v_expires_at TIMESTAMPTZ;
    v_new_id UUID;
BEGIN
    SELECT id INTO v_existing_booking
    FROM bookings
    WHERE provider_id = p_provider_id
      AND date = p_date
      AND start_time = p_start_time
      AND status NOT IN ('CANCELLED', 'RELEASED', 'DECLINED', 'EXPIRED')
    LIMIT 1;

    IF v_existing_booking IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'code', 'SLOT_TAKEN', 'message', 'This slot is already booked');
    END IF;

    SELECT id INTO v_existing_hold
    FROM slot_reservations
    WHERE provider_id = p_provider_id
      AND date = p_date
      AND start_time = p_start_time
      AND status = 'HELD'
      AND expires_at > NOW()
    LIMIT 1;

    IF v_existing_hold IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'code', 'SLOT_HELD', 'message', 'Slot is temporarily held by another customer');
    END IF;

    v_token := encode(gen_random_bytes(24), 'hex');
    v_expires_at := NOW() + INTERVAL '5 minutes';
    v_new_id := gen_random_uuid();

    INSERT INTO slot_reservations (
        id, provider_id, service_id, customer_id, date, start_time,
        reservation_token, status, expires_at, created_at
    ) VALUES (
        v_new_id, p_provider_id, p_service_id, p_customer_id, p_date, p_start_time,
        v_token, 'HELD', v_expires_at, NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'reservationToken', v_token,
        'expiresAt', v_expires_at,
        'holdDurationSeconds', 300
    );
EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'code', 'SLOT_TAKEN', 'message', 'Contested slot was just reserved by another user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Verify Service OTP
CREATE OR REPLACE FUNCTION verify_service_otp_rpc(
    p_booking_id UUID,
    p_otp VARCHAR(6)
)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
BEGIN
    SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;

    IF v_booking IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Booking not found');
    END IF;

    IF v_booking.status = 'COMPLETED' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Booking is already completed');
    END IF;

    IF v_booking.service_otp != p_otp THEN
        RETURN jsonb_build_object('success', false, 'code', 'INVALID_OTP', 'message', 'Invalid 6-digit OTP code');
    END IF;

    UPDATE bookings
    SET status = 'COMPLETED',
        updated_at = NOW()
    WHERE id = p_booking_id;

    RETURN jsonb_build_object('success', true, 'message', 'Service verified and appointment completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: 100% Cancellation & Refund
CREATE OR REPLACE FUNCTION cancel_booking_refund_rpc(
    p_booking_id UUID,
    p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
BEGIN
    SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;

    IF v_booking IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Booking not found');
    END IF;

    UPDATE bookings
    SET status = 'CANCELLED',
        cancellation_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_booking_id;

    INSERT INTO refunds (
        id, booking_id, amount, reason, status, deadline, created_at
    ) VALUES (
        gen_random_uuid(), p_booking_id, v_booking.total_amount, p_reason, 'REQUESTED', NOW() + INTERVAL '48 hours', NOW()
    );

    DELETE FROM provider_earnings WHERE booking_id = p_booking_id;

    RETURN jsonb_build_object('success', true, 'message', '100% refund initiated.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

