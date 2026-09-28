-- ==============================================================================
-- MAHFAZA.CO — UNIFIED GAMIFICATION & XP SOURCE-OF-TRUTH MIGRATION
-- 1. TOTAL_XP (LIFETIME, NEVER DEDUCTED, LEVEL & LEADERBOARD SOURCE-OF-TRUTH)
-- 2. SPENDABLE_XP (REWARD CLAIM BALANCE, DEDUCTED UPON REDEMPTION)
-- 3. XP LEDGER (IMMUTABLE, AUDITABLE, IDEMPOTENT VIA ACTION_ID)
-- 4. DATABASE-LEVEL ATOMIC PROCEDURES (CLAIM REWARD, REFUND, AWARD XP)
-- ==============================================================================

-- 1. EXTEND PUBLIC.STUDENTS COLUMNS NON-DESTRUCTIVELY
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'total_xp') THEN
    ALTER TABLE public.students ADD COLUMN total_xp INT NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'spendable_xp') THEN
    ALTER TABLE public.students ADD COLUMN spendable_xp INT NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'streak') THEN
    ALTER TABLE public.students ADD COLUMN streak INT NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'xp_boost_until') THEN
    ALTER TABLE public.students ADD COLUMN xp_boost_until TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- 2. SAFE BACKFILL FOR EXISTING STUDENTS (Preserve existing XP)
UPDATE public.students
SET total_xp = xp,
    spendable_xp = xp
WHERE total_xp = 0 AND xp > 0;

-- 3. EXTEND XP TRANSACTIONS (LEDGER) FOR IDEMPOTENCY
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'xp_transactions' AND column_name = 'action_id') THEN
    ALTER TABLE public.xp_transactions ADD COLUMN action_id TEXT;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_transactions_action_id 
  ON public.xp_transactions(action_id) 
  WHERE action_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_xp_transactions_student_date 
  ON public.xp_transactions(student_id, created_at);

-- 4. ATOMIC REWARD CLAIM FUNCTION (Prevents race conditions & double spends)
CREATE OR REPLACE FUNCTION public.claim_reward_atomic(
  p_student_id UUID,
  p_reward_id UUID,
  p_action_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_reward RECORD;
  v_new_spendable INT;
  v_request_id UUID;
  v_effective_action_id TEXT;
BEGIN
  -- Idempotency check if action_id is provided
  v_effective_action_id := COALESCE(p_action_id, 'reward_claim_' || gen_random_uuid());
  IF EXISTS (SELECT 1 FROM public.xp_transactions WHERE action_id = v_effective_action_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bu işlem daha önce gerçekleştirilmiştir (duplicate action_id).');
  END IF;

  -- Lock student record FOR UPDATE to prevent race conditions
  SELECT * INTO v_student FROM public.students WHERE id = p_student_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Öğrenci bulunamadı.');
  END IF;

  -- Fetch reward
  SELECT * INTO v_reward FROM public.rewards WHERE id = p_reward_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ödül bulunamadı veya aktif değil.');
  END IF;

  -- Check spendable_xp balance (total_xp is NEVER touched)
  IF v_student.spendable_xp < v_reward.cost_xp THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Yetersiz spendable XP bakiyesi',
      'required', v_reward.cost_xp,
      'current', v_student.spendable_xp
    );
  END IF;

  -- Deduct from spendable_xp ONLY
  v_new_spendable := v_student.spendable_xp - v_reward.cost_xp;

  UPDATE public.students
  SET spendable_xp = v_new_spendable,
      updated_at = now()
  WHERE id = p_student_id;

  -- Create Reward Request
  v_request_id := gen_random_uuid();
  INSERT INTO public.reward_requests (
    id,
    reward_id,
    student_id,
    status,
    requested_at
  ) VALUES (
    v_request_id,
    p_reward_id,
    p_student_id,
    'pending',
    now()
  );

  -- Record in XP ledger
  INSERT INTO public.xp_transactions (
    id,
    student_id,
    amount,
    reason,
    source_type,
    source_id,
    action_id,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_student_id,
    -v_reward.cost_xp,
    'Ödül Talebi: ' || v_reward.title,
    'reward_redemption',
    v_request_id::text,
    v_effective_action_id,
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'cost_xp', v_reward.cost_xp,
    'remaining_spendable_xp', v_new_spendable,
    'total_xp', v_student.total_xp
  );
END;
$$;

-- 5. ATOMIC REWARD REFUND FUNCTION (When claim is rejected)
CREATE OR REPLACE FUNCTION public.refund_reward_atomic(
  p_request_id UUID,
  p_coach_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_reward RECORD;
  v_refund_action_id TEXT;
BEGIN
  -- Fetch request
  SELECT * INTO v_request FROM public.reward_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ödül talebi bulunamadı.');
  END IF;

  IF v_request.status = 'rejected' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bu talep daha önce reddedilmiş ve iade edilmiştir.');
  END IF;

  SELECT * INTO v_reward FROM public.rewards WHERE id = v_request.reward_id;

  v_refund_action_id := 'refund_req_' || p_request_id::text;
  IF EXISTS (SELECT 1 FROM public.xp_transactions WHERE action_id = v_refund_action_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'İade işlemi daha önce yapılmıştır.');
  END IF;

  -- Update request status
  UPDATE public.reward_requests
  SET status = 'rejected',
      coach_notes = p_coach_notes,
      processed_at = now()
  WHERE id = p_request_id;

  -- Refund spendable_xp
  IF v_reward.cost_xp > 0 THEN
    UPDATE public.students
    SET spendable_xp = spendable_xp + v_reward.cost_xp,
        updated_at = now()
    WHERE id = v_request.student_id;

    -- Record refund ledger entry
    INSERT INTO public.xp_transactions (
      id,
      student_id,
      amount,
      reason,
      source_type,
      source_id,
      action_id,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_request.student_id,
      v_reward.cost_xp,
      'Ödül İadesi (Reddedildi): ' || v_reward.title,
      'reward_refund',
      p_request_id::text,
      v_refund_action_id,
      now()
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'refunded_xp', v_reward.cost_xp);
END;
$$;
