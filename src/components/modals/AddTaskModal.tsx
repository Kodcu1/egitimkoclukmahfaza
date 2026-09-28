import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Task, Student, TaskPriority } from '../../types';
import {
  CheckSquare,
  Smartphone,
  MessageSquare,
  AlertCircle,
  Sparkles,
  UserPlus,
  Users,
  Search,
  Check,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { db } from '../../lib/db';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  students?: Student[];
  preselectedStudentId?: string;
  onAddTask: (task: Omit<Task, 'id' | 'created_at'>) => Promise<void>;
  coachId: string;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  students: propStudents,
  preselectedStudentId,
  onAddTask,
  coachId,
}) => {
  const { toast } = useToast();
  const [selectedExamGroup, setSelectedExamGroup] = useState<'Tümü' | 'YKS' | 'LGS' | 'KPSS'>('Tümü');
  const [portfolioStudents, setPortfolioStudents] = useState<Student[]>(propStudents || []);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    preselectedStudentId ? [preselectedStudentId] : []
  );
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<TaskPriority>('Yüksek');
  const [xpReward, setXpReward] = useState<number>(20);
  const [sendSms, setSendSms] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper to determine student's exam group
  const getStudentExamGroup = (s: Student): 'YKS' | 'LGS' | 'KPSS' => {
    if (s.target_exam) return s.target_exam;
    if (s.grade === '8. Sınıf' || s.field === 'LGS' || s.target_school?.toLowerCase().includes('lise')) return 'LGS';
    if (
      s.grade === 'Ön Lisans' ||
      s.grade === 'Lisans' ||
      s.field === 'GY-GK' ||
      s.field === 'Eğitim Bilimleri' ||
      s.field === 'Alan (ÖABT)'
    ) {
      return 'KPSS';
    }
    return 'YKS';
  };

  // Filtered student list based on selected exam group and search
  const filteredStudents = portfolioStudents.filter((s) => {
    const matchesGroup = selectedExamGroup === 'Tümü' || getStudentExamGroup(s) === selectedExamGroup;
    const matchesSearch = !studentSearch.trim() || s.name.toLowerCase().includes(studentSearch.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  // Fetch coach's real students from database when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadCoachStudents = async () => {
        try {
          setIsLoadingStudents(true);
          const data = await db.getStudents(coachId);
          if (data && data.length > 0) {
            setPortfolioStudents(data);
            if (preselectedStudentId) {
              setSelectedStudentIds([preselectedStudentId]);
            } else if (selectedStudentIds.length === 0) {
              setSelectedStudentIds([data[0].id]);
            }
          } else if (propStudents && propStudents.length > 0) {
            setPortfolioStudents(propStudents);
            if (preselectedStudentId) {
              setSelectedStudentIds([preselectedStudentId]);
            } else if (selectedStudentIds.length === 0) {
              setSelectedStudentIds([propStudents[0].id]);
            }
          }
        } catch (err) {
          console.error('Failed to load portfolio students for task modal:', err);
          if (propStudents) setPortfolioStudents(propStudents);
        } finally {
          setIsLoadingStudents(false);
        }
      };

      loadCoachStudents();
    }
  }, [isOpen, coachId, preselectedStudentId]);

  const toggleStudentSelection = (id: string) => {
    if (preselectedStudentId) return;
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredStudents.map((s) => s.id);
    setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleClearSelection = () => {
    if (preselectedStudentId) return;
    setSelectedStudentIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Lütfen görev başlığı giriniz.');
      return;
    }
    if (selectedStudentIds.length === 0) {
      setErrorMsg('Lütfen atanacak en az bir hedef öğrenci seçiniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      for (const sId of selectedStudentIds) {
        const targetStudent = portfolioStudents.find((s) => s.id === sId || s.user_id === sId);

        await onAddTask({
          student_id: sId,
          coach_id: coachId,
          title: title.trim(),
          description: description.trim() || undefined,
          due_date: new Date(dueDate + 'T23:59:59Z').toISOString(),
          priority,
          status: 'Bekliyor',
          xp_reward: Number(xpReward) || 20,
        });

        if (sendSms && targetStudent) {
          await db.addSmsLog({
            student_id: sId,
            student_name: targetStudent.name,
            phone_number: targetStudent.phoneNumber || targetStudent.phone || '0532 123 45 67',
            action_type: 'Görev Atama',
            message_content: `Sn. ${targetStudent.name}, Mahfaza.co Eğitim Koçluğu tarafından yeni bir koçluk görevi atandı: "${title.trim()}". Son teslim: ${dueDate}. Başarılar!`,
            status: 'İletildi',
          });
        }
      }

      toast.success(
        `🎯 "${title.trim()}" görevi ${selectedStudentIds.length} öğrenciye başarıyla atandı!`
      );

      setTitle('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Görev oluşturulurken bir hata meydana geldi.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yeni Koçluk Görevi Ata (Çoklu Seçim Destekli)"
      subtitle="Portföyünüzdeki öğrencilere haftalık soru hedefi, deneme veya çalışma fasikülü görevi tanımlayın"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {portfolioStudents.length === 0 && !isLoadingStudents ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Portföyünüzde Henüz Öğrenci Bulunmuyor</p>
              <p className="text-amber-700 mt-0.5">
                Görev atayabilmek için önce panonuzdaki "Öğrenci Ekle" butonundan portföyünüze öğrenci eklemelisiniz.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Sınav Grubu Filtresi */}
            {!preselectedStudentId && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Sınav Grubu Filtresi
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  {(['Tümü', 'YKS', 'LGS', 'KPSS'] as const).map((grp) => {
                    const isSelected = selectedExamGroup === grp;
                    const count =
                      grp === 'Tümü'
                        ? portfolioStudents.length
                        : portfolioStudents.filter((s) => getStudentExamGroup(s) === grp).length;
                    return (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => setSelectedExamGroup(grp)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        <span>{grp}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hedef Öğrenci Çoklu Seçim (Multi-Select Checkboxes) */}
            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/60 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Hedef Öğrenciler ({selectedStudentIds.length} Seçili)</span>
                </span>

                {!preselectedStudentId && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllVisible}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Listedekileri Seç
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-[11px] font-bold text-slate-500 hover:text-rose-600 cursor-pointer"
                    >
                      Temizle
                    </button>
                  </div>
                )}
              </div>

              {!preselectedStudentId && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Öğrenci adı ara..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              )}

              {/* Scrollable Checkbox List */}
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <p className="text-xs text-slate-500 p-2 text-center">Öğrenci bulunamadı.</p>
                ) : (
                  filteredStudents.map((s) => {
                    const isChecked = selectedStudentIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-50/80 border border-indigo-200'
                            : 'hover:bg-slate-100/70 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleStudentSelection(s.id)}
                            disabled={Boolean(preselectedStudentId)}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">
                              {s.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {getStudentExamGroup(s)} • {s.grade || '12. Sınıf'} • {s.field || 'SAY'}
                            </span>
                          </div>
                        </div>

                        {isChecked && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full shrink-0">
                            Seçildi
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Görev Başlığı */}
        <Input
          label="Görev Başlığı"
          placeholder="Örn: 2026 AYT Limit-Süreklilik 150 Soru Fasikülü"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Görev Açıklaması */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Açıklama & Koç Yönergeleri (Opsiyonel)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Görevin detayları, odaklanılması gereken formüller veya video çözüm linkleri..."
          />
        </div>

        {/* Tarih, Öncelik, XP */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Son Teslim Tarihi"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />

          <Select
            label="Öncelik Seviyesi"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            <option value="Düşük">Düşük</option>
            <option value="Normal">Normal</option>
            <option value="Yüksek">Yüksek</option>
            <option value="Kritik">Kritik</option>
          </Select>

          <Input
            label="XP Ödülü"
            type="number"
            min="5"
            max="100"
            step="5"
            value={xpReward}
            onChange={(e) => setXpReward(Number(e.target.value))}
          />
        </div>

        {/* SMS Bildirimi Seçeneği */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-slate-800">Öğrencilere SMS Bildirimi Gönder</p>
              <p className="text-[10px] text-slate-500">Görev atandığında öğrencinin telefonuna otomatik SMS iletilir.</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={sendSms}
            onChange={(e) => setSendSms(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
          />
        </div>

        {/* Footer Butonları */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || selectedStudentIds.length === 0}
            className="bg-indigo-900 hover:bg-indigo-800 text-white"
          >
            {isSubmitting
              ? 'Atanıyor...'
              : `${selectedStudentIds.length > 1 ? `${selectedStudentIds.length} Öğrenciye ` : ''}Görevi Ata`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
