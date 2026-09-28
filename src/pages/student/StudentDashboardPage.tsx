import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { db } from '../../lib/db';
import { Student, StudentGoal, ExamResult, StudyLog, Task, StudentBadge } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { RiskBadge } from '../../components/common/RiskBadge';
import { PomodoroTimer } from '../../components/dashboard/PomodoroTimer';
import { MotivationCard } from '../../components/dashboard/MotivationCard';
import { StudentAIWidget } from '../../components/dashboard/StudentAIWidget';
import { AnimatedNumber } from '../../components/dashboard/AnimatedNumber';
import { SkeletonKPIGrid } from '../../components/dashboard/SkeletonCard';
import { DailyMoodTracker } from '../../components/dashboard/DailyMoodTracker';
import { AddStudyLogModal } from '../../components/modals/AddStudyLogModal';
import { AddExamModal } from '../../components/modals/AddExamModal';
import { StudentAvatarModal } from '../../components/modals/StudentAvatarModal';
import { BreathingExercise } from '../../components/BreathingExercise';
import { SuccessStoriesModal } from '../../components/SuccessStoriesModal';
import { formatDurationHours, formatDateTurkish } from '../../utils/formatters';
import {
  Flame,
  Award,
  BookOpen,
  CheckSquare,
  Target,
  Plus,
  KeyRound,
  CheckCircle2,
  MessageSquareQuote,
  Camera,
  User,
  UserCheck,
  Sparkles,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
  Calendar,
  Check,
  ChevronRight,
  MessageSquare,
  GraduationCap,
  ListTodo,
  X,
  Wind,
  Trophy,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export const StudentDashboardPage: React.FC = () => {
  const { user, studentData, refreshStudentData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [goal, setGoal] = useState<StudentGoal | null>(null);
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [, setBadges] = useState<StudentBadge[]>([]);
  const [isHandlingRequest, setIsHandlingRequest] = useState<'accept' | 'reject' | null>(null);
  const [entitlement, setEntitlement] = useState<{
    isPro: boolean;
    isStandard: boolean;
    isSponsored: boolean;
    className?: string;
    validUntil?: string;
    reason?: string;
  } | null>(null);

  // Filters for Net Progression Chart
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [examTypeFilter, setExamTypeFilter] = useState<'all' | 'TYT' | 'AYT'>('all');

  // Modals state
  const [showAddLog, setShowAddLog] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [showSuccessStoriesModal, setShowSuccessStoriesModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (showSpinner = false) => {
    try {
      if (showSpinner || !student) {
        setIsLoading(true);
      }
      let currentStu = studentData;
      if (!currentStu && user) {
        currentStu = await db.getStudentById(user.user_id || user.id);
        if (!currentStu) {
          const list = await db.getStudents();
          currentStu = list.find((s) => s.user_id === (user.user_id || user.id) || (s.email && s.email.toLowerCase() === user.email.toLowerCase())) || null;
        }
      }

      if (currentStu) {
        setStudent(currentStu);
        const [g, ex, logs, t, b, ent] = await Promise.all([
          db.getGoal(currentStu.id),
          db.getExamsByStudent(currentStu.id),
          db.getStudyLogsByStudent(currentStu.id),
          db.getTasksByStudent(currentStu.id),
          db.getStudentBadges(currentStu.id),
          db.checkStudentEntitlement(currentStu.id),
        ]);
        setGoal(g);
        setExams(ex);
        setStudyLogs(logs);
        setTasks(t);
        setBadges(b);
        setEntitlement(ent);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const handleUpdated = () => {
      loadData(false);
      refreshStudentData();
    };
    window.addEventListener('tasks_updated', handleUpdated);
    window.addEventListener('approvals_updated', handleUpdated);
    window.addEventListener('study_logs_updated', handleUpdated);
    window.addEventListener('exams_updated', handleUpdated);
    window.addEventListener('coach_requests_updated', handleUpdated);
    window.addEventListener('students_updated', handleUpdated);
    window.addEventListener('profiles_updated', handleUpdated);
    return () => {
      window.removeEventListener('tasks_updated', handleUpdated);
      window.removeEventListener('approvals_updated', handleUpdated);
      window.removeEventListener('study_logs_updated', handleUpdated);
      window.removeEventListener('exams_updated', handleUpdated);
      window.removeEventListener('coach_requests_updated', handleUpdated);
      window.removeEventListener('students_updated', handleUpdated);
      window.removeEventListener('profiles_updated', handleUpdated);
    };
  }, [studentData]);

  const handleAcceptCoachRequest = async () => {
    if (!student) return;
    const targetStudentId = student.id || student.user_id;
    const assignedCoach = student.pending_coach_id || '';
    setIsHandlingRequest('accept');

    // Optimistic UI: clear pending state immediately and set active coach
    setStudent((prev) =>
      prev
        ? {
            ...prev,
            coach_id: assignedCoach,
            pending_coach_id: null,
            pending_coach_name: null,
          }
        : null
    );

    try {
      await db.acceptCoachRequest(targetStudentId);
      toast.success('🎉 Harika! Koçluk eşleşmeniz tamamlandı. Koçunuzla başarı yolculuğunuz başladı!');
      await refreshStudentData();
      await loadData();
    } catch (err) {
      console.error('Failed to accept coach request:', err);
      toast.error('Koçluk isteği onaylanırken bir hata oluştu.');
      loadData();
    } finally {
      setIsHandlingRequest(null);
    }
  };

  const handleRejectCoachRequest = async () => {
    if (!student) return;
    const targetStudentId = student.id || student.user_id;
    setIsHandlingRequest('reject');

    // Optimistic UI: clear pending state immediately
    setStudent((prev) =>
      prev
        ? {
            ...prev,
            pending_coach_id: null,
            pending_coach_name: null,
          }
        : null
    );

    try {
      await db.rejectCoachRequest(targetStudentId);
      toast.info('Koçluk isteği reddedildi.');
      await refreshStudentData();
      await loadData();
    } catch (err) {
      console.error('Failed to reject coach request:', err);
      toast.error('Koçluk isteği reddedilirken bir hata oluştu.');
      loadData();
    } finally {
      setIsHandlingRequest(null);
    }
  };

  const handleCompleteTask = async (task: Task) => {
    // Optimistic UI: Update state immediately so task is removed from active list
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'Koç Onayı Bekliyor' } : t))
    );

    try {
      await db.updateTaskStatus(task.id, 'Koç Onayı Bekliyor');
      window.dispatchEvent(new CustomEvent('tasks_updated'));
      window.dispatchEvent(new CustomEvent('approvals_updated'));
      await refreshStudentData();
    } catch (err) {
      console.error('Görev tamamlanırken hata oluştu:', err);
      loadData();
    }
  };

  // Calculations for real data
  const totalQuestions = useMemo(() => {
    return studyLogs.reduce((acc, curr) => acc + (curr.question_count || 0), 0);
  }, [studyLogs]);

  // Today's statistics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = useMemo(() => {
    return studyLogs.filter((l) => l.study_date === todayStr);
  }, [studyLogs, todayStr]);

  const todayQuestions = useMemo(() => {
    return todayLogs.reduce((acc, curr) => acc + (curr.question_count || 0), 0);
  }, [todayLogs]);

  const todayMinutes = useMemo(() => {
    return todayLogs.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
  }, [todayLogs]);

  // Target daily questions
  const targetDailyQuestions = goal?.daily_question_target || 100;
  const todayProgressPercent = Math.min(
    100,
    Math.round((todayQuestions / targetDailyQuestions) * 100)
  );

  // Weekly study minutes (last 7 days)
  const weeklyMinutes = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    return studyLogs
      .filter((l) => new Date(l.study_date).getTime() >= sevenDaysAgo)
      .reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
  }, [studyLogs]);

  // Recent TYT & AYT exams
  const tytExams = useMemo(() => exams.filter((e) => e.exam_type === 'TYT'), [exams]);
  const aytExams = useMemo(() => exams.filter((e) => e.exam_type === 'AYT'), [exams]);

  const latestTYT = tytExams[0];
  const prevTYT = tytExams[1];
  const tytDiff = latestTYT && prevTYT ? latestTYT.total_net - prevTYT.total_net : 0;

  const latestAYT = aytExams[0];
  const prevAYT = aytExams[1];
  const aytDiff = latestAYT && prevAYT ? latestAYT.total_net - prevAYT.total_net : 0;

  // Active / Pending tasks strictly filtered (NO completed or approved tasks)
  const activePendingTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'Bekliyor' || t.status === 'Devam Ediyor');
  }, [tasks]);

  // Filtered Exam trend data for chart
  const filteredTrendData = useMemo(() => {
    let list = [...exams].reverse(); // chronological order

    const now = Date.now();
    if (chartPeriod === '7d') {
      list = list.filter((e) => now - new Date(e.exam_date).getTime() <= 7 * 24 * 3600 * 1000);
    } else if (chartPeriod === '30d') {
      list = list.filter((e) => now - new Date(e.exam_date).getTime() <= 30 * 24 * 3600 * 1000);
    } else if (chartPeriod === '90d') {
      list = list.filter((e) => now - new Date(e.exam_date).getTime() <= 90 * 24 * 3600 * 1000);
    }

    if (examTypeFilter !== 'all') {
      list = list.filter((e) => e.exam_type === examTypeFilter);
    }

    return list.map((e) => ({
      date: formatDateTurkish(e.exam_date),
      rawDate: e.exam_date,
      name: e.exam_name,
      net: Number(e.total_net.toFixed(2)),
      type: e.exam_type,
    }));
  }, [exams, chartPeriod, examTypeFilter]);

  // Estimated Rank Calculation from current averages
  const estimatedRank = useMemo(() => {
    if (!student) return null;
    const avgNet = latestTYT ? latestTYT.total_net : 80;
    if (avgNet >= 105) return 450;
    if (avgNet >= 95) return 1800;
    if (avgNet >= 85) return 6500;
    if (avgNet >= 70) return 18000;
    return 35000;
  }, [student, latestTYT]);

  const targetRank = student?.target_rank || 1000;
  const rankDeviation = estimatedRank ? estimatedRank - targetRank : 0;

  if (isLoading && !student) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="h-32 bg-slate-200/80 rounded-3xl animate-pulse" />
        <SkeletonKPIGrid count={4} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-md space-y-3">
        <p className="text-sm font-bold text-slate-800">Öğrenci profili bulunamadı.</p>
        <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
          Yeniden Dene
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* PENDING COACH REQUEST INVITATION BANNER (Öğrenci Onay Merkezi) */}
      {student.pending_coach_id && (
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-50 via-blue-50/70 to-indigo-50/50 rounded-3xl border-2 border-indigo-200 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25 shrink-0">
              <UserCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-indigo-950">
                  Koçluk İsteği Alındı 🎯
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 text-[11px] font-bold">
                  Onayınız Bekleniyor
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-900/85 max-w-2xl leading-relaxed">
                <strong className="text-indigo-950 font-bold">
                  {student.pending_coach_name || 'Serkan KOÇAK'}
                </strong>{' '}
                size koçluk isteği gönderdi. Bu isteği onaylayarak koçluk programınızı başlatabilir ve özel çalışma planınızı oluşturmaya başlayabilirsiniz.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-center w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              isLoading={isHandlingRequest === 'reject'}
              disabled={isHandlingRequest !== null}
              onClick={handleRejectCoachRequest}
              leftIcon={<X className="w-4 h-4 text-red-500" />}
              className="bg-white hover:bg-red-50 text-red-600 border-red-200 font-bold text-xs px-4 py-2 rounded-xl active:scale-95 cursor-pointer shadow-xs"
            >
              Reddet
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isHandlingRequest === 'accept'}
              disabled={isHandlingRequest !== null}
              onClick={handleAcceptCoachRequest}
              leftIcon={<CheckCircle2 className="w-4 h-4 text-white" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md shadow-emerald-600/25 active:scale-95 cursor-pointer"
            >
              Kabul Et & Başlat
            </Button>
          </div>
        </div>
      )}

      {/* 1. Daily Motivation Bar */}
      <MotivationCard />

      {/* 2. Bento Header / Student Welcome Banner (Aydınlık & Ferah) */}
      <div className="p-6 sm:p-7 bg-white rounded-3xl border border-slate-100 shadow-md hover:shadow-lg transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* User Info & Avatar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-orange-200 bg-orange-50 shadow-sm flex items-center justify-center">
                {student.avatar_url ? (
                  <img
                    src={student.avatar_url}
                    alt={student.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-xl font-black font-mono bg-gradient-to-tr from-orange-500 to-amber-500">
                    {student.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAvatarModal(true)}
                className="absolute -bottom-1.5 -right-1.5 bg-orange-500 hover:bg-orange-600 text-white p-1.5 rounded-xl shadow-md border-2 border-white transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                title="Fotoğrafı Değiştir"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Merhaba, {student.name} 👋
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                  {student.field} • {student.grade}
                </span>
                <RiskBadge level={student.risk_level} score={student.risk_score} />
                {entitlement?.isSponsored && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>PRO Öğrenci</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                <span className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-orange-500" />
                  Hedef:{' '}
                  <strong className="text-slate-800 font-semibold">
                    {goal?.target_university || student.target_university}
                  </strong>{' '}
                  (#{student.target_rank})
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                  Veli Kodu:{' '}
                  <strong className="text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {student.match_code}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/student/profile')}
              leftIcon={<User className="w-4 h-4 text-slate-600" />}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
            >
              Profil & Koçum
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddLog(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-500/20"
            >
              + Çalışma Kaydı
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddExam(true)}
              leftIcon={<Award className="w-4 h-4 text-indigo-600" />}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
            >
              + Deneme Gir
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Top Bento KPI Cards Row (4 High-Impact Summary Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Durumu (TYT & AYT) */}
        <StatCard
          title="Son Net Durumu"
          value={
            latestTYT ? (
              <div className="flex items-baseline gap-2">
                <span className="text-slate-900 font-black text-2xl font-mono">
                  {latestTYT.total_net.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-500">TYT</span>
                {latestAYT && (
                  <>
                    <span className="text-slate-300">/</span>
                    <span className="text-indigo-600 font-black text-xl font-mono">
                      {latestAYT.total_net.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-slate-500">AYT</span>
                  </>
                )}
              </div>
            ) : (
              '-'
            )
          }
          subtitle={latestTYT ? formatDateTurkish(latestTYT.exam_date) : 'Kayıt yok'}
          trend={
            tytDiff !== 0
              ? {
                  value: `${tytDiff > 0 ? '+' : ''}${tytDiff.toFixed(1)} Net`,
                  isPositive: tytDiff > 0,
                  label: 'son TYT',
                }
              : undefined
          }
          icon={<Award className="w-4 h-4 text-orange-500" />}
          variant="amber"
          onClick={() => navigate('/student/exams')}
        />

        {/* Günlük Soru Kotası & İlerleme */}
        <StatCard
          title="Bugünkü Soru Kotası"
          value={<AnimatedNumber value={todayQuestions} suffix={` / ${targetDailyQuestions}`} />}
          subtitle={`%${todayProgressPercent} Hedef İlerlemesi`}
          icon={<BookOpen className="w-4 h-4 text-emerald-600" />}
          variant="emerald"
          onClick={() => setShowAddLog(true)}
        />

        {/* Kazanılan XP & Seviye */}
        <StatCard
          title="Kazanılan XP"
          value={<AnimatedNumber value={student.xp || 0} suffix=" XP" />}
          subtitle={`Seviye ${student.level || 1} Rütbesi`}
          icon={<Sparkles className="w-4 h-4 text-indigo-600" />}
          variant="indigo"
          onClick={() => navigate('/student/badges')}
        />

        {/* Günlük Seri (Streak) */}
        <StatCard
          title="Günlük Seri"
          value={<AnimatedNumber value={student.streak_days || 0} suffix=" Gün" />}
          subtitle="Aralıksız disiplin"
          icon={<Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />}
          variant="amber"
        />
      </div>

      {/* 3. Premium Feature Cards: Sınav Kaygısını Yönet & Başarı Hikayeleri */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Sınav Kaygısını Yönet */}
        <div
          onClick={() => setShowBreathingModal(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowBreathingModal(true);
            }
          }}
          className="group relative flex flex-col justify-between p-5 text-left bg-gradient-to-br from-white via-teal-50/20 to-white hover:from-teal-50/40 hover:to-white rounded-2xl border border-slate-200 hover:border-teal-400/80 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          aria-label="Sınav Kaygısını Yönet - Yoğunluk anında nefes egzersizi ve kısa zindelik araçları."
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/90 flex items-center justify-center text-teal-700 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <span className="text-2xl" role="img" aria-label="Nefes Egzersizi">🧘‍♂️</span>
            </div>
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Sınav Kaygısını Yönet
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80 shrink-0">
                  Zindelik
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Yoğunluk anında nefes egzersizi ve kısa zindelik araçları.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 group-hover:text-teal-900 transition-colors">
              <span>Egzersizi Başlat</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400 group-hover:text-teal-700 transition-colors font-medium">
              4x4 Kutu Nefesi
            </span>
          </div>
        </div>

        {/* Card 2: Başarı Hikayeleri */}
        <div
          onClick={() => setShowSuccessStoriesModal(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowSuccessStoriesModal(true);
            }
          }}
          className="group relative flex flex-col justify-between p-5 text-left bg-gradient-to-br from-white via-amber-50/20 to-white hover:from-amber-50/40 hover:to-white rounded-2xl border border-slate-200 hover:border-amber-400/80 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          aria-label="Başarı Hikayeleri - Benzer hedeflere ulaşan öğrencilerin gerçek gelişim yolculuklarını incele."
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/90 flex items-center justify-center text-amber-700 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <span className="text-2xl" role="img" aria-label="Kupa">🏆</span>
            </div>
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Başarı Hikayeleri
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0">
                  Dereceler
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Benzer hedeflere ulaşan öğrencilerin gerçek gelişim yolculuklarını incele.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100/90 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:text-amber-900 transition-colors">
              <span>Hikayeleri Gör</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400 group-hover:text-amber-700 transition-colors font-medium">
              YKS • LGS • KPSS
            </span>
          </div>
        </div>
      </div>

      {/* 4. Daily Mood Tracker / Psikolojik Takip Modülü */}
      <DailyMoodTracker studentId={student.id} studentName={student.name} />

      {/* 5. AI Diagnosis Widget */}
      <StudentAIWidget student={student} />

      {/* 6. MAIN BENTO GRID (Middle Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orta Sol (Geniş - 2/3): Net Gelişim Grafiği */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-white border border-slate-100 shadow-md hover:shadow-lg transition-all rounded-3xl h-full flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      Net Gelişim Trendi
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deneme sınavlarındaki TYT ve AYT netlerinizin kronolojik ivmesi
                  </p>
                </div>

                {/* Controls: Exam Type & Period Filter */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Exam Type Toggle */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setExamTypeFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                        examTypeFilter === 'all'
                          ? 'bg-white text-orange-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tümü
                    </button>
                    <button
                      onClick={() => setExamTypeFilter('TYT')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                        examTypeFilter === 'TYT'
                          ? 'bg-white text-orange-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      TYT
                    </button>
                    <button
                      onClick={() => setExamTypeFilter('AYT')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                        examTypeFilter === 'AYT'
                          ? 'bg-white text-orange-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      AYT
                    </button>
                  </div>

                  {/* Time Filter */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                    {(['7d', '30d', '90d', 'all'] as const).map((p) => {
                      const labels = {
                        '7d': '7G',
                        '30d': '30G',
                        '90d': '90G',
                        all: 'Tümü',
                      };
                      return (
                        <button
                          key={p}
                          onClick={() => setChartPeriod(p)}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                            chartPeriod === p
                              ? 'bg-white text-orange-600 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {labels[p]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="h-64 sm:h-72 w-full pt-4">
                {filteredTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={filteredTrendData}
                      margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="netOrangeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} domain={['dataMin - 5', 'dataMax + 5']} tickLine={false} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1">
                                <p className="font-bold text-amber-300">{data.name}</p>
                                <p className="text-slate-300">{data.date} • {data.type}</p>
                                <p className="text-sm font-black text-orange-400">
                                  Net: {data.net} Net
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {goal?.target_score && (
                        <ReferenceLine
                          y={Math.round(goal.target_score / 5)}
                          label={{
                            value: `Hedef Net (~${Math.round(goal.target_score / 5)})`,
                            fill: '#f59e0b',
                            fontSize: 10,
                            position: 'top',
                          }}
                          stroke="#f59e0b"
                          strokeDasharray="4 4"
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="net"
                        stroke="#f97316"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#netOrangeGradient)"
                        dot={{ r: 4, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#ea580c', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <Award className="w-10 h-10 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-700">Seçilen aralıkta deneme verisi bulunmuyor.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddExam(true)}
                      className="text-xs mt-1"
                    >
                      + İlk Denemeni Gir
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Mini Footer Statistics */}
            {filteredTrendData.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-4 mt-2 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-slate-50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Son Net</p>
                  <p className="text-sm font-black text-slate-900 font-mono">
                    {filteredTrendData[filteredTrendData.length - 1]?.net || '-'}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">En Yüksek Net</p>
                  <p className="text-sm font-black text-emerald-600 font-mono">
                    {Math.max(...filteredTrendData.map((d) => d.net)).toFixed(1)}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Ortalama Net</p>
                  <p className="text-sm font-black text-orange-600 font-mono">
                    {(
                      filteredTrendData.reduce((acc, curr) => acc + curr.net, 0) /
                      filteredTrendData.length
                    ).toFixed(1)}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Orta Sağ (1/3): Sadece Aktif/Yapılacak En Fazla 3 Görev */}
        <div className="lg:col-span-1">
          <Card className="p-6 bg-white border border-slate-100 shadow-md hover:shadow-lg transition-all rounded-3xl h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                    <ListTodo className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      Aktif Görevlerim
                    </h3>
                    <p className="text-[11px] text-slate-500">Yalnızca yapılacak görevler</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full font-mono">
                  {activePendingTasks.length} Aktif
                </span>
              </div>

              {/* Task Items (Top 3 active only) */}
              <div className="space-y-3">
                {activePendingTasks.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-orange-200 hover:shadow-md transition-all text-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 leading-tight">{t.title}</p>
                        {t.description && (
                          <p className="text-slate-500 text-[11px] line-clamp-1">{t.description}</p>
                        )}
                      </div>
                      <span className="font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full shrink-0 font-mono text-[10px]">
                        +{t.xp_reward} XP
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDateTurkish(t.due_date)}
                      </span>

                      <button
                        onClick={() => handleCompleteTask(t)}
                        className="font-bold text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <Check className="w-3 h-3 text-orange-600 stroke-[3]" />
                        <span>Tamamla</span>
                      </button>
                    </div>
                  </div>
                ))}

                {activePendingTasks.length === 0 && (
                  <div className="text-center py-8 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">
                      Tüm görevlerini tamamladın! 🎉
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Yeni görevler için koçunun yönlendirmelerini bekleyebilirsin.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* View All Link */}
            <div className="pt-4 border-t border-slate-100">
              <Link
                to="/student/tasks"
                className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Tüm Görevleri Gör ({tasks.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* 6. BOTTOM BENTO GRID (Supporting Modules & Compact Pomodoro Widget) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Alt (2/3): Hedef Üniversite Analizi, Koçluk Notu & Son Denemeler */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sub-grid: Hedef Analizi & Koçluk Notu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hedef Üniversite & Sıralama */}
            <Card className="p-5 bg-white border border-slate-100 shadow-md rounded-3xl space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Hedef Üniversite Radarı
                  </h4>
                  <p className="text-[10px] text-slate-400">YKS 2027 Hedef & Sapma</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Program</p>
                  <p className="font-bold text-slate-900 truncate">
                    {goal?.target_university || student.target_university}
                  </p>
                  <p className="text-indigo-600 text-[11px] font-medium">
                    {goal?.target_department || student.target_department}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-semibold">Hedef Sıra</p>
                    <p className="text-sm font-black text-orange-600 font-mono">
                      #{targetRank.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-semibold">Tahmini Sıra</p>
                    <p className="text-sm font-black text-indigo-600 font-mono">
                      {estimatedRank ? `#${estimatedRank.toLocaleString()}` : '-'}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Sapma Durumu:</span>
                    {rankDeviation <= 0 ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> Hedefte
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5" /> +{rankDeviation.toLocaleString()} Kişi
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Koçluk Notu */}
            <Card className="p-5 bg-amber-50/70 border border-amber-200/80 shadow-md rounded-3xl flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-800">
                      <MessageSquareQuote className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                        Koçun Haftalık Notu
                      </h4>
                      <p className="text-[10px] text-amber-700 font-medium">Serkan Hoca — Eğitim Koçu</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {student.coach_notes ||
                    'Bu hafta deneme netlerindeki istikrarlı artış harika. Özellikle Geometri ve Fen tekrarlarına devam et.'}
                </p>
              </div>

              <div className="pt-3 border-t border-amber-200/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/student/messages')}
                  className="w-full text-xs bg-white text-amber-900 border-amber-300 hover:bg-amber-100/60"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  Koçuna Mesaj Yaz
                </Button>
              </div>
            </Card>
          </div>

          {/* Son Denemelerim Tablosu */}
          <Card className="p-5 sm:p-6 bg-white border border-slate-100 shadow-md rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Son Denemelerim</h3>
                  <p className="text-[11px] text-slate-500">Kayıtlı deneme sonuçları ve net değişimleri</p>
                </div>
              </div>
              <Link
                to="/student/exams"
                className="text-xs font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1"
              >
                <span>Tümü</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {exams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-2 pr-3">Deneme</th>
                      <th className="pb-2 px-2">Tarih</th>
                      <th className="pb-2 px-2">Tür</th>
                      <th className="pb-2 px-2 text-right">Net</th>
                      <th className="pb-2 pl-2 text-right">Fark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {exams.slice(0, 4).map((exam, idx) => {
                      const prev = exams[idx + 1];
                      const diff = prev ? exam.total_net - prev.total_net : 0;

                      return (
                        <tr
                          key={exam.id}
                          onClick={() => navigate('/student/exams')}
                          className="hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 pr-3 font-bold text-slate-900 truncate max-w-[140px]">
                            {exam.exam_name}
                          </td>
                          <td className="py-2.5 px-2 text-slate-500 text-[11px]">
                            {formatDateTurkish(exam.exam_date)}
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-bold text-[10px]">
                              {exam.exam_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-black text-slate-900 font-mono">
                            {exam.total_net.toFixed(2)}
                          </td>
                          <td className="py-2.5 pl-2 text-right font-mono text-[11px]">
                            {diff !== 0 ? (
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                  diff > 0
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {diff > 0 ? '+' : ''}
                                {diff.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Henüz kayıtlı deneme bulunmuyor.
              </div>
            )}
          </Card>
        </div>

        {/* Sağ Alt (1/3): Kompakt Pomodoro Odaklanma Modülü */}
        <div className="lg:col-span-1">
          <PomodoroTimer
            studentId={student.id}
            variant="compact"
            onSessionComplete={async () => {
              await loadData();
              await refreshStudentData();
            }}
          />
        </div>
      </div>

      {/* Modals */}
      <AddStudyLogModal
        isOpen={showAddLog}
        onClose={() => setShowAddLog(false)}
        studentId={student.id}
        onAddLog={async (newLog) => {
          await db.addStudyLog(newLog);
          await loadData();
          await refreshStudentData();
        }}
      />

      <AddExamModal
        isOpen={showAddExam}
        onClose={() => setShowAddExam(false)}
        studentId={student.id}
        studentField={student.field}
        onAddExam={async (newExam) => {
          await db.addExam(newExam);
          await loadData();
          await refreshStudentData();
        }}
      />

      {showAvatarModal && (
        <StudentAvatarModal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          student={student}
          onSaveAvatar={async (newAvatarUrl) => {
            await db.updateStudent(student.id, { avatar_url: newAvatarUrl });
            await loadData();
            await refreshStudentData();
          }}
        />
      )}

      {/* Stres Yönetimi & Nefes Egzersizi Modal */}
      <BreathingExercise
        isOpen={showBreathingModal}
        onClose={() => setShowBreathingModal(false)}
      />

      {/* Başarı Hikayeleri & Dereceler Modal */}
      <SuccessStoriesModal
        isOpen={showSuccessStoriesModal}
        onClose={() => setShowSuccessStoriesModal(false)}
      />
    </div>
  );
};
