-- ============================================================================
-- QUICK APPOINTMENTS — COMPLETE ALL-IN-ONE SUPABASE MIGRATION SCRIPT
-- Paste and run this script in your Supabase Project -> SQL Editor
-- Project ID: ugxgtgvykauyydxoqouz (Singapore ap-southeast-1)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: EXTENSIONS & TABLES (DDL)
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('CUSTOMER', 'PROVIDER', 'ADMIN', 'SUPERADMIN')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(50),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS provider_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100),
    file_url TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS provider_service_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    custom_price NUMERIC(10, 2),
    custom_duration INT,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(provider_id, service_id)
);

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
CREATE INDEX IF NOT EXISTS idx_slot_reservations_lookup 
ON slot_reservations(provider_id, date, start_time, is_released);

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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_date ON bookings(provider_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);

CREATE TABLE IF NOT EXISTS booking_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    reason TEXT,
    changed_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100),
    permissions VARCHAR(255) DEFAULT 'ALL',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- STEP 2: SEED DATA
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_admin_id UUID := gen_random_uuid();
    v_cat1_id UUID := gen_random_uuid();
    v_cat2_id UUID := gen_random_uuid();
    v_cat3_id UUID := gen_random_uuid();
    v_cat4_id UUID := gen_random_uuid();
    v_serv1_id UUID := gen_random_uuid();
    v_prov1_user_id UUID := gen_random_uuid();
    v_prov1_id UUID := gen_random_uuid();
    v_cust_user_id UUID := gen_random_uuid();
    v_cust_id UUID := gen_random_uuid();
    v_booking_id UUID := gen_random_uuid();
