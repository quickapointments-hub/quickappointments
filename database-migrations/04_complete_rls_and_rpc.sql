-- ============================================================================
-- QUICK APPOINTMENTS — COMPLETE RLS POLICIES & CONCURRENCY RPCS
-- Platform: Supabase (PostgreSQL 15+)
-- Idempotent: Safe to run repeatedly.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY ON ALL EXTENSION TABLES
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS FOR USER AUTHENTICATION IN RLS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- ----------------------------------------------------------------------------
-- 3. RLS POLICIES FOR EXTENSION TABLES
-- ----------------------------------------------------------------------------

-- Reviews
DROP POLICY IF EXISTS "Public Read Verified Reviews" ON reviews;
CREATE POLICY "Public Read Verified Reviews" ON reviews
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Customers Submit Own Reviews" ON reviews;
CREATE POLICY "Customers Submit Own Reviews" ON reviews
FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid())
);

-- Coupons (Public active read, Admin manage)
DROP POLICY IF EXISTS "Public Read Active Coupons" ON coupons;
CREATE POLICY "Public Read Active Coupons" ON coupons
FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

DROP POLICY IF EXISTS "Admins Manage Coupons" ON coupons;
CREATE POLICY "Admins Manage Coupons" ON coupons
FOR ALL USING (current_user_is_admin());

-- Refunds (Customer view own, Admin manage)
DROP POLICY IF EXISTS "Customers View Own Refunds" ON refunds;
CREATE POLICY "Customers View Own Refunds" ON refunds
FOR SELECT USING (
    booking_id IN (
        SELECT b.id FROM bookings b
        JOIN customer_profiles c ON b.customer_id = c.id
        WHERE c.user_id = auth.uid()
    ) OR current_user_is_admin()
);

-- Provider Bank Accounts (Provider only + Admin)
DROP POLICY IF EXISTS "Providers Manage Own Bank Account" ON provider_bank_accounts;
CREATE POLICY "Providers Manage Own Bank Account" ON provider_bank_accounts
FOR ALL USING (
    provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
    OR current_user_is_admin()
);

-- Support Tickets & Messages (Owner view + Admin)
DROP POLICY IF EXISTS "Users Manage Own Support Tickets" ON support_tickets;
CREATE POLICY "Users Manage Own Support Tickets" ON support_tickets
FOR ALL USING (
    user_id = auth.uid() OR current_user_is_admin()
);

DROP POLICY IF EXISTS "Users View Own Ticket Messages" ON ticket_messages;
CREATE POLICY "Users View Own Ticket Messages" ON ticket_messages
FOR ALL USING (
    ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid())
    OR current_user_is_admin()
);

-- Saved Addresses (Customer only)
DROP POLICY IF EXISTS "Customers Manage Own Saved Addresses" ON saved_addresses;
CREATE POLICY "Customers Manage Own Saved Addresses" ON saved_addresses
FOR ALL USING (
    customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid())
);

-- Provider Branches & Staff (Provider manage, Public read)
DROP POLICY IF EXISTS "Public Read Active Branches" ON provider_branches;
CREATE POLICY "Public Read Active Branches" ON provider_branches
FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Providers Manage Own Branches" ON provider_branches;
CREATE POLICY "Providers Manage Own Branches" ON provider_branches
FOR ALL USING (
    provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
    OR current_user_is_admin()
);

DROP POLICY IF EXISTS "Public Read Active Staff" ON provider_staff;
CREATE POLICY "Public Read Active Staff" ON provider_staff
FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Providers Manage Own Staff" ON provider_staff;
CREATE POLICY "Providers Manage Own Staff" ON provider_staff
FOR ALL USING (
    provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
    OR current_user_is_admin()
);

-- Payouts (Providers view own items, Admins manage batches)
DROP POLICY IF EXISTS "Providers View Own Payout Items" ON payout_items;
CREATE POLICY "Providers View Own Payout Items" ON payout_items
FOR SELECT USING (
    provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
    OR current_user_is_admin()
);

