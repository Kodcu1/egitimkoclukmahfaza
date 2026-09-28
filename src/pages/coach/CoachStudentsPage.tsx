import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/db';
import { Student, StudentMood } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { RiskBadge } from '../../components/common/RiskBadge';
import { Avatar } from '../../components/common/Avatar';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AddStudentModal } from '../../components/modals/AddStudentModal';
import { EditStudentModal } from '../../components/modals/EditStudentModal';
import { AddExamModal } from '../../components/modals/AddExamModal';
import { AddTaskModal } from '../../components/modals/AddTaskModal';
import { CoachNotesModal } from '../../components/modals/CoachNotesModal';
import { StudentAvatarModal } from '../../components/modals/StudentAvatarModal';
import { ParentMeetingModal } from '../../components/modals/ParentMeetingModal';
import { BulkImportStudentsModal } from '../../components/modals/BulkImportStudentsModal';
import { generateStudentPdfReport } from '../../utils/pdfReport';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import { UpgradeModal } from '../../components/modals/UpgradeModal';
import { DEMO_COACH_USER_ID } from '../../data/seedData';
import {
  UserPlus,
  Search,
  FileDown,
  FileSpreadsheet,
  Trash2,
  CheckSquare,
  Square,
  Camera,
  PhoneCall,
  Edit3,
  ExternalLink,
  GraduationCap,
  BookOpen,
  Briefcase,
  Table as TableIcon,
  LayoutGrid,
  Users,
  Sparkles,
  RefreshCw,
  Mail,
  Target,
  Plus,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export const CoachStudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const effectiveCoachId = user?.id || (user as any)?.user_id || DEMO_COACH_USER_ID;

  const [students, setStudents] = useState<Student[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);
  const [moodsMap, setMoodsMap] = useState<Record<string, StudentMood>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExamGroup, setSelectedExamGroup] = useState<string>('ALL');
  const [selectedField, setSelectedField] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Multi-selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Demo student wipe state
  const [showDeleteDemoModal, setShowDeleteDemoModal] = useState(false);
  const [isDeletingDemo, setIsDeletingDemo] = useState(false);

  // Quick assign loading state
  const [assigningPoolId, setAssigningPoolId] = useState<string | null>(null);

  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalConfig, setUpgradeModalConfig] = useState<{
    featureName: string;
    requiredPlan: 'Starter' | 'Pro' | 'Premium' | 'Kurumsal';
    description?: string;
    currentPlanName?: string;
  }>({
    featureName: 'Koçluk Portföyü',
    requiredPlan: 'Pro',
  });

  // Action Modals state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [examStudent, setExamStudent] = useState<Student | null>(null);
  const [taskStudent, setTaskStudent] = useState<Student | null>(null);
  const [notesStudent, setNotesStudent] = useState<Student | null>(null);
  const [avatarStudent, setAvatarStudent] = useState<Student | null>(null);
  const [parentMeetingStudent, setParentMeetingStudent] = useState<Student | null>(null);
  const [showGeneralParentMeeting, setShowGeneralParentMeeting] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const [data, latestMoods, unassigned] = await Promise.all([
        db.getStudents(effectiveCoachId),
        db.getLatestMoodsMap(),
        db.getUnassignedStudents(),
      ]);
      setStudents(data);
      setMoodsMap(latestMoods);
      
      // 🚀 1. KRİTİK DÜZELTME: Taha Eren / Havuz Bug'ı
      // Koçun kendi portföyündeki öğrencilerin ID'lerini bir havuzda topluyoruz
      const myStudentIds = new Set(
        data.flatMap(s => [s.id, s.user_id]).filter(Boolean)
      );

      // Veritabanından gelen listeyi katı bir filtreye sokuyoruz
      const strictlyUnassigned = (unassigned || []).filter(stu => {
        const sId = stu.id || stu.user_id;
        const hasCoach = stu.coach_id && stu.coach_id.trim() !== '';
        const isMine = myStudentIds.has(sId);
        
        // KURAL: Öğrenci senin listendeyse VEYA zaten bir koça atanmışsa havuzda ASLA GÖRÜNMEZ.
        return !isMine && !hasCoach;
      });

      setUnassignedStudents(strictlyUnassigned);
    } catch (err) {
      console.error('Error loading students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    const handleUpdate = () => loadStudents();
    window.addEventListener('students_updated', handleUpdate);
    window.addEventListener('moods_updated', handleUpdate);
    window.addEventListener('profiles_updated', handleUpdate);
    return () => {
      window.removeEventListener('students_updated', handleUpdate);
      window.removeEventListener('moods_updated', handleUpdate);
      window.removeEventListener('profiles_updated', handleUpdate);
    };
  }, [effectiveCoachId]);

  // Identify demo / mock students (e.g. @ornek.com, or 'demo' in email/name)
  const demoStudents = useMemo(() => {
    return students.filter((s) => {
      const email = (s.email || '').toLowerCase();
      const name = (s.name || '').toLowerCase();
      return (
        email.startsWith('demo.') ||
        email.endsWith('@ornek.com') ||
        email === 'ogrenci@mahfaza.co' ||
        name.toLowerCase().includes('demo öğrenci')
      );
    });
  }, [students]);

  const handleOpenAddStudent = async () => {
    const actorId = user?.id || (user as any)?.user_id || '';
    const access = await db.checkFeatureAccess(actorId, 'coach_portfolio');
    if (!access.hasAccess) {
      setUpgradeModalConfig({
        featureName: 'Öğrenci Ekleme ve Portföy Yönetimi',
        requiredPlan: access.requiredPlan,
        description:
          access.reason ||
          `Paketinizdeki öğrenci limitine ulaştınız. Portföyünüzü genişletmek için paketinizi yükseltebilirsiniz.`,
        currentPlanName: access.currentPlanName,
      });
      setShowUpgradeModal(true);
      return;
    }
    setShowAddStudent(true);
  };

  const handleOpenTaskModal = async (student: Student) => {
    const actorId = user?.id || student.coach_id || student.id || student.user_id;
    const access = await db.checkFeatureAccess(actorId, 'task_assignment');
    if (!access.hasAccess) {
      setUpgradeModalConfig({
        featureName: 'Öğrenciye Görev Atama & Takip',
        requiredPlan: 'Pro',
        description:
          access.reason ||
          'Öğrencilere görev atama ve haftalık kontrol sistemi PRO ve üzeri paketlerde kullanılabilir.',
        currentPlanName: access.currentPlanName,
      });
      setShowUpgradeModal(true);
      return;
    }
    setTaskStudent(student);
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.match_code?.toLowerCase().includes(searchQuery.toLowerCase());

      const targetGroup =
        s.target_exam ||
        (s.grade === '8. Sınıf' ? 'LGS' : s.field === 'GY-GK' ? 'KPSS' : 'YKS');
      const matchesExam = selectedExamGroup === 'ALL' || targetGroup === selectedExamGroup;
      const matchesField = selectedField === 'ALL' || s.field === selectedField;
      const matchesRisk = selectedRisk === 'ALL' || s.risk_level === selectedRisk;
      return matchesSearch && matchesExam && matchesField && matchesRisk;
    });
  }, [students, searchQuery, selectedExamGroup, selectedField, selectedRisk]);

  // Single Delete
  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      const name = studentToDelete.name;
      await db.deleteStudent(studentToDelete.id);
      setStudentToDelete(null);
      setSelectedStudentIds((prev) => prev.filter((id) => id !== studentToDelete.id));
      toast.success(`"${name}" adlı öğrenci portföyden silindi.`);
      await loadStudents();
    } catch {
      toast.error('Öğrenci silinirken hata oluştu.');
    }
  };

  // Bulk Delete Selected
  const handleBulkDeleteSelected = async () => {
    if (selectedStudentIds.length === 0) return;
    try {
      setIsBulkDeleting(true);
      await db.deleteStudents(selectedStudentIds);
      toast.success(`${selectedStudentIds.length} öğrenci portföyden başarıyla silindi.`);
      setSelectedStudentIds([]);
      setShowBulkDeleteModal(false);
      await loadStudents();
    } catch (err) {
      console.error('Bulk delete error:', err);
      toast.error('Öğrenciler silinirken hata oluştu.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Delete All Demo Students
  const handleDeleteAllDemoStudents = async () => {
    try {
      setIsDeletingDemo(true);
      const count = await db.deleteDemoStudents();
      toast.success(
        `${count || demoStudents.length} adet demo öğrenci portföyden silindi. Gerçek öğrencileriniz listelenmektedir.`
      );
      setShowDeleteDemoModal(false);
      setSelectedStudentIds([]);
      await loadStudents();
    } catch (err) {
      console.error('Delete demo students error:', err);
      toast.error('Demo öğrenciler silinirken bir hata oluştu.');
    } finally {
      setIsDeletingDemo(false);
    }
  };

  // Quick Assign Unassigned Student from Pool
  const handleAssignUnassignedStudent = async (stu: any) => {
    const sId = stu.id || stu.user_id;
    if (!sId || assigningPoolId) return;
    try {
      setAssigningPoolId(sId);
      await db.assignStudentToCoach(sId, effectiveCoachId);
      toast.success(`🎉 ${stu.name} başarıyla koçluk portföyünüze eklendi!`);
      await loadStudents();
    } catch (err) {
      console.error('Assign unassigned student error:', err);
      toast.error('Öğrenci portföye eklenirken hata oluştu.');
    } finally {
      setAssigningPoolId(null);
    }
  };

  // Checkbox handlers
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveNotes = async (studentId: string, notes: string) => {
    try {
      await db.updateStudentCoachNotes(studentId, notes);
      toast.success('Koç notu başarıyla güncellendi.');
      await loadStudents();
    } catch {
      toast.error('Koç notu kaydedilirken bir hata oluştu.');
    }
  };

  const handleDownloadPdf = async (student: Student) => {
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

    try {
      setIsGeneratingPdf(student.id);
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
      toast.success('Öğrenci gelişim ve koçluk raporu indirildi.');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('PDF raporu oluşturulamadı.');
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  const examCounts = useMemo(() => {
    let yks = 0;
    let lgs = 0;
    let kpss = 0;
    students.forEach((s) => {
      const group =
        s.target_exam ||
        (s.grade === '8. Sınıf' ? 'LGS' : s.field === 'GY-GK' ? 'KPSS' : 'YKS');
      if (group === 'LGS') lgs++;
      else if (group === 'KPSS') kpss++;
      else yks++;
    });
    return {
      all: students.length,
      yks,
      lgs,
      kpss,
    };
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Öğrenci Portföy Tablosu
            </h2>
            <Badge variant="primary" size="md" className="font-mono font-bold">
              {students.length} Öğrenci
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            YKS 2027, LGS ve KPSS koçluk portföyünüz, yeni üye kabulü ve akademik analiz yönetimi
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Table / Grid Toggle */}
          <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tablo Görünümü"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tablo</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kart Görünümü"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kart</span>
            </button>
          </div>

          {/* Delete All Demo Students Button (Shows if any demo student exists) */}
          {demoStudents.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteDemoModal(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              className="border-rose-300 bg-rose-50/60 text-rose-700 hover:bg-rose-100 text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
              title="Portföydeki hazır demo öğrencileri silip sadece gerçek öğrencilerinizi bırakın"
            >
              Demo Öğrencileri Sil ({demoStudents.length})
            </Button>
          )}

          {/* Parent Meeting Button */}
          <Button
            variant="outline"
            onClick={() => setShowGeneralParentMeeting(true)}
            leftIcon={<PhoneCall className="w-3.5 h-3.5 text-emerald-600" />}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
          >
            Veli Görüşme Kaydı
          </Button>

          {/* Bulk Import from File / Excel Button */}
          <Button
            variant="outline"
            onClick={() => setShowBulkImportModal(true)}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-amber-600" />}
            className="border-amber-300 bg-amber-50/70 text-amber-800 hover:bg-amber-100 font-bold text-xs sm:text-sm shadow-xs cursor-pointer"
            title="Excel, CSV veya dosyadaki öğrenci listesini yükleyin"
          >
            Dosyadan / Excel'den Yükle
          </Button>

          {/* Add New Student Button */}
          <Button
            variant="primary"
            onClick={handleOpenAddStudent}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="font-bold text-xs sm:text-sm shadow-sm"
          >
            Yeni Öğrenci Ekle
          </Button>
        </div>
      </div>

      {/* BANNER: Newly Registered Unassigned Students Pool (yeni üye olan kişiyi ekleyebilelim) */}
      {unassignedStudents.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-amber-50/70 to-emerald-50/90 border border-indigo-200/80 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>Sisteme Yeni Kayıt Olan Öğrenciler</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-600 text-white font-bold">
                    {unassignedStudents.length} Yeni Üye
                  </span>
                </h4>
                <p className="text-xs text-slate-600">
                  Platforma kayıt olan ve koçluk portföyünüze ekleyebileceğiniz öğrenciler:
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenAddStudent}
              leftIcon={<Users className="w-3.5 h-3.5" />}
              className="text-xs font-bold text-indigo-700 border-indigo-300 hover:bg-indigo-50 self-start sm:self-auto"
            >
              Öğrenci Havuzunu Aç
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {unassignedStudents.slice(0, 3).map((stu) => {
              const sId = stu.id || stu.user_id;
              const isAssigning = assigningPoolId === sId;

              return (
                <div
                  key={sId}
                  className="p-3 bg-white rounded-xl border border-indigo-200 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={stu.name} src={stu.avatar_url} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{stu.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{stu.email}</p>
                      <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                        {stu.field || 'SAY'} • {stu.grade || '12. Sınıf'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isAssigning}
                    onClick={() => handleAssignUnassignedStudent(stu)}
                    className="shrink-0 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Öğrenciyi portföyünüze ekleyin"
                  >
                    {isAssigning ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Portföye Ekle</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-Selection Sticky Bar (When students are selected) */}
      {selectedStudentIds.length > 0 && (
        <div className="p-3.5 bg-slate-900 text-white rounded-xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span className="text-xs sm:text-sm font-bold">
              {selectedStudentIds.length} öğrenci seçildi
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedStudentIds([])}
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Seçimi Temizle
            </button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowBulkDeleteModal(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              className="text-xs font-bold py-1.5"
            >
              Seçilenleri Sil ({selectedStudentIds.length})
            </Button>
          </div>
        </div>
      )}

      {/* Multi-Exam Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedExamGroup('ALL')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedExamGroup === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Tüm Öğrenciler</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/40 text-current">
            {examCounts.all}
          </span>
        </button>

        <button
          onClick={() => setSelectedExamGroup('YKS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedExamGroup === 'YKS'
              ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/20'
              : 'bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-700 border border-slate-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>YKS 2027</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 text-current">
            {examCounts.yks}
          </span>
        </button>

        <button
          onClick={() => setSelectedExamGroup('LGS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedExamGroup === 'LGS'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>LGS (MEB 6 Ders)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 text-current">
            {examCounts.lgs}
          </span>
        </button>

        <button
          onClick={() => setSelectedExamGroup('KPSS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedExamGroup === 'KPSS'
              ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/20'
              : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>KPSS (GY-GK)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 text-current">
            {examCounts.kpss}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Öğrenci adı, e-posta veya eşleşme kodu ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <Select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
          >
            <option value="ALL">Tüm Branş & Alanlar</option>
            <option value="SAY">Sayısal (SAY)</option>
            <option value="EA">Eşit Ağırlık (EA)</option>
            <option value="SÖZ">Sözel (SÖZ)</option>
            <option value="LGS">LGS Hazırlık</option>
            <option value="GY-GK">KPSS GY-GK</option>
          </Select>

          <Select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
          >
            <option value="ALL">Tüm Risk Seviyeleri</option>
            <option value="LOW">Düşük Risk</option>
            <option value="MEDIUM">Orta Risk</option>
            <option value="HIGH">Yüksek Risk</option>
            <option value="CRITICAL">Kritik Risk</option>
          </Select>
        </div>
      </Card>

      {/* MAIN VIEW: TABLE VIEW (Tablo Görünümü) */}
      {viewMode === 'table' ? (
        <Card className="bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="cursor-pointer text-slate-500 hover:text-indigo-600"
                      title="Tümünü Seç / Kaldır"
                    >
                      {selectedStudentIds.length === filteredStudents.length &&
                      filteredStudents.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">Öğrenci Adı / Profil</th>
                  <th className="py-3 px-3">Sınav & Branş</th>
                  <th className="py-3 px-3">Akademik Hedef</th>
                  <th className="py-3 px-3">Risk Durumu</th>
                  <th className="py-3 px-3">Duygu / XP</th>
                  <th className="py-3 px-3 text-right">İşlemler & Yönetim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((stu) => {
                  const studentMood =
                    stu.current_mood || moodsMap[stu.id] || moodsMap[stu.user_id];
                  const examGroup =
                    stu.target_exam ||
                    (stu.grade === '8. Sınıf' ? 'LGS' : stu.field === 'GY-GK' ? 'KPSS' : 'YKS');
                  const isSelected = selectedStudentIds.includes(stu.id);

                  return (
                    <tr
                      key={stu.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(stu.id)}
                          className="cursor-pointer text-slate-400 hover:text-indigo-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Student Identity */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => setAvatarStudent(stu)}
                            className="relative cursor-pointer group shrink-0"
                            title="Fotoğrafı Değiştir"
                          >
                            <Avatar name={stu.name} src={stu.avatar_url} size="sm" />
                            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-0.5 rounded-full shadow-2xs opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="w-2.5 h-2.5" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => navigate(`/coach/students/${stu.id}`)}
                              className="font-bold text-slate-900 hover:text-indigo-600 text-xs text-left truncate flex items-center gap-1 cursor-pointer"
                            >
                              <span>{stu.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </button>
                            <p className="text-[11px] text-slate-500 truncate">{stu.email}</p>
                            {stu.match_code && (
                              <p className="text-[10px] text-indigo-600 font-mono mt-0.5">
                                #{stu.match_code}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Exam & Branch */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              examGroup === 'LGS'
                                ? 'bg-indigo-100 text-indigo-700'
                                : examGroup === 'KPSS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {examGroup}
                          </span>
                          <p className="text-[11px] text-slate-600 font-medium">
                            {stu.field || 'SAY'} • {stu.grade || '12. Sınıf'}
                          </p>
                        </div>
                      </td>

                      {/* Academic Goal */}
                      <td className="py-3 px-3 max-w-[200px]">
                        <p className="font-semibold text-slate-900 truncate">
                          {stu.target_university || 'Hedef Belirlenmedi'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {stu.target_department || 'Bölüm Seçilmedi'}
                        </p>
                        {stu.target_rank && (
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            Hedef: #{stu.target_rank}
                          </span>
                        )}
                      </td>

                      {/* Risk Level */}
                      <td className="py-3 px-3">
                        <RiskBadge level={stu.risk_level || 'LOW'} size="sm" />
                      </td>

                      {/* Mood / XP */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          {studentMood ? (
                            <span className="text-[11px] text-slate-700 font-medium flex items-center gap-1">
                              <span>{studentMood.mood_emoji || '😊'}</span>
                              <span className="truncate max-w-[80px]">
                                {studentMood.mood_text || 'İyi'}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Duygu girilmedi</span>
                          )}
                          <p className="text-[10px] text-slate-500 font-mono">
                            {stu.xp || 0} XP • Lv.{stu.level || 1}
                          </p>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Karne PDF */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] py-1 px-2 text-slate-700 hover:text-indigo-700 hover:border-indigo-300"
                            onClick={() => handleDownloadPdf(stu)}
                            disabled={isGeneratingPdf === stu.id}
                            title="Resmi Gelişim Karnesi İndir"
                          >
                            <FileDown className="w-3 h-3 text-indigo-600" />
                            <span className="hidden xl:inline">
                              {isGeneratingPdf === stu.id ? '...' : 'Karne'}
                            </span>
                          </Button>

                          {/* Görev Ver */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] py-1 px-2 text-slate-700 hover:text-indigo-700 hover:border-indigo-300"
                            onClick={() => handleOpenTaskModal(stu)}
                            title="Öğrenciye Görev Ata"
                          >
                            <CheckSquare className="w-3 h-3 text-emerald-600" />
                            <span className="hidden xl:inline">Görev</span>
                          </Button>

                          {/* Deneme Ekle */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] py-1 px-2 text-slate-700 hover:text-indigo-700 hover:border-indigo-300"
                            onClick={() => setExamStudent(stu)}
                            title="Yeni Deneme Sonucu Ekle"
                          >
                            <Plus className="w-3 h-3 text-amber-600" />
                            <span className="hidden xl:inline">Deneme</span>
                          </Button>

                          {/* Koç Notu */}
                          <button
                            type="button"
                            onClick={() => setNotesStudent(stu)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Koç Gözlem Notu Ekle / Düzenle"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Düzenle */}
                          <button
                            type="button"
                            onClick={() => setEditingStudent(stu)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Öğrenci Bilgilerini Düzenle"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {/* Sil */}
                          <button
                            type="button"
                            onClick={() => setStudentToDelete(stu)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Öğrenciyi Portföyden Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* CARD GRID VIEW (Kart Görünümü) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((stu) => {
            const studentMood =
              stu.current_mood || moodsMap[stu.id] || moodsMap[stu.user_id];
            const examGroup =
              stu.target_exam ||
              (stu.grade === '8. Sınıf' ? 'LGS' : stu.field === 'GY-GK' ? 'KPSS' : 'YKS');
            const isSelected = selectedStudentIds.includes(stu.id);

            return (
              <Card
                key={stu.id}
                className={`flex flex-col justify-between bg-white border transition-all shadow-xs group ${
                  isSelected ? 'border-indigo-400 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Card Header: Checkbox, Avatar, Name, Risk */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectOne(stu.id)}
                        className="cursor-pointer text-slate-400 hover:text-indigo-600 shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <div
                        onClick={() => setAvatarStudent(stu)}
                        className="relative group/avatar cursor-pointer shrink-0"
                        title="Öğrenci profil fotoğrafını değiştir"
                      >
                        <Avatar name={stu.name} src={stu.avatar_url} size="md" />
                        <div className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 text-white p-0.5 rounded-full shadow-xs transition-transform group-hover/avatar:scale-110">
                          <Camera className="w-2.5 h-2.5" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/coach/students/${stu.id}`)}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-sm truncate block text-left transition-colors"
                        >
                          {stu.name}
                        </button>
                        <p className="text-xs text-slate-500 truncate">{stu.email}</p>
                        {stu.match_code && (
                          <p className="text-[10px] text-indigo-600 font-mono mt-0.5">
                            #{stu.match_code}
                          </p>
                        )}
                      </div>
                    </div>

                    <RiskBadge level={stu.risk_level || 'LOW'} size="sm" />
                  </div>

                  {/* Target & Field Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        examGroup === 'LGS'
                          ? 'bg-indigo-100 text-indigo-700'
                          : examGroup === 'KPSS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {examGroup}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                      {stu.field || 'SAY'} • {stu.grade || '12. Sınıf'}
                    </span>
                    {stu.target_rank && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold text-[10px]">
                        Hedef: #{stu.target_rank}
                      </span>
                    )}
                  </div>

                  {/* University & Department Target */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-0.5">
                    <p className="font-semibold text-slate-800 truncate">
                      {stu.target_university || 'Hedef Belirlenmedi'}
                    </p>
                    <p className="text-slate-500 truncate text-[11px]">
                      {stu.target_department || 'Mühendislik / Tıp'}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs px-1"
                      onClick={() => setExamStudent(stu)}
                    >
                      Deneme
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs px-1"
                      onClick={() => handleOpenTaskModal(stu)}
                    >
                      Görev Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs px-1 text-slate-700 hover:text-indigo-700"
                      onClick={() => handleDownloadPdf(stu)}
                      disabled={isGeneratingPdf === stu.id}
                    >
                      {isGeneratingPdf === stu.id ? '...' : 'Karne'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingStudent(stu)}
                      className="flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 font-medium py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Düzenle</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStudentToDelete(stu)}
                      className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium py-1 px-2 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sil</span>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredStudents.length === 0 && !isLoading && (
        <Card className="p-12 text-center bg-white border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            Aramanızla eşleşen öğrenci bulunamadı.
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Filtreleri sıfırlayarak veya "Yeni Öğrenci Ekle" butonu ile portföyünüze gerçek öğrenciler kaydedebilirsiniz.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedExamGroup('ALL');
                setSelectedField('ALL');
                setSelectedRisk('ALL');
              }}
            >
              Filtreleri Temizle
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenAddStudent}>
              Yeni Öğrenci Ekle
            </Button>
          </div>
        </Card>
      )}

      {/* MODALS */}
      <AddStudentModal
        isOpen={showAddStudent}
        onClose={() => setShowAddStudent(false)}
        coachId={effectiveCoachId}
        onSuccess={() => {
          loadStudents();
          setShowAddStudent(false);
        }}
      />

      {editingStudent && (
        <EditStudentModal
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            loadStudents();
            setEditingStudent(null);
          }}
          student={editingStudent}
        />
      )}

      {examStudent && (
        <AddExamModal
          isOpen={!!examStudent}
          onClose={() => setExamStudent(null)}
          studentId={examStudent.id}
          studentTargetExam={examStudent.target_exam}
        />
      )}

      {taskStudent && (
        <AddTaskModal
          isOpen={!!taskStudent}
          onClose={() => setTaskStudent(null)}
          studentId={taskStudent.id}
        />
      )}

      {notesStudent && (
        <CoachNotesModal
          isOpen={!!notesStudent}
          onClose={() => setNotesStudent(null)}
          student={notesStudent}
          onSave={handleSaveNotes}
        />
      )}

      {avatarStudent && (
        <StudentAvatarModal
          isOpen={!!avatarStudent}
          onClose={() => setAvatarStudent(null)}
          studentId={avatarStudent.id}
          currentAvatarUrl={avatarStudent.avatar_url}
          studentName={avatarStudent.name}
        />
      )}

      {/* Veli Görüşme Formu / Kaydı Modal */}
      <ParentMeetingModal
        isOpen={showGeneralParentMeeting || !!parentMeetingStudent}
        onClose={() => {
          setShowGeneralParentMeeting(false);
          setParentMeetingStudent(null);
        }}
        preselectedStudentId={parentMeetingStudent?.id}
        students={students}
      />

      {/* Individual Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleDeleteStudent}
        title="Öğrenciyi Kalıcı Olarak Sil"
        message={`"${studentToDelete?.name}" adlı öğrenciyi portföyünüzden silmek istediğinize emin misiniz? Bu işlem öğrenciye ait tüm çalışma kayıtlarını, deneme verilerini ve görevleri kalıcı olarak silecektir.`}
        confirmText="Öğrenciyi Sil"
        cancelText="Vazgeç"
        variant="danger"
      />

      {/* Bulk Delete Selected Students Confirm Dialog */}
      <ConfirmDialog
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDeleteSelected}
        title="Seçilen Öğrencileri Sil"
        message={`Seçmiş olduğunuz ${selectedStudentIds.length} öğrenci portföyünüzden kalıcı olarak silinecektir. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?`}
        confirmText={isBulkDeleting ? 'Siliniyor...' : `Seçilen ${selectedStudentIds.length} Öğrenciyi Sil`}
        cancelText="Vazgeç"
        variant="danger"
      />

      {/* Delete All Demo Students Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDemoModal}
        onClose={() => setShowDeleteDemoModal(false)}
        onConfirm={handleDeleteAllDemoStudents}
        title="Demo Öğrencileri Portföyden Sil"
        message={`Portföyünüzde bulunan ${demoStudents.length} adet hazır demo öğrenci (örnek kayıtlar) kalıcı olarak silinecektir. Gerçek öğrencileriniz ve kendi eklediğiniz öğrenciler korunacaktır. Devam etmek istiyor musunuz?`}
        confirmText={isDeletingDemo ? 'Siliniyor...' : 'Evet, Demo Öğrencileri Sil'}
        cancelText="Vazgeç"
        variant="danger"
      />

      {/* Upgrade Plan Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={upgradeModalConfig.featureName}
        requiredPlan={upgradeModalConfig.requiredPlan}
        description={upgradeModalConfig.description}
        currentPlanName={upgradeModalConfig.currentPlanName}
      />

      {/* Bulk Import Students (Excel / CSV / List) Modal */}
      <BulkImportStudentsModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onSuccess={loadStudents}
        coachId={effectiveCoachId}
      />
    </div>
  );
};