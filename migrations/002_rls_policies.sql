-- Admin check function (SECURITY DEFINER bypasses RLS to avoid infinite recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid() AND is_admin = true
  );
$$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- ============ USERS TABLE ============

CREATE POLICY "users_select_own"
ON users FOR SELECT
TO authenticated
USING (email = auth.jwt() ->> 'email');

CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (email = auth.jwt() ->> 'email')
WITH CHECK (email = auth.jwt() ->> 'email');

CREATE POLICY "users_admin_all"
ON users FOR ALL
TO authenticated
USING (is_admin());

-- ============ SHIFTS TABLE ============

CREATE POLICY "shifts_select_all"
ON shifts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "shifts_manage_own"
ON shifts FOR ALL
TO authenticated
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "shifts_admin_all"
ON shifts FOR ALL
TO authenticated
USING (is_admin());
