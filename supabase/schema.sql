-- ==========================================================
-- SERKAN HOCA EĞİTİM KOÇLUĞU - POSTGRESQL & SUPABASE RLS SCHEMA
-- YKS 2026 SaaS Database Architecture
-- ==========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('coach', 'student', 'parent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE student_grade AS ENUM ('12. Sınıf', 'Mezun');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE student_field AS ENUM ('EA', 'SAY', 'SÖZ');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('Düşük', 'Orta', 'Yüksek', 'Kritik');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('Bekliyor', 'Devam Ediyor', 'Tamamlandı');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE exam_type AS ENUM ('TYT', 'AYT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE reward_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- STUDENTS
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  grade student_grade NOT NULL DEFAULT '12. Sınıf',
  field student_field NOT NULL DEFAULT 'SAY',
  match_code TEXT UNIQUE NOT NULL,
  target_university TEXT DEFAULT 'Boğaziçi Üniversitesi',
  target_department TEXT DEFAULT 'Bilgisayar Mühendisliği',
  target_rank INT DEFAULT 2000,
  target_score NUMERIC(5,2) DEFAULT 480.00,
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  risk_score INT NOT NULL DEFAULT 0,
  risk_level risk_level NOT NULL DEFAULT 'LOW',
  risk_reasons TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COACH STUDENT LINKS
CREATE TABLE IF NOT EXISTS public.coach_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(coach_id, student_id)
);

-- PARENT STUDENT LINKS
CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'Veli',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

-- STUDENT GOALS
CREATE TABLE IF NOT EXISTS public.student_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  target_university TEXT NOT NULL,
  target_department TEXT NOT NULL,
  target_rank INT NOT NULL,
  target_score NUMERIC(5,2) NOT NULL,
  weekly_question_target INT NOT NULL DEFAULT 500,
  weekly_hour_target INT NOT NULL DEFAULT 20,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EXAM RESULTS
CREATE TABLE IF NOT EXISTS public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_type exam_type NOT NULL,
  exam_name TEXT NOT NULL,
  exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_questions INT NOT NULL,
  total_correct INT NOT NULL DEFAULT 0,
  total_wrong INT NOT NULL DEFAULT 0,
  total_empty INT NOT NULL DEFAULT 0,
  total_net NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  score NUMERIC(6,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EXAM SUBJECT RESULTS
CREATE TABLE IF NOT EXISTS public.exam_subject_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_result_id UUID NOT NULL REFERENCES public.exam_results(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  correct INT NOT NULL DEFAULT 0,
  wrong INT NOT NULL DEFAULT 0,
  empty INT NOT NULL DEFAULT 0,
  net NUMERIC(5,2) NOT NULL DEFAULT 0.00
);

-- STUDY LOGS
CREATE TABLE IF NOT EXISTS public.study_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_type exam_type NOT NULL,
  test_name TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  subtopic_name TEXT,
  duration_minutes INT NOT NULL DEFAULT 0,
  question_count INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  wrong_count INT NOT NULL DEFAULT 0,
  empty_count INT NOT NULL DEFAULT 0,
  net_count NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  study_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  priority task_priority NOT NULL DEFAULT 'Orta',
  status task_status NOT NULL DEFAULT 'Bekliyor',
  xp_reward INT NOT NULL DEFAULT 20,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REWARDS
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cost_xp INT NOT NULL CHECK (cost_xp > 0),
  category TEXT NOT NULL DEFAULT 'Genel',
  icon TEXT NOT NULL DEFAULT 'Gift',
  stock INT NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REWARD REQUESTS
CREATE TABLE IF NOT EXISTS public.reward_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status reward_status NOT NULL DEFAULT 'pending',
  coach_notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- BADGES
CREATE TABLE IF NOT EXISTS public.badges (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INT NOT NULL,
  subject_name TEXT
);

-- STUDENT BADGES
CREATE TABLE IF NOT EXISTS public.student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, badge_id)
);

-- XP TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- STUDY STREAKS
CREATE TABLE IF NOT EXISTS public.study_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  study_date DATE NOT NULL DEFAULT CURRENT_DATE,
  question_count INT NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL DEFAULT 0,
  UNIQUE(student_id, study_date)
);

-- POMODORO SESSIONS
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 25,
  status TEXT NOT NULL DEFAULT 'running',
  mode TEXT NOT NULL DEFAULT 'work',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subject_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_coach_of_student(p_student_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE id = p_student_id AND coach_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES POLICIES
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

-- STUDENTS POLICIES
CREATE POLICY "Coaches can manage own students" ON public.students
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "Students can read own record" ON public.students
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Parents can read linked student record" ON public.students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.parent_student_links
      WHERE parent_id = auth.uid() AND student_id = public.students.id
    )
  );

-- TASKS POLICIES
CREATE POLICY "Coaches can manage tasks" ON public.tasks
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "Students can read assigned tasks" ON public.tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students WHERE id = tasks.student_id AND user_id = auth.uid())
  );

CREATE POLICY "Students can update task status only" ON public.tasks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.students WHERE id = tasks.student_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.students WHERE id = tasks.student_id AND user_id = auth.uid())
  );

-- STUDY LOGS POLICIES
CREATE POLICY "Students can manage own study logs" ON public.study_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.students WHERE id = study_logs.student_id AND user_id = auth.uid())
  );

CREATE POLICY "Coaches can view linked students study logs" ON public.study_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students WHERE id = study_logs.student_id AND coach_id = auth.uid())
  );

-- EXAM RESULTS POLICIES
CREATE POLICY "Students can manage own exams" ON public.exam_results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.students WHERE id = exam_results.student_id AND user_id = auth.uid())
  );

CREATE POLICY "Coaches can manage students exams" ON public.exam_results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.students WHERE id = exam_results.student_id AND coach_id = auth.uid())
  );

-- REWARDS POLICIES
CREATE POLICY "Coaches manage rewards" ON public.rewards
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "Anyone can view active rewards" ON public.rewards
  FOR SELECT USING (is_active = true);

-- REWARD REQUESTS POLICIES
CREATE POLICY "Students create and view reward requests" ON public.reward_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.students WHERE id = reward_requests.student_id AND user_id = auth.uid())
  );

CREATE POLICY "Coaches manage reward requests" ON public.reward_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = reward_requests.student_id AND coach_id = auth.uid()
    )
  );

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users read and update own notifications" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- BADGES
CREATE POLICY "Badges are public to read" ON public.badges
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Student badges are readable" ON public.student_badges
  FOR SELECT TO authenticated USING (true);

-- XP TRANSACTIONS
CREATE POLICY "Students and coaches can view xp transactions" ON public.xp_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students WHERE id = xp_transactions.student_id AND (user_id = auth.uid() OR coach_id = auth.uid()))
  );
