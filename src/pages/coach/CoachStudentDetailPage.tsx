import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../../lib/db';
import { Student, StudentGoal, ExamResult, StudyLog, Task, SmsLog, StudentMood } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { RiskBadge } from '../../components/common/RiskBadge';
import { Avatar } from '../../components/common/Avatar';
import { AddTaskModal } from '../../components/modals/AddTaskModal';
import { AddExamModal } from '../../components/modals/AddExamModal';
import { EditStudentModal } from '../../components/modals/EditStudentModal';
import { StudentAvatarModal } from '../../components/modals/StudentAvatarModal';
import { AIStudentAnalysisModal } from '../../components/ai/AIStudentAnalysisModal';
import { AIStudyPlanModal } from '../../components/ai/AIStudyPlanModal';
import { AICoachReportModal } from '../../components/ai/AICoachReportModal';
import { generateStudentPdfReport } from '../../utils/pdfReport';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import { UpgradeModal } from '../../components/modals/UpgradeModal';
import {
  ArrowLeft,
  Phone,
  Mail,
  GraduationCap,
  Target,
  Award,
  CheckSquare,
  BookOpen,
  MessageSquare,
  Send,
  FileDown,
  Sparkles,
  KeyRound,
  AlertTriangle,
  Smartphone,
  CheckCircle2,
  Clock,
  Edit3,
  Camera,
  Search,
  Filter,
  Bot,
  Zap,
  Heart,
  Smile,
  Calendar,
  MessageSquareQuote,
} from 'lucide-react';

type TabType = 'overview' | 'tasks' | 'exams' | 'studylogs' | 'moods' | 'sms_history';

