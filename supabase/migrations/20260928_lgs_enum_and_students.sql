-- ==========================================================
-- MAHFAZA.CO — LGS & MULTI-EXAM ENUM EXTENSIONS
-- Non-destructive Schema Extension for 2026-2027 Academic Year
-- ==========================================================

-- 1. EXTEND STUDENT GRADE ENUM
DO $$ BEGIN
  ALTER TYPE public.student_grade ADD VALUE IF NOT EXISTS '8. Sınıf';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE public.student_grade ADD VALUE IF NOT EXISTS '7. Sınıf';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE public.student_grade ADD VALUE IF NOT EXISTS '11. Sınıf';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. EXTEND STUDENT FIELD ENUM
DO $$ BEGIN
  ALTER TYPE public.student_field ADD VALUE IF NOT EXISTS 'LGS';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE public.student_field ADD VALUE IF NOT EXISTS 'DİL';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE public.student_field ADD VALUE IF NOT EXISTS 'GY-GK';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. EXTEND EXAM TYPE ENUM
DO $$ BEGIN
  ALTER TYPE public.exam_type ADD VALUE IF NOT EXISTS 'LGS';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE public.exam_type ADD VALUE IF NOT EXISTS 'KPSS_GYGK';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. ENSURE ENTITLEMENTS & SPONSORED CLASSES RLS POLICIES REMAIN INTACT
ALTER TABLE IF EXISTS public.student_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sponsored_classes ENABLE ROW LEVEL SECURITY;
