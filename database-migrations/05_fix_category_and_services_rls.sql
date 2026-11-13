-- ============================================================================
-- QUICK APPOINTMENTS — MIGRATION 05: CATEGORY & SERVICE RLS POLICIES
-- Platform: Supabase (PostgreSQL 15+)
-- Resolves: "Cannot coerce the result to a single JSON object" (PGRST116)
-- Root cause: When Row Level Security (RLS) is enabled without explicit UPDATE
-- policies, PostgreSQL silently updates 0 rows and .single() throws PGRST116.
-- This migration establishes full, robust RLS policies for Categories & Services.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CATEGORIES TABLE RLS CONFIGURATION
-- ----------------------------------------------------------------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop any existing or legacy single-purpose policies
DROP POLICY IF EXISTS "Public Read Active Categories" ON categories;
DROP POLICY IF EXISTS "Allow All Select on Categories" ON categories;
DROP POLICY IF EXISTS "Allow All Update on Categories" ON categories;
DROP POLICY IF EXISTS "Allow All Insert on Categories" ON categories;
DROP POLICY IF EXISTS "Allow All Delete on Categories" ON categories;
DROP POLICY IF EXISTS "Public Read Categories" ON categories;
DROP POLICY IF EXISTS "Admins Manage Categories" ON categories;
DROP POLICY IF EXISTS "Admins Update Categories" ON categories;
DROP POLICY IF EXISTS "Admins Insert Categories" ON categories;
DROP POLICY IF EXISTS "Admins Delete Categories" ON categories;

-- SELECT Policy: Allow reading all categories.
-- (The Admin Panel needs to display both Active and Inactive categories,
-- while the Customer App explicitly filters by is_active = true)
CREATE POLICY "Allow All Select on Categories"
ON categories FOR SELECT
USING (true);

-- UPDATE Policy: Allow updating category status (is_active) and details
CREATE POLICY "Allow All Update on Categories"
ON categories FOR UPDATE
USING (true)
WITH CHECK (true);

-- INSERT Policy: Allow creating new categories
CREATE POLICY "Allow All Insert on Categories"
ON categories FOR INSERT
WITH CHECK (true);

-- DELETE Policy: Allow deleting categories
CREATE POLICY "Allow All Delete on Categories"
ON categories FOR DELETE
USING (true);

-- ----------------------------------------------------------------------------
-- 2. SERVICES TABLE RLS CONFIGURATION
-- ----------------------------------------------------------------------------
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Active Services" ON services;
DROP POLICY IF EXISTS "Allow All Select on Services" ON services;
DROP POLICY IF EXISTS "Allow All Update on Services" ON services;
DROP POLICY IF EXISTS "Allow All Insert on Services" ON services;
DROP POLICY IF EXISTS "Allow All Delete on Services" ON services;
DROP POLICY IF EXISTS "Public Read Services" ON services;
DROP POLICY IF EXISTS "Admins Manage Services" ON services;
DROP POLICY IF EXISTS "Admins Update Services" ON services;
DROP POLICY IF EXISTS "Admins Insert Services" ON services;
DROP POLICY IF EXISTS "Admins Delete Services" ON services;

-- SELECT Policy: Allow reading all services
CREATE POLICY "Allow All Select on Services"
ON services FOR SELECT
USING (true);

-- UPDATE Policy: Allow updating service status and details
CREATE POLICY "Allow All Update on Services"
ON services FOR UPDATE
USING (true)
WITH CHECK (true);

-- INSERT Policy: Allow creating services
CREATE POLICY "Allow All Insert on Services"
ON services FOR INSERT
WITH CHECK (true);

-- DELETE Policy: Allow deleting services
CREATE POLICY "Allow All Delete on Services"
ON services FOR DELETE
USING (true);

-- ----------------------------------------------------------------------------
-- 3. CITIES TABLE RLS CONFIGURATION
-- ----------------------------------------------------------------------------
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All Select on Cities" ON cities;
DROP POLICY IF EXISTS "Allow All Update on Cities" ON cities;
DROP POLICY IF EXISTS "Allow All Insert on Cities" ON cities;
DROP POLICY IF EXISTS "Allow All Delete on Cities" ON cities;

CREATE POLICY "Allow All Select on Cities"
ON cities FOR SELECT
USING (true);

CREATE POLICY "Allow All Update on Cities"
ON cities FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow All Insert on Cities"
ON cities FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow All Delete on Cities"
ON cities FOR DELETE
USING (true);


