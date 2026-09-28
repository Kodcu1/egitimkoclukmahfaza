import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { Task, Student, TaskStatus } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { AddTaskModal } from '../../components/modals/AddTaskModal';
import { formatDateTurkish } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import {
  CheckSquare,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  UserCheck,
  Check,
} from 'lucide-react';

export const CoachTasksPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PENDING_APPROVAL' | 'COMPLETED' | 'ALL'>('ACTIVE');
  const [selectedExamFilter, setSelectedExamFilter] = useState<'ALL' | 'YKS' | 'LGS'>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [taskList, stuList] = await Promise.all([
        db.getTasks(),
        db.getStudents(user?.id),
      ]);
      setTasks(taskList);
      setStudents(stuList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdated = () => loadData();
    window.addEventListener('tasks_updated', handleUpdated);
    window.addEventListener('approvals_updated', handleUpdated);
    return () => {
      window.removeEventListener('tasks_updated', handleUpdated);
      window.removeEventListener('approvals_updated', handleUpdated);
    };
  }, []);

  // Filter tasks based on active Tab, Student selector and Search Query
  const filteredTasks = tasks.filter((t) => {
    const matchesStudent = selectedStudentId === 'ALL' || t.student_id === selectedStudentId;
    
    // Tab filtering (Active tab strictly hides completed tasks to keep screen clean)
    let matchesTab = true;
    if (activeTab === 'ACTIVE') {
      matchesTab = t.status !== 'Tamamlandı' && t.status !== 'İptal';
    } else if (activeTab === 'PENDING_APPROVAL') {
      matchesTab = t.status === 'Koç Onayı Bekliyor';
    } else if (activeTab === 'COMPLETED') {
      matchesTab = t.status === 'Tamamlandı';
    }

    const stu = students.find((s) => s.id === t.student_id);
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (stu && stu.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStudent && matchesTab && matchesSearch;
  });

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'Tamamlandı' ? 'Bekliyor' : 'Tamamlandı';
    
    // Optimistic UI
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    try {
      await db.updateTaskStatus(task.id, nextStatus);
      window.dispatchEvent(new CustomEvent('tasks_updated'));
      window.dispatchEvent(new CustomEvent('approvals_updated'));
    } catch (err) {
      console.error('Görev durumu güncellenirken hata oluştu:', err);
      loadData();
    }
  };

  // Sil butonu doğrudan db.deleteTask'e bağlı — SADECE Supabase'den başarılı yanıt geldikten SONRA toast gösterilir
  const handleDeleteTask = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      await db.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirmId(null);
      toast.success('Görev başarıyla silindi.');
      window.dispatchEvent(new CustomEvent('tasks_updated'));
    } catch (error: any) {
      console.error('Görev silinirken hata oluştu:', error);
      toast.error('Silme işlemi veritabanı izni nedeniyle başarısız oldu!');
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'Kritik':
        return <Badge variant="danger">Kritik Öncelik</Badge>;
      case 'Yüksek':
        return <Badge variant="warning">Yüksek Öncelik</Badge>;
      case 'Orta':
        return <Badge variant="primary">Orta Öncelik</Badge>;
      default:
        return <Badge variant="default">Normal</Badge>;
    }
  };

  // Count metrics for tabs
  const activeCount = tasks.filter((t) => t.status !== 'Tamamlandı' && t.status !== 'İptal').length;
  const pendingApprovalCount = tasks.filter((t) => t.status === 'Koç Onayı Bekliyor').length;
  const completedCount = tasks.filter((t) => t.status === 'Tamamlandı').length;

  // Student list filtered by LGS / YKS
  const displayStudents = students.filter((s) => {
    if (selectedExamFilter === 'ALL') return true;
    const isLgs = s.grade?.includes('8') || s.field === 'LGS';
    if (selectedExamFilter === 'LGS') return isLgs;
    return !isLgs;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500 text-white shadow-sm">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Koçluk Görevleri & Takip
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Öğrencilerinize atadığınız haftalık çalışma fasikülleri, deneme ve etüt görevleri
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={students.length === 0}
          className="bg-orange-500 hover:bg-orange-600 shadow-orange-500/25 text-white"
        >
          Yeni Görev Ata
        </Button>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="space-y-3">
        {/* Navigation Tabs (Screen Cleaning) */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-xs flex-wrap">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ACTIVE'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>Aktif Görevler</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'ACTIVE' ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-700'
            }`}>
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PENDING_APPROVAL')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'PENDING_APPROVAL'
                ? 'bg-white text-amber-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>Onay Bekleyenler</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {pendingApprovalCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'COMPLETED'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>Tamamlananlar</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {completedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ALL'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>Tümü ({tasks.length})</span>
          </button>
        </div>

        {/* Filter Bar */}
        <Card className="p-4 bg-white border border-slate-100 shadow-sm rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-5">
              <Input
                placeholder="Görev başlığı veya öğrenci adı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                className="bg-slate-50/70 border-slate-200"
              />
            </div>

            <div className="sm:col-span-3 flex items-center justify-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              {(['ALL', 'YKS', 'LGS'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedExamFilter(filter)}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer text-center ${
                    selectedExamFilter === filter
                      ? 'bg-white text-orange-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter === 'ALL' ? 'Tümü' : filter}
                </button>
              ))}
            </div>

            <div className="sm:col-span-4">
              <Select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-slate-50/70 border-slate-200"
              >
                <option value="ALL">
                  Tüm Öğrenciler ({displayStudents.length})
                </option>
                {displayStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.field || 'SAY'})
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((t) => {
          const stu = students.find((s) => s.id === t.student_id);
          const isDone = t.status === 'Tamamlandı';
          const isPending = t.status === 'Koç Onayı Bekliyor';
          const isRiskStudent = stu && (stu.risk_level === 'HIGH' || stu.risk_level === 'CRITICAL' || stu.risk_score >= 60);

          return (
            <Card
              key={t.id}
              className={`flex flex-col justify-between transition-all duration-200 rounded-3xl p-5 border ${
                isDone
                  ? 'border-emerald-100 bg-emerald-50/30'
                  : isPending
                  ? 'border-amber-200 bg-amber-50/40 shadow-sm'
                  : 'border-slate-100 bg-white hover:border-orange-200 shadow-md hover:shadow-lg'
              }`}
            >
              <div className="space-y-3">
                {/* Top Row: Student & Priority Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center font-mono">
                      {stu?.name ? stu.name[0] : 'Ö'}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {stu?.name || 'Öğrenci'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {stu?.field || 'YKS'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {getPriorityBadge(t.priority)}
                  </div>
                </div>

                {isRiskStudent && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold shadow-2xs animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                    <span>⚠️ Riskli Öğrenci Görevi</span>
                  </div>
                )}

                <div>
                  <h4 className={`text-sm font-bold leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {t.title}
                  </h4>

                  {t.description && (
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mt-1">
                      {t.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Teslim: {formatDateTurkish(t.due_date)}
                  </span>
                  <span className="font-bold text-amber-700 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                    <Sparkles className="w-3 h-3 text-amber-600" /> +{t.xp_reward} XP
                  </span>
                </div>
              </div>

              {/* Task Actions with Working Delete Button */}
              <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  variant={isDone ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => handleToggleStatus(t)}
                  leftIcon={isDone ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  className={`text-xs ${
                    isDone
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : isPending
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  {isDone ? 'Bekliyor Yap' : isPending ? 'Onayla & Tamamla' : 'Tamamlandı Yap'}
                </Button>

                {deleteConfirmId === t.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDeleteTask(t.id, e)}
                      className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      Sil
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(null);
                      }}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      İptal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(t.id);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Görevi Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <Card className="text-center py-16 bg-white border border-slate-100 shadow-sm rounded-3xl space-y-2">
          <CheckSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">
            {activeTab === 'ACTIVE'
              ? 'Şu anda teslim bekleyen aktif görev bulunmuyor.'
              : activeTab === 'PENDING_APPROVAL'
              ? 'Onay bekleyen görev bulunmuyor.'
              : activeTab === 'COMPLETED'
              ? 'Tamamlanmış görev bulunmuyor.'
              : 'Filtre kriterlerine uygun görev bulunamadı.'}
          </p>
          <p className="text-xs text-slate-500">
            Öğrencilerinize yeni görev atamak için sağ üstteki "Yeni Görev Ata" butonunu kullanabilirsiniz.
          </p>
        </Card>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          students={students}
          coachId={user?.id || (user as any)?.user_id || ''}
          onAddTask={async (newTask) => {
            await db.addTask(newTask);
            setShowAddModal(false);
            await loadData();
          }}
        />
      )}
    </div>
  );
};
