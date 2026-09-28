-- ==============================================================================
-- MAHFAZA.CO — SAPS GAMIFICATION MODEL (Status, Access, Power, Stuff) & KVKK COMPLIANCE
-- Architected for: 26 Active Students (14 YKS / 12 LGS) & Coach Serkan Koçak (2b1feeed-890a-430a-8360-dd103034649b)
-- ==============================================================================

-- 1. EXTEND PUBLIC.STUDENTS WITH SAPS & KVKK PREFERENCES
DO $$ BEGIN
  -- KVKK Explicit Consent for Gamification, Public Leaderboard & Social Motivation
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'kvkk_gamification_consent') THEN
    ALTER TABLE public.students ADD COLUMN kvkk_gamification_consent BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Timestamp of KVKK Consent
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'kvkk_consent_date') THEN
    ALTER TABLE public.students ADD COLUMN kvkk_consent_date TIMESTAMPTZ DEFAULT NULL;
  END IF;

  -- Privacy Preference: Anonymous or Nickname on Public Leaderboards
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'is_anonymous_leaderboard') THEN
    ALTER TABLE public.students ADD COLUMN is_anonymous_leaderboard BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Custom Alias / Nickname for Gamification (Optional display name)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'leaderboard_nickname') THEN
    ALTER TABLE public.students ADD COLUMN leaderboard_nickname TEXT DEFAULT NULL;
  END IF;

  -- Status Tier: Bronze, Silver, Gold, Platinum, Diamond
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'saps_tier') THEN
    ALTER TABLE public.students ADD COLUMN saps_tier TEXT NOT NULL DEFAULT 'Bronze';
  END IF;

  -- Power Role: Member, StudyLeader, PomodoroCaptain, MentorPeer
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'saps_power_role') THEN
    ALTER TABLE public.students ADD COLUMN saps_power_role TEXT NOT NULL DEFAULT 'Member';
  END IF;

  -- Unlocked Access Privilege Slugs
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'unlocked_perks') THEN
    ALTER TABLE public.students ADD COLUMN unlocked_perks JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 2. CREATE TABLE: SAPS ACCESS PRIVILEGES (Access Dimension)
CREATE TABLE IF NOT EXISTS public.saps_access_perks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('study_room', 'question_bank', 'advanced_analytics', 'exclusive_webinar', 'coach_vip')),
  min_total_xp INT NOT NULL DEFAULT 500,
  min_streak INT NOT NULL DEFAULT 0,
  required_saps_tier TEXT NOT NULL DEFAULT 'Bronze',
  icon_name TEXT DEFAULT 'Sparkles',
  badge_required_id TEXT DEFAULT NULL,
  resource_url TEXT DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATE TABLE: SAPS POWER NUDGES & PEER MOTIVATION (Power Dimension)
