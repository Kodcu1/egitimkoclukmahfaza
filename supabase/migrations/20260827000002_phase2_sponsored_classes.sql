-- ==========================================================
-- MAHFAZA.CO — FAZ 2 SPONSORED CLASSES & ENTITLEMENTS MIGRATION
-- Non-destructive Schema Extension
-- ==========================================================

-- 1. ROLE EXTENSIONS
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'head_coach';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. SPONSORED CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.sponsored_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_tier TEXT NOT NULL DEFAULT 'pro',
  quota INT NOT NULL DEFAULT 30,
  student_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. STUDENT ENTITLEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.student_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  student_name TEXT,
  student_email TEXT,
  access_tier TEXT NOT NULL DEFAULT 'pro',
  granted_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. ENABLE RLS
ALTER TABLE public.sponsored_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_entitlements ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES
-- Anyone authenticated can view active sponsored classes or entitlements for access validation
DROP POLICY IF EXISTS "Allow authenticated read sponsored classes" ON public.sponsored_classes;
CREATE POLICY "Allow authenticated read sponsored classes"
  ON public.sponsored_classes FOR SELECT
  TO authenticated
  USING (true);

-- Only Admin and Head Coach can insert/update sponsored classes
DROP POLICY IF EXISTS "Admins and teachers manage sponsored classes" ON public.sponsored_classes;
CREATE POLICY "Admins and teachers manage sponsored classes"
  ON public.sponsored_classes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'org_admin', 'head_coach')
    )
  );

-- Read entitlements
DROP POLICY IF EXISTS "Allow authenticated read entitlements" ON public.student_entitlements;
CREATE POLICY "Allow authenticated read entitlements"
  ON public.student_entitlements FOR SELECT
  TO authenticated
  USING (true);

-- Admin manage entitlements
DROP POLICY IF EXISTS "Admins manage entitlements" ON public.student_entitlements;
CREATE POLICY "Admins manage entitlements"
  ON public.student_entitlements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'org_admin')
    )
  );
