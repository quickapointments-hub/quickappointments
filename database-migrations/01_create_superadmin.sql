-- ============================================================================
-- QUICK APPOINTMENTS — PRODUCTION SUPERADMIN INITIALIZATION SCRIPT
-- Replace the placeholder details below with your official production admin details
-- ============================================================================

DO $$
DECLARE
    v_admin_id UUID := gen_random_uuid();
    -- EDIT THESE VALUES FOR YOUR OFFICIAL PRODUCTION ADMINISTRATOR:
    v_admin_phone VARCHAR(20)  := '+919999900001';             -- Your official phone number
    v_admin_email VARCHAR(255) := 'admin@quickappointments.com'; -- Your official email address
    v_admin_name  VARCHAR(150) := 'System Administrator';       -- Administrator full name
BEGIN
    -- 1. Create or verify User record
    INSERT INTO users (id, phone, email, full_name, is_active)
    VALUES (v_admin_id, v_admin_phone, v_admin_email, v_admin_name, TRUE)
    ON CONFLICT (phone) DO UPDATE 
        SET email = EXCLUDED.email, 
            full_name = EXCLUDED.full_name,
            is_active = TRUE
    RETURNING id INTO v_admin_id;

    -- 2. Grant ADMIN & SUPERADMIN Roles
    INSERT INTO user_roles (user_id, role)
    VALUES 
        (v_admin_id, 'ADMIN'),
        (v_admin_id, 'SUPERADMIN')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 3. Register Admin Profile
    INSERT INTO admin_users (user_id, department, permissions)
    VALUES (v_admin_id, 'Executive Administration', 'ALL')
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'SuperAdmin initialized successfully with ID: %', v_admin_id;
END $$;
