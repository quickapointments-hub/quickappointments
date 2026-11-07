-- ============================================================================
-- QUICK APPOINTMENTS — OFFICIAL LAUNCH SERVICE CATALOG (ZERO DUMMY DATA)
-- Sets up the 4 official launch categories and baseline service templates.
-- Contains ZERO dummy users, ZERO dummy providers, and ZERO test bookings.
-- ============================================================================

DO $$
DECLARE
    v_cat_salon UUID := gen_random_uuid();
    v_cat_health UUID := gen_random_uuid();
    v_cat_home UUID := gen_random_uuid();
    v_cat_auto UUID := gen_random_uuid();
BEGIN
    -- 1. Four Launch Categories
    INSERT INTO categories (id, name, slug, description, display_order, is_active)
    VALUES 
    (v_cat_salon, 'Salon & Grooming', 'salon-grooming', 'Haircuts, beard detailing, luxury facial care & styling', 1, TRUE),
    (v_cat_health, 'Healthcare & Wellness', 'healthcare-wellness', 'Certified doctors, physiotherapy, holistic therapy & nutrition', 2, TRUE),
    (v_cat_home, 'Home Repairs & AC Services', 'home-repairs-ac', 'Master technicians for HVAC, electrical, plumbing & maintenance', 3, TRUE),
    (v_cat_auto, 'Auto Care & Detailing', 'auto-care-detailing', 'Professional foam wash, ceramic polish & mechanical tune-up', 4, TRUE)
    ON CONFLICT (slug) DO UPDATE
        SET name = EXCLUDED.name,
            description = EXCLUDED.description,
            display_order = EXCLUDED.display_order,
            is_active = TRUE;

    -- Fetch active category UUIDs in case they already existed
    SELECT id INTO v_cat_salon FROM categories WHERE slug = 'salon-grooming';
    SELECT id INTO v_cat_health FROM categories WHERE slug = 'healthcare-wellness';
    SELECT id INTO v_cat_home FROM categories WHERE slug = 'home-repairs-ac';
    SELECT id INTO v_cat_auto FROM categories WHERE slug = 'auto-care-detailing';

    -- 2. Official Standard Master Services
    INSERT INTO services (category_id, name, slug, description, duration_minutes, base_price, is_active)
    VALUES
    -- Salon & Grooming
    (v_cat_salon, 'Executive Haircut & Beard Sculpt', 'executive-haircut-beard', 'Precision styling, beard shaping, hot towel & wash', 45, 499.00, TRUE),
    (v_cat_salon, 'Deep Cleanse Organic Facial', 'organic-facial', 'Pore cleansing, exfoliating peel and revitalizing mask', 60, 899.00, TRUE),
    (v_cat_salon, 'Bridal & Groom Complete Spa', 'bridal-groom-spa', 'Full body rejuvenating massage, scrub and glow treatment', 120, 2499.00, TRUE),

    -- Healthcare & Wellness
    (v_cat_health, 'General Physician Consultation', 'gp-consultation', 'Comprehensive diagnostic review, vital checks & prescriptions', 30, 599.00, TRUE),
    (v_cat_health, 'Ergonomic Physiotherapy Session', 'ergonomic-physio', 'Targeted spine, neck and joint mobility therapy', 45, 799.00, TRUE),
    (v_cat_health, 'Clinical Nutrition & Diet Consultation', 'nutrition-diet-plan', 'Metabolic evaluation, custom diet chart & follow-up', 40, 650.00, TRUE),

    -- Home Repairs & AC Services
    (v_cat_home, 'AC Comprehensive Deep Jet Service', 'ac-jet-service', 'Indoor & outdoor coil cleaning, pressure check & foam wash', 60, 699.00, TRUE),
    (v_cat_home, 'Complete Home Electrical Safety Inspection', 'electrical-safety-check', 'Circuit breaker diagnosis, earthing test & appliance audit', 60, 450.00, TRUE),
    (v_cat_home, 'Plumbing Leak Detection & Pipe Repair', 'plumbing-leak-repair', 'High-pressure line inspection, sealant & pipe replacement', 45, 399.00, TRUE),

    -- Auto Care & Detailing
    (v_cat_auto, '3-Layer Ceramic Coating & Paint Seal', 'ceramic-coating', 'Hydrophobic protection, machine polish & scratch minimization', 180, 4999.00, TRUE),
    (v_cat_auto, 'Interior Steam Clean & Odor Sterilization', 'interior-steam-clean', 'Upholstery shampooing, dashboard shine & ozone purification', 90, 1299.00, TRUE),
    (v_cat_auto, 'Complete 30-Point Vehicle Health Inspection', 'vehicle-health-check', 'Brakes, fluid, battery, OBD scanner & suspension check', 60, 799.00, TRUE)
    ON CONFLICT (slug) DO UPDATE
        SET name = EXCLUDED.name,
            description = EXCLUDED.description,
            duration_minutes = EXCLUDED.duration_minutes,
            base_price = EXCLUDED.base_price,
            is_active = TRUE;

    -- 3. Default Platform Commission Setting (10% standard)
    INSERT INTO commission_settings (type, rate, is_active)
    SELECT 'PERCENTAGE', 10.00, TRUE
    WHERE NOT EXISTS (SELECT 1 FROM commission_settings WHERE is_active = TRUE);

    RAISE NOTICE 'Official catalog and services configured successfully.';
END $$;
