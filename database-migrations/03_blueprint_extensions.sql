-- ============================================================================
-- QUICK APPOINTMENTS — BLUEPRINT EXTENSIONS (SCHEMA EXPANSION)
-- Platform: Supabase (PostgreSQL 15+)
-- Description: Creates the 14 additional enterprise tables defined in the
--              Screen Flow & Implementation Blueprint.
-- ============================================================================

-- 1. Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    rating NUMERIC(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    tags TEXT, -- JSON array of tags: ["On time", "Professional"]
    comment TEXT,
    reply TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id);

-- 2. Coupons
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

-- 3. Refunds
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'PROCESSING', 'REFUNDED', 'FAILED')),
    gateway_refund_id VARCHAR(100),
    deadline TIMESTAMPTZ NOT NULL, -- 48 hours SLA deadline
    processed_at TIMESTAMPTZ,
    admin_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Payout Batches & Items
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

-- 5. Provider Bank Accounts
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

-- 6. Cities and City Categories
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

-- 7. Support Tickets & Messages
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

-- 8. Device Tokens (Push Notifications)
CREATE TABLE IF NOT EXISTS device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    device_type VARCHAR(20) DEFAULT 'ANDROID' CHECK (device_type IN ('ANDROID', 'IOS', 'WEB')),
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);

-- 9. Saved Addresses
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

-- 10. Provider Branches and Staff (Businesses)
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

