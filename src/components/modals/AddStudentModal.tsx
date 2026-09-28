import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Student } from '../../types';
import { db } from '../../lib/db';
import { DEMO_COACH_USER_ID } from '../../data/seedData';
import { useToast } from '../../context/ToastContext';
import {
  UserPlus,
  Search,
  Users,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Phone,
  Mail,
  Target,
  ArrowRight,
  UserCheck,
  Plus,
  Loader2,
  RefreshCw,
  Send,
  Clock,
  RotateCcw,
  XCircle,
} from 'lucide-react';

const studentSchema = z.object({
  name: z.string().min(3, 'Ad soyad en az 3 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phoneNumber: z
    .string()
    .min(10, 'Telefon numarası en az 10 haneli olmalıdır')
    .regex(
      /^(\+90|0)?[5]\d{2}[ ]?\d{3}[ ]?\d{2}[ ]?\d{2}$|^[0-9+\s()-]{10,20}$/,
      'Geçerli bir telefon numarası giriniz (örn: 0532 123 45 67)'
    ),
  grade: z.enum(['12. Sınıf', 'Mezun'] as const),
  field: z.enum(['EA', 'SAY', 'SÖZ'] as const),
  target_university: z.string().min(2, 'Hedef üniversite adı giriniz'),
  target_department: z.string().min(2, 'Hedef bölüm adı giriniz'),
  target_rank: z.number().min(1, 'Sıralama 1 veya daha büyük olmalıdır'),
  target_score: z.number().min(100, 'Puan 100 ile 560 arasında olmalıdır').max(560, 'Puan en fazla 560 olabilir'),
});

type StudentFormData = {
  name: string;
  email: string;
  phoneNumber: string;
  grade: '12. Sınıf' | 'Mezun';
  field: 'EA' | 'SAY' | 'SÖZ';
  target_university: string;
  target_department: string;
  target_rank: number;
  target_score: number;
};

interface UnassignedStudentItem {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  grade?: string;
  field?: string;
  target_university?: string;
  target_department?: string;
  target_rank?: number;
  target_score?: number;
  avatar_url?: string;
  pending_coach_id?: string | null;
  pending_coach_name?: string | null;
  created_at?: string;
}

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (data: Omit<Student, 'id' | 'created_at' | 'updated_at' | 'xp' | 'level' | 'risk_score' | 'risk_level' | 'risk_reasons' | 'match_code'>) => Promise<void>;
  coachId?: string;
  onSuccess?: () => void;
  onStudentAssigned?: (student: Student) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  coachId,
  onSuccess,
  onStudentAssigned,
}) => {
  const { toast } = useToast();
  const effectiveCoachId = coachId || DEMO_COACH_USER_ID;
  const [activeTab, setActiveTab] = useState<'pool' | 'pending' | 'manual'>('pool');
  const [poolStudents, setPoolStudents] = useState<UnassignedStudentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickLinkInput, setQuickLinkInput] = useState('');
  const [isQuickLinking, setIsQuickLinking] = useState(false);
  const [isLoadingPool, setIsLoadingPool] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting: isSubmittingManual },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      grade: '12. Sınıf',
      field: 'SAY',
      target_university: 'Boğaziçi Üniversitesi',
      target_department: 'Bilgisayar Mühendisliği',
      target_rank: 2000,
      target_score: 485,
    },
  });

  const fetchUnassigned = useCallback(async () => {
    try {
      setIsLoadingPool(true);
      const data = await db.getUnassignedStudents();
      setPoolStudents(data);
    } catch (err) {
      console.error('Failed to load unassigned students:', err);
    } finally {
      setIsLoadingPool(false);
    }
  }, []);

  // Fetch unassigned students when modal opens or active tab switches to pool
  useEffect(() => {
    if (isOpen) {
      fetchUnassigned();

      // Listen for system/real-time student additions to immediately refetch
      const handleSync = () => {
        fetchUnassigned();
      };

      window.addEventListener('students_updated', handleSync);
      window.addEventListener('profiles_updated', handleSync);
      window.addEventListener('coach_requests_updated', handleSync);

      return () => {
        window.removeEventListener('students_updated', handleSync);
        window.removeEventListener('profiles_updated', handleSync);
        window.removeEventListener('coach_requests_updated', handleSync);
      };
    }
  }, [isOpen, activeTab, fetchUnassigned]);

  // Tab 1 Students: Strictly unassigned AND no pending coach request (coach_id IS NULL and pending_coach_id IS NULL)
  const unrequestedPool = useMemo(() => {
    return poolStudents.filter((s) => !s.pending_coach_id || s.pending_coach_id === '');
  }, [poolStudents]);

  // Tab 2 Students: Requests sent by this coach (pending_coach_id matches current coach)
  const pendingRequests = useMemo(() => {
    return poolStudents.filter(
      (s) => Boolean(s.pending_coach_id) && s.pending_coach_id === effectiveCoachId
    );
  }, [poolStudents, effectiveCoachId]);

  // Filter based on search query
  const filteredPool = useMemo(() => {
    const list = activeTab === 'pending' ? pendingRequests : unrequestedPool;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.target_university && s.target_university.toLowerCase().includes(q)) ||
        (s.target_department && s.target_department.toLowerCase().includes(q)) ||
        (s.field && s.field.toLowerCase().includes(q)) ||
        (s.grade && s.grade.toLowerCase().includes(q))
    );
  }, [unrequestedPool, pendingRequests, activeTab, searchQuery]);

  // Handle Sending a Coaching Request to Student
  const handleSendRequest = async (studentItem: UnassignedStudentItem) => {
    const studentIdentifier = studentItem.id || studentItem.user_id;
    if (!studentIdentifier || assigningId) return;
    setAssigningId(studentIdentifier);

    try {
      await db.sendCoachRequest(studentIdentifier, effectiveCoachId);
      // State update strictly upon successful response
      setPoolStudents((prev) =>
        prev.map((s) =>
          (s.id || s.user_id) === studentIdentifier
            ? { ...s, pending_coach_id: effectiveCoachId, pending_coach_name: 'Koç' }
            : s
        )
      );
      toast.success(`🚀 ${studentItem.name} öğrencisine koçluk isteği başarıyla iletildi.`);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to send coach request:', err);
      toast.error('Koçluk isteği gönderilirken bir hata oluştu.');
      await fetchUnassigned();
    } finally {
      setAssigningId(null);
    }
  };

  // Handle Withdrawing / Cancelling a Coaching Request
  const handleCancelRequest = async (studentItem: UnassignedStudentItem) => {
    const studentIdentifier = studentItem.id || studentItem.user_id;
    if (!studentIdentifier || cancellingId) return;
    setCancellingId(studentIdentifier);

    try {
      await db.cancelCoachRequest(studentIdentifier, effectiveCoachId);
      // State update strictly upon successful cancellation
      setPoolStudents((prev) =>
        prev.map((s) =>
          (s.id || s.user_id) === studentIdentifier
            ? { ...s, pending_coach_id: null, pending_coach_name: null }
            : s
        )
      );
      toast.success(`Koçluk isteği geri çekildi. Öğrenci tekrar havuza döndü.`);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to cancel coach request:', err);
      toast.error('İstek geri çekilirken bir hata oluştu.');
      await fetchUnassigned();
    } finally {
      setCancellingId(null);
    }
  };

  // Handle Direct Instant Portfolio Addition (Bypasses pending request)
  const handleDirectAssign = async (studentItem: UnassignedStudentItem) => {
    const sId = studentItem.id || studentItem.user_id;
    if (!sId || assigningId) return;
    setAssigningId(sId);

    try {
      await db.assignStudentToCoach(sId, effectiveCoachId);
      toast.success(`🎉 ${studentItem.name} başarıyla koçluk portföyünüze eklendi.`);
      if (onAdd) {
        await onAdd({} as any);
      }
      onSuccess?.();
      await fetchUnassigned();
    } catch (err) {
      console.error('Failed to directly assign student:', err);
      toast.error('Öğrenci portföye eklenirken hata oluştu.');
    } finally {
      setAssigningId(null);
    }
  };

  // Handle Quick Link by Email or Match Code
  const handleQuickLink = async () => {
    const code = quickLinkInput.trim();
    if (!code) {
      toast.error('Lütfen öğrencinin e-postasını veya STU eşleşme kodunu girin.');
      return;
    }
    setIsQuickLinking(true);
    try {
      const res = await db.linkStudentByMatchCodeOrEmail(code, effectiveCoachId);
      if (res.success) {
        toast.success(`🎉 ${res.studentName || 'Öğrenci'} başarıyla portföyünüze eklendi!`);
        setQuickLinkInput('');
        if (onAdd) {
          await onAdd({} as any);
        }
        onSuccess?.();
        await fetchUnassigned();
      } else {
        toast.error(res.error || 'Öğrenci bulunamadı.');
      }
    } catch (err: any) {
      console.error('Quick link error:', err);
      toast.error(err.message || 'Öğrenci eklenemedi.');
    } finally {
      setIsQuickLinking(false);
    }
  };

  // Handle Manual Student Registration (Adds student DIRECTLY to coach's active portfolio)
  const onManualSubmit = async (data: StudentFormData) => {
    try {
      const mockUserId = 'user_' + Math.random().toString(36).substring(2, 9);
      
      const payload = {
        ...data,
        user_id: mockUserId,
        coach_id: effectiveCoachId,
        pending_coach_id: null,
        pending_coach_name: null,
      };

      const newStudent = await db.addStudent(payload);

      if (onAdd) {
        await onAdd(payload);
      }
      if (onStudentAssigned) {
        onStudentAssigned(newStudent);
      }
      onSuccess?.();

      toast.success(`🎉 ${data.name} başarıyla oluşturuldu ve koçluk portföyünüze eklendi!`);
      reset();
      onClose();
    } catch (err) {
      console.error('Failed to add student:', err);
      toast.error('Öğrenci kaydedilirken bir hata oluştu.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Koçluk Portföyüne Öğrenci Ekle"
      subtitle="Havuzdaki koçsuz öğrencilere istek gönderin veya yeni kayıt oluşturun"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* 3-Tab Selector */}
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('pool')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pool'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Öğrenci Havuzu ({unrequestedPool.length})</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-white text-amber-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Gönderilen İstekler ({pendingRequests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'manual'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span>Yeni Manuel Kayıt</span>
          </button>
        </div>

        {/* TAB 1 & 2: STUDENT POOL & PENDING REQUESTS */}
        {(activeTab === 'pool' || activeTab === 'pending') && (
          <div className="space-y-4">
            {/* Search Box & Manual Refresh */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'pending'
                      ? 'Gönderilen isteklerde ara...'
                      : 'Öğrenci adı, e-posta, hedef üniversite veya alan ara...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                />
              </div>

              <button
                type="button"
                onClick={() => fetchUnassigned()}
                disabled={isLoadingPool}
                title="Yenile"
                className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingPool ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>

            {/* List View */}
            <div className="max-h-[360px] overflow-y-auto space-y-2.5 pr-1">
              {isLoadingPool ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                  <p className="text-xs font-medium">Veriler yükleniyor...</p>
                </div>
              ) : filteredPool.length === 0 ? (
                <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                    {activeTab === 'pending' ? <Clock className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {activeTab === 'pending'
                      ? searchQuery
                        ? 'Aramanıza uygun gönderilmiş istek bulunamadı'
                        : 'Henüz gönderilmiş bekleyen bir koçluk isteğiniz bulunmuyor'
                      : searchQuery
                      ? 'Aramanıza uygun öğrenci bulunamadı'
                      : 'Havuzda henüz boşta öğrenci yok'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {activeTab === 'pending'
                      ? 'Öğrenci Havuzu sekmesinden koçsuz öğrencilere "Koçluk İsteği Gönder" butonuna basarak davet iletebilirsiniz.'
                      : searchQuery
                      ? 'Farklı bir anahtar kelime ile arama yapabilir veya "Yeni Manuel Kayıt" sekmesinden doğrudan öğrenci ekleyebilirsiniz.'
                      : 'Yeni bir öğrenci kaydı oluşturmak için "Yeni Manuel Kayıt" sekmesine geçebilirsiniz.'}
                  </p>
                  {activeTab === 'pool' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 text-xs"
                      onClick={() => setActiveTab('manual')}
                    >
                      Yeni Kayıt Formunu Aç
                    </Button>
                  )}
                  {activeTab === 'pending' && unrequestedPool.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 text-xs"
                      onClick={() => setActiveTab('pool')}
                    >
                      Öğrenci Havuzuna Git ({unrequestedPool.length})
                    </Button>
                  )}
                </div>
              ) : (
                filteredPool.map((stu) => {
                  const sId = stu.id || stu.user_id;
                  const isAssigning = assigningId === sId;
                  const isCancelling = cancellingId === sId;

                  return (
                    <div
                      key={sId}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                          {stu.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{stu.name}</h4>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-[10px] whitespace-nowrap shrink-0">
                              {stu.field || 'SAY'} • {stu.grade || '12. Sınıf'}
                            </span>
                            {stu.target_rank && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-[10px] whitespace-nowrap shrink-0">
                                Hedef: #{stu.target_rank}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 truncate flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate">{stu.target_university || 'Hedef Belirlenmedi'}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 truncate">{stu.target_department || 'Mühendislik / Tıp'}</span>
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 truncate max-w-[180px]">
                              <Mail className="w-3 h-3 shrink-0" /> {stu.email}
                            </span>
                            {stu.phone && (
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                <Phone className="w-3 h-3 shrink-0" /> {stu.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Control with Strict Overflow Prevention */}
                      <div className="shrink-0 flex items-center justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {activeTab === 'pending' ? (
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
                            <span className="whitespace-nowrap shrink-0 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5 shadow-xs">
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                              <span>İstek Gönderildi</span>
                            </span>
                            <button
                              type="button"
                              disabled={isCancelling}
                              onClick={() => handleCancelRequest(stu)}
                              className="whitespace-nowrap shrink-0 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs disabled:opacity-50"
                            >
                              {isCancelling ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              <span>İsteği Geri Çek</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 w-full sm:w-auto">
                            <button
                              type="button"
                              disabled={isAssigning}
                              onClick={() => handleDirectAssign(stu)}
                              className="whitespace-nowrap shrink-0 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-all active:scale-95 inline-flex items-center justify-center gap-1.5 w-full sm:w-auto disabled:opacity-50"
                              title="Öğrenciyi doğrudan aktif koçluk portföyünüze ekleyin"
                            >
                              {isAssigning ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <UserPlus className="w-3.5 h-3.5" />
                              )}
                              <span>Portföye Ekle</span>
                            </button>
                            <button
                              type="button"
                              disabled={isAssigning}
                              onClick={() => handleSendRequest(stu)}
                              className="whitespace-nowrap shrink-0 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer transition-all active:scale-95 inline-flex items-center justify-center gap-1 w-full sm:w-auto disabled:opacity-50"
                              title="Öğrenciye bildirim olarak koçluk daveti gönderin"
                            >
                              <Send className="w-3 h-3" />
                              <span className="hidden sm:inline">İstek Gönder</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MANUAL REGISTRATION */}
        {activeTab === 'manual' && (
          <form onSubmit={handleSubmit(onManualSubmit)} className="space-y-4">
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center gap-2.5 text-xs text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Kaydettiğiniz öğrenci <strong>Öğrenci Havuzuna</strong> eklenecektir. İlgili öğrenciye koçluk isteği göndermek için Havuz sekmesinden <strong>"Koçluk İsteği Gönder"</strong> butonuna tıklayabilirsiniz.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <Input
                label="Öğrenci Adı Soyadı"
                placeholder="Örn: Emirhan Yıldız"
                error={errors.name?.message}
                {...register('name')}
              />

              <Input
                label="E-Posta Adresi"
                type="email"
                placeholder="emirhan@ornek.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Telefon Numarası"
                placeholder="0532 123 45 67"
                error={errors.phoneNumber?.message}
                {...register('phoneNumber')}
              />

              <Select
                label="Sınıf Düzeyi"
                error={errors.grade?.message}
                {...register('grade')}
              >
                <option value="12. Sınıf">12. Sınıf</option>
                <option value="Mezun">Mezun</option>
              </Select>

              <Select
                label="Alan"
                error={errors.field?.message}
                {...register('field')}
              >
                <option value="SAY">Sayısal (SAY)</option>
                <option value="EA">Eşit Ağırlık (EA)</option>
                <option value="SÖZ">Sözel (SÖZ)</option>
              </Select>

              <Input
                label="Hedef Sıralama (YKS)"
                type="number"
                placeholder="Örn: 2500"
                error={errors.target_rank?.message}
                {...register('target_rank', { valueAsNumber: true })}
              />

              <Input
                label="Hedef Üniversite"
                placeholder="Örn: Boğaziçi Üniversitesi"
                error={errors.target_university?.message}
                {...register('target_university')}
              />

              <Input
                label="Hedef Bölüm"
                placeholder="Örn: Bilgisayar Mühendisliği"
                error={errors.target_department?.message}
                {...register('target_department')}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs"
              >
                İptal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmittingManual}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 cursor-pointer"
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              >
                Öğrenciyi Kaydet (Havuza Ekle)
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

