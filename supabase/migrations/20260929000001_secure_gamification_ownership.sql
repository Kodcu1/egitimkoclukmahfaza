-- Add the existing XP approval workflow to the database and enforce ownership
-- at the mutation boundary. This migration is intentionally additive.

CREATE TABLE IF NOT EXISTS public.xp_approvals (
  id TEXT PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  coach_id TEXT,
  activity_type TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  question_count INT,
  duration_minutes INT,
  net_count NUMERIC(7,2),
  calculated_xp INT NOT NULL DEFAULT 0 CHECK (calculated_xp >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  coach_notes TEXT,
  proof_url TEXT,
  proof_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_xp_approvals_student_status
  ON public.xp_approvals(student_id, status);
CREATE INDEX IF NOT EXISTS idx_xp_approvals_coach_status
  ON public.xp_approvals(coach_id, status);

ALTER TABLE public.xp_approvals ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.xp_approvals TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.xp_approvals FROM anon, authenticated;

DROP POLICY IF EXISTS "Read owned XP approvals" ON public.xp_approvals;
CREATE POLICY "Read owned XP approvals"
  ON public.xp_approvals FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = xp_approvals.student_id
        AND (s.user_id = auth.uid() OR s.coach_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Students create own pending XP approvals" ON public.xp_approvals;
CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_approvals_activity
  ON public.xp_approvals(activity_type, activity_id);

CREATE OR REPLACE FUNCTION public.submit_xp_approval_atomic(
  p_student_id UUID,
  p_activity_type TEXT,
  p_activity_id UUID,
  p_proof_url TEXT DEFAULT NULL,
  p_proof_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_student RECORD;
  v_approval public.xp_approvals%ROWTYPE;
  v_title TEXT;
  v_details TEXT;
  v_question_count INT;
  v_duration_minutes INT;
  v_net_count NUMERIC(7,2);
  v_xp INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_student
  FROM public.students
  WHERE id = p_student_id AND user_id = auth.uid()
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Activity approvals are restricted to the owning student.' USING ERRCODE = '42501';
  END IF;

  IF p_activity_type = 'study_log' THEN
    SELECT subject_name || ' - ' || topic_name,
           question_count,
           duration_minutes,
           net_count
    INTO v_title, v_question_count, v_duration_minutes, v_net_count
    FROM public.study_logs
    WHERE id = p_activity_id AND student_id = p_student_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Owned study activity not found.');
    END IF;
    v_xp := GREATEST(5, ROUND(GREATEST(COALESCE(v_question_count, 0), 0) * 0.5)::INT);
    v_details := COALESCE(v_question_count, 0) || ' Soru • ' || COALESCE(v_duration_minutes, 0) || ' Dk';
  ELSIF p_activity_type = 'exam' THEN
    SELECT exam_name || ' (' || exam_type || ')', total_net
    INTO v_title, v_net_count
    FROM public.exam_results
    WHERE id = p_activity_id AND student_id = p_student_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Owned exam activity not found.');
    END IF;
    v_xp := 25;
    v_details := 'Deneme Sonucu • ' || COALESCE(v_net_count, 0) || ' Net';
    v_duration_minutes := NULL;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Unsupported activity type.');
  END IF;

  INSERT INTO public.xp_approvals (
    id, student_id, student_name, coach_id, activity_type, activity_id,
    title, details, question_count, duration_minutes, net_count, calculated_xp,
    status, requested_at, created_at, proof_url, proof_name
  ) VALUES (
    gen_random_uuid()::TEXT, p_student_id, v_student.name, v_student.coach_id::TEXT,
    p_activity_type, p_activity_id::TEXT, v_title, v_details,
    v_question_count, v_duration_minutes, v_net_count, v_xp,
    'pending', now(), now(), p_proof_url, p_proof_name
  )
  ON CONFLICT (activity_type, activity_id) DO NOTHING
  RETURNING * INTO v_approval;

  IF NOT FOUND THEN
    SELECT * INTO v_approval
    FROM public.xp_approvals
    WHERE activity_type = p_activity_type AND activity_id = p_activity_id::TEXT;
    RETURN jsonb_build_object('success', true, 'duplicate', true, 'approval', to_jsonb(v_approval));
  END IF;

  RETURN jsonb_build_object('success', true, 'approval', to_jsonb(v_approval));
END;
$$;

REVOKE ALL ON FUNCTION public.submit_xp_approval_atomic(UUID, TEXT, UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_xp_approval_atomic(UUID, TEXT, UUID, TEXT, TEXT) TO authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_transactions_action_id
  ON public.xp_transactions(action_id)
  WHERE action_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.process_xp_approval_atomic(
  p_approval_id TEXT,
  p_status TEXT,
  p_coach_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_approval RECORD;
  v_student RECORD;
  v_action_id TEXT;
  v_total INT;
  v_spendable INT;
  v_level INT := 1;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid XP approval status.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_approval
  FROM public.xp_approvals
  WHERE id = p_approval_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'XP approval not found.');
  END IF;

  SELECT * INTO v_student
  FROM public.students
  WHERE id = v_approval.student_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Student not found.');
  END IF;

  IF NOT public.is_admin() AND NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('coach', 'head_coach')
      AND v_student.coach_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to process this student approval.' USING ERRCODE = '42501';
  END IF;

  v_total := COALESCE(v_student.total_xp, v_student.xp, 0);
  v_spendable := COALESCE(v_student.spendable_xp, v_student.xp, 0);
  IF v_approval.status <> 'pending' THEN
    RETURN jsonb_build_object(
      'success', true,
      'duplicate', true,
      'status', v_approval.status,
      'total_xp', v_total,
      'spendable_xp', v_spendable,
      'level', v_student.level
    );
  END IF;

  IF p_status = 'rejected' THEN
    UPDATE public.xp_approvals
    SET status = 'rejected', coach_notes = COALESCE(p_coach_notes, coach_notes), processed_at = now()
    WHERE id = p_approval_id;
    RETURN jsonb_build_object(
      'success', true,
      'status', 'rejected',
      'total_xp', v_total,
      'spendable_xp', v_spendable,
      'level', v_student.level
    );
  END IF;

  v_action_id := 'approval_' || v_approval.id;
  IF EXISTS (SELECT 1 FROM public.xp_transactions WHERE action_id = v_action_id) THEN
    UPDATE public.xp_approvals
    SET status = 'approved', coach_notes = COALESCE(p_coach_notes, coach_notes), processed_at = now()
    WHERE id = p_approval_id;
    RETURN jsonb_build_object(
      'success', true,
      'duplicate', true,
      'status', 'approved',
      'total_xp', v_total,
      'spendable_xp', v_spendable,
      'level', v_student.level
    );
  END IF;

  v_total := v_total + v_approval.calculated_xp;
  v_spendable := v_spendable + v_approval.calculated_xp;
  WHILE v_total >= ROUND(500 * POWER(v_level::NUMERIC, 1.35)) LOOP
    v_level := v_level + 1;
  END LOOP;

  UPDATE public.students
  SET total_xp = v_total,
      spendable_xp = v_spendable,
      xp = v_total,
      level = v_level,
      updated_at = now()
  WHERE id = v_student.id;

  INSERT INTO public.xp_transactions (
    student_id, amount, reason, source_type, source_id, action_id, created_at
  ) VALUES (
    v_student.id,
    v_approval.calculated_xp,
    'Koç onayı: ' || v_approval.title,
    v_approval.activity_type,
    v_approval.activity_id,
    v_action_id,
    now()
  );

  UPDATE public.xp_approvals
  SET status = 'approved', coach_notes = COALESCE(p_coach_notes, coach_notes), processed_at = now()
  WHERE id = p_approval_id;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'approved',
    'total_xp', v_total,
    'spendable_xp', v_spendable,
    'level', v_level
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_xp_approval_atomic(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_xp_approval_atomic(TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.adjust_manual_xp_atomic(
  p_student_id UUID,
  p_delta INT,
  p_reason TEXT,
  p_action_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_student RECORD;
  v_total INT;
  v_spendable INT;
  v_new_total INT;
  v_new_spendable INT;
  v_level INT := 1;
BEGIN
  IF auth.uid() IS NULL OR p_action_id IS NULL OR p_delta = 0 THEN
    RAISE EXCEPTION 'Invalid manual XP request.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_student
  FROM public.students
  WHERE id = p_student_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Student not found.');
  END IF;

  IF NOT public.is_admin() AND NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('coach', 'head_coach')
      AND v_student.coach_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to change XP for this student.' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM public.xp_transactions WHERE action_id = p_action_id) THEN
    RETURN jsonb_build_object('success', false, 'duplicate', true, 'error', 'XP action already processed.');
  END IF;

  v_total := COALESCE(v_student.total_xp, v_student.xp, 0);
  v_spendable := COALESCE(v_student.spendable_xp, v_student.xp, 0);
  IF p_delta < 0 AND v_spendable < ABS(p_delta) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient spendable XP.');
  END IF;

  v_new_total := CASE WHEN p_delta > 0 THEN v_total + p_delta ELSE v_total END;
  v_new_spendable := v_spendable + p_delta;
  IF v_new_spendable < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Spendable XP cannot be negative.');
  END IF;

  WHILE v_new_total >= ROUND(500 * POWER(v_level::NUMERIC, 1.35)) LOOP
    v_level := v_level + 1;
  END LOOP;

  UPDATE public.students
  SET total_xp = v_new_total,
      spendable_xp = v_new_spendable,
      xp = v_new_total,
      level = v_level,
      updated_at = now()
  WHERE id = p_student_id;

  INSERT INTO public.xp_transactions (
    student_id, amount, reason, source_type, action_id, created_at
  ) VALUES (
    p_student_id, p_delta, p_reason, 'manual', p_action_id, now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'total_xp', v_new_total,
    'spendable_xp', v_new_spendable,
    'level', v_level
  );
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_manual_xp_atomic(UUID, INT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_manual_xp_atomic(UUID, INT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_reward_atomic(
  p_student_id UUID,
  p_reward_id UUID,
  p_action_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_student RECORD;
  v_reward RECORD;
  v_request_id UUID;
  v_existing_request_id TEXT;
  v_action_id TEXT := COALESCE(p_action_id, 'reward_claim_' || gen_random_uuid()::TEXT);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_student
  FROM public.students
  WHERE id = p_student_id AND user_id = auth.uid()
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward claims are restricted to the owning student.' USING ERRCODE = '42501';
  END IF;

  SELECT source_id INTO v_existing_request_id
  FROM public.xp_transactions
  WHERE action_id = v_action_id;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'duplicate', true,
      'request_id', v_existing_request_id,
      'remaining_spendable_xp', v_student.spendable_xp,
      'total_xp', COALESCE(v_student.total_xp, v_student.xp, 0)
    );
  END IF;

  SELECT id INTO v_request_id
  FROM public.reward_requests
  WHERE student_id = p_student_id AND reward_id = p_reward_id AND status = 'pending'
  LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'duplicate', true,
      'request_id', v_request_id,
      'remaining_spendable_xp', v_student.spendable_xp,
      'total_xp', COALESCE(v_student.total_xp, v_student.xp, 0)
    );
  END IF;

  SELECT * INTO v_reward
  FROM public.rewards
  WHERE id = p_reward_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward not found or inactive.');
  END IF;
  IF v_student.spendable_xp < v_reward.cost_xp THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient spendable XP.');
  END IF;

  UPDATE public.students
  SET spendable_xp = spendable_xp - v_reward.cost_xp,
      updated_at = now()
  WHERE id = p_student_id;

  INSERT INTO public.reward_requests (reward_id, student_id, status, requested_at)
  VALUES (p_reward_id, p_student_id, 'pending', now())
  RETURNING id INTO v_request_id;

  INSERT INTO public.xp_transactions (
    student_id, amount, reason, source_type, source_id, action_id, created_at
  ) VALUES (
    p_student_id,
    -v_reward.cost_xp,
    'Ödül Talebi: ' || v_reward.title,
    'reward_redemption',
    v_request_id::TEXT,
    v_action_id,
    now()
  );

  IF v_student.coach_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_student.coach_id,
      'Yeni ödül talebi',
      v_student.name || ' "' || v_reward.title || '" için ' || v_reward.cost_xp || ' XP talep etti.',
      'reward',
      '/coach/rewards'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'cost_xp', v_reward.cost_xp,
    'remaining_spendable_xp', v_student.spendable_xp - v_reward.cost_xp,
    'total_xp', COALESCE(v_student.total_xp, v_student.xp, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_reward_atomic(UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_reward_atomic(UUID, UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.refund_reward_atomic(
  p_request_id UUID,
  p_coach_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_request RECORD;
  v_student RECORD;
  v_reward RECORD;
  v_action_id TEXT := 'refund_req_' || p_request_id::TEXT;
BEGIN
  SELECT student_id, reward_id INTO v_request
  FROM public.reward_requests
  WHERE id = p_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward request not found.');
  END IF;

  SELECT * INTO v_student
  FROM public.students
  WHERE id = v_request.student_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Student not found.');
  END IF;

  IF auth.uid() IS NULL OR (
    NOT public.is_admin()
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('coach', 'head_coach')
        AND v_student.coach_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized to refund this reward request.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_request
  FROM public.reward_requests
  WHERE id = p_request_id
  FOR UPDATE;
  IF v_request.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'duplicate', true, 'error', 'Request is no longer pending.');
  END IF;

  IF EXISTS (SELECT 1 FROM public.xp_transactions WHERE action_id = v_action_id) THEN
    UPDATE public.reward_requests
    SET status = 'rejected', coach_notes = p_coach_notes, processed_at = now()
    WHERE id = p_request_id;
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  SELECT * INTO v_reward FROM public.rewards WHERE id = v_request.reward_id;
  UPDATE public.students
  SET spendable_xp = spendable_xp + v_reward.cost_xp,
      updated_at = now()
  WHERE id = v_student.id;

  UPDATE public.reward_requests
  SET status = 'rejected', coach_notes = p_coach_notes, processed_at = now()
  WHERE id = p_request_id;

  INSERT INTO public.xp_transactions (
    student_id, amount, reason, source_type, source_id, action_id, created_at
  ) VALUES (
    v_student.id,
    v_reward.cost_xp,
    'Ödül İadesi (Reddedildi): ' || v_reward.title,
    'reward_refund',
    p_request_id::TEXT,
    v_action_id,
    now()
  );

  RETURN jsonb_build_object('success', true, 'refunded_xp', v_reward.cost_xp);
END;
$$;

REVOKE ALL ON FUNCTION public.refund_reward_atomic(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refund_reward_atomic(UUID, TEXT) TO authenticated;

ALTER TYPE public.reward_status ADD VALUE IF NOT EXISTS 'delivered';

DROP POLICY IF EXISTS "Students create and view reward requests" ON public.reward_requests;
DROP POLICY IF EXISTS "Coaches manage reward requests" ON public.reward_requests;
CREATE POLICY "Students read own reward requests"
  ON public.reward_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = reward_requests.student_id AND s.user_id = auth.uid()));
CREATE POLICY "Students create own pending reward requests"
  ON public.reward_requests FOR INSERT TO authenticated
  WITH CHECK (
    status = 'pending'
    AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = reward_requests.student_id AND s.user_id = auth.uid())
  );
CREATE POLICY "Coaches and admins manage assigned reward requests"
  ON public.reward_requests FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = reward_requests.student_id AND s.coach_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = reward_requests.student_id AND s.coach_id = auth.uid())
  );

DROP POLICY IF EXISTS "Allow authenticated read sponsored classes" ON public.sponsored_classes;
CREATE POLICY "Read related sponsored classes"
  ON public.sponsored_classes FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.user_id = auth.uid()
        AND public.sponsored_classes.student_ids @> jsonb_build_array(s.id::TEXT)
    )
    OR EXISTS (
      SELECT 1 FROM public.parent_student_links psl
      JOIN public.students s ON s.id = psl.student_id
      WHERE psl.parent_id = auth.uid()
        AND public.sponsored_classes.student_ids @> jsonb_build_array(s.id::TEXT)
    )
  );

DROP POLICY IF EXISTS "Allow authenticated read entitlements" ON public.student_entitlements;
DROP POLICY IF EXISTS "Admins manage entitlements" ON public.student_entitlements;
CREATE POLICY "Read related student entitlements"
  ON public.student_entitlements FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_entitlements.student_id
        AND (s.user_id = auth.uid() OR s.coach_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.parent_student_links psl
      WHERE psl.student_id = student_entitlements.student_id
        AND psl.parent_id = auth.uid()
    )
  );
CREATE POLICY "Admins manage entitlements"
  ON public.student_entitlements FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Students can insert power nudges" ON public.saps_power_nudges;
CREATE POLICY "Coaches and admins send assigned student nudges"
  ON public.saps_power_nudges FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role IN ('coach', 'head_coach')
    )
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = sender_student_id AND s.coach_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = receiver_student_id AND s.coach_id = auth.uid()
    )
  );

REVOKE ALL ON FUNCTION public.get_saps_leaderboard(TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_saps_leaderboard(TEXT, INT) TO authenticated;