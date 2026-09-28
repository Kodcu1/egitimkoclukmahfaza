import React, { useState, useEffect } from 'react';
import { Student, AIStudyPlan, AIStudyPlanTask, TaskPriority } from '../../types';
import { aiService } from '../../services/aiService';
import { db } from '../../lib/db';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Input } from '../common/Input';
import { useToast } from '../../context/ToastContext';
import {
  Sparkles,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  Target,
  Edit3,
  Trash2,
  Plus,
  RotateCcw,
  X,
  Zap,
  Save,
  Check,
  AlertCircle,
} from 'lucide-react';

interface AIStudyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  coachId: string;
  onPlanApproved?: () => void;
}

const DAYS_ORDER: Array<'Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma' | 'Cumartesi' | 'Pazar'> = [
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
  'Pazar',
];

export const AIStudyPlanModal: React.FC<AIStudyPlanModalProps> = ({
  isOpen,
  onClose,
  student,
  coachId,
  onPlanApproved,
}) => {
  const { toast } = useToast();
  const [plan, setPlan] = useState<AIStudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTasks, setEditedTasks] = useState<AIStudyPlanTask[]>([]);
  const [focusInput, setFocusInput] = useState('');

  const loadOrGeneratePlan = async (forceRefresh = false) => {
    if (!student) return;
    try {
      setIsLoading(true);
      if (!forceRefresh) {
        const latest = await db.getLatestAIStudyPlan(student.id);
        if (latest && latest.status === 'proposed') {
          setPlan(latest);
          setEditedTasks(latest.tasks);
          setIsLoading(false);
          return;
        }
      }

      const focusTopics = focusInput.trim() ? focusInput.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
      const generated = await aiService.generateStudyPlan(student.id, coachId, {
        focusTopics,
        forceRefresh,
      });

      setPlan(generated);
      setEditedTasks(generated.tasks);
    } catch (err: any) {
      console.error('Failed to generate study plan:', err);
      toast.error(err?.message || 'Çalışma planı oluşturulurken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && student) {
      loadOrGeneratePlan(false);
    }
  }, [isOpen, student?.id]);

  if (!isOpen || !student) return null;

  const handleApprovePlan = async () => {
    if (!plan) return;
    try {
      setIsApproving(true);
      // Save any pending task edits first
      if (isEditing) {
        plan.tasks = editedTasks;
        await db.saveAIStudyPlan(plan);
      }

      await db.approveAndPushAIStudyPlan(plan.id, coachId);
      toast.success(`✅ ${student.name} için haftalık çalışma planı onaylandı ve ${plan.tasks.length} adet görev takvime eklendi!`);
      onPlanApproved?.();
      onClose();
    } catch (err: any) {
      console.error('Plan approval error:', err);
      toast.error('Plan onaylanırken bir sorun oluştu.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectPlan = async () => {
    if (!plan) return;
    if (!window.confirm('Bu önerilen AI çalışma planını reddetmek ve silmek istediğinize emin misiniz?')) return;
    try {
      await db.updateAIStudyPlanStatus(plan.id, 'rejected');
      toast.info('AI çalışma planı reddedildi.');
      onClose();
    } catch (err: any) {
      console.error('Plan rejection error:', err);
      toast.error('Plan reddedilirken bir sorun oluştu.');
    }
  };

  const handleTaskChange = (taskId: string, field: keyof AIStudyPlanTask, value: any) => {
    setEditedTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setEditedTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleAddNewTask = (day: AIStudyPlanTask['day']) => {
    const newTask: AIStudyPlanTask = {
      id: 'plan_task_' + Math.random().toString(36).substring(2, 7),
      day,
      subject_name: student.field === 'SAY' ? 'Matematik' : 'Türkçe',
      topic_name: 'Özel Koçluk Görevi',
      description: 'Test çözümü ve soru analizi.',
      duration_minutes: 60,
      priority: 'Yüksek',
      target_goal: 'Kazanım pekiştirme',
      question_count: 40,
      xp_reward: 50,
    };
    setEditedTasks((prev) => [...prev, newTask]);
  };

  const groupedTasks = DAYS_ORDER.map((day) => ({
    day,
    tasks: editedTasks.filter((t) => t.day === day),
  }));

  const totalQuestions = editedTasks.reduce((sum, t) => sum + (t.question_count || 0), 0);
  const totalMinutes = editedTasks.reduce((sum, t) => sum + (t.duration_minutes || 0), 0);
  const totalXp = editedTasks.reduce((sum, t) => sum + (t.xp_reward || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 transition-all animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
              <Calendar className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight">Haftalık AI Çalışma Planı</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-extrabold flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" /> AI TARAFINDAN ÖNERİLDİ
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {student.name} • {student.field} • {student.grade} • Hedef: {student.target_university || 'Hedef Üniversite'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadOrGeneratePlan(true)}
              disabled={isLoading || isApproving}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Yeniden Oluştur
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Plan Summary Bar */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-4 px-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-800 font-bold">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Toplam Görev: <span className="text-indigo-700 font-extrabold">{editedTasks.length}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Süre: <span className="text-amber-700 font-extrabold">{Math.round((totalMinutes / 60) * 10) / 10} Saat ({totalMinutes} dk)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-600" />
              Hedef Soru: <span className="text-emerald-700 font-extrabold">{totalQuestions} Soru</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-600" />
              Toplam XP: <span className="text-purple-700 font-extrabold">{totalXp} XP</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isEditing ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs"
            >
              {isEditing ? (
                <>
                  <Save className="w-3.5 h-3.5 mr-1" /> Düzenlemeyi Tamamla
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5 mr-1" /> Planı Düzenle
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto bg-slate-50/50">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-14 h-14 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                <Sparkles className="w-6 h-6 text-amber-500 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-slate-800 text-sm">Öğrenciye Özel 7 Günlük Plan Tasarlanıyor...</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Öğrencinin branş eksikleri, zayıf konuları ve haftalık deneme hedefleri harmanlanıyor.
                </p>
              </div>
            </div>
          ) : plan ? (
            <>
              {/* Focus Areas Strip */}
              {plan.focus_areas && plan.focus_areas.length > 0 && (
                <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-2xs">
                  <div className="text-xs font-bold text-indigo-900 mb-2 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" /> Bu Haftanın Stratejik Odak Alanları:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {plan.focus_areas.map((fa, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-extrabold"
                      >
                        🎯 {fa}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 7 Days Schedule Cards */}
              <div className="space-y-4">
                {groupedTasks.map(({ day, tasks: dayTasks }) => (
                  <div
                    key={day}
                    className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-2xs">
                          {day.substring(0, 2)}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm">{day}</h4>
                        <span className="text-xs text-slate-400 font-medium">
                          ({dayTasks.length} Görev • {dayTasks.reduce((s, t) => s + (t.duration_minutes || 0), 0)} dk)
                        </span>
                      </div>

                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddNewTask(day)}
                          className="text-[11px] py-1 h-7 border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Görev Ekle
                        </Button>
                      )}
                    </div>

                    {dayTasks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">Bu gün için atanmış görev bulunmuyor.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dayTasks.map((t) => (
                          <div
                            key={t.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isEditing
                                ? 'border-indigo-200 bg-indigo-50/30'
                                : 'border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-xs'
                            }`}
                          >
                            {isEditing ? (
                              <div className="space-y-2.5">
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    value={t.subject_name}
                                    onChange={(e) => handleTaskChange(t.id, 'subject_name', e.target.value)}
                                    placeholder="Ders (Örn: Matematik)"
                                    className="p-1.5 text-xs font-bold border rounded-lg bg-white"
                                  />
                                  <input
                                    type="text"
                                    value={t.topic_name}
                                    onChange={(e) => handleTaskChange(t.id, 'topic_name', e.target.value)}
                                    placeholder="Konu (Örn: Türev)"
                                    className="p-1.5 text-xs font-semibold border rounded-lg bg-white"
                                  />
                                </div>
                                <textarea
                                  value={t.description}
                                  onChange={(e) => handleTaskChange(t.id, 'description', e.target.value)}
                                  placeholder="Görev açıklaması..."
                                  rows={2}
                                  className="w-full p-1.5 text-xs border rounded-lg bg-white"
                                />
                                <div className="grid grid-cols-3 gap-2 text-[11px]">
                                  <div>
                                    <label className="text-slate-500 font-bold block mb-0.5">Süre (dk)</label>
                                    <input
                                      type="number"
                                      value={t.duration_minutes}
                                      onChange={(e) => handleTaskChange(t.id, 'duration_minutes', Number(e.target.value))}
                                      className="w-full p-1 border rounded-lg bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-slate-500 font-bold block mb-0.5">Soru Hedefi</label>
                                    <input
                                      type="number"
                                      value={t.question_count || 0}
                                      onChange={(e) => handleTaskChange(t.id, 'question_count', Number(e.target.value))}
                                      className="w-full p-1 border rounded-lg bg-white"
                                    />
                                  </div>
                                  <div className="flex items-end justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTask(t.id)}
                                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors"
                                      title="Görevi Sil"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-extrabold text-[10px] uppercase">
                                      {t.subject_name}
                                    </span>
                                    <h5 className="font-bold text-slate-900 text-xs mt-1">
                                      {t.topic_name}
                                    </h5>
                                  </div>
                                  <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                    +{t.xp_reward} XP
                                  </span>
                                </div>

                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                  {t.description}
                                </p>

                                <div className="flex items-center gap-3 pt-2 text-[11px] font-medium text-slate-500 border-t border-slate-200/60">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    {t.duration_minutes} dk
                                  </span>
                                  {t.question_count && (
                                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                      <Target className="w-3.5 h-3.5" />
                                      {t.question_count} Soru
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400 ml-auto">
                                    Öncelik: <strong className="text-slate-700">{t.priority}</strong>
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions (Human-in-the-loop: Coach Decision) */}
        <div className="p-5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>AI öğrencinin yerine karar vermez. Onayladığınızda görevler öğrencinin takvimine aktarılır.</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRejectPlan}
              disabled={isApproving || isLoading}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Reddet
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleApprovePlan}
              disabled={isApproving || isLoading || editedTasks.length === 0}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md px-5"
            >
              {isApproving ? (
                'Onaylanıyor...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-white" />
                  ✅ Planı Onayla ve Görevleri Ata
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