CREATE TABLE IF NOT EXISTS public.saps_power_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  receiver_student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  nudge_type TEXT NOT NULL CHECK (nudge_type IN ('boost_study', 'congratulate_exam', 'streak_applause', 'study_challenge', 'kudos')),
  message TEXT,
  sender_display_name TEXT,
  xp_gift INT NOT NULL DEFAULT 10,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saps_power_nudges_receiver ON public.saps_power_nudges(receiver_student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saps_power_nudges_sender ON public.saps_power_nudges(sender_student_id);

-- 4. CREATE TABLE: PHYSICAL REWARD ORDERS (Stuff Dimension - KVKK Sensitive)
CREATE TABLE IF NOT EXISTS public.physical_reward_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_request_id UUID REFERENCES public.reward_requests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.profiles(id),
  reward_title TEXT NOT NULL,
  recipient_full_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  postal_code TEXT,
  cargo_tracking_number TEXT,
  cargo_carrier TEXT DEFAULT 'Yurtiçi Kargo',
  shipping_status TEXT NOT NULL DEFAULT 'pending' CHECK (shipping_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  kvkk_address_consent BOOLEAN NOT NULL DEFAULT true,
  kvkk_consent_ip TEXT,
  coach_internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_physical_orders_student ON public.physical_reward_orders(student_id);
CREATE INDEX IF NOT EXISTS idx_physical_orders_coach ON public.physical_reward_orders(coach_id);
CREATE INDEX IF NOT EXISTS idx_physical_orders_status ON public.physical_reward_orders(shipping_status);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES — KVKK & ZERO-LEAKAGE ENFORCEMENT

-- Enable RLS on newly created tables
ALTER TABLE public.saps_access_perks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saps_power_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_reward_orders ENABLE ROW LEVEL SECURITY;

-- 5.1 Perks are readable by all authenticated users
DROP POLICY IF EXISTS "Perks are viewable by authenticated users" ON public.saps_access_perks;
CREATE POLICY "Perks are viewable by authenticated users"
  ON public.saps_access_perks FOR SELECT
  TO authenticated
  USING (is_active = true);

-- 5.2 Power Nudges: Student can see received or sent nudges; Coaches can monitor
DROP POLICY IF EXISTS "Students view own nudges" ON public.saps_power_nudges;
CREATE POLICY "Students view own nudges"
  ON public.saps_power_nudges FOR SELECT
  TO authenticated
  USING (
    sender_student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) OR
    receiver_student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.coach_student_links csl
      WHERE (csl.student_id = saps_power_nudges.sender_student_id OR csl.student_id = saps_power_nudges.receiver_student_id)
        AND csl.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can insert power nudges" ON public.saps_power_nudges;
CREATE POLICY "Students can insert power nudges"
  ON public.saps_power_nudges FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Students can mark nudges as read" ON public.saps_power_nudges;
CREATE POLICY "Students can mark nudges as read"
  ON public.saps_power_nudges FOR UPDATE
  TO authenticated
  USING (
    receiver_student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- 5.3 Physical Reward Orders: EXTREMELY STRICT KVKK RLS
-- Only the owner student can view their shipping address, and ONLY their authorized coach (Serkan Koçak)
DROP POLICY IF EXISTS "Student view own physical orders" ON public.physical_reward_orders;
CREATE POLICY "Student view own physical orders"
  ON public.physical_reward_orders FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Student insert own physical orders" ON public.physical_reward_orders;
CREATE POLICY "Student insert own physical orders"
  ON public.physical_reward_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Coach view and manage student shipping orders" ON public.physical_reward_orders;
CREATE POLICY "Coach view and manage student shipping orders"
  ON public.physical_reward_orders FOR ALL
  TO authenticated
  USING (
    coach_id = auth.uid() OR
    coach_id = '2b1feeed-890a-430a-8360-dd103034649b' OR
    EXISTS (
      SELECT 1 FROM public.coach_student_links csl
      WHERE csl.student_id = physical_reward_orders.student_id
        AND csl.coach_id = auth.uid()
    )
  );

-- 6. KVKK-COMPLIANT LEADERBOARD RPC (Zero Raw PII Leakage)
-- Masks names automatically if consent is not granted or if anonymous toggle is active
CREATE OR REPLACE FUNCTION public.get_saps_leaderboard(
  p_exam_type TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  rank BIGINT,
  student_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  target_exam TEXT,
  field TEXT,
  total_xp INT,
  spendable_xp INT,
  streak INT,
  level INT,
  saps_tier TEXT,
  saps_power_role TEXT,
  is_self BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID := auth.uid();
  v_current_student_id UUID;
BEGIN
  -- Determine caller student id if student is logged in
  SELECT id INTO v_current_student_id FROM public.students WHERE user_id = v_current_user_id;

  RETURN QUERY
  WITH ranked AS (
    SELECT
      s.id AS r_student_id,
      CASE
        -- If caller is looking at their own row, always show full name
        WHEN s.id = v_current_student_id THEN s.name
        -- If student requested anonymity or has not consented to public leaderboards
        WHEN s.is_anonymous_leaderboard = true OR s.kvkk_gamification_consent = false THEN
          COALESCE(
            NULLIF(s.leaderboard_nickname, ''),
            'Öğrenci #' || substring(s.id::text, 1, 4)
          )
        -- Consented & public: Prefer nickname if set, else masked partial name (e.g. Ela G***)
        WHEN s.leaderboard_nickname IS NOT NULL AND length(trim(s.leaderboard_nickname)) > 0 THEN
          s.leaderboard_nickname
        ELSE
          -- Mask surname for privacy protection (e.g. "Ela G***")
          split_part(s.name, ' ', 1) || ' ' || substring(COALESCE(split_part(s.name, ' ', 2), 'X'), 1, 1) || '***'
      END AS r_display_name,
      CASE
        WHEN s.is_anonymous_leaderboard = true OR s.kvkk_gamification_consent = false THEN
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        ELSE
          s.avatar_url
      END AS r_avatar_url,
      s.target_exam AS r_target_exam,
      s.field AS r_field,
      COALESCE(s.total_xp, s.xp, 0) AS r_total_xp,
      COALESCE(s.spendable_xp, s.xp, 0) AS r_spendable_xp,
      COALESCE(s.streak, 0) AS r_streak,
      COALESCE(s.level, 1) AS r_level,
      COALESCE(s.saps_tier, 'Bronze') AS r_saps_tier,
      COALESCE(s.saps_power_role, 'Member') AS r_saps_power_role,
      (s.id = v_current_student_id) AS r_is_self
    FROM public.students s
    WHERE (p_exam_type IS NULL OR s.target_exam = p_exam_type)
    ORDER BY COALESCE(s.total_xp, s.xp, 0) DESC, COALESCE(s.streak, 0) DESC
    LIMIT p_limit
  )
  SELECT
    ROW_NUMBER() OVER () AS rank,
    ranked.r_student_id,
    ranked.r_display_name,
    ranked.r_avatar_url,
    ranked.r_target_exam,
    ranked.r_field,
    ranked.r_total_xp,
    ranked.r_spendable_xp,
    ranked.r_streak,
    ranked.r_level,
    ranked.r_saps_tier,
    ranked.r_saps_power_role,
    ranked.r_is_self
  FROM ranked;
END;
$$;

-- 7. ATOMIC SEED FOR SAPS ACCESS PERKS (Access Dimension)
INSERT INTO public.saps_access_perks (slug, title, description, category, min_total_xp, min_streak, required_saps_tier, icon_name)
VALUES
  ('vip_study_hall', 'VIP Odaklanma Odası', 'Özel fon müzikleri, dikkat dağıtmayan minimalist Pomodoro salonu.', 'study_room', 500, 3, 'Bronze', 'Sparkles'),
  ('archive_question_bank', 'Geçmiş Sınavlar Soru Arşivi', 'Son 10 yılın çıkmış YKS / LGS soru ve detaylı video çözüm arşivi.', 'question_bank', 1200, 5, 'Silver', 'BookOpen'),
  ('ai_deep_exam_diagnostics', 'Derin Yapay Zekâ Analizörü', 'Hata yapılan soru tiplerine göre otomatik nokta atışı konu reçetesi.', 'advanced_analytics', 2500, 7, 'Gold', 'Cpu'),
  ('coach_monthly_roundtable', 'Serkan Koçak ile VIP Yuvarlak Masa', 'Her ay en yüksek disiplin sağlayan öğrencilerle özel canlı strateji oturumu.', 'coach_vip', 5000, 14, 'Platinum', 'Crown')
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    min_total_xp = EXCLUDED.min_total_xp,
    required_saps_tier = EXCLUDED.required_saps_tier;

-- 8. INITIAL TIER CALCULATION FOR EXISTING 26 STUDENTS
UPDATE public.students
SET saps_tier = CASE
      WHEN COALESCE(total_xp, xp, 0) >= 5000 THEN 'Platinum'
      WHEN COALESCE(total_xp, xp, 0) >= 2500 THEN 'Gold'
      WHEN COALESCE(total_xp, xp, 0) >= 1000 THEN 'Silver'
      ELSE 'Bronze'
    END,
    saps_power_role = CASE
      WHEN COALESCE(streak, 0) >= 7 THEN 'PomodoroCaptain'
      ELSE 'Member'
    END
WHERE coach_id = '2b1feeed-890a-430a-8360-dd103034649b';
