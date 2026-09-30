CREATE TABLE IF NOT EXISTS public.student_moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT NOT NULL CHECK (mood IN ('joyful', 'hopeful', 'energetic', 'focused', 'calm', 'undecided', 'tired', 'stressed', 'anxious')),
  mood_label TEXT NOT NULL,
  mood_emoji TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_student_moods_student_date
  ON public.student_moods(student_id, date DESC);

ALTER TABLE public.student_moods ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.student_moods TO authenticated;
REVOKE DELETE ON public.student_moods FROM anon, authenticated;

CREATE POLICY "Students manage own daily mood"
  ON public.student_moods FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_moods.student_id AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_moods.student_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Coaches read assigned student moods"
  ON public.student_moods FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_moods.student_id AND s.coach_id = auth.uid()
  ));

CREATE POLICY "Parents read linked student moods"
  ON public.student_moods FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.parent_student_links psl
    WHERE psl.student_id = student_moods.student_id AND psl.parent_id = auth.uid()
  ));

CREATE POLICY "Admins read student moods"
  ON public.student_moods FOR SELECT TO authenticated
  USING (public.is_admin());