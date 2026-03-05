-- RLS Policy Tests for ShiftBoard
-- Everything runs inside a transaction that rolls back, so no data persists.

BEGIN;

-- Load pgTAP
CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(14);

-- 1. Create test fixtures
-- We need auth.users rows so is_admin() can resolve auth.uid() -> users.auth_id.
-- Supabase's auth.users table has required columns; we insert minimal rows.

INSERT INTO auth.users (id, instance_id, role, aud, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'test-admin@shiftboard.test', '', now(), now(), now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'test-alice@shiftboard.test', '', now(), now(), now()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'test-bob@shiftboard.test', '', now(), now(), now());

-- Public users rows
INSERT INTO public.users (id, email, is_admin, auth_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'test-admin@shiftboard.test', true,
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'test-alice@shiftboard.test', false,
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('33333333-3333-3333-3333-333333333333', 'test-bob@shiftboard.test', false,
   'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- Shifts: Alice has 2, Bob has 1
INSERT INTO public.shifts (user_id, date, type) VALUES
  ('22222222-2222-2222-2222-222222222222', '2099-01-01', 'full'),
  ('22222222-2222-2222-2222-222222222222', '2099-01-02', 'half'),
  ('33333333-3333-3333-3333-333333333333', '2099-01-01', 'full');


-- Helper: impersonate a user by setting the JWT claims and role
-- PostgREST (and therefore Supabase) uses these session variables for RLS.

CREATE OR REPLACE FUNCTION _test_set_user(auth_uid uuid, user_email text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', auth_uid::text, true);
  PERFORM set_config('request.jwt.claim.email', user_email, true);
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', auth_uid, 'email', user_email, 'role', 'authenticated')::text,
    true);
  PERFORM set_config('role', 'authenticated', true);
END;
$$;


-- ==========================================================================
-- USERS TABLE POLICIES
-- ==========================================================================

-- 2. Employee can SELECT their own user row
SELECT _test_set_user(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'test-alice@shiftboard.test'
);

SELECT results_eq(
  $$ SELECT email FROM public.users WHERE email LIKE 'test-%@shiftboard.test' ORDER BY email $$,
  $$ VALUES ('test-alice@shiftboard.test'::text) $$,
  'Alice can only see her own user row'
);

-- 3. Employee cannot see other employees' user rows
SELECT is_empty(
  $$ SELECT * FROM public.users WHERE email = 'test-bob@shiftboard.test' $$,
  'Alice cannot see Bob''s user row'
);

-- 4. Employee can UPDATE their own row (e.g. name)
SELECT lives_ok(
  $$ UPDATE public.users SET name = 'Alice Test' WHERE email = 'test-alice@shiftboard.test' $$,
  'Alice can update her own user row'
);

-- 5. Employee cannot UPDATE another user's row
-- This should affect 0 rows (RLS filters it out), not error
SELECT results_eq(
  $$ WITH updated AS (
       UPDATE public.users SET name = 'Hacked' WHERE email = 'test-bob@shiftboard.test' RETURNING 1
     ) SELECT count(*)::int FROM updated $$,
  $$ VALUES (0) $$,
  'Alice cannot update Bob''s user row'
);

-- 6. Employee cannot INSERT a new user
SELECT throws_ok(
  $$ INSERT INTO public.users (email) VALUES ('test-evil@shiftboard.test') $$,
  null,
  null,
  'Employee cannot insert new users'
);

-- 7. Employee cannot DELETE users
SELECT results_eq(
  $$ WITH deleted AS (
       DELETE FROM public.users WHERE email = 'test-bob@shiftboard.test' RETURNING 1
     ) SELECT count(*)::int FROM deleted $$,
  $$ VALUES (0) $$,
  'Alice cannot delete Bob''s user row'
);

-- 8. Admin can see ALL user rows
SELECT _test_set_user(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'test-admin@shiftboard.test'
);

SELECT results_eq(
  $$ SELECT count(*)::int FROM public.users WHERE email LIKE 'test-%@shiftboard.test' $$,
  $$ VALUES (3) $$,
  'Admin can see all test user rows'
);

-- 9. Admin can INSERT new users
SELECT lives_ok(
  $$ INSERT INTO public.users (email) VALUES ('test-new@shiftboard.test') $$,
  'Admin can insert new users'
);

-- 10. Admin can DELETE users
SELECT results_eq(
  $$ WITH deleted AS (
       DELETE FROM public.users WHERE email = 'test-new@shiftboard.test' RETURNING 1
     ) SELECT count(*)::int FROM deleted $$,
  $$ VALUES (1) $$,
  'Admin can delete users'
);


-- ==========================================================================
-- SHIFTS TABLE POLICIES
-- ==========================================================================

-- 11. Any authenticated user can SELECT all shifts
SELECT _test_set_user(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'test-alice@shiftboard.test'
);

SELECT results_eq(
  $$ SELECT count(*)::int FROM public.shifts
     WHERE user_id IN (
       '22222222-2222-2222-2222-222222222222',
       '33333333-3333-3333-3333-333333333333'
     ) $$,
  $$ VALUES (3) $$,
  'Alice can see all shifts (her own + Bob''s)'
);

-- 12. Employee can INSERT/UPDATE their own shifts
SELECT lives_ok(
  $$ INSERT INTO public.shifts (user_id, date, type)
     VALUES ('22222222-2222-2222-2222-222222222222', '2099-01-03', 'full') $$,
  'Alice can insert her own shifts'
);

-- 13. Employee cannot INSERT shifts for another user
SELECT throws_ok(
  $$ INSERT INTO public.shifts (user_id, date, type)
     VALUES ('33333333-3333-3333-3333-333333333333', '2099-01-03', 'full') $$,
  null,
  null,
  'Alice cannot insert shifts for Bob'
);

-- 14. Employee cannot DELETE another user's shifts
SELECT results_eq(
  $$ WITH deleted AS (
       DELETE FROM public.shifts
       WHERE user_id = '33333333-3333-3333-3333-333333333333' RETURNING 1
     ) SELECT count(*)::int FROM deleted $$,
  $$ VALUES (0) $$,
  'Alice cannot delete Bob''s shifts'
);

-- 15. Admin can manage any user's shifts
SELECT _test_set_user(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'test-admin@shiftboard.test'
);

SELECT lives_ok(
  $$ INSERT INTO public.shifts (user_id, date, type)
     VALUES ('33333333-3333-3333-3333-333333333333', '2099-01-03', 'half') $$,
  'Admin can insert shifts for any user'
);

-- Done
SELECT finish();

ROLLBACK;
