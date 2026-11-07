-- ============================================================================
-- QUICK APPOINTMENTS — ORIGINAL CLEAN PRODUCTION DATABASE SETUP (ZERO SEED DATA)
-- Platform: PostgreSQL 14+ / Supabase
-- Target Database: Production Ready
-- Note: Contains 100% pure schema DDL, indexes, triggers, storage buckets & RLS.
--       Contains ZERO mock/seeded records.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. AUTOMATIC TIMESTAMP TRIGGER FUNCTION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. USERS, AUTHENTICATION & ACCESS CONTROL
-- ----------------------------------------------------------------------------

-- Main User Account
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

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User Roles (Normalized: CUSTOMER, PROVIDER, ADMIN, SUPERADMIN)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('CUSTOMER', 'PROVIDER', 'ADMIN', 'SUPERADMIN')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- OTP Verifications (Mobile Auth)
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone_used ON otp_verifications(phone, is_used);

-- Active User Sessions & Refresh Tokens
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(50),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);

-- ----------------------------------------------------------------------------
-- 4. CUSTOMER & PROVIDER PROFILES
-- ----------------------------------------------------------------------------

-- Customer Profile
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

CREATE TRIGGER trg_customer_profiles_updated_at
BEFORE UPDATE ON customer_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Provider Profile & Business Details
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
CREATE INDEX IF NOT EXISTS idx_provider_verification ON provider_profiles(verification_status, is_accepting_bookings);
CREATE INDEX IF NOT EXISTS idx_provider_location ON provider_profiles(city, latitude, longitude);

CREATE TRIGGER trg_provider_profiles_updated_at
BEFORE UPDATE ON provider_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Provider KYC Documents (Aadhaar, PAN, Licenses)
CREATE TABLE IF NOT EXISTS provider_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- 'AADHAAR', 'PAN', 'TRADE_LICENSE', etc.
    document_number VARCHAR(100),
    file_url TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_provider_documents_provider ON provider_documents(provider_id);

-- Provider Weekly Working Schedule & Breaks
CREATE TABLE IF NOT EXISTS provider_working_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 1=Mon ... 6=Sat
    open_time VARCHAR(10) NOT NULL, -- '09:00'
    close_time VARCHAR(10) NOT NULL, -- '19:00'
    is_closed BOOLEAN DEFAULT FALSE,
    break_start VARCHAR(10), -- '13:00'
    break_end VARCHAR(10), -- '14:00'
    UNIQUE(provider_id, day_of_week)
);
CREATE INDEX IF NOT EXISTS idx_working_hours_lookup ON provider_working_hours(provider_id, day_of_week);

-- ----------------------------------------------------------------------------
-- 5. SERVICE CATALOG & PRICING
-- ----------------------------------------------------------------------------

-- Categories
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
CREATE INDEX IF NOT EXISTS idx_categories_active_order ON categories(is_active, display_order);

CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Master Services
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
CREATE INDEX IF NOT EXISTS idx_services_category_active ON services(category_id, is_active);

CREATE TRIGGER trg_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Provider-Specific Custom Rates & Durations
CREATE TABLE IF NOT EXISTS provider_service_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    custom_price NUMERIC(10, 2),
    custom_duration INT,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(provider_id, service_id)
);
CREATE INDEX IF NOT EXISTS idx_provider_rates ON provider_service_rates(provider_id, service_id);

-- ----------------------------------------------------------------------------
-- 6. CONCURRENCY MUTEX & 10-MINUTE SLOT RESERVATIONS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS slot_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL, -- '10:00'
    end_time VARCHAR(10) NOT NULL, -- '11:00'
    expires_at TIMESTAMPTZ NOT NULL,
    is_released BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_slot_reservations_concurrency 
ON slot_reservations(provider_id, date, start_time, is_released);
CREATE INDEX IF NOT EXISTS idx_slot_reservations_expiry 
ON slot_reservations(expires_at, is_released);

