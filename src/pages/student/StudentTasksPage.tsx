import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/db';
import { Task, Student } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatDateTurkish } from '../../utils/formatters';
import { CheckSquare, CheckCircle2, Clock, Sparkles, AlertTriangle, Check, ArrowRight } from 'lucide-react';

export const StudentTasksPage: React.FC = () => {
  const { user, studentData, refreshStudentData } = useAuth();
  const [student, setStudent] = useState<Student | null>(studentData);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PENDING_APPROVAL' | 'COMPLETED' | 'ALL'>('ACTIVE');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      let stu = studentData;
      if (!stu && user) {
        stu = await db.getStudentById(user.user_id || user.id);
        if (!stu) {
          const list = await db.getStudents();
          stu = list.find((s) => s.user_id === (user.user_id || user.id) || (s.email && s.email.toLowerCase() === user.email.toLowerCase())) || null;
        }
      }
      setStudent(stu);

      if (stu) {
        const taskList = await db.getTasksByStudent(stu.id);
        setTasks(taskList);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdated = () => {
      loadData();
      refreshStudentData();
    };
    window.addEventListener('tasks_updated', handleUpdated);
    window.addEventListener('approvals_updated', handleUpdated);
    return () => {
      window.removeEventListener('tasks_updated', handleUpdated);
      window.removeEventListener('approvals_updated', handleUpdated);
    };
  }, [studentData]);

  // Handle student completing task -> moves to Coach Approval
  const handleCompleteTask = async (task: Task) => {
    // Optimistic UI update: instantly update status in local state
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

  // Screen Cleaning Filter:
  // ACTIVE tab shows ONLY pending/in-progress tasks (completed & approved are hidden)
  const filteredTasks = tasks.filter((t) => {
    if (activeTab === 'ACTIVE') {
      return t.status === 'Bekliyor' || t.status === 'Devam Ediyor';
    }
    if (activeTab === 'PENDING_APPROVAL') {
      return t.status === 'Koç Onayı Bekliyor';
    }
    if (activeTab === 'COMPLETED') {
      return t.status === 'Tamamlandı';
    }
    return true; // 'ALL'
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'Kritik': return <Badge variant="danger">Kritik Öncelik</Badge>;
      case 'Yüksek': return <Badge variant="warning">Yüksek Öncelik</Badge>;
      case 'Orta': return <Badge variant="primary">Orta Öncelik</Badge>;
      default: return <Badge variant="default">Normal</Badge>;
    }
  };

  const activeCount = tasks.filter((t) => t.status === 'Bekliyor' || t.status === 'Devam Ediyor').length;
  const pendingApprovalCount = tasks.filter((t) => t.status === 'Koç Onayı Bekliyor').length;
  const completedCount = tasks.filter((t) => t.status === 'Tamamlandı').length;

  if (!student) {
    return <div className="p-8 text-center text-slate-500 font-bold">Yükleniyor...</div>;
  }

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
              Koçluk Görevlerim & Hedeflerim
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Koçunuz tarafından sana özel atanan haftalık soru fasikülleri, tekrar ve etüt ödevleri
          </p>
        </div>

        {/* Tab Buttons (Screen Cleaning) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-xs flex-wrap">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ACTIVE'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>Yapılacaklar</span>
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
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((t) => {
          const isDone = t.status === 'Tamamlandı';
          const isPendingApproval = t.status === 'Koç Onayı Bekliyor';

          return (
            <Card
              key={t.id}
              className={`flex flex-col justify-between transition-all duration-200 rounded-3xl p-5 border ${
                isDone
                  ? 'border-emerald-100 bg-emerald-50/40 shadow-xs'
                  : isPendingApproval
                  ? 'border-amber-200 bg-amber-50/40 shadow-sm'
                  : 'border-slate-100 bg-white hover:border-orange-200 shadow-md hover:shadow-lg'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  {getPriorityBadge(t.priority)}
                  <span className="font-bold text-amber-700 text-xs flex items-center gap-1 font-mono bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-200">
                    <Sparkles className="w-3 h-3 text-amber-600" /> +{t.xp_reward} XP
                  </span>
                </div>

                {(student.risk_level === 'HIGH' || student.risk_level === 'CRITICAL' || t.priority === 'Kritik') && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-extrabold shadow-2xs animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                    <span>⚠️ Koçun Öncelikli Takip Ettiği Kritik Görev</span>
                  </div>
                )}

                <div>
                  <h4 className={`text-sm font-bold leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                    {t.title}
                  </h4>

                  {t.description && (
                    <p className="text-xs text-slate-600 leading-relaxed mt-1 line-clamp-3">
                      {t.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Son Teslim: {formatDateTurkish(t.due_date)}
                  </span>
                  <span className="font-bold text-slate-700">
                    {isDone ? 'Tamamlandı' : isPendingApproval ? 'Onay Bekliyor' : 'Aktif'}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3.5 mt-3.5 border-t border-slate-100">
                {isDone ? (
                  <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-100/80 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Koç Tarafından Onaylandı (+{t.xp_reward} XP)</span>
                  </div>
                ) : isPendingApproval ? (
                  <div className="w-full py-2.5 px-3 rounded-xl bg-amber-100/80 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                    <span>Koç Onayı Bekleniyor</span>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-500/20"
                    onClick={() => handleCompleteTask(t)}
                    leftIcon={<Check className="w-4 h-4" />}
                  >
                    Görevi Bitirdim (Onaya Gönder)
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <Card className="text-center py-16 bg-white border border-slate-100 shadow-sm rounded-3xl space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-slate-900">
            {activeTab === 'ACTIVE'
              ? 'Harika! Yapılacak aktif bir görevin kalmadı.'
              : activeTab === 'PENDING_APPROVAL'
              ? 'Onay bekleyen görevin bulunmuyor.'
              : activeTab === 'COMPLETED'
              ? 'Henüz tamamlanmış görev kaydın yok.'
              : 'Kayıtlı görev bulunmuyor.'}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {activeTab === 'ACTIVE'
              ? 'Mevcut tüm görevlerini tamamladın veya onaya gönderdin. Yeni görevler için koçunun yönlendirmelerini takip edebilirsin.'
              : 'Tamamlanan veya onay bekleyen diğer görevlerini sekmelerden inceleyebilirsin.'}
          </p>
        </Card>
      )}
    </div>
  );
};
