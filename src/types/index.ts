export type UserRole = 'coach' | 'head_coach' | 'student' | 'parent' | 'admin' | 'org_admin';

export * from './saas.types';

export type TargetExamGroup = 'YKS' | 'LGS' | 'KPSS';
export type StudentGrade = '8. Sınıf' | '11. Sınıf' | '12. Sınıf' | 'Mezun' | 'Ön Lisans' | 'Lisans';
export type StudentField = 'EA' | 'SAY' | 'SÖZ' | 'DİL' | 'LGS' | 'GY-GK' | 'Eğitim Bilimleri' | 'Alan (ÖABT)';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskPriority = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik';
export type TaskStatus = 'Bekliyor' | 'Devam Ediyor' | 'Koç Onayı Bekliyor' | 'Tamamlandı';
export type ExamType = 'TYT' | 'AYT' | 'LGS' | 'KPSS_GYGK' | 'KPSS_EB' | 'KPSS_OABT';
export type RewardRequestStatus = 'pending' | 'approved' | 'rejected' | 'delivered';
export type PomodoroMode = 'work' | 'short_break' | 'long_break';
export type PomodoroStatus = 'running' | 'paused' | 'completed' | 'cancelled';
export type TopicMastery = 'not_started' | 'in_progress' | 'mastered';

// ==========================================
// DAILY MOOD TRACKER TYPES
// ==========================================
export type MoodKey =
  | 'joyful'       // 😊 Neşe Dolu
  | 'hopeful'      // 🌟 Umutlu
  | 'energetic'    // ⚡ Enerjik
  | 'focused'      // 🎯 Odaklanmış
  | 'calm'         // 😌 Dingin & Sakin
  | 'undecided'    // ⛅ Kararsız / Durgun
  | 'tired'        // 🔋 Yorgun & Bitkin
  | 'stressed'     // 🌧️ Stresli
  | 'anxious';     // 🌪️ Endişeli & Kaygılı

export interface StudentMood {
  id: string;
  student_id: string;
  date: string; // 'YYYY-MM-DD'
  mood: MoodKey;
  mood_label: string;
  mood_emoji: string;
  note?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  username?: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  coach_id?: string | null;
  pending_coach_id?: string | null;
  pending_coach_name?: string | null;
  target_exam?: TargetExamGroup;
  grade?: StudentGrade;
  field?: StudentField;
  target_university?: string;
  target_department?: string;
  target_rank?: number;
  target_score?: number;
  is_verified?: boolean;
  email_confirmed_at?: string | null;
  is_founder?: boolean;
  two_factor_enabled?: boolean;
  backup_codes?: string[];
  status?: 'active' | 'inactive' | 'pending';
  specialty?: string;
  bio?: string;
  is_demo?: boolean;
  demo_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DemoAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  notes?: string;
  created_by?: string;
}

export interface CoachRequest {
  id: string;
  coach_id: string;
  coach_name?: string;
  student_id: string;
  student_name?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CoachPrinciple {
  title: string;
  description: string;
}

export interface CoachProfile {
  id: string;
  user_id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  avatar_url: string;
  slogan: string;
  bio: string;
  vision: string;
  experience_years: number;
  working_hours: string;
  special_message: string;
  principles: CoachPrinciple[];
  updated_at: string;
}

export interface AdminCoachProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  specialty?: string;
  title?: string;
  bio?: string;
  is_founder?: boolean;
  is_verified?: boolean;
  email_confirmed_at?: string | null;
  status: 'active' | 'pending' | 'inactive';
  active_students_count: number;
  total_tasks_count?: number;
  created_at: string;
  updated_at?: string;
  students?: Student[];
}

export interface Student {
  id: string;
  user_id: string;
  coach_id?: string | null;
  pending_coach_id?: string | null;
  pending_coach_name?: string | null;
  parent_id?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  avatar_url?: string;
  target_exam?: TargetExamGroup;
  grade: StudentGrade;
  field: StudentField;
  match_code: string;
  target_university: string;
  target_department: string;
  target_school?: string;
  target_rank: number;
  target_score: number;
  xp: number; // legacy / lifetime representation (kept equal to total_xp)
  total_xp?: number; // Lifetime XP for Level, Leagues, and Leaderboards (never deducted)
  spendable_xp?: number; // Spendable XP balance for Rewards (deducted on reward claim)
  level: number;
  streak?: number;
  streak_days?: number;
  xp_boost_until?: string | null;
  // SAPS & KVKK additions
  kvkk_gamification_consent?: boolean;
  kvkk_consent_date?: string | null;
  is_anonymous_leaderboard?: boolean;
  leaderboard_nickname?: string | null;
  saps_tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  saps_power_role?: 'Member' | 'StudyLeader' | 'PomodoroCaptain' | 'MentorPeer';
  unlocked_perks?: string[];
  risk_score: number;
  risk_level: RiskLevel;
  risk_reasons: string[];
  coach_notes?: string;
  is_verified?: boolean;
  current_mood?: StudentMood;
  created_at: string;
  updated_at: string;
}

