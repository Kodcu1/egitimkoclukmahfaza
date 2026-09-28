import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/db';
import { Student, StudentGoal, ExamResult, StudyLog, Task, StudentBadge } from '../../types';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { RiskBadge } from '../../components/common/RiskBadge';
import { ChartCard } from '../../components/dashboard/ChartCard';
import { AnimatedNumber } from '../../components/dashboard/AnimatedNumber';
import { SkeletonKPIGrid } from '../../components/dashboard/SkeletonCard';
import { generateStudentPdfReport } from '../../utils/pdfReport';
import { UpgradeModal } from '../../components/modals/UpgradeModal';
import { useToast } from '../../context/ToastContext';
import { formatDurationHours, formatDateTurkish } from '../../utils/formatters';
import {
  Users,
  Flame,
  Award,
  BookOpen,
  CheckSquare,
  FileDown,
  Target,
  KeyRound,
  MessageSquareQuote,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const ParentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [student, setStudent] = useState<Student | null>(null);
  const [goal, setGoal] = useState<StudentGoal | null>(null);
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [badges, setBadges] = useState<StudentBadge[]>([]);

  const [matchCodeInput, setMatchCodeInput] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Upgrade Modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalConfig, setUpgradeModalConfig] = useState<{
    featureName: string;
    requiredPlan: 'Starter' | 'Pro' | 'Premium' | 'Kurumsal';
    description?: string;
    currentPlanName?: string;
  }>({
    featureName: 'PDF Gelişim Raporu',
    requiredPlan: 'Starter',
  });

  const loadParentData = async () => {
    try {
      setIsLoading(true);
      const allStudents = await db.getStudents();
      const parentStudents = allStudents.filter(
        (s) => s.parent_id === user?.id || (user?.user_id && s.parent_id === user.user_id)
      );
      setStudentsList(parentStudents);

      const matched =
        parentStudents.find((s) => s.id === selectedStudentId) ||
        parentStudents[0] ||
        null;

      if (matched) {
        setSelectedStudentId(matched.id);
        setStudent(matched);
        const [g, ex, logs, t, b] = await Promise.all([
          db.getGoal(matched.id),
          db.getExamsByStudent(matched.id),
          db.getStudyLogsByStudent(matched.id),
          db.getTasksByStudent(matched.id),
          db.getStudentBadges(matched.id),
        ]);
        setGoal(g);
        setExams(ex);
        setStudyLogs(logs);
        setTasks(t);
        setBadges(b);
      } else {
        setStudent(null);
        setGoal(null);
        setExams([]);
        setStudyLogs([]);
        setTasks([]);
        setBadges([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChild = async (childId: string) => {
    setSelectedStudentId(childId);
    const matched = studentsList.find((s) => s.id === childId);
    if (matched) {
      setStudent(matched);
      const [g, ex, logs, t, b] = await Promise.all([
        db.getGoal(matched.id),
        db.getExamsByStudent(matched.id),
        db.getStudyLogsByStudent(matched.id),
        db.getTasksByStudent(matched.id),
        db.getStudentBadges(matched.id),
      ]);
      setGoal(g);
      setExams(ex);
      setStudyLogs(logs);
      setTasks(t);
      setBadges(b);
    }
  };

  useEffect(() => {
    loadParentData();
  }, [user]);

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);
    setLinkSuccess(null);
    setIsLinking(true);

    try {
      if (!user) throw new Error('Oturum bilgisi bulunamadı.');
      const linked = await db.matchStudentWithCode(matchCodeInput.trim().toUpperCase(), user.id);
      setLinkSuccess(`"${linked.name}" isimli öğrenci hesabınıza başarıyla bağlandı!`);
      setMatchCodeInput('');
      await loadParentData();
    } catch (err: any) {
      setLinkError(err.message || 'Eşleşme kodu geçersiz.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!student) return;
    try {
      const actorId = user?.id || student.coach_id || student.id;
      const access = await db.checkFeatureAccess(actorId, 'pdf_reports');
      if (!access.hasAccess) {
        setUpgradeModalConfig({
          featureName: 'Resmi PDF Gelişim Karnesi ve Rapor İndirme',
          requiredPlan: 'Starter',
          description:
            access.reason ||
            'Resmi PDF Gelişim Karnesi indirme özelliği Starter ve üzeri paketlerde kullanılabilir.',
          currentPlanName: access.currentPlanName,
        });
        setShowUpgradeModal(true);
        return;
      }

      setIsGeneratingPdf(true);
      await generateStudentPdfReport({
        student,
        goal,
        exams,
        logs: studyLogs,
        tasks,
        badges,
      });
      toast.success('Öğrenci gelişim raporu PDF olarak indirildi.');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('PDF raporu oluşturulamadı.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const totalQuestions = useMemo(
    () => studyLogs.reduce((acc, curr) => acc + (curr.question_count || 0), 0),
    [studyLogs]
  );
  const totalMinutes = useMemo(
    () => studyLogs.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0),
    [studyLogs]
  );

  // Weekly questions
  const weeklyQuestions = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    return studyLogs
      .filter((l) => new Date(l.study_date).getTime() >= sevenDaysAgo)
      .reduce((acc, curr) => acc + (curr.question_count || 0), 0);
  }, [studyLogs]);

  // Latest TYT & AYT
  const latestTYT = useMemo(
    () => exams.find((e) => e.exam_type === 'TYT'),
    [exams]
  );
  const latestAYT = useMemo(
    () => exams.find((e) => e.exam_type === 'AYT'),
    [exams]
  );

  // Task Completion Rate
  const completedTasksCount = useMemo(
    () => tasks.filter((t) => t.status === 'Tamamlandı').length,
    [tasks]
  );
  const taskSuccessRate = tasks.length > 0
    ? Math.round((completedTasksCount / tasks.length) * 100)
    : 100;

  // Chart data
  const trendData = useMemo(() => {
    return exams
      .slice()
      .reverse()
      .map((e) => ({
        date: formatDateTurkish(e.exam_date),
        name: e.exam_name,
        net: Number(e.total_net.toFixed(2)),
        type: e.exam_type,
      }));
  }, [exams]);

  if (isLoading && !student) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="h-44 bg-slate-200/80 rounded-3xl animate-pulse" />
        <SkeletonKPIGrid count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Banner / Header Hero */}
      <div className="relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0F172A] p-6 sm:p-7 rounded-3xl border border-indigo-500/30 shadow-xl text-white">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-amber-400 border border-indigo-400/30 shadow-sm">
              <Users className="w-5 h-5 text-amber-300" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Veli Bilgilendirme & Takip Portalı
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-indigo-200 font-medium max-w-xl">
            Mahfaza.co Eğitim Koçluğu • Öğrencinizin anlık YKS 2027 çalışma disiplini, deneme netleri ve koçluk değerlendirmeleri
          </p>
        </div>

        {student && (
          <div className="flex flex-wrap items-center gap-2.5 relative z-10 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/parent/messages')}
              leftIcon={<MessageSquare className="w-4 h-4 text-indigo-300" />}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Koça Mesaj Yaz
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadPdf}
              isLoading={isGeneratingPdf}
              leftIcon={<FileDown className="w-4 h-4 text-emerald-300" />}
              className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-600/30"
            >
              Gelişim Karnesi (PDF)
            </Button>
          </div>
        )}
      </div>

      {/* 2. Multiple Children Tabs & Match Drawer */}
      <Card className="p-4 sm:p-5 bg-white border border-slate-200 shadow-sm rounded-3xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Child Select Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-500 shrink-0 mr-1">Öğrenci:</span>
            {studentsList.map((stu) => (
              <button
                key={stu.id}
                onClick={() => handleSelectChild(stu.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  student?.id === stu.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{stu.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  student?.id === stu.id ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {stu.grade}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Match Form */}
          <form onSubmit={handleLinkStudent} className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <div className="relative">
              <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Örn: STU-AHMET-2027"
                value={matchCodeInput}
                onChange={(e) => setMatchCodeInput(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-mono uppercase focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 w-44"
                required
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" isLoading={isLinking} className="text-xs">
              Yeni Bağla
            </Button>
          </form>
        </div>

        {linkSuccess && <p className="text-xs text-emerald-600 font-semibold">{linkSuccess}</p>}
        {linkError && <p className="text-xs text-rose-600 font-semibold">{linkError}</p>}
      </Card>

      {student ? (
        <>
          {/* 3. Student Profile & Coach Observation Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Student Target Overview (2 cols) */}
            <Card className="lg:col-span-2 p-5 sm:p-6 bg-white border border-slate-200 shadow-sm rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg overflow-hidden shrink-0">
                    {student.avatar_url ? (
                      <img src={student.avatar_url} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      student.name.split(' ').map((n) => n[0]).join('')
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{student.name}</h3>
                      <Badge variant="primary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        {student.field} • {student.grade}
                      </Badge>
                      <RiskBadge level={student.risk_level} score={student.risk_score} />
                    </div>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1 font-medium">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      Hedef: <strong>{goal?.target_university || student.target_university}</strong> -{' '}
                      {goal?.target_department || student.target_department} (Hedef Sıra: #{student.target_rank})
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[11px] text-slate-400 block font-semibold uppercase">Akademik Durum</span>
                  <span className={`text-xs font-black ${student.risk_level === 'LOW' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {student.risk_level === 'LOW'
                      ? '✓ Hedefe Uygun İlerliyor'
                      : '⚡ Koç Tarafından Ek Takip Planlandı'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Right: Coach Observation Note */}
            <Card className="p-5 bg-amber-50/80 border border-amber-200 rounded-3xl space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="w-4 h-4 text-amber-700" />
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Koçun Veli Bilgilendirme Notu
                </h4>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-medium line-clamp-3">
                {student.coach_notes ||
                  `${student.name} bu hafta planlanan soru çözüm temposunu koruyor. Deneme analizlerindeki eksik kazanımlar tamamlanıyor.`}
              </p>
              <button
                onClick={() => navigate('/parent/messages')}
                className="text-[11px] text-amber-800 font-bold hover:underline flex items-center gap-1 pt-1"
              >
                <span>Koçla İletişime Geç</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </Card>
          </div>

          {/* 4. 5 KPI Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Son TYT Net */}
            <StatCard
              title="Son TYT Net"
              value={
                latestTYT ? (
                  <AnimatedNumber value={latestTYT.total_net} decimals={1} />
                ) : (
                  '-'
                )
              }
              subtitle={latestTYT ? formatDateTurkish(latestTYT.exam_date) : 'Kayıt yok'}
              icon={<Award className="w-4 h-4 text-indigo-600" />}
              variant="indigo"
            />

            {/* Son AYT Net */}
            <StatCard
              title="Son AYT Net"
              value={
                latestAYT ? (
                  <AnimatedNumber value={latestAYT.total_net} decimals={1} />
                ) : (
                  '-'
                )
              }
              subtitle={latestAYT ? formatDateTurkish(latestAYT.exam_date) : 'Kayıt yok'}
              icon={<Award className="w-4 h-4 text-amber-600" />}
              variant="amber"
            />

            {/* Haftalık Soru */}
            <StatCard
              title="Haftalık Soru"
              value={<AnimatedNumber value={weeklyQuestions} suffix=" Soru" />}
              subtitle={`Toplam: ${totalQuestions.toLocaleString()}`}
              icon={<BookOpen className="w-4 h-4 text-emerald-600" />}
              variant="emerald"
            />

            {/* Çalışma Süresi */}
            <StatCard
              title="Toplam Süre"
              value={formatDurationHours(totalMinutes)}
              subtitle="Odaklanılan ders saati"
              icon={<Clock className="w-4 h-4 text-cyan-600" />}
              variant="default"
            />

            {/* Görev Başarı Oranı */}
            <StatCard
              title="Görev Başarısı"
              value={`%${taskSuccessRate}`}
              subtitle={`${completedTasksCount}/${tasks.length} Görev Bitti`}
              icon={<CheckSquare className="w-4 h-4 text-purple-600" />}
              variant="default"
            />
          </div>

          {/* 5. Exam Net Trend Chart */}
          <Card className="p-5 sm:p-6 bg-white border border-slate-200 shadow-sm rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Deneme Net Gelişim Eğrisi
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Öğrencinizin katıldığı denemelerdeki net artış ve gelişim grafiği
                </p>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full pt-2">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="parentNetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
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
                            <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
                              <p className="font-bold text-amber-300">{data.name}</p>
                              <p className="text-slate-300">{data.date} • {data.type}</p>
                              <p className="text-sm font-black text-indigo-300">
                                Toplam Net: {data.net} Net
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="net"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#parentNetGrad)"
                      dot={{ r: 4, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Henüz kayıtlı deneme sınavı bulunmuyor.
                </div>
              )}
            </div>
          </Card>

          {/* 6. Recent Study Sessions & Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Logs */}
            <Card className="p-5 bg-white border border-slate-200 shadow-sm rounded-3xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" /> Son Çalışma Oturumları
                </h3>
                <span className="text-xs font-bold text-slate-400">Son 5 Kayıt</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {studyLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">
                        {log.subject_name} • {log.topic_name}
                      </span>
                      <p className="text-[11px] text-slate-400">{formatDateTurkish(log.study_date)}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 font-mono">
                        {log.question_count} Soru
                      </span>
                      <span className="block text-[11px] text-slate-500 font-medium">
                        {formatDurationHours(log.duration_minutes)}
                      </span>
                    </div>
                  </div>
                ))}
                {studyLogs.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">
                    Henüz kayıtlı çalışma oturumu bulunmuyor.
                  </div>
                )}
              </div>
            </Card>

            {/* Coaching Tasks */}
            <Card className="p-5 bg-white border border-slate-200 shadow-sm rounded-3xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-600" /> Koçluk Ödevleri ve Durum
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  {completedTasksCount}/{tasks.length} Tamamlandı
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {tasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{t.title}</span>
                      <p className="text-[11px] text-slate-400">Son Teslim: {formatDateTurkish(t.due_date)}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        t.status === 'Tamamlandı'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">
                    Henüz atanmış koçluk ödevi bulunmuyor.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card className="text-center py-12 bg-white border border-slate-200 rounded-3xl space-y-2">
          <p className="text-sm font-bold text-slate-700">Hesabınıza bağlı bir öğrenci bulunamadı.</p>
          <p className="text-xs text-slate-500">
            Lütfen yukarıdaki alana öğrencinizin profilindeki 6 haneli eşleşme kodunu giriniz.
          </p>
        </Card>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureName={upgradeModalConfig.featureName}
          requiredPlan={upgradeModalConfig.requiredPlan}
          description={upgradeModalConfig.description}
          currentPlanName={upgradeModalConfig.currentPlanName}
        />
      )}
    </div>
  );
};
