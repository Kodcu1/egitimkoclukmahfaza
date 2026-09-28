import { RiskLevel, Student, StudyLog, ExamResult, Task } from '../types';

/**
 * Calculates net score: Doğru - (Yanlış / 4)
 * Clamped to 2 decimal places.
 */
export function calculateNet(correct: number, wrong: number): number {
  if (correct < 0) correct = 0;
  if (wrong < 0) wrong = 0;
  const net = correct - wrong / 4;
  return Number(Math.max(0, net).toFixed(2));
}

export const LEVEL_TIERS = [
  { level: 1, title: 'Başlangıç', minXp: 0, maxXp: 500 },
  { level: 2, title: 'Çırak', minXp: 500, maxXp: 1000 },
  { level: 3, title: 'Usta Adayı', minXp: 1000, maxXp: 2000 },
  { level: 4, title: 'Uzman', minXp: 2000, maxXp: 3500 },
  { level: 5, title: 'Şampiyon', minXp: 3500, maxXp: 5000 },
  { level: 6, title: 'YKS Stratejisti', minXp: 5000, maxXp: 7500 },
  { level: 7, title: 'Zirve Takipçisi', minXp: 7500, maxXp: 10000 },
  { level: 8, title: 'YKS Fatihi', minXp: 10000, maxXp: Infinity },
];

export interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  currentXpInLevel: number;
  neededXpInLevel: number;
  progressPercentage: number;
}

/**
 * Standard Level Titles
 */
export const LEVEL_TITLES = [
  'Başlangıç',
  'Çırak',
  'Usta Adayı',
  'Uzman',
  'Şampiyon',
  'Stratejist',
  'Zirve Takipçisi',
  'Büyük Usta',
];

/**
 * Formula-based Level Calculation:
 * Cumulative XP needed to reach Level (L+1) = Math.round(500 * Math.pow(L, 1.35))
 */
export function getLevelThreshold(level: number): number {
  if (level <= 0) return 0;
  return Math.round(500 * Math.pow(level, 1.35));
}

export function getLevelInfo(totalXp: number): LevelInfo {
  const currentXp = Math.max(0, Math.floor(totalXp || 0));
  let level = 1;

  while (true) {
    const nextReq = getLevelThreshold(level);
    if (currentXp >= nextReq) {
      level++;
    } else {
      break;
    }
  }

  const prevThreshold = level === 1 ? 0 : getLevelThreshold(level - 1);
  const nextThreshold = getLevelThreshold(level);
  const neededXpInLevel = Math.max(1, nextThreshold - prevThreshold);
  const currentXpInLevel = Math.max(0, currentXp - prevThreshold);
  const progressPercentage = Math.min(100, Math.round((currentXpInLevel / neededXpInLevel) * 100));
  const title = LEVEL_TITLES[level - 1] || `Seviye ${level} Üstadı`;

  return {
    level,
    title,
    minXp: prevThreshold,
    maxXp: nextThreshold,
    currentXpInLevel,
    neededXpInLevel,
    progressPercentage,
  };
}

export function calculateLevel(totalXp: number): number {
  return getLevelInfo(totalXp).level;
}

/**
 * Standard League Tiers
 * Bronze: 0–9,999
 * Silver: 10,000–24,999
 * Gold: 25,000–49,999
 * Platinum: 50,000–99,999
 * Elite: 100,000+
 */
export type LeagueTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Elite';

export interface LeagueInfo {
  tier: LeagueTier;
  name: string;
  minXp: number;
  maxXp: number;
  badge: string;
  color: string;
}

export function getLeagueInfo(totalXp: number): LeagueInfo {
  const xp = Math.max(0, Math.floor(totalXp || 0));
  if (xp >= 100000) {
    return { tier: 'Elite', name: 'Elite Ligi', minXp: 100000, maxXp: Infinity, badge: '🏆', color: 'text-amber-400' };
  }
  if (xp >= 50000) {
    return { tier: 'Platinum', name: 'Platin Ligi', minXp: 50000, maxXp: 99999, badge: '💎', color: 'text-cyan-400' };
  }
  if (xp >= 25000) {
    return { tier: 'Gold', name: 'Altın Ligi', minXp: 25000, maxXp: 49999, badge: '🥇', color: 'text-yellow-400' };
  }
  if (xp >= 10000) {
    return { tier: 'Silver', name: 'Gümüş Ligi', minXp: 10000, maxXp: 24999, badge: '🥈', color: 'text-slate-300' };
  }
  return { tier: 'Bronze', name: 'Bronz Ligi', minXp: 0, maxXp: 9999, badge: '🥉', color: 'text-amber-700' };
}

