-- ============================================================================
-- QUICK APPOINTMENTS — MIGRATION 06: USERS, ROLES & CUSTOMER PROFILES RLS
-- Platform: Supabase (PostgreSQL 15+)
-- Resolves: User registration not reflecting in admin panel due to RLS blocking
-- anonymous / unauthenticated inserts into users, user_roles, and customer_profiles.
-- ============================================================================

-- 1. USERS TABLE
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Public Select Users" ON users;
DROP POLICY IF EXISTS "Allow Public Insert Users" ON users;
DROP POLICY IF EXISTS "Allow Public Update Users" ON users;
DROP POLICY IF EXISTS "Allow All Select on Users" ON users;
DROP POLICY IF EXISTS "Allow All Insert on Users" ON users;
DROP POLICY IF EXISTS "Allow All Update on Users" ON users;

CREATE POLICY "Allow All Select on Users"
ON users FOR SELECT
USING (true);

CREATE POLICY "Allow All Insert on Users"
ON users FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow All Update on Users"
ON users FOR UPDATE
USING (true)
WITH CHECK (true);

-- 2. USER ROLES TABLE
ALTER TABLE IF EXISTS user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All Select on User Roles" ON user_roles;
DROP POLICY IF EXISTS "Allow All Insert on User Roles" ON user_roles;
DROP POLICY IF EXISTS "Allow All Update on User Roles" ON user_roles;

CREATE POLICY "Allow All Select on User Roles"
ON user_roles FOR SELECT
USING (true);

CREATE POLICY "Allow All Insert on User Roles"
ON user_roles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow All Update on User Roles"
ON user_roles FOR UPDATE
USING (true)
WITH CHECK (true);

-- 3. CUSTOMER PROFILES TABLE
ALTER TABLE IF EXISTS customer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers Manage Own Profile" ON customer_profiles;
DROP POLICY IF EXISTS "Allow All Select on Customer Profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Allow All Insert on Customer Profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Allow All Update on Customer Profiles" ON customer_profiles;

CREATE POLICY "Allow All Select on Customer Profiles"
ON customer_profiles FOR SELECT
USING (true);

CREATE POLICY "Allow All Insert on Customer Profiles"
ON customer_profiles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow All Update on Customer Profiles"
ON customer_profiles FOR UPDATE
USING (true)
WITH CHECK (true);

-- 4. PROVIDER PROFILES TABLE
ALTER TABLE IF EXISTS provider_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All Select on Provider Profiles" ON provider_profiles;
DROP POLICY IF EXISTS "Allow All Insert on Provider Profiles" ON provider_profiles;
DROP POLICY IF EXISTS "Allow All Update on Provider Profiles" ON provider_profiles;

CREATE POLICY "Allow All Select on Provider Profiles"
ON provider_profiles FOR SELECT
USING (true);

CREATE POLICY "Allow All Insert on Provider Profiles"
ON provider_profiles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow All Update on Provider Profiles"
ON provider_profiles FOR UPDATE
USING (true)
WITH CHECK (true);