BEGIN
    -- SuperAdmin
    INSERT INTO users (id, phone, email, full_name, is_active)
    VALUES (v_admin_id, '+919999900001', 'admin@quickappointments.com', 'Super Administrator', TRUE)
    ON CONFLICT (phone) DO NOTHING;

    INSERT INTO user_roles (user_id, role)
    SELECT v_admin_id, 'ADMIN' WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_admin_id AND role = 'ADMIN');

    INSERT INTO user_roles (user_id, role)
    SELECT v_admin_id, 'SUPERADMIN' WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_admin_id AND role = 'SUPERADMIN');

    INSERT INTO admin_users (user_id, department, permissions)
    VALUES (v_admin_id, 'Executive Operations', 'ALL')
    ON CONFLICT (user_id) DO NOTHING;

    -- 4 Launch Categories
    INSERT INTO categories (id, name, slug, description, display_order, is_active)
    VALUES 
    (v_cat1_id, 'Salon & Grooming', 'salon-grooming', 'Haircuts, beard detailing, luxury facial care & styling', 1, TRUE),
    (v_cat2_id, 'Healthcare & Wellness', 'healthcare-wellness', 'Certified doctors, physiotherapy, holistic therapy & nutrition', 2, TRUE),
    (v_cat3_id, 'Home Repairs & AC Services', 'home-repairs-ac', 'Master technicians for HVAC, electrical, plumbing & maintenance', 3, TRUE),
    (v_cat4_id, 'Auto Care & Detailing', 'auto-care-detailing', 'Professional foam wash, ceramic polish & mechanical tune-up', 4, TRUE)
    ON CONFLICT (slug) DO NOTHING;

    -- Services
    INSERT INTO services (id, category_id, name, slug, description, duration_minutes, base_price, is_active)
    VALUES
    (v_serv1_id, v_cat1_id, 'Executive Haircut & Beard Sculpt', 'executive-haircut-beard', 'Precision styling, beard shaping, hot towel & wash', 45, 499.00, TRUE),
    (gen_random_uuid(), v_cat1_id, 'Deep Cleanse Organic Facial', 'organic-facial', 'Pore cleansing, exfoliating peel and revitalizing mask', 60, 899.00, TRUE),
    (gen_random_uuid(), v_cat1_id, 'Bridal & Groom Complete Spa', 'bridal-groom-spa', 'Full body rejuvenating massage, scrub and glow treatment', 120, 2499.00, TRUE),
    (gen_random_uuid(), v_cat2_id, 'General Physician Consultation', 'gp-consultation', 'Comprehensive diagnostic review, vital checks & prescriptions', 30, 599.00, TRUE),
    (gen_random_uuid(), v_cat2_id, 'Ergonomic Physiotherapy Session', 'ergonomic-physio', 'Targeted spine, neck and joint mobility therapy', 45, 799.00, TRUE),
    (gen_random_uuid(), v_cat2_id, 'Clinical Nutrition & Diet Consultation', 'nutrition-diet-plan', 'Metabolic evaluation, custom diet chart & follow-up', 40, 650.00, TRUE),
    (gen_random_uuid(), v_cat3_id, 'AC Comprehensive Deep Jet Service', 'ac-jet-service', 'Indoor & outdoor coil cleaning, pressure check & foam wash', 60, 699.00, TRUE),
    (gen_random_uuid(), v_cat3_id, 'Complete Home Electrical Safety Inspection', 'electrical-safety-check', 'Circuit breaker diagnosis, earthing test & appliance audit', 60, 450.00, TRUE),
    (gen_random_uuid(), v_cat3_id, 'Plumbing Leak Detection & Pipe Repair', 'plumbing-leak-repair', 'High-pressure line inspection, sealant & pipe replacement', 45, 399.00, TRUE),
    (gen_random_uuid(), v_cat4_id, '3-Layer Ceramic Coating & Paint Seal', 'ceramic-coating', 'Hydrophobic protection, machine polish & scratch minimization', 180, 4999.00, TRUE),
    (gen_random_uuid(), v_cat4_id, 'Interior Steam Clean & Odor Sterilization', 'interior-steam-clean', 'Upholstery shampooing, dashboard shine & ozone purification', 90, 1299.00, TRUE),
    (gen_random_uuid(), v_cat4_id, 'Complete 30-Point Vehicle Health Inspection', 'vehicle-health-check', 'Brakes, fluid, battery, OBD scanner & suspension check', 60, 799.00, TRUE)
    ON CONFLICT (slug) DO NOTHING;

    -- Provider
    INSERT INTO users (id, phone, full_name, is_active)
    VALUES (v_prov1_user_id, '+919876500001', 'Vikram Sethi', TRUE)
    ON CONFLICT (phone) DO NOTHING;

    INSERT INTO user_roles (user_id, role)
    VALUES (v_prov1_user_id, 'PROVIDER'), (v_prov1_user_id, 'CUSTOMER')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO provider_profiles (id, user_id, provider_type, business_name, city, address, verification_status, experience_years, rating_avg, rating_count, is_accepting_bookings)
    VALUES (v_prov1_id, v_prov1_user_id, 'BUSINESS', 'Studio Precision Salon', 'Mumbai', 'Shop 14, High Street Mall, Bandra West', 'APPROVED', 8, 4.90, 142, TRUE)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO provider_working_hours (provider_id, day_of_week, open_time, close_time, break_start, break_end, is_closed)
    VALUES
    (v_prov1_id, 1, '09:00', '19:00', '13:00', '14:00', FALSE),
    (v_prov1_id, 2, '09:00', '19:00', '13:00', '14:00', FALSE),
    (v_prov1_id, 3, '09:00', '19:00', '13:00', '14:00', FALSE),
    (v_prov1_id, 4, '09:00', '19:00', '13:00', '14:00', FALSE),
    (v_prov1_id, 5, '09:00', '19:00', '13:00', '14:00', FALSE),
    (v_prov1_id, 6, '09:00', '19:00', '13:00', '14:00', FALSE),
    (v_prov1_id, 0, '09:00', '18:00', '13:00', '14:00', TRUE)
    ON CONFLICT (provider_id, day_of_week) DO NOTHING;

    INSERT INTO provider_service_rates (provider_id, service_id, custom_price, is_active)
    VALUES (v_prov1_id, v_serv1_id, 499.00, TRUE)
    ON CONFLICT (provider_id, service_id) DO NOTHING;

    -- Customer & Confirmed Booking
    INSERT INTO users (id, phone, full_name, is_active)
    VALUES (v_cust_user_id, '+919811122233', 'Pooja Verma', TRUE)
    ON CONFLICT (phone) DO NOTHING;

    INSERT INTO user_roles (user_id, role)
    VALUES (v_cust_user_id, 'CUSTOMER')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO customer_profiles (id, user_id, city, default_address)
    VALUES (v_cust_id, v_cust_user_id, 'Mumbai', 'Flat 402, Sea Breeze Apts, Bandra West')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO bookings (
        id, booking_ref, customer_id, provider_id, service_id, status, 
        date, start_time, end_time, service_price, tax_amount, total_amount, 
        platform_commission, provider_earnings, payment_status, payment_method
    )
    VALUES (
        v_booking_id, 'QA-2026-0001', v_cust_id, v_prov1_id, v_serv1_id, 'CONFIRMED',
        CURRENT_DATE, '11:00', '12:00', 499.00, 25.00, 524.00,
        50.00, 474.00, 'PAID', 'CASH_ON_SERVICE'
    )
    ON CONFLICT (booking_ref) DO NOTHING;

    INSERT INTO provider_earnings (
        provider_id, booking_id, gross_amount, commission_rate, platform_fee, net_earnings, is_settled
    )
    VALUES (
        v_prov1_id, v_booking_id, 524.00, 10.00, 50.00, 474.00, FALSE
    )
    ON CONFLICT (booking_id) DO NOTHING;

    INSERT INTO commission_settings (type, rate, is_active)
    VALUES ('PERCENTAGE', 10.00, TRUE);
END $$;
