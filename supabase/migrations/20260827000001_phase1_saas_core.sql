-- ==========================================================
-- MAHFAZA.CO — FAZ 1 SAAS & ADMIN CORE MIGRATION
-- Non-destructive Schema Extension
-- ==========================================================

-- 1. ROLE EXTENSIONS
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'org_admin';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. SAAS ENUMS
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly', 'lifetime');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM ('percentage', 'fixed', 'free');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. SAAS TABLES

-- SUBSCRIPTION PLANS
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  yearly_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'TRY',
  student_limit INT NOT NULL DEFAULT 1,
  ai_monthly_limit INT NOT NULL DEFAULT 50,
  parent_access BOOLEAN NOT NULL DEFAULT true,
  advanced_reports BOOLEAN NOT NULL DEFAULT false,
  pdf_reports BOOLEAN NOT NULL DEFAULT true,
  priority_support BOOLEAN NOT NULL DEFAULT false,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ADMIN DISCOUNTS
CREATE TABLE IF NOT EXISTS public.admin_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_type discount_type NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  max_redemptions INT,
  redemption_count INT NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  discount_id UUID REFERENCES public.admin_discounts(id) ON DELETE SET NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  billing_cycle billing_cycle NOT NULL DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  discount_id UUID REFERENCES public.admin_discounts(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'TRY',
  status payment_status NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_payment_id TEXT,
  provider_invoice_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role user_role,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FEATURE FLAGS
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  target_roles user_role[] DEFAULT '{}',
  rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI USAGE
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  model TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
  status TEXT NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PERFORMANCE & QUERY INDEXES
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON public.subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_admin_discounts_user_id ON public.admin_discounts(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_discounts_plan_id ON public.admin_discounts(plan_id);
CREATE INDEX IF NOT EXISTS idx_admin_discounts_is_active ON public.admin_discounts(is_active);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON public.ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON public.ai_usage(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- 5. SECURITY DEFINER HELPER FUNCTIONS

-- Admin Check Function (Recursion-safe, based on profiles.user_id = auth.uid())
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'org_admin')
  );
$$;

-- Atomic Discount Redemption Function (Prevents race conditions)
CREATE OR REPLACE FUNCTION public.redeem_discount_atomic(
  p_discount_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_rows INT;
BEGIN
  UPDATE public.admin_discounts
  SET redemption_count = redemption_count + 1,
      updated_at = now()
  WHERE id = p_discount_id
    AND is_active = true
    AND (valid_until IS NULL OR valid_until >= now())
    AND (valid_from IS NULL OR valid_from <= now())
    AND (max_redemptions IS NULL OR redemption_count < max_redemptions)
    AND (user_id IS NULL OR p_user_id IS NULL OR user_id = p_user_id);
  
  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  RETURN v_updated_rows > 0;
END;
$$;

-- Subscription Price Calculation Function
CREATE OR REPLACE FUNCTION public.calculate_subscription_price(
  p_plan_id UUID,
  p_billing_cycle TEXT DEFAULT 'monthly',
  p_discount_code TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  base_price NUMERIC(10,2),
  discount_amount NUMERIC(10,2),
  final_price NUMERIC(10,2),
  discount_id UUID,
  discount_title TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan RECORD;
  v_discount RECORD;
  v_base NUMERIC(10,2) := 0.00;
  v_disc NUMERIC(10,2) := 0.00;
  v_final NUMERIC(10,2) := 0.00;
BEGIN
  -- 1. Get Plan
  SELECT * INTO v_plan FROM public.subscription_plans WHERE id = p_plan_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0.00::NUMERIC(10,2), 0.00::NUMERIC(10,2), 0.00::NUMERIC(10,2), NULL::UUID, NULL::TEXT, 'Plan bulunamadı veya aktif değil'::TEXT;
    RETURN;
  END IF;

  -- 2. Base Price by Billing Cycle
  IF p_billing_cycle = 'yearly' THEN
    v_base := v_plan.yearly_price;
  ELSE
    v_base := v_plan.monthly_price;
  END IF;

  -- 3. Check Discount if provided
  IF p_discount_code IS NOT NULL AND TRIM(p_discount_code) <> '' THEN
    SELECT * INTO v_discount FROM public.admin_discounts
    WHERE UPPER(code) = UPPER(TRIM(p_discount_code))
      AND is_active = true
      AND (valid_from IS NULL OR valid_from <= now())
      AND (valid_until IS NULL OR valid_until >= now())
      AND (max_redemptions IS NULL OR redemption_count < max_redemptions)
      AND (plan_id IS NULL OR plan_id = p_plan_id)
      AND (user_id IS NULL OR user_id = p_user_id);

    IF FOUND THEN
      IF v_discount.discount_type = 'percentage' THEN
        v_disc := ROUND((v_base * (v_discount.discount_value / 100.00)), 2);
      ELSIF v_discount.discount_type = 'fixed' THEN
        v_disc := LEAST(v_base, v_discount.discount_value);
      ELSIF v_discount.discount_type = 'free' THEN
        v_disc := v_base;
      END IF;

      v_final := GREATEST(0.00, v_base - v_disc);

      RETURN QUERY SELECT v_base, v_disc, v_final, v_discount.id, v_discount.title, NULL::TEXT;
      RETURN;
    ELSE
      -- Discount invalid or expired
      v_final := v_base;
      RETURN QUERY SELECT v_base, 0.00::NUMERIC(10,2), v_final, NULL::UUID, NULL::TEXT, 'İndirim kodu geçersiz veya kullanım limiti dolmuş'::TEXT;
      RETURN;
    END IF;
  END IF;

  v_final := v_base;
  RETURN QUERY SELECT v_base, 0.00::NUMERIC(10,2), v_final, NULL::UUID, NULL::TEXT, NULL::TEXT;
END;
$$;

-- 6. ROW LEVEL SECURITY (RLS) ACTIVATION
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES

-- SUBSCRIPTION PLANS POLICIES
CREATE POLICY "Public and authenticated users can view active plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage subscription plans"
  ON public.subscription_plans
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ADMIN DISCOUNTS POLICIES
CREATE POLICY "Admins can manage discounts"
  ON public.admin_discounts
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- SUBSCRIPTIONS POLICIES
CREATE POLICY "Users can read own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- PAYMENTS POLICIES (Strict Security: Frontend ANON/AUTH client CANNOT insert/update/delete; Service role/backend webhook only)
CREATE POLICY "Users can view own payments"
  ON public.payments
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "No client payment insertions"
  ON public.payments
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No client payment updates"
  ON public.payments
  FOR UPDATE
  USING (false);

CREATE POLICY "No client payment deletions"
  ON public.payments
  FOR DELETE
  USING (false);

-- AUDIT LOGS POLICIES (Immutable logs, Admin select only)
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "System and admins can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "No one can update audit logs"
  ON public.audit_logs
  FOR UPDATE
  USING (false);

CREATE POLICY "No one can delete audit logs"
  ON public.audit_logs
  FOR DELETE
  USING (false);

-- FEATURE FLAGS POLICIES
CREATE POLICY "Authenticated users can read enabled flags"
  ON public.feature_flags
  FOR SELECT
  TO authenticated
  USING (is_enabled = true OR public.is_admin());

CREATE POLICY "Admins can manage feature flags"
  ON public.feature_flags
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- AI USAGE POLICIES
CREATE POLICY "Users can view own AI usage"
  ON public.ai_usage
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users and system can insert own AI usage"
  ON public.ai_usage
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage all AI usage"
  ON public.ai_usage
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