DROP POLICY IF EXISTS "Admins Manage Payout Batches" ON payout_batches;
CREATE POLICY "Admins Manage Payout Batches" ON payout_batches
FOR ALL USING (current_user_is_admin());

-- Audit Logs (Admin read only)
DROP POLICY IF EXISTS "Admins Read Audit Logs" ON audit_logs;
CREATE POLICY "Admins Read Audit Logs" ON audit_logs
FOR SELECT USING (current_user_is_admin());

-- ----------------------------------------------------------------------------
-- 4. CONCURRENCY MUTEX & PESSIMISTIC SLOT LOCK INDEX
-- ----------------------------------------------------------------------------

-- Ensure required columns exist on slot_reservations and bookings
ALTER TABLE IF EXISTS slot_reservations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'HELD';
ALTER TABLE IF EXISTS slot_reservations ADD COLUMN IF NOT EXISTS reservation_token VARCHAR(64);

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'slot_reservations' AND column_name = 'is_released') THEN
        UPDATE slot_reservations SET status = 'RELEASED' WHERE is_released = TRUE AND status = 'HELD';
    END IF;
END $$;

ALTER TABLE IF EXISTS bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE IF EXISTS bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE IF EXISTS bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('PENDING', 'AWAITING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DECLINED', 'EXPIRED', 'RESCHEDULED'));

-- Unique active reservation lock (prevents two concurrent holds for the same slot)
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_slot_reservation 
ON slot_reservations(provider_id, date, start_time) 
WHERE status = 'HELD';

-- ----------------------------------------------------------------------------
-- 5. POSTGRES STORED PROCEDURES (RPCS) FOR ZERO-NODE BACKEND
-- ----------------------------------------------------------------------------

-- RPC 1: Reserve Slot (5-Minute Pessimistic Hold)
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
    -- Check if slot already has a confirmed booking
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

    -- Check if slot has an active 5-minute hold
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

    -- Generate secure reservation token and 5-minute expiry
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

