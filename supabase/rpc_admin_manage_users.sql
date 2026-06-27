-- ═══════════════════════════════════════════════════════════════
-- ETRA Training Portal — Admin RPCs for User Management
-- ═══════════════════════════════════════════════════════════════
-- This script creates secure functions (RPCs) that allow the Admin 
-- to create and disable users from the frontend without needing the service_role key.

-- Enable pgcrypto if not already enabled (needed for password hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Function to create a new trainee
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();

  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('full_name', p_full_name, 'role', 'trainee'),
    FALSE,
    'authenticated',
    'authenticated',
    NOW(),
    NOW(),
    '', '', '', ''
  );

  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id::TEXT,
    new_user_id,
    json_build_object('sub', new_user_id, 'email', p_email, 'email_verified', true),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Function to disable (ban) a user
CREATE OR REPLACE FUNCTION public.admin_disable_user(
  p_user_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Ban the user from logging in by setting banned_until far into the future
  UPDATE auth.users
  SET banned_until = '2100-01-01'::TIMESTAMPTZ,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Change role in profiles so they don't show up in active trainee lists
  UPDATE public.profiles
  SET role = 'disabled'
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
