import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/db';
import { Student, ExamResult, StudyLog, Task } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { RiskBadge } from '../../components/common/RiskBadge';
import { ChartCard } from '../../components/dashboard/ChartCard';
import { AnimatedNumber } from '../../components/dashboard/AnimatedNumber';
import { SkeletonKPIGrid } from '../../components/dashboard/SkeletonCard';
import { AddStudentModal } from '../../components/modals/AddStudentModal';
import { AddTaskModal } from '../../components/modals/AddTaskModal';
import { AddExamModal } from '../../components/modals/AddExamModal';
import { useAuth } from '../../hooks/useAuth';
import { generateStudentPdfReport } from '../../utils/pdfReport';
import { ParentMeetingModal } from '../../components/modals/ParentMeetingModal';
import {
  Users,
  AlertTriangle,
  Award,
  BookOpen,
  UserPlus,
  CheckSquare,
  FileText,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  FileCheck,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Flame,
  PhoneCall,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const VIBRANT_BAR_COLORS = [
  '#4f46e5', // Zengin İndigo
  '#2563eb', // Elektrik Mavisi
  '#10b981', // Zümrüt Yeşili
  '#8b5cf6', // Canlı Mor
  '#f59e0b', // Sıcak Amber
  '#ec4899', // Canlı Pembe
];

export const CoachDashboardPage: React.FC = () => {
  const { user, role } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Student Portfolio Table Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('all');
  const [selectedFieldFilter, setSelectedFieldFilter] = useState<'all' | 'SAY' | 'EA' | 'SÖZ' | 'DİL'>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<'all' | '11' | '12' | 'Mezun'>('all');

  const isHeadCoach = role === 'head_coach' || user?.role === 'head_coach' || user?.email === 'serkankocak551@gmail.com';

  // Modals state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [showParentMeeting, setShowParentMeeting] = useState(false);
  const [selectedStudentForExam, setSelectedStudentForExam] = useState<string>('');

  const navigate = useNavigate();

  const loadDashboardData = async (showSpinner = false) => {
    try {
      if (showSpinner || students.length === 0) {
        setIsLoading(true);
      }
      const [stu, ex, logs, t, approvals] = await Promise.all([
        db.getStudents(user?.id),
        db.getExams(),
        db.getStudyLogs(),
        db.getTasks(),
        db.getPendingXpApprovalsCount(),
      ]);
      setStudents(stu);
      setExams(ex);
      setStudyLogs(logs);
      setTasks(t);
      setPendingApprovalsCount(approvals);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData(true);
    const handleUpdate = () => loadDashboardData(false);
    window.addEventListener('students_updated', handleUpdate);
    window.addEventListener('tasks_updated', handleUpdate);
    window.addEventListener('approvals_updated', handleUpdate);
    window.addEventListener('study_logs_updated', handleUpdate);
    window.addEventListener('exams_updated', handleUpdate);
    return () => {
      window.removeEventListener('students_updated', handleUpdate);
      window.removeEventListener('tasks_updated', handleUpdate);
      window.removeEventListener('approvals_updated', handleUpdate);
      window.removeEventListener('study_logs_updated', handleUpdate);
      window.removeEventListener('exams_updated', handleUpdate);
    };
  }, [user?.id]);

  // Aggregated KPIs
  const totalStudents = students.length;
  const criticalRiskStudents = useMemo(
    () => students.filter((s) => s.risk_level === 'HIGH' || s.risk_level === 'CRITICAL'),
    [students]
  );
  const mediumRiskStudents = useMemo(
    () => students.filter((s) => s.risk_level === 'MEDIUM'),
    [students]
  );
  const lowRiskStudents = useMemo(
    () => students.filter((s) => s.risk_level === 'LOW' || !s.risk_level),
    [students]
  );

  const totalQuestions = useMemo(
    () => studyLogs.reduce((acc, curr) => acc + (curr.question_count || 0), 0),
    [studyLogs]
  );
  const pendingTasks = useMemo(
    () => tasks.filter((t) => t.status === 'Bekliyor' || t.status === 'Devam Ediyor').length,
    [tasks]
  );

  // Filtered Students for Table
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.target_university?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRisk =
        selectedRiskFilter === 'all' || s.risk_level === selectedRiskFilter;

      const matchesField =
        selectedFieldFilter === 'all' || s.field === selectedFieldFilter;

      const matchesGrade =
        selectedGradeFilter === 'all' || s.grade === selectedGradeFilter;

      return matchesSearch && matchesRisk && matchesField && matchesGrade;
    });
  }, [students, searchQuery, selectedRiskFilter, selectedFieldFilter, selectedGradeFilter]);

  // Chart Data: Subject Question Distribution
  const subjectChartData = useMemo(() => {
    const subjectQuestionMap: { [key: string]: number } = {};
    studyLogs.forEach((l) => {
      subjectQuestionMap[l.subject_name] =
        (subjectQuestionMap[l.subject_name] || 0) + (l.question_count || 0);
    });
    return Object.entries(subjectQuestionMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [studyLogs]);

  // Chart Data: Risk Distribution with vibrant colors
  const riskPieData = useMemo(() => {
    return [
      { name: 'Düşük Risk', value: lowRiskStudents.length, color: '#10b981' },
      { name: 'Orta Risk', value: mediumRiskStudents.length, color: '#f59e0b' },
      { name: 'Yüksek & Kritik', value: criticalRiskStudents.length, color: '#ef4444' },
    ].filter((d) => d.value > 0);
  }, [lowRiskStudents, mediumRiskStudents, criticalRiskStudents]);

  // Download PDF Report for student
  const handleDownloadPdf = async (student: Student) => {
    const [studentGoal, studentExams, studentLogs, studentTasks, studentBadges] =
      await Promise.all([
        db.getGoal(student.id),
        db.getExamsByStudent(student.id),
        db.getStudyLogsByStudent(student.id),
        db.getTasksByStudent(student.id),
        db.getStudentBadges(student.id),
      ]);

    await generateStudentPdfReport({
      student,
      goal: studentGoal,
      exams: studentExams,
      logs: studentLogs,
      tasks: studentTasks,
      badges: studentBadges,
    });
  };

  if (isLoading && students.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="h-36 bg-slate-200/80 rounded-3xl animate-pulse" />
        <SkeletonKPIGrid count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 bg-slate-50 min-h-screen font-sans text-slate-900 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* 1. Top Command Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 rounded-2xl border border-indigo-900/40 shadow-lg text-white flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-xs">
              <Award className="w-5 h-5 text-indigo-400" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {isHeadCoach ? 'Mahfaza.co — Kıdemli Koç Yönetim Paneli' : 'Koçluk Genel Bakış & Komuta Merkezi'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-indigo-200/80 font-medium max-w-2xl">
            Öğrenci portföyü, anlık akademik risk durumu ve görev tamamlama göstergeleri
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/coach/approvals')}
            leftIcon={<FileCheck className="w-4 h-4 text-indigo-400" />}
            className="border-indigo-400/30 text-white bg-white/5 hover:bg-white/15 font-bold backdrop-blur-xs transition-all duration-300 hover:shadow-md"
          >
            <span>Onaylar</span>
            {pendingApprovalsCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                {pendingApprovalsCount}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowParentMeeting(true)}
            leftIcon={<PhoneCall className="w-4 h-4 text-emerald-300" />}
            className="border-emerald-400/40 text-emerald-100 bg-emerald-500/10 hover:bg-emerald-500/20 font-bold backdrop-blur-xs transition-all duration-300 hover:shadow-md"
          >
            Veli Görüşme Kaydı
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddTask(true)}
            leftIcon={<CheckSquare className="w-4 h-4 text-indigo-300" />}
            className="border-indigo-400/30 text-white bg-white/5 hover:bg-white/15 font-bold backdrop-blur-xs transition-all duration-300 hover:shadow-md"
          >
            Görev Ata
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddStudent(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md hover:shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5"
          >
            Öğrenci Ekle
          </Button>
        </div>
      </div>

      {/* 2. Vibrant Stat Cards with Rich Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1: Toplam Portföy */}
        <StatCard
          title="Toplam Portföy"
          value={<AnimatedNumber value={totalStudents} suffix=" Öğrenci" />}
          subtitle="Aktif danışmanlık listesi"
          icon={<Users className="w-5 h-5 text-indigo-600" />}
          variant="indigo"
          onClick={() => navigate('/coach/students')}
          className="hover:border-indigo-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        />

        {/* 2: Kritik & Riskli Öğrenciler */}
        <StatCard
          title="Kritik & Riskli"
          value={<AnimatedNumber value={criticalRiskStudents.length} suffix=" Öğrenci" />}
          subtitle="Acil takip ve müdahale"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          variant="rose"
          onClick={() => navigate('/coach/risk-analysis')}
          className="hover:border-rose-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        />

        {/* 3: Bekleyen Görevler */}
        <StatCard
          title="Bekleyen Görevler"
          value={<AnimatedNumber value={pendingTasks} />}
          subtitle="Öğrencilerde aktif süreç"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          variant="amber"
          onClick={() => navigate('/coach/tasks')}
          className="hover:border-amber-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        />

        {/* 4: Soru Havuzu */}
        <StatCard
          title="Soru Havuzu"
          value={<AnimatedNumber value={totalQuestions} suffix=" Soru" />}
          subtitle="Toplam çözülen pratik"
          icon={<BookOpen className="w-5 h-5 text-emerald-600" />}
          variant="emerald"
          onClick={() => navigate('/coach/study-logs')}
          className="hover:border-emerald-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        />
      </div>

      {/* 3. Balanced Middle Section (Zero Dead Space Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Card: Acil Müdahale Gerektiren Öğrenciler (6 cols) */}
        <div className="lg:col-span-6 flex flex-col">
          <Card className="p-5 sm:p-6 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                      Acil Müdahale Gerektiren Öğrenciler
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Net düşüşü veya aksayan çalışma temposu tespit edilenler
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold font-mono">
                  {criticalRiskStudents.length} Riskli
                </span>
              </div>

              {/* Critical Students List */}
              <div className="mt-3.5 space-y-2.5">
                {criticalRiskStudents.slice(0, 4).map((stu) => (
                  <div
                    key={stu.id}
                    className="p-3 rounded-xl bg-gradient-to-r from-rose-50/50 via-white to-slate-50 border border-rose-200/80 hover:border-rose-300 hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">{stu.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {stu.field} • {stu.grade}
                        </span>
                      </div>
                      {stu.risk_reasons && stu.risk_reasons.length > 0 && (
                        <p className="text-[11px] text-rose-700 font-medium truncate flex items-center gap-1">
                          <span className="text-rose-500">⚠️</span> {stu.risk_reasons[0]}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPdf(stu)}
                        className="text-[11px] h-7 px-2 border-slate-200 text-slate-700 hover:bg-slate-100"
                        title="PDF Karnesi"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/coach/students/${stu.id}`)}
                        className="text-[11px] h-7 px-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold"
                      >
                        İncele
                      </Button>
                    </div>
                  </div>
                ))}

                {criticalRiskStudents.length === 0 && (
                  <div className="p-6 text-center bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-medium flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <span>Harika! Portföyünüzde şu anda acil müdahale gerektiren yüksek riskli öğrenci bulunmuyor.</span>
                  </div>
                )}
              </div>
            </div>

            {criticalRiskStudents.length > 4 && (
              <div className="pt-3 border-t border-slate-100 text-center">
                <button
                  onClick={() => navigate('/coach/risk-analysis')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  Tüm Riskli Öğrencileri Görüntüle ({criticalRiskStudents.length}) <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Card: 2 Side-by-Side Vibrant Charts (6 cols) */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Chart 1: Risk Distribution Donut */}
          <ChartCard
            title="Portföy Risk Dağılımı"
            subtitle="Tüm öğrencilerin risk analizi"
            className="p-4 sm:p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl flex flex-col justify-between"
          >
            <div className="h-40 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={60}
                    paddingAngle={5}
                  >
                    {riskPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-[11px] text-slate-600 pt-2.5 border-t border-slate-100 font-medium">
              {riskPieData.map((r) => (
                <span key={r.name} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: r.color }} />
                  <span>{r.name}: <strong className="text-slate-900 font-bold">{r.value}</strong></span>
                </span>
              ))}
            </div>
          </ChartCard>

          {/* Chart 2: Subject Question Volume Bar Chart with Vibrant Colors */}
          <ChartCard
            title="Branş Soru Dağılımı"
            subtitle="En çok pratik yapılan dersler"
            className="p-4 sm:p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl flex flex-col justify-between"
          >
            <div className="h-40 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData} margin={{ top: 8, right: 8, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  />
                  <Bar dataKey="count" radius={[5, 5, 0, 0]} name="Çözülen Soru">
                    {subjectChartData.map((_, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={VIBRANT_BAR_COLORS[index % VIBRANT_BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2.5 border-t border-slate-100 font-medium">
              <span>Toplam: <strong className="text-slate-800 font-bold">{totalQuestions} Soru</strong></span>
              <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                <Sparkles className="w-3 h-3" /> Canlı Veri
              </span>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* 4. Full Student Portfolio Table (Directly underneath with clean spacing) */}
      <Card className="p-5 sm:p-7 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Öğrenci Portföy Tablosu ({students.length})
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Tüm öğrencileri arayın, risk ve alanlarına göre filtreleyip doğrudan gelişimini takip edin
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Öğrenci veya hedef ara..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50 transition-all"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider">Alan:</span>
          {(['all', 'SAY', 'EA', 'SÖZ', 'DİL'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFieldFilter(f)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedFieldFilter === f
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? 'Tüm Alanlar' : f}
            </button>
          ))}

          <span className="text-[11px] font-bold text-slate-400 ml-3 mr-1 uppercase tracking-wider">Risk:</span>
          {(['all', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRiskFilter(r)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedRiskFilter === r
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r === 'all' ? 'Tüm Seviyeler' : r === 'LOW' ? 'Düşük' : r === 'MEDIUM' ? 'Orta' : 'Kritik'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                <th className="py-3.5 px-4">Öğrenci</th>
                <th className="py-3.5 px-4">Alan & Sınıf</th>
                <th className="py-3.5 px-4">Hedef Üniversite</th>
                <th className="py-3.5 px-4">Risk Durumu</th>
                <th className="py-3.5 px-4 text-right">XP & Seri</th>
                <th className="py-3.5 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((stu) => (
                <tr
                  key={stu.id}
                  className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/coach/students/${stu.id}`)}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                        {stu.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {stu.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">{stu.match_code}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800">{stu.field}</span>
                    <span className="text-slate-400 ml-1">• {stu.grade}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900 truncate max-w-[200px]">
                      {stu.target_university || 'Belirtilmedi'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Hedef Sıra: #{stu.target_rank || 1000}
                    </p>
                  </td>

                  <td className="py-3.5 px-4">
                    <RiskBadge level={stu.risk_level} score={stu.risk_score} />
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <p className="font-bold font-mono text-amber-600">{stu.xp || 0} XP</p>
                    <p className="text-[10px] text-slate-500 font-medium flex items-center justify-end gap-0.5">
                      <Flame className="w-3 h-3 text-orange-500 fill-orange-500" /> {stu.streak_days || 0} gün
                    </p>
                  </td>

                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPdf(stu)}
                        className="text-xs p-1.5 h-8 bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all"
                        title="PDF Karnesi İndir"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/coach/students/${stu.id}`)}
                        className="text-xs px-3 h-8 bg-slate-900 hover:bg-indigo-600 text-white font-bold transition-all shadow-xs"
                      >
                        Detay
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm text-slate-700">Henüz kayıtlı öğrenci bulunmuyor</p>
                      <p className="text-xs text-slate-400">Yeni öğrenci eklemek veya eşleşme kodu ile bağlamak için "Öğrenci Ekle" butonunu kullanabilirsiniz.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <AddStudentModal
        isOpen={showAddStudent}
        onClose={() => setShowAddStudent(false)}
        coachId={user?.user_id || user?.id || ''}
        onAdd={async () => {
          await loadDashboardData();
        }}
      />

      <AddTaskModal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        students={students}
        coachId={user?.user_id || user?.id || ''}
        onAddTask={async (newTask) => {
          await db.addTask(newTask);
          await loadDashboardData();
        }}
      />

      <ParentMeetingModal
        isOpen={showParentMeeting}
        onClose={() => setShowParentMeeting(false)}
        students={students}
      />

      {selectedStudentForExam && (
        <AddExamModal
          isOpen={showAddExam}
          onClose={() => setShowAddExam(false)}
          studentId={selectedStudentForExam}
          onAddExam={async (newExam) => {
            await db.addExam(newExam);
            await loadDashboardData();
          }}
        />
      )}
    </div>
  );
};