/**
 * Streak Multipliers:
 * 1–3 = ×1.00
 * 4–7 = ×1.05
 * 8–14 = ×1.10
 * 15–21 = ×1.15
 * 22–30 = ×1.20
 * 31–45 = ×1.30
 * 46–60 = ×1.40
 * 61+ = ×1.50
 */
export function getStreakMultiplier(streak: number): number {
  const s = Math.max(0, Math.floor(streak || 0));
  if (s >= 61) return 1.50;
  if (s >= 46) return 1.40;
  if (s >= 31) return 1.30;
  if (s >= 22) return 1.20;
  if (s >= 15) return 1.15;
  if (s >= 8) return 1.10;
  if (s >= 4) return 1.05;
  return 1.00;
}

/**
 * 24h XP Boost (×1.25, non-stackable)
 */
export function isXpBoostActive(boostUntil?: string | null): boolean {
  if (!boostUntil) return false;
  return new Date(boostUntil).getTime() > Date.now();
}

export function getXpBoostMultiplier(boostUntil?: string | null): number {
  return isXpBoostActive(boostUntil) ? 1.25 : 1.00;
}

/**
 * Gelişim Bonusu Formülü:
 * 25 × √(net artış × 10)
 * net artış <= 0 ise bonus = 0
 */
export function calculateProgressBonus(netIncrease: number): number {
  if (netIncrease <= 0) return 0;
  return Math.round(25 * Math.sqrt(netIncrease * 10));
}

/**
 * Systematic Standard XP Rules
 */
export const XP_RULES = {
  LOGIN: 5,
  DAILY_TASK_1: 20,
  DAILY_TASK_2: 25,
  DAILY_TASK_3: 35,
  DAILY_PLAN_COMPLETE: 40,
  STUDY_SESSION_MIN: 10,
  STUDY_SESSION_MAX: 30,
  COACH_TASK_MIN: 25,
  COACH_TASK_DEFAULT: 50,
  COACH_TASK_MAX: 75,
  WEEKLY_EXAM_UPLOAD: 50,
  EXAM_ANALYSIS: 50,
  DAILY_LIMIT_BASE: 500,
  DAILY_LIMIT_BONUS: 750,
  BOOST_MULTIPLIER: 1.25,
};

/**
 * Calculates current active streak given an array of unique YYYY-MM-DD date strings.
 */
export function calculateStreak(studyDates: string[]): number {
  if (!studyDates || studyDates.length === 0) return 0;

  // Deduplicate and sort descending (most recent first)
  const uniqueDates = Array.from(new Set(studyDates.map((d) => d.split('T')[0]))).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const mostRecent = uniqueDates[0];
  // If no study today or yesterday, streak is broken (0)
  if (mostRecent !== today && mostRecent !== yesterday) {
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(mostRecent);

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i]);
    const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
}

export interface RiskAnalysisResult {
  riskScore: number;
  riskLevel: RiskLevel;
  reasons: string[];
}

/**
 * Pure risk calculation function based on:
 * - Days since last study
 * - Last 7 days question volume & study hours
 * - Pending/overdue tasks
 * - Exam net trends
 * - Active streak
 */
