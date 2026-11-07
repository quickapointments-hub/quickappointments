-- ============================================================================
-- QUICK APPOINTMENTS — PRODUCTION SEED DATA SCRIPT
-- ============================================================================

DO $$
DECLARE
    v_admin_id UUID := gen_random_uuid();
    v_cat1_id UUID := gen_random_uuid();
    v_cat2_id UUID := gen_random_uuid();
    v_cat3_id UUID := gen_random_uuid();
    v_cat4_id UUID := gen_random_uuid();
    v_serv1_id UUID := gen_random_uuid();
    v_serv2_id UUID := gen_random_uuid();
    v_serv3_id UUID := gen_random_uuid();
    v_prov1_user_id UUID := gen_random_uuid();
    v_prov1_id UUID := gen_random_uuid();
    v_cust_user_id UUID := gen_random_uuid();
    v_cust_id UUID := gen_random_uuid();
    v_booking_id UUID := gen_random_uuid();
BEGIN

    -- 1. Create Super Administrator User
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

    -- 2. Insert 4 Launch Categories (Phase 6.4 Requirement)
    INSERT INTO categories (id, name, slug, description, display_order, is_active)
    VALUES 
    (v_cat1_id, 'Salon & Grooming', 'salon-grooming', 'Haircuts, beard detailing, luxury facial care & styling', 1, TRUE),
    (v_cat2_id, 'Healthcare & Wellness', 'healthcare-wellness', 'Certified doctors, physiotherapy, holistic therapy & nutrition', 2, TRUE),
    (v_cat3_id, 'Home Repairs & AC Services', 'home-repairs-ac', 'Master technicians for HVAC, electrical, plumbing & maintenance', 3, TRUE),
    (v_cat4_id, 'Auto Care & Detailing', 'auto-care-detailing', 'Professional foam wash, ceramic polish & mechanical tune-up', 4, TRUE)
    ON CONFLICT (slug) DO NOTHING;

    -- 3. Insert Catalog Services
    INSERT INTO services (id, category_id, name, slug, description, duration_minutes, base_price, is_active)
    VALUES
    (v_serv1_id, v_cat1_id, 'Executive Haircut & Beard Sculpt', 'executive-haircut-beard', 'Precision styling, beard shaping, hot towel & wash', 45, 499.00, TRUE),
    (v_serv2_id, v_cat1_id, 'Deep Cleanse Organic Facial', 'organic-facial', 'Pore cleansing, exfoliating peel and revitalizing mask', 60, 899.00, TRUE),
    (v_serv3_id, v_cat1_id, 'Bridal & Groom Complete Spa', 'bridal-groom-spa', 'Full body rejuvenating massage, scrub and glow treatment', 120, 2499.00, TRUE),
    
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

    -- 4. Insert Verified Provider
    INSERT INTO users (id, phone, full_name, is_active)
    VALUES (v_prov1_user_id, '+919876500001', 'Vikram Sethi', TRUE)
    ON CONFLICT (phone) DO NOTHING;

    INSERT INTO user_roles (user_id, role)
    VALUES (v_prov1_user_id, 'PROVIDER'), (v_prov1_user_id, 'CUSTOMER')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO provider_profiles (id, user_id, provider_type, business_name, city, address, verification_status, experience_years, rating_avg, rating_count, is_accepting_bookings)
    VALUES (v_prov1_id, v_prov1_user_id, 'BUSINESS', 'Studio Precision Salon', 'Mumbai', 'Shop 14, High Street Mall, Bandra West', 'APPROVED', 8, 4.90, 142, TRUE)
    ON CONFLICT (user_id) DO NOTHING;

    -- Provider KYC Documents
    INSERT INTO provider_documents (provider_id, document_type, document_number, file_url, is_verified)
    VALUES 
    (v_prov1_id, 'GOVERNMENT_ID', 'XXXX-XXXX-4512', 'https://ugxgtgvykauyydxoqouz.supabase.co/storage/v1/object/public/kyc-documents/sample_aadhaar.png', TRUE),
    (v_prov1_id, 'TRADE_LICENSE', 'TL-2024-8891', 'https://ugxgtgvykauyydxoqouz.supabase.co/storage/v1/object/public/kyc-documents/sample_license.png', TRUE);

    -- Provider Working Hours (Monday through Saturday 09:00 - 19:00, lunch 13:00 - 14:00, Sunday closed)
    INSERT INTO provider_working_hours (provider_id, day_of_week, open_time, close_time, break_start, break_end, is_closed)
    VALUES
    (v_prov1_id, 1, '09:00', '19:00', '13:00', '14:00', FALSE),
    (v_prov1_id, 2, '09:00', '19:00', '13:00', '14:00', FALSE),
    (v_prov1_id, 3, '09:00', '19:00', '13:00', '14:00', FALSE),
    (v_prov1_id, 4, '09:00', '19:00', '13:00', '14:00', FALSE),
    (v_prov1_id, 5, '09:00', '19:00', '13:00', '14:00', FALSE),
    (v_prov1_id, 6, '09:00', '19:00', '13:00', '14:00', FALSE),
    (v_prov1_id, 0, '09:00', '18:00', '13:00', '14:00', TRUE) -- Sunday closed
    ON CONFLICT (provider_id, day_of_week) DO NOTHING;

    -- Provider Service Link
    INSERT INTO provider_service_rates (provider_id, service_id, custom_price, is_active)
    VALUES (v_prov1_id, v_serv1_id, 499.00, TRUE)
    ON CONFLICT (provider_id, service_id) DO NOTHING;

    -- 5. Insert Sample Customer Profile
    INSERT INTO users (id, phone, full_name, is_active)
    VALUES (v_cust_user_id, '+919811122233', 'Pooja Verma', TRUE)
    ON CONFLICT (phone) DO NOTHING;

    INSERT INTO user_roles (user_id, role)
    VALUES (v_cust_user_id, 'CUSTOMER')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO customer_profiles (id, user_id, city, default_address)
    VALUES (v_cust_id, v_cust_user_id, 'Mumbai', 'Flat 402, Sea Breeze Apts, Bandra West')
    ON CONFLICT (user_id) DO NOTHING;

    -- 6. Insert Sample Confirmed Booking & Financial Ledger Split
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

    -- 7. Insert Default Platform Commission Setting (10%)
    INSERT INTO commission_settings (type, rate, is_active)
    VALUES ('PERCENTAGE', 10.00, TRUE);

END $$;