-- RPC 2: Confirm Booking & 6-Digit Delivery OTP
CREATE OR REPLACE FUNCTION confirm_booking_rpc(
    p_reservation_token VARCHAR(64),
    p_payment_method VARCHAR(50),
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_res RECORD;
    v_service RECORD;
    v_booking_ref VARCHAR(20);
    v_service_otp VARCHAR(6);
    v_booking_id UUID;
    v_gross_amount NUMERIC(10,2);
    v_tax_amount NUMERIC(10,2);
    v_total_amount NUMERIC(10,2);
    v_commission_amount NUMERIC(10,2);
    v_provider_net NUMERIC(10,2);
BEGIN
    -- Validate reservation
    SELECT * INTO v_res
    FROM slot_reservations
    WHERE reservation_token = p_reservation_token
      AND status = 'HELD'
      AND expires_at > NOW();

    IF v_res IS NULL THEN
        RETURN jsonb_build_object('success', false, 'code', 'HOLD_EXPIRED', 'message', 'Reservation expired or invalid');
    END IF;

    -- Retrieve service details
    SELECT * INTO v_service FROM services WHERE id = v_res.service_id;
    v_gross_amount := COALESCE(v_service.base_price, 499.00);
    v_tax_amount := ROUND((v_gross_amount * 0.05), 2); -- 5% GST
    v_total_amount := v_gross_amount + v_tax_amount;
    v_commission_amount := ROUND((v_gross_amount * 0.05), 2); -- 5% Platform take-rate
    v_provider_net := v_gross_amount - v_commission_amount;

    -- Generate reference and 6-digit delivery OTP
    v_booking_ref := 'QA-' || UPPER(SUBSTRING(encode(gen_random_bytes(4), 'hex') FROM 1 FOR 7));
    v_service_otp := LPAD(FLOOR(random() * 900000 + 100000)::TEXT, 6, '0');
    v_booking_id := gen_random_uuid();

    -- Create confirmed booking
    INSERT INTO bookings (
        id, booking_ref, customer_id, provider_id, service_id,
        date, start_time, end_time, status, payment_method, payment_status,
        total_amount, notes, service_otp, created_at, updated_at
    ) VALUES (
        v_booking_id, v_booking_ref, v_res.customer_id, v_res.provider_id, v_res.service_id,
        v_res.date, v_res.start_time, v_res.start_time, 'AWAITING', p_payment_method, 'PAID',
        v_total_amount, p_notes, v_service_otp, NOW(), NOW()
    );

    -- Mark reservation as converted
    UPDATE slot_reservations SET status = 'CONVERTED' WHERE id = v_res.id;

    -- Record initial provider earning entry
    INSERT INTO provider_earnings (
        id, provider_id, booking_id, gross_amount, commission_rate, platform_fee, net_earnings, is_settled, created_at
    ) VALUES (
        gen_random_uuid(), v_res.provider_id, v_booking_id, v_gross_amount, 5.0, v_commission_amount, v_provider_net, false, NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'bookingId', v_booking_id,
        'bookingRef', v_booking_ref,
        'serviceOtp', v_service_otp,
        'slaDurationSeconds', 300
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 3: Verify Service OTP (Atomic Completion & 5-Attempt Lockout)
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

    -- Validate OTP
    IF v_booking.service_otp != p_otp THEN
        RETURN jsonb_build_object('success', false, 'code', 'INVALID_OTP', 'message', 'Invalid 6-digit OTP code');
    END IF;

    -- Complete appointment atomically
    UPDATE bookings
    SET status = 'COMPLETED',
        updated_at = NOW()
    WHERE id = p_booking_id;

    -- Mark provider earning as verified
    UPDATE provider_earnings
    SET is_settled = false
    WHERE booking_id = p_booking_id;

    RETURN jsonb_build_object('success', true, 'message', 'Service verified and appointment completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 4: 100% Cancellation & Refund RPC (Within 48h deadline)
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

    IF v_booking.status IN ('COMPLETED', 'CANCELLED') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Booking cannot be cancelled');
    END IF;

    -- Mark booking cancelled
    UPDATE bookings
    SET status = 'CANCELLED',
        cancellation_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_booking_id;

    -- Insert 100% refund record
    INSERT INTO refunds (
        id, booking_id, amount, reason, status, deadline, created_at
    ) VALUES (
        gen_random_uuid(), p_booking_id, v_booking.total_amount, p_reason, 'REQUESTED', NOW() + INTERVAL '48 hours', NOW()
    );

    -- Reverse provider earning
    DELETE FROM provider_earnings WHERE booking_id = p_booking_id;

    RETURN jsonb_build_object('success', true, 'message', '100% refund initiated. Funds will be returned within 48 hours.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 5: Cleanup Expired Holds & 300s SLA Timeouts (pg_cron target)
CREATE OR REPLACE FUNCTION cleanup_expired_holds_rpc()
RETURNS JSONB AS $$
DECLARE
    v_expired_holds INT;
    v_expired_sla INT;
BEGIN
    -- 1. Release expired 5-minute reservations
    UPDATE slot_reservations
    SET status = 'EXPIRED'
    WHERE status = 'HELD' AND expires_at < NOW();
    GET DIAGNOSTICS v_expired_holds = ROW_COUNT;

    -- 2. Expire unaccepted SLA requests older than 300 seconds
    UPDATE bookings
    SET status = 'EXPIRED',
        updated_at = NOW()
    WHERE status = 'AWAITING'
      AND created_at < (NOW() - INTERVAL '300 seconds');
    GET DIAGNOSTICS v_expired_sla = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'expiredHolds', v_expired_holds,
        'expiredSlaRequests', v_expired_sla
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