export interface ParentMeeting {
  id: string;
  coach_id: string;
  student_id: string;
  student_name: string;
  student_grade?: string;
  student_field?: string;
  parent_name: string;
  parent_phone: string;
  parent_relation: 'Anne' | 'Baba' | 'Vasi' | 'Diğer' | string;
  meeting_date: string;
  meeting_time: string;
  meeting_type: 'Telefon' | 'Yüz Yüze' | 'Online (Zoom / Meet)' | string;
  meeting_topic: string;
  coach_notes: string;
  action_items?: string;
  next_meeting_date?: string;
  created_at: string;
}

export type XpApprovalType = 'study_log' | 'exam' | 'task' | 'pomodoro' | 'reward';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface XpApprovalRequest {
  id: string;
  student_id: string;
  student_name?: string;
  coach_id?: string;
  activity_type: XpApprovalType;
  activity_id: string;
  title: string;
  details: string;
  question_count?: number;
  duration_minutes?: number;
  net_count?: number;
  calculated_xp: number;
  status: ApprovalStatus;
  requested_at: string;
  created_at?: string;
  processed_at?: string;
  coach_notes?: string;
  proof_url?: string;
  proof_name?: string;
}

export type RewardClaim = RewardRequest;

export interface StudentGoal {
  id: string;
  student_id: string;
  target_university: string;
  target_department: string;
  target_rank: number;
  target_score: number;
  weekly_question_target: number;
  weekly_hour_target: number;
  notes?: string;
  updated_at: string;
}

export interface ExamSubjectResult {
  id: string;
  exam_result_id: string;
  test_name: string;
  subject_name: string;
  correct: number;
  wrong: number;
  empty: number;
  net: number;
}

export interface ExamResult {
  id: string;
  student_id: string;
  exam_type: ExamType;
  exam_name: string;
  exam_date: string;
  total_questions: number;
  total_correct: number;
  total_wrong: number;
  total_empty: number;
  total_net: number;
  score?: number;
  notes?: string;
  created_at: string;
  subject_results?: ExamSubjectResult[];
}

export interface StudyLog {
  id: string;
  student_id: string;
  exam_type: ExamType;
  test_name: string;
  subject_name: string;
  topic_name: string;
  subtopic_name?: string;
  duration_minutes: number;
  question_count: number;
  correct_count: number;
  wrong_count: number;
  empty_count: number;
  net_count: number;
  study_date: string;
  notes?: string;
  proof_url?: string;
  proof_name?: string;
  created_at: string;
}

export interface Task {
  id: string;
  student_id: string;
  student_user_id?: string;
  student_email?: string;
  coach_id: string;
  title: string;
  description?: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  xp_reward: number;
  estimated_minutes?: number;
  completed_at?: string;
  created_at: string;
  student_name?: string;
}

export interface Reward {
  id: string;
  coach_id: string;
  title: string;
  description: string;
  cost_xp: number;
  category: string;
  icon: string;
  stock: number;
  is_active: boolean;
  created_at: string;
}

export interface RewardRequest {
  id: string;
  reward_id: string;
  student_id: string;
  status: RewardRequestStatus;
  coach_notes?: string;
  requested_at: string;
  created_at?: string;
  processed_at?: string;
  cost_xp?: number;
  reward?: Reward;
  student_name?: string;
}

