-- ============================================================================
-- QUICK APPOINTMENTS — WORKFLOW INTEGRITY TRIGGERS, REALTIME & RLS
-- Platform: Supabase (PostgreSQL 15+)
-- Idempotent: Safe to run repeatedly.
-- Description:
--   1. Enforces Service Provider PENDING default & blocks unapproved booking acceptance.
--   2. Automatically creates notifications & audit_logs when provider verification_status changes.
--   3. Ensures provider_documents, provider_working_hours, notifications & audit_logs policies work cleanly.
--   4. Exposes check_phone_registered_rpc for normalized phone existence checks.
--   5. Enables Supabase Realtime publication on core registration & verification tables.
-- ============================================================================

-- 1. Enforce column defaults & constraints on provider_profiles
ALTER TABLE IF EXISTS provider_profiles
  ALTER COLUMN verification_status SET DEFAULT 'PENDING',
  ALTER COLUMN is_accepting_bookings SET DEFAULT FALSE;

-- Fix any existing non-approved providers that accidentally had is_accepting_bookings = TRUE
UPDATE provider_profiles
SET is_accepting_bookings = FALSE
WHERE verification_status <> 'APPROVED' AND is_accepting_bookings = TRUE;

-- 2. Trigger: Enforce PENDING + non-accepting state on new provider creation
CREATE OR REPLACE FUNCTION fn_enforce_provider_pending_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status IS NULL OR NEW.verification_status = '' THEN
    NEW.verification_status := 'PENDING';
  END IF;

  IF NEW.verification_status <> 'APPROVED' THEN
    NEW.is_accepting_bookings := FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_provider_pending_on_insert ON provider_profiles;
CREATE TRIGGER trg_enforce_provider_pending_on_insert
BEFORE INSERT ON provider_profiles
FOR EACH ROW
EXECUTE FUNCTION fn_enforce_provider_pending_on_insert();

-- 3. Trigger: Prevent unapproved providers from turning is_accepting_bookings ON
CREATE OR REPLACE FUNCTION fn_guard_provider_accepting_bookings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status <> 'APPROVED' THEN
    NEW.is_accepting_bookings := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_provider_accepting_bookings ON provider_profiles;
CREATE TRIGGER trg_guard_provider_accepting_bookings
BEFORE UPDATE ON provider_profiles
FOR EACH ROW
EXECUTE FUNCTION fn_guard_provider_accepting_bookings();

-- 4. Trigger: Auto-dispatch provider notifications & audit logs on verification status change
CREATE OR REPLACE FUNCTION fn_notify_provider_verification_change()
RETURNS TRIGGER AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_action TEXT;
BEGIN
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    IF NEW.verification_status = 'APPROVED' THEN
      v_title := 'Account Approved & Live!';
      v_message := 'Congratulations! Your Service Provider account has been approved by Admin. You can now go online and accept customer bookings.';
      v_action := 'PROVIDER_APPROVED';
    ELSIF NEW.verification_status = 'REJECTED' THEN
      v_title := 'Application Rejected';
      v_message := COALESCE('Your provider application was rejected: ' || NEW.rejection_reason, 'Your provider application was rejected. Please review compliance requirements.');
      v_action := 'PROVIDER_REJECTED';
    ELSIF NEW.verification_status = 'NEEDS_INFO' THEN
      v_title := 'Document Clarity Required';
      v_message := COALESCE('Admin requested clearer documents: ' || NEW.rejection_reason, 'Please upload clear HD copies of your KYC documents for verification.');
      v_action := 'PROVIDER_NEEDS_INFO';
    ELSE
      v_title := 'Verification Status Updated';
      v_message := 'Your verification status is now ' || NEW.verification_status || '.';
      v_action := 'PROVIDER_STATUS_CHANGED';
    END IF;

    INSERT INTO notifications (user_id, title, message, type, is_read, data)
    VALUES (
      NEW.user_id,
      v_title,
      v_message,
      'SYSTEM_ALERT',
      FALSE,
      jsonb_build_object(
        'provider_id', NEW.id,
        'previous_status', OLD.verification_status,
        'new_status', NEW.verification_status,
        'reason', NEW.rejection_reason
      )
    );

    INSERT INTO audit_logs (action, entity_type, entity_id, details)
    VALUES (
      v_action,
      'provider_profiles',
      NEW.id::TEXT,
      jsonb_build_object(
        'previous_status', OLD.verification_status,
        'new_status', NEW.verification_status,
        'reason', NEW.rejection_reason
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_provider_verification_change ON provider_profiles;
CREATE TRIGGER trg_notify_provider_verification_change
AFTER UPDATE ON provider_profiles
FOR EACH ROW
EXECUTE FUNCTION fn_notify_provider_verification_change();

-- 5. Normalized Phone Existence Lookup RPC
CREATE OR REPLACE FUNCTION check_phone_registered_rpc(p_phone TEXT)
RETURNS JSONB AS $$
DECLARE
  v_digits TEXT;
  v_last10 TEXT;
  v_user RECORD;
  v_roles TEXT[];
BEGIN
  v_digits := regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
  IF length(v_digits) >= 10 THEN
    v_last10 := right(v_digits, 10);
  ELSE
    v_last10 := v_digits;
  END IF;

  IF length(v_last10) < 10 THEN
    RETURN jsonb_build_object('registered', FALSE);
  END IF;

  SELECT id, full_name, phone, email, is_active
  INTO v_user
  FROM users
  WHERE phone = v_last10
     OR phone = '+91' || v_last10
     OR right(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = v_last10
  LIMIT 1;

  IF v_user IS NULL THEN
    RETURN jsonb_build_object('registered', FALSE);
  END IF;

  SELECT ARRAY_AGG(role) INTO v_roles
  FROM user_roles
  WHERE user_id = v_user.id;

  RETURN jsonb_build_object(
    'registered', TRUE,
    'user', jsonb_build_object(
      'id', v_user.id,
      'full_name', v_user.full_name,
      'phone', v_user.phone,
      'email', v_user.email,
      'is_active', v_user.is_active,
      'roles', COALESCE(v_roles, ARRAY['CUSTOMER']::TEXT[])
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS Policies for Supporting Tables (Documents, Working Hours, Rates, Notifications, Audit Logs)
ALTER TABLE IF EXISTS provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS provider_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS provider_service_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All Provider Documents" ON provider_documents;
CREATE POLICY "Allow All Provider Documents" ON provider_documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Provider Working Hours" ON provider_working_hours;
CREATE POLICY "Allow All Provider Working Hours" ON provider_working_hours FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Provider Service Rates" ON provider_service_rates;
CREATE POLICY "Allow All Provider Service Rates" ON provider_service_rates FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Notifications" ON notifications;
CREATE POLICY "Allow All Notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Insert Audit Logs" ON audit_logs;
CREATE POLICY "Allow Insert Audit Logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 7. Enable Supabase Realtime on Registration & Approval Tables
DO $$
DECLARE
  t TEXT;
  tables_to_publish TEXT[] := ARRAY[
    'users',
    'user_roles',
    'customer_profiles',
    'provider_profiles',
    'provider_documents',
    'notifications',
    'bookings'
  ];
BEGIN
  FOREACH t IN ARRAY tables_to_publish LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_object THEN NULL;
      WHEN insufficient_privilege THEN NULL;
    END;
  END LOOP;
END $$;