-- ----------------------------------------------------------------------------
-- 7. MASTER BOOKINGS & TRANSACTIONS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_ref VARCHAR(50) UNIQUE NOT NULL, -- 'QA-2026-XXXX'
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_schedule ON bookings(provider_id, date, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_history ON bookings(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Booking State Change Audit Log
CREATE TABLE IF NOT EXISTS booking_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    reason TEXT,
    changed_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_booking_history ON booking_status_history(booking_id, created_at);

-- Payment Transactions (Razorpay / Online Gateways)
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
CREATE INDEX IF NOT EXISTS idx_payment_tx_booking ON payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_gateway ON payment_transactions(gateway_tx_id);

-- Provider Financial Ledger & Commission Earnings
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
CREATE INDEX IF NOT EXISTS idx_provider_earnings_provider ON provider_earnings(provider_id, is_settled);

-- ----------------------------------------------------------------------------
-- 8. ADMINISTRATION, COMMISSIONS & SYSTEM AUDITING
-- ----------------------------------------------------------------------------

-- Dynamic Commission Engine Settings
CREATE TABLE IF NOT EXISTS commission_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(30) DEFAULT 'PERCENTAGE' CHECK (type IN ('PERCENTAGE', 'FIXED')),
    rate NUMERIC(5, 2) DEFAULT 10.00,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES provider_profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push & In-App Notifications
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
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Admin User Profiles & Access Rights
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100),
    permissions VARCHAR(255) DEFAULT 'ALL',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enterprise Audit Logs
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
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- System Key-Value Configuration Store
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_system_settings_updated_at
BEFORE UPDATE ON system_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 9. SUPABASE STORAGE BUCKETS (Document & Image Infrastructure)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('kyc-documents', 'kyc-documents', false),
    ('service-images', 'service-images', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies: Public reading of Service Images and Avatars
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Service Images'
    ) THEN
        CREATE POLICY "Public Read Service Images"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'service-images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Avatars'
    ) THEN
        CREATE POLICY "Public Read Avatars"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'avatars');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Users Upload Documents'
    ) THEN
        CREATE POLICY "Authenticated Users Upload Documents"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id IN ('kyc-documents', 'avatars') AND auth.role() = 'authenticated');
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
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

DO $$
BEGIN
    -- Public Read Catalogs & Approved Providers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Active Categories') THEN
        CREATE POLICY "Public Read Active Categories" ON categories FOR SELECT USING (is_active = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Active Services') THEN
        CREATE POLICY "Public Read Active Services" ON services FOR SELECT USING (is_active = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Approved Providers') THEN
        CREATE POLICY "Public Read Approved Providers" ON provider_profiles FOR SELECT 
        USING (verification_status = 'APPROVED' AND is_accepting_bookings = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Provider Working Hours') THEN
        CREATE POLICY "Public Read Provider Working Hours" ON provider_working_hours FOR SELECT USING (true);
    END IF;

    -- Customer Profile & Booking Security
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Customers Manage Own Profile') THEN
        CREATE POLICY "Customers Manage Own Profile" ON customer_profiles FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Customers View Own Bookings') THEN
        CREATE POLICY "Customers View Own Bookings" ON bookings FOR SELECT 
        USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Customers Hold Slot Reservations') THEN
        CREATE POLICY "Customers Hold Slot Reservations" ON slot_reservations FOR ALL 
        USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
    END IF;

    -- Provider Security
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Providers View Assigned Bookings') THEN
        CREATE POLICY "Providers View Assigned Bookings" ON bookings FOR SELECT 
        USING (provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Providers Manage Working Hours') THEN
        CREATE POLICY "Providers Manage Working Hours" ON provider_working_hours FOR ALL 
        USING (provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Providers View Own Earnings') THEN
        CREATE POLICY "Providers View Own Earnings" ON provider_earnings FOR SELECT 
        USING (provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid()));
    END IF;
END $$;