export const CoachStudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [goal, setGoal] = useState<StudentGoal | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [moods, setMoods] = useState<StudentMood[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
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

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showAIAnalysisModal, setShowAIAnalysisModal] = useState(false);
  const [showAIStudyPlanModal, setShowAIStudyPlanModal] = useState(false);
  const [showAICoachReportModal, setShowAICoachReportModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Custom Quick SMS Composer state
  const [quickSmsType, setQuickSmsType] = useState('Motivasyon');
  const [quickSmsMessage, setQuickSmsMessage] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsFilter, setSmsFilter] = useState('ALL');

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [stu, studentsList, stuGoal, stuTasks, stuExams, stuLogs, stuSms, stuMoods] = await Promise.all([
        db.getStudentById(id),
        db.getStudents(),
        db.getGoal(id),
        db.getTasksByStudent(id),
        db.getExamsByStudent(id),
        db.getStudyLogsByStudent(id),
        db.getSmsLogs(id),
        db.getStudentMoods(id, 30),
      ]);

      const resolvedStudent = stu || studentsList.find((s) => s.id === id || s.user_id === id) || null;

      if (resolvedStudent) {
        const isFounderOrAdmin = user?.is_founder || user?.role === 'admin' || user?.role === 'head_coach' || user?.role === 'org_admin';
        const isAssignedCoach = !resolvedStudent.coach_id || resolvedStudent.coach_id === user?.id || (user?.user_id && resolvedStudent.coach_id === user.user_id);
        if (!isFounderOrAdmin && user?.role === 'coach' && !isAssignedCoach) {
          toast.error('Bu öğrencinin detaylarına erişim yetkiniz bulunmamaktadır.');
          navigate('/coach/students');
          return;
        }
        setStudent(resolvedStudent);
      } else {
        setStudent(null);
      }

      setAllStudents(studentsList);
      setGoal(stuGoal);
      setTasks(stuTasks);
      setExams(stuExams);
      setStudyLogs(stuLogs);
      setSmsLogs(stuSms);
      setMoods(stuMoods);
    } catch (err) {
      console.error('Error loading student details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('moods_updated', handleUpdate);
    window.addEventListener('students_updated', handleUpdate);
    return () => {
      window.removeEventListener('moods_updated', handleUpdate);
      window.removeEventListener('students_updated', handleUpdate);
    };
  }, [id]);

  const handleUpdateStudent = async (updatedData: Partial<Student>) => {
    if (!student) return;
    await db.updateStudent(student.id, updatedData);
    toast.success('Öğrenci bilgileri ve telefon numarası başarıyla güncellendi.');
    await loadData();
  };

  const handleSendQuickSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !quickSmsMessage.trim()) return;

    setIsSendingSms(true);
    try {
      const targetPhone = student.phoneNumber || student.phone || '0532 123 45 67';
      await db.addSmsLog({
        student_id: student.id,
        student_name: student.name,
        phone_number: targetPhone,
        action_type: quickSmsType,
        message_content: quickSmsMessage.trim(),
        status: 'İletildi',
      });
      setQuickSmsMessage('');
      toast.success('📱 SMS Bildirimi Başarıyla İletildi');
      const updatedSms = await db.getSmsLogs(student.id);
      setSmsLogs(updatedSms);
    } catch (err) {
      console.error('Failed to send SMS:', err);
      toast.error('SMS gönderilirken bir sorun oluştu.');
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!student) return;
    try {
      // Check Feature Access for PDF reports
      const actorId = user?.id || student.coach_id || student.id || student.user_id;
      const access = await db.checkFeatureAccess(actorId, 'pdf_reports');
      if (!access.hasAccess) {
        setUpgradeModalConfig({
          featureName: 'Resmi PDF Gelişim Karnesi ve Koçluk Raporu',
          requiredPlan: 'Starter',
          description:
            access.reason ||
            'Resmi PDF Gelişim Karnesi ve Rapor İndirme özelliği Starter ve üzeri paketlerde kullanılabilir.',
          currentPlanName: access.currentPlanName,
        });
        setShowUpgradeModal(true);
        return;
      }

      setIsGeneratingPdf(true);
      const badges = await db.getStudentBadges(student.id);
      await generateStudentPdfReport({
        student,
        goal,
        exams,
        logs: studyLogs,
        tasks,
        badges,
      });
      toast.success('Öğrenci gelişim ve koçluk raporu indirildi.');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('PDF raporu oluşturulamadı.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Öğrenci detayları yükleniyor...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Öğrenci Bulunamadı</h3>
        <p className="text-sm text-slate-500 mb-5">
          Aradığınız öğrenci kaydı sistemde mevcut değil veya silinmiş olabilir.
        </p>
        <Button variant="primary" onClick={() => navigate('/coach/students')}>
          Öğrenci Listesine Dön
        </Button>
      </div>
    );
  }

  const studentPhoneNumber = student.phoneNumber || student.phone || '0532 123 45 67';

  const filteredSmsLogs = smsLogs.filter((log) => {
    if (smsFilter === 'ALL') return true;
    return log.action_type === smsFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/coach/students')}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer shadow-xs"
            title="Öğrenciler Listesine Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
              <RiskBadge level={student.risk_level} score={student.risk_score} />
            </div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
              <span>{student.field} Alanı</span>
              <span>•</span>
              <span>{student.grade}</span>
              <span>•</span>
              <span className="font-mono text-indigo-600 font-semibold">{student.match_code}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Phase 3: AI Danışmanlık Grubu */}
          <div className="flex items-center gap-1.5 p-1 bg-indigo-50/80 rounded-xl border border-indigo-200/80 shadow-2xs">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAIAnalysisModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              leftIcon={<Bot className="w-3.5 h-3.5 text-amber-300 animate-pulse" />}
            >
              AI Analizi
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAIStudyPlanModal(true)}
              className="bg-white hover:bg-indigo-100/50 text-indigo-900 border-indigo-200 text-xs font-bold"
              leftIcon={<Zap className="w-3.5 h-3.5 text-amber-500" />}
            >
              AI Planı
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAICoachReportModal(true)}
              className="bg-white hover:bg-indigo-100/50 text-indigo-900 border-indigo-200 text-xs font-bold"
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
            >
              AI Raporu
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditModal(true)}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
          >
            Düzenle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTaskModal(true)}
            leftIcon={<CheckSquare className="w-3.5 h-3.5 text-amber-600" />}
          >
            Görev Ata
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExamModal(true)}
            leftIcon={<Award className="w-3.5 h-3.5 text-indigo-600" />}
          >
            Deneme Ekle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            isLoading={isGeneratingPdf}
            leftIcon={<FileDown className="w-3.5 h-3.5 text-emerald-600" />}
          >
            PDF Raporu
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/coach/messages')}
            leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
          >
            Mesaj Gönder
          </Button>
        </div>
      </div>

      {/* Main Student Header Card with Phone Number & Target Badges */}
      <Card className="p-5 bg-white border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Avatar & Contact Info */}
          <div className="flex items-center gap-4 lg:border-r lg:border-slate-100 lg:pr-6">
            <div
              onClick={() => setShowAvatarModal(true)}
              className="relative group cursor-pointer shrink-0"
              title="Profil Fotoğrafını Değiştir"
            >
              <Avatar name={student.name} src={student.avatar_url} size="xl" />
              <div className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded-full shadow-xs transition-transform group-hover:scale-110">
                <Camera className="w-3 h-3" />
              </div>
            </div>

            <div className="space-y-1.5 min-w-0">
              <h3 className="font-bold text-base text-slate-900 truncate">{student.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{student.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  {studentPhoneNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Academic & Target Goals */}
          <div className="space-y-2 lg:border-r lg:border-slate-100 lg:pr-6">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Hedef Üniversite:</span>
              <span className="font-bold text-slate-900 truncate max-w-[200px]">
                {student.target_university}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Hedef Bölüm:</span>
              <span className="font-bold text-indigo-700 truncate max-w-[200px]">
                {student.target_department}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Hedef Sıralama & Puan:</span>
              <span className="font-mono font-bold text-amber-700">
                #{student.target_rank} • {student.target_score} Puan
              </span>
            </div>
          </div>

          {/* Gamification & Veli Eşleşme */}
          <div className="flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="font-bold text-slate-900 block">Level {student.level}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{student.xp} Toplam XP</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Eşleşme Kodu</span>
                <span className="font-mono font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200/60">
                  {student.match_code}
                </span>
              </div>
            </div>

            {student.coach_notes && (
              <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200/60 text-[11px] text-slate-800 line-clamp-1 italic">
                "{student.coach_notes}"
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Target className="w-4 h-4 text-indigo-400" />
          <span>Genel Bakış & Hedefler</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'tasks'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-amber-400" />
          <span>Görevler ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'exams'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4 text-purple-400" />
          <span>Deneme Sonuçları ({exams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('studylogs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'studylogs'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Çalışma Kayıtları ({studyLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('moods')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'moods'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500" />
          <span>Duygu & Psikoloji ({moods.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sms_history')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'sms_history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>İletişim & SMS Geçmişi</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
            {smsLogs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: İLETİŞİM & SMS GEÇMİŞİ */}
      {activeTab === 'sms_history' && (
        <div className="space-y-6">
          {/* Quick Metrics & SMS Info Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Toplam SMS İletimi</p>
                <h4 className="text-xl font-extrabold text-slate-900">{smsLogs.length} Mesaj</h4>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Başarılı İletim Oranı</p>
                <h4 className="text-xl font-extrabold text-emerald-700">%100 İletildi</h4>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Kayıtlı GSM Hattı</p>
                <h4 className="text-sm font-bold font-mono text-slate-900">{studentPhoneNumber}</h4>
              </div>
            </Card>
          </div>

          {/* Quick Send SMS Form */}
          <Card className="p-5 bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <Send className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">
                Öğrenciye Doğrudan SMS Bildirimi Gönder
              </h4>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Öğrencinin kayıtlı numarasına ({studentPhoneNumber}) anında koçluk bilgilendirmesi, deneme analizi veya motivasyon SMS'i iletin.
            </p>

            <form onSubmit={handleSendQuickSms} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    İşlem Türü
                  </label>
                  <select
                    value={quickSmsType}
                    onChange={(e) => setQuickSmsType(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Motivasyon">Motivasyon</option>
                    <option value="Görev Atama">Görev Atama</option>
                    <option value="Deneme Bildirimi">Deneme Bildirimi</option>
                    <option value="Haftalık Rapor">Haftalık Rapor</option>
                    <option value="Koç Notu">Koç Notu</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    SMS İçeriği & Mesaj Metni
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={quickSmsMessage}
                      onChange={(e) => setQuickSmsMessage(e.target.value)}
                      placeholder="Örn: Sn. Ahmet, yarınki TYT branş denemesini saat 10:00'da başlatmayı unutma. Başarılar!"
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={!quickSmsMessage.trim() || isSendingSms}
                      isLoading={isSendingSms}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      SMS Gönder
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Card>

          {/* SMS History Table */}
          <Card className="bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-700" />
                <h4 className="font-bold text-sm text-slate-900">İletim & SMS Log Kayıtları</h4>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={smsFilter}
                  onChange={(e) => setSmsFilter(e.target.value)}
                  className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none"
                >
                  <option value="ALL">Tüm İşlem Türleri</option>
                  <option value="Görev Atama">Görev Atama</option>
                  <option value="Haftalık Rapor">Haftalık Rapor</option>
                  <option value="Deneme Bildirimi">Deneme Bildirimi</option>
                  <option value="Motivasyon">Motivasyon</option>
                  <option value="Koç Notu">Koç Notu</option>
                </select>
              </div>
            </div>

            {filteredSmsLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Smartphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium">Bu filtreye uygun SMS kaydı bulunamadı.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Tarih & Saat</th>
                      <th className="py-3 px-4">Gönderilen Numara</th>
                      <th className="py-3 px-4">İşlem Türü</th>
                      <th className="py-3 px-4">SMS Mesaj İçeriği</th>
                      <th className="py-3 px-4 text-center">İletim Durumu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredSmsLogs.map((log) => {
                      const dateObj = new Date(log.sent_at);
                      const formattedDate = dateObj.toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Tarih & Saat */}
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{formattedDate}</span>
                            </div>
                          </td>

                          {/* Gönderilen Numara */}
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                                {log.phone_number}
                              </span>
                            </div>
                          </td>

                          {/* İşlem Türü */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                log.action_type === 'Görev Atama'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : log.action_type === 'Deneme Bildirimi'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : log.action_type === 'Haftalık Rapor'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  : log.action_type === 'Motivasyon'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-slate-100 text-slate-800 border-slate-200'
                              }`}
                            >
                              {log.action_type}
                            </span>
                          </td>

                          {/* Mesaj İçeriği */}
                          <td className="py-3.5 px-4 max-w-md">
                            <p className="text-slate-800 font-medium leading-relaxed line-clamp-2">
                              {log.message_content}
                            </p>
                          </td>

                          {/* İletim Durumu */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                log.status === 'İletildi'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : log.status === 'Beklemede'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{log.status}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: GENEL BAKIŞ & HEDEFLER */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5 bg-white border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" /> {student.target_exam || 'Sınav'} Hedef Profili
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Hedef Kurum / Üniversite</span>
                  <span className="font-bold text-slate-900">{student.target_university}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Hedef Bölüm / Kadro</span>
                  <span className="font-bold text-indigo-700">{student.target_department}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Hedef Başarı Sıralaması</span>
                  <span className="font-bold font-mono text-amber-700">#{student.target_rank}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Hedef Taban Puan</span>
                  <span className="font-bold font-mono text-slate-900">{student.target_score} Puan</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">İletişim Telefonu</span>
                  <span className="font-bold font-mono text-emerald-700">{studentPhoneNumber}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-white border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Risk Analizi & Koç Gözlemleri
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Mevcut Risk Skoru:</span>
                  <RiskBadge level={student.risk_level} score={student.risk_score} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-slate-500 font-semibold">Tespit Edilen Faktörler:</p>
                  {student.risk_reasons && student.risk_reasons.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {student.risk_reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-emerald-600 font-medium">Risk unsuru tespit edilmedi.</p>
                  )}
                </div>
                {student.coach_notes && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-slate-800">
                    <p className="font-bold text-amber-900 text-[11px] mb-1">Koçluk Strateji Notu:</p>
                    <p className="italic">{student.coach_notes}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Psychological Mood Summary in Overview */}
          <Card className="p-5 bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Günlük Duygu Durumu & Psikolojik Nabız</h4>
                  <p className="text-xs text-slate-500">Öğrencinin son günlerdeki motivasyon ve ruh hali seyri</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('moods')}
                className="text-xs"
              >
                Tüm Geçmişi Gör ({moods.length})
              </Button>
            </div>

            {moods.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Öğrenci henüz günlük duygu durumu girişi yapmadı.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-2">
                {moods.slice(0, 7).map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center gap-1 hover:border-indigo-300 transition-colors"
                  >
                    <span className="text-2xl">{m.mood_emoji}</span>
                    <span className="text-xs font-bold text-slate-900 line-clamp-1">{m.mood_label}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(m.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </span>
                    {m.note && (
                      <span className="text-[10px] text-indigo-600 line-clamp-1 italic max-w-full">
                        "{m.note}"
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB: DUYGU & PSİKOLOJİK TAKİP (30 GÜNLÜK GEÇMİŞ) */}
      {activeTab === 'moods' && (
        <div className="space-y-6">
          {/* Header Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Toplam Kayıtlı Gün</p>
                <h4 className="text-xl font-extrabold text-slate-900">{moods.length} Gün</h4>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                <Smile className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Son Ruh Hali</p>
                <h4 className="text-sm font-extrabold text-indigo-900 flex items-center gap-1.5 mt-0.5">
                  <span>{moods[0]?.mood_emoji || '—'}</span>
                  <span>{moods[0]?.mood_label || 'Giriş yapılmadı'}</span>
                </h4>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Psikolojik Motivasyon Seviyesi</p>
                <h4 className="text-sm font-bold text-amber-800">
                  {moods.some((m) => m.sentiment === 'positive') ? '⚡ Yüksek / Canlı' : 'Dengeli Takip'}
                </h4>
              </div>
            </Card>
          </div>

          {/* Full Mood Timeline */}
          <Card className="bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-sm text-slate-900">Gün Gün Ruh Hali ve Psikolojik Takip Geçmişi</h4>
              </div>
              <span className="text-xs font-mono text-slate-400 font-medium">Son 30 Gün</span>
            </div>

            {moods.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                <Heart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                Öğrenciye ait henüz bir duygu durumu kaydı bulunamadı. Öğrenci kendi paneline giriş yaptıkça bu liste otomatik güncellenecektir.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {moods.map((m) => (
                  <div key={m.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shrink-0">
                        {m.mood_emoji}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-sm text-slate-900">{m.mood_label}</h5>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              m.sentiment === 'positive'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : m.sentiment === 'negative'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {m.sentiment === 'positive'
                              ? 'Pozitif Motivasyon'
                              : m.sentiment === 'negative'
                              ? 'Destek Gerekebilir'
                              : 'Nötr / Dengeli'}
                          </span>
                        </div>
                        {m.note ? (
                          <p className="text-xs text-slate-700 font-medium italic bg-slate-100/70 px-3 py-1.5 rounded-lg border border-slate-200/60 inline-block">
                            "{m.note}"
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Not girilmedi.</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-800 block">
                        {new Date(m.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(m.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: GÖREVLER */}
      {activeTab === 'tasks' && (
        <Card className="bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900">Öğrenciye Atanan Görevler</h4>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowTaskModal(true)}
              leftIcon={<CheckSquare className="w-3.5 h-3.5" />}
            >
              Yeni Görev Ata
            </Button>
          </div>
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Henüz atanmış aktif bir görev bulunmuyor.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tasks.map((t) => {
                const isAtRisk = student.risk_level === 'HIGH' || student.risk_level === 'CRITICAL' || student.risk_score >= 60;
                return (
                  <div key={t.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-xs text-slate-900">{t.title}</h5>
                        {isAtRisk && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            ⚠️ Riskli Öğrenciye Özel Koçluk Görevi Atandı
                          </span>
                        )}
                      </div>
                      {t.description && <p className="text-[11px] text-slate-600">{t.description}</p>}
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <span>Son Teslim: {new Date(t.due_date).toLocaleDateString('tr-TR')}</span>
                        <span>•</span>
                        <span className="text-amber-700 font-bold">+{t.xp_reward} XP</span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        t.status === 'Tamamlandı'
                          ? 'success'
                          : t.status === 'İnceleniyor'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {t.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: DENEMELER */}
      {activeTab === 'exams' && (
        <Card className="bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900">Deneme Sınavları & Net Çizelgesi</h4>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowExamModal(true)}
              leftIcon={<Award className="w-3.5 h-3.5" />}
            >
              Yeni Deneme Ekle
            </Button>
          </div>
          {exams.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Henüz kaydedilmiş deneme sonucu bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                    <th className="py-3 px-4">Tarih</th>
                    <th className="py-3 px-4">Deneme Adı / Yayın</th>
                    <th className="py-3 px-4">Tür</th>
                    <th className="py-3 px-4">Toplam Net</th>
                    <th className="py-3 px-4">YKS Puanı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {exams.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono">
                        {new Date(ex.exam_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{ex.title}</td>
                      <td className="py-3 px-4">
                        <Badge variant="primary" size="sm">
                          {ex.exam_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-indigo-700">
                        {ex.total_net.toFixed(2)} Net
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-amber-700">
                        {ex.calculated_score?.toFixed(1) || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 5: ÇALIŞMA KAYITLARI */}
      {activeTab === 'studylogs' && (
        <Card className="bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h4 className="font-bold text-sm text-slate-900">Günlük Çalışma & Soru Çözüm Kayıtları</h4>
          </div>
          {studyLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Öğrenciye ait çalışma kaydı bulunmuyor.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {studyLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <h5 className="font-bold text-slate-900">
                      {log.subject} • {log.topic}
                    </h5>
                    <p className="text-slate-500 font-mono text-[11px]">
                      {new Date(log.date).toLocaleDateString('tr-TR')} • {log.duration_minutes} Dakika
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-emerald-700 block">
                      {log.questions_solved} Soru ({log.questions_correct}D / {log.questions_incorrect}Y)
                    </span>
                    <span className="text-[10px] text-amber-700 font-bold">+{log.xp_earned} XP</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      {showEditModal && (
        <EditStudentModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          student={student}
          onSave={handleUpdateStudent}
        />
      )}

      {showTaskModal && (
        <AddTaskModal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            loadData();
          }}
          students={allStudents}
          preselectedStudentId={student.id}
          onAddTask={async (taskData) => {
            await db.addTask(taskData);
          }}
          coachId={student.coach_id}
        />
      )}

      {showExamModal && (
        <AddExamModal
          isOpen={showExamModal}
          onClose={() => {
            setShowExamModal(false);
            loadData();
          }}
          studentId={student.id}
          studentField={student.field}
          onAddExam={async (examData) => {
            await db.addExam(examData);
          }}
        />
      )}

      {showAvatarModal && (
        <StudentAvatarModal
          isOpen={showAvatarModal}
          onClose={() => {
            setShowAvatarModal(false);
            loadData();
          }}
          student={student}
          onSaveAvatar={async (url) => {
            await db.updateStudent(student.id, { avatar_url: url });
          }}
        />
      )}

      {/* Phase 3: AI Modals */}
      {showAIAnalysisModal && (
        <AIStudentAnalysisModal
          isOpen={showAIAnalysisModal}
          onClose={() => setShowAIAnalysisModal(false)}
          student={student}
          onOpenStudyPlan={() => setShowAIStudyPlanModal(true)}
          onOpenCoachReport={() => setShowAICoachReportModal(true)}
        />
      )}

      {showAIStudyPlanModal && (
        <AIStudyPlanModal
          isOpen={showAIStudyPlanModal}
          onClose={() => setShowAIStudyPlanModal(false)}
          student={student}
          coachId={student.coach_id || 'coach_default'}
          onPlanApproved={() => {
            loadData();
            toast.success('Haftalık çalışma planı öğrenciye aktarıldı.');
          }}
        />
      )}

      {showAICoachReportModal && (
        <AICoachReportModal
          isOpen={showAICoachReportModal}
          onClose={() => setShowAICoachReportModal(false)}
          student={student}
        />
      )}

      {/* Upgrade Modal for Gated Features */}
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