export function calculateRisk(
  _student: Partial<Student>,
  logs: StudyLog[] = [],
  exams: ExamResult[] = [],
  tasks: Task[] = [],
  streak = 0
): RiskAnalysisResult {
  let score = 0;
  const reasons: string[] = [];

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  // 1. Last study log recency
  if (logs.length === 0) {
    score += 40;
    reasons.push('Sistemde henüz hiç çalışma kaydı bulunmuyor.');
  } else {
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(b.study_date).getTime() - new Date(a.study_date).getTime()
    );
    const lastDate = new Date(sortedLogs[0].study_date);
    const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / 86400000);

    if (daysSince >= 5) {
      score += 35;
      reasons.push(`Son ${daysSince} gündür hiç çalışma kaydı girilmedi.`);
    } else if (daysSince >= 3) {
      score += 20;
      reasons.push(`Son ${daysSince} gündür çalışma kaydı yapılmadı.`);
    } else if (daysSince === 0) {
      score = Math.max(0, score - 5);
    }
  }

  // 2. 7-Day question volume
  const recentLogs = logs.filter((l) => new Date(l.study_date) >= sevenDaysAgo);
  const totalQuestionsLast7Days = recentLogs.reduce((acc, curr) => acc + (curr.question_count || 0), 0);
  const totalHoursLast7Days = recentLogs.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) / 60;

  if (totalQuestionsLast7Days < 100 && logs.length > 0) {
    score += 25;
    reasons.push(`Son 7 günde sadece ${totalQuestionsLast7Days} soru çözüldü (Hedef minimum 300+).`);
  } else if (totalQuestionsLast7Days < 250 && logs.length > 0) {
    score += 15;
    reasons.push(`Haftalık soru çözümü düşük seyrediyor (${totalQuestionsLast7Days} soru).`);
  }

  if (totalHoursLast7Days < 8 && logs.length > 0) {
    score += 15;
    reasons.push(`Haftalık toplam çalışma süresi yetersiz (${totalHoursLast7Days.toFixed(1)} saat).`);
  }

  // 3. Tasks overdue / completion
  const studentTasks = tasks;
  const overdueTasks = studentTasks.filter(
    (t) => t.status !== 'Tamamlandı' && new Date(t.due_date) < now
  );
  if (overdueTasks.length > 0) {
    score += Math.min(25, overdueTasks.length * 10);
    reasons.push(`${overdueTasks.length} adet gecikmiş veya teslim edilmemiş koçluk görevi var.`);
  }

  // 4. Exam trend
  if (exams.length >= 2) {
    const sortedExams = [...exams].sort(
      (a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
    );
    const lastExam = sortedExams[sortedExams.length - 1];
    const prevExam = sortedExams[sortedExams.length - 2];

    if (lastExam.total_net < prevExam.total_net - 5) {
      score += 15;
      reasons.push(`Son denemede netlerde düşüş gözlendi (${prevExam.total_net} -> ${lastExam.total_net} net).`);
    }
  } else if (exams.length === 0) {
    score += 10;
    reasons.push('Henüz deneme sınavı sonucu girilmedi.');
  }

  // 5. Streak bonus/penalty
  if (streak === 0 && logs.length > 0) {
    score += 10;
    reasons.push('Günlük çalışma serisi kesintiye uğradı.');
  } else if (streak >= 5) {
    score = Math.max(0, score - 15);
  }

  // Final score clamping
  const finalScore = Math.min(100, Math.max(0, Math.round(score)));

  let riskLevel: RiskLevel = 'LOW';
  if (finalScore >= 76) {
    riskLevel = 'CRITICAL';
  } else if (finalScore >= 51) {
    riskLevel = 'HIGH';
  } else if (finalScore >= 26) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  if (reasons.length === 0) {
    reasons.push('Çalışma temposu, görev tamamlama ve deneme performansı hedefle uyumlu.');
  }

  return {
    riskScore: finalScore,
    riskLevel,
    reasons,
  };
}

/**
 * Systematic XP Multipliers & Standardized Calculation System:
 * - 1 Soru = 0.5 XP (Örn: 60 Soru = 30 XP, 100 Soru = 50 XP)
 * - 1 Tam Deneme = 25 XP
 * - 1 Görev = 20 XP (veya özel görev ödülü)
 * - 1 Pomodoro = 15 XP
 */
export const XP_RATES = {
  QUESTION_MULTIPLIER: 0.5,
  FULL_EXAM: 25,
  TASK_DEFAULT: 20,
  POMODORO_SESSION: 15,
};

export function calculateXpForQuestion(questionCount: number): number {
  const calculated = Math.round(Math.max(0, questionCount) * XP_RATES.QUESTION_MULTIPLIER);
  return Math.max(5, calculated);
}

export function calculateXpForStudyLog(questionCount: number): number {
  return calculateXpForQuestion(questionCount);
}

export function calculateXpForExam(): number {
  return XP_RATES.FULL_EXAM;
}

export function calculateXpForTask(customXp?: number): number {
  return customXp && customXp > 0 ? customXp : XP_RATES.TASK_DEFAULT;
}