export interface Badge {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: 'milestone' | 'streak' | 'subject' | 'special';
  requirement_type: 'questions' | 'hours' | 'streak' | 'exams' | 'subject_questions';
  requirement_value: number;
  subject_name?: string;
}

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface XpTransaction {
  id: string;
  student_id: string;
  amount: number;
  reason: string;
  source_type: 'question' | 'study_log' | 'exam' | 'task' | 'pomodoro' | 'reward_redemption' | 'reward_refund' | 'daily_login' | 'daily_plan' | 'progress_bonus' | string;
  source_id?: string;
  action_id?: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'task' | 'exam' | 'badge' | 'level' | 'reward' | 'streak' | 'general';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface StudyStreak {
  id: string;
  student_id: string;
  study_date: string;
  question_count: number;
  duration_minutes: number;
}

export interface PomodoroSession {
  id: string;
  student_id: string;
  started_at: string;
  ends_at: string;
  duration_minutes: number;
  status: PomodoroStatus;
  mode: PomodoroMode;
  created_at: string;
}

export interface StudentTopicProgress {
  id: string;
  student_id: string;
  exam_type: ExamType;
  subject_name: string;
  topic_name: string;
  status: TopicMastery;
  total_questions: number;
  total_correct: number;
  mastery_pct: number;
  last_studied_at: string;
}

export interface DailyStudyStat {
  id: string;
  student_id: string;
  date: string;
  total_questions: number;
  total_duration_minutes: number;
  total_net: number;
  total_xp: number;
}

export interface CoachStudentLink {
  id: string;
  coach_id: string;
  student_id: string;
  status: 'active' | 'archived';
  created_at: string;
}

export interface ParentStudentLink {
  id: string;
  parent_id: string;
  student_id: string;
  relationship: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
  sender_role: 'coach' | 'student' | 'parent' | 'admin';
  receiver_role?: 'coach' | 'student' | 'parent' | 'admin';
  content: string;
  is_read: boolean;
  created_at: string;
  attachment_url?: string;
  attachment_name?: string;
}

export interface ChatConversation {
  partner_id: string;
  partner_name: string;
  partner_avatar?: string;
  partner_role: 'coach' | 'student' | 'parent' | 'admin';
  partner_field?: string;
  partner_target?: string;
  last_message?: ChatMessage;
  unread_count: number;
  is_online?: boolean;
}

export interface SmsLog {
  id: string;
  student_id: string;
  student_name: string;
  phone_number: string;
  action_type: string;
  message_content: string;
  status: 'İletildi' | 'Beklemede' | 'Hata';
  sent_at: string;
}

// ==========================================
// PHASE 3: AI COACHING & CONSULTING ENGINE
// ==========================================

export type AIRiskStatus = 'LOW' | 'MEDIUM' | 'CRITICAL'; // 🟢 İYİ | 🟡 TAKİP EDİLMELİ | 🔴 MÜDAHALE GEREKLİ
export type AIPlanStatus = 'proposed' | 'approved' | 'rejected';

export interface AIStudentAnalysis {
  id: string;
  student_id: string;
  student_name?: string;
  risk_level: AIRiskStatus;
  risk_score: number;
  general_status: string;           // 1. Genel Durum
  strengths: string[];              // 2. Güçlü Alanlar
  areas_for_improvement: string[];  // 3. Geliştirilmesi Gereken Alanlar
  critical_risks: string[];         // 4. Kritik Riskler
  study_discipline: string;         // 5. Çalışma Disiplini
  academic_performance: string;     // 6. Akademik Performans
  recent_trend: string;             // 7. Son Dönem Değişimi
  coach_intervention: string;       // 8. Koç Müdahalesi Önerisi
  next_week_priorities: string[];   // 9. Gelecek Hafta Öncelikleri
  recommended_action: string;       // Koç İçin Önerilen Aksiyon
  metrics_summary: {
    hours_7d: number;
    hours_14d: number;
    hours_30d: number;
    task_completion_rate: number;
    overdue_tasks_count: number;
    recent_exam_net: number;
    target_net: number;
    streak_days: number;
    total_xp: number;
  };
  created_at: string;
}

export interface AIStudyPlanTask {
  id: string;
  day: 'Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma' | 'Cumartesi' | 'Pazar';
  subject_name: string;
  topic_name: string;
  description: string;
  duration_minutes: number;
  priority: TaskPriority;
  target_goal: string;
  question_count?: number;
  xp_reward: number;
}

export interface AIStudyPlan {
  id: string;
  student_id: string;
  student_name?: string;
  coach_id: string;
  status: AIPlanStatus; // 'proposed' | 'approved' | 'rejected'
  week_start_date: string;
  title: string;
  summary: string;
  focus_areas: string[];
  tasks: AIStudyPlanTask[];
  created_at: string;
  updated_at: string;
  approved_at?: string;
  rejected_at?: string;
}

export interface AICoachReport {
  id: string;
  student_id: string;
  student_name: string;
  summary: string;
  academic_performance: string;
  study_discipline: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  recent_trend: string;
  coach_recommendations: string[];
  next_week_targets: string[];
  created_at: string;
}

export interface DailyTriageStudent {
  student_id: string;
  student_name: string;
  student_avatar?: string;
  student_field: string;
  target_department: string;
  target_university: string;
  risk_level: AIRiskStatus;
  priority_rank: number;
  reason: string;
  details: string;
  action_type: 'call' | 'task' | 'meeting' | 'review_exam';
  action_label: string;
  recent_metrics: {
    hours_7d: number;
    hours_14d_change_pct: number;
    overdue_tasks: number;
    last_exam_score?: number;
  };
}

// Re-export SAPS & KVKK types
export * from './saps.types';


