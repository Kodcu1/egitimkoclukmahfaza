import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { XpApprovalRequest, Student, ApprovalStatus, XpApprovalType } from '../../types';
import { formatDateTurkish } from '../../utils/formatters';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  Eye,
  X,
  AlertTriangle,
  ZoomIn,
  BookOpen,
  Award,
  CheckSquare,
  ShieldCheck,
  CheckCheck,
  MessageSquare,
  ChevronRight,
  User,
  Zap,
  Trash2,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const CoachApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<XpApprovalRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('pending');
  const [activityFilter, setActivityFilter] = useState<XpApprovalType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Proof Lightbox Modal
  const [previewProof, setPreviewProof] = useState<{
    url: string;
    name: string;
    title: string;
    studentName: string;
  } | null>(null);

  // Rejection Notes Modal
  const [rejectingItem, setRejectingItem] = useState<XpApprovalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Loading & Processing States
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async (showSpinner = false) => {
    try {
      if (showSpinner || approvals.length === 0) setLoading(true);
      const [allApprovals, studentList] = await Promise.all([
        db.getXpApprovals(),
        db.getStudents(),
      ]);
      setApprovals(allApprovals);
      setStudents(studentList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const handleUpdate = () => loadData(false);
    window.addEventListener('approvals_updated', handleUpdate);
    return () => window.removeEventListener('approvals_updated', handleUpdate);
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApprove = async (item: XpApprovalRequest) => {
    try {
      setProcessingId(item.id);
      // 1. Optimistic UI update so the item immediately moves from pending to approved tab
      setApprovals((prev) =>
        prev.map((a) =>
          a.id === item.id
            ? { ...a, status: 'approved', processed_at: new Date().toISOString() }
            : a
        )
      );
      showToast(`✅ "${item.title}" onaylandı! ${item.student_name} kullanıcısına +${item.calculated_xp} XP tanımlandı.`);

      // 2. Persist to server & db
      await db.processXpApproval(item.id, 'approved', 'Koç tarafından incelendi ve onaylandı.');
      const [allApprovals, studentList] = await Promise.all([
        db.getXpApprovals(),
        db.getStudents(),
      ]);
      setApprovals(allApprovals);
      setStudents(studentList);
      window.dispatchEvent(new CustomEvent('approvals_updated'));
    } catch (e: any) {
      showToast(e.message || 'Onaylama işlemi sırasında bir hata oluştu.', 'error');
      await loadData(false);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingItem) return;
    try {
      setProcessingId(rejectingItem.id);
      const note = rejectReason.trim() || 'Kanıt belgesi veya çalışma detayları yetersiz görüldü.';
      setApprovals((prev) =>
        prev.map((a) =>
          a.id === rejectingItem.id
            ? { ...a, status: 'rejected', coach_notes: note, processed_at: new Date().toISOString() }
            : a
        )
      );
      showToast(`❌ "${rejectingItem.title}" reddedildi. Öğrenci bilgilendirildi.`, 'error');
      const targetId = rejectingItem.id;
      setRejectingItem(null);
      setRejectReason('');

      await db.processXpApproval(targetId, 'rejected', note);
      const [allApprovals, studentList] = await Promise.all([
        db.getXpApprovals(),
        db.getStudents(),
      ]);
      setApprovals(allApprovals);
      setStudents(studentList);
      window.dispatchEvent(new CustomEvent('approvals_updated'));
    } catch (e: any) {
      showToast(e.message || 'Reddetme işlemi sırasında bir hata oluştu.', 'error');
      await loadData(false);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAllPending = async () => {
    const pendingItems = approvals.filter((a) => a.status === 'pending');
    if (pendingItems.length === 0) {
      showToast('Onay bekleyen herhangi bir talep bulunmuyor.', 'error');
      return;
    }

    if (!window.confirm(`${pendingItems.length} adet bekleyen çalışma ve XP talebini onaylamak ve XP'leri öğrencilerin hesabına aktarmak istiyor musunuz?`)) {
      return;
    }

    try {
      setLoading(true);
      await db.batchProcessXpApprovals(
        pendingItems.map((p) => p.id),
        'approved'
      );
      showToast(`🎉 ${pendingItems.length} adet bekleyen talep başarıyla onaylandı ve XP'ler yüklendi!`);
      await loadData();
      window.dispatchEvent(new CustomEvent('approvals_updated'));
      window.dispatchEvent(new CustomEvent('tasks_updated'));
    } catch (e: any) {
      showToast('Toplu onaylama sırasında bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApproval = async (item: XpApprovalRequest) => {
    if (
      !window.confirm(
        `"${item.title}" kaydını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem ilişkili çalışma/deneme kaydını veritabanından tamamen temizler.`
      )
    ) {
      return;
    }

    const deleteId = item.id;
    // Optimistic UI: Immediately remove card from local state
    setApprovals((prev) => prev.filter((a) => a.id !== deleteId));
    showToast(`🗑️ "${item.title}" kaydı kalıcı olarak silindi.`);

    try {
      await db.deleteXpApproval(deleteId);
      window.dispatchEvent(new CustomEvent('approvals_updated'));
    } catch (err: any) {
      console.error('Kayıt silinirken hata:', err);
      showToast('Kayıt silinirken bir hata oluştu.', 'error');
      await loadData();
    }
  };

  // Filter items
  const filteredApprovals = approvals.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (selectedStudentId !== 'all' && item.student_id !== selectedStudentId) return false;
    if (activityFilter !== 'all' && item.activity_type !== activityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchStudent = (item.student_name || '').toLowerCase().includes(q);
      const matchDetails = item.details.toLowerCase().includes(q);
      if (!matchTitle && !matchStudent && !matchDetails) return false;
    }
    return true;
  });

  // Calculate statistics
  const pendingCount = approvals.filter((a) => a.status === 'pending').length;
  const approvedCount = approvals.filter((a) => a.status === 'approved').length;
  const rejectedCount = approvals.filter((a) => a.status === 'rejected').length;
  const totalApprovedXp = approvals
    .filter((a) => a.status === 'approved')
    .reduce((acc, curr) => acc + curr.calculated_xp, 0);

  const getActivityBadge = (type: XpApprovalType) => {
    switch (type) {
      case 'study_log':
        return {
          label: 'Çalışma Günlüğü (Test)',
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: BookOpen,
        };
      case 'exam':
        return {
          label: 'Deneme Sınavı',
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Award,
        };
      case 'task':
        return {
          label: 'Koçluk Görevi',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckSquare,
        };
      default:
        return {
          label: 'Aktivite',
          color: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: Zap,
        };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-bounce max-w-md',
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border-emerald-500/50'
              : 'bg-rose-950 text-rose-100 border-rose-500/50'
          )}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <p className="text-xs font-bold">{toastMessage.text}</p>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Onay Bekleyen İşlemler & Çalışma Kanıtları
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                Öğrencilerinizin yüklediği test, deneme ve görev kanıtlarını inceleyin; XP artışlarını onaylayın.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {pendingCount > 0 && (
            <button
              onClick={handleApproveAllPending}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Tüm Bekleyenleri Onayla ({pendingCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Onay Bekleyenler</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount} Talep</p>
            <span className="text-[11px] font-bold text-slate-500">İncelenmeyi bekliyor</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Onaylanan Kayıtlar</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{approvedCount} Adet</p>
            <span className="text-[11px] font-bold text-slate-500">XP cüzdanına aktarıldı</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Dağıtılan Toplam XP</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">+{totalApprovedXp} XP</p>
            <span className="text-[11px] font-bold text-slate-500">Öğrenci rütbe ilerlemesi</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Reddedilen Kayıt</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{rejectedCount} Adet</p>
            <span className="text-[11px] font-bold text-slate-500">Kanıt yetersizliği</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Status Tab Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex overflow-x-auto scrollbar-none w-full sm:w-auto bg-slate-100 p-1 rounded-xl gap-1 max-w-full">
            <button
              onClick={() => setStatusFilter('pending')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap min-h-[36px]',
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Bekleyenler ({pendingCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('approved')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap min-h-[36px]',
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Onaylananlar ({approvedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('rejected')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap min-h-[36px]',
                statusFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <XCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Reddedilenler ({rejectedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 whitespace-nowrap min-h-[36px]',
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Tümü ({approvals.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-500">
              Gösterilen: <strong className="text-slate-900">{filteredApprovals.length}</strong> Talep
            </span>
          </div>
        </div>

        {/* Secondary Filters Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Öğrenci adı, ders veya konu ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Student Filter */}
          <div className="sm:col-span-4">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
            >
              <option value="all">Tüm Öğrenciler ({students.length})</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.field} • {s.grade})
                </option>
              ))}
            </select>
          </div>

          {/* Activity Filter */}
          <div className="sm:col-span-3">
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
            >
              <option value="all">Tüm Aktivite Türleri</option>
              <option value="study_log">Çalışma Günlükleri</option>
              <option value="exam">Deneme Sınavları</option>
              <option value="task">Koçluk Görevleri</option>
            </select>
          </div>
        </div>
      </div>

      {/* Approvals List Stream */}
      <div className="space-y-3.5">
        {filteredApprovals.map((item) => {
          const badge = getActivityBadge(item.activity_type);
          const Icon = badge.icon;
          const isPending = item.status === 'pending';
          const isApproved = item.status === 'approved';
          const isRejected = item.status === 'rejected';
          const isProcessing = processingId === item.id;

          return (
            <div
              key={item.id}
              className={cn(
                'p-5 bg-white rounded-2xl border transition-all duration-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5',
                isPending
                  ? 'border-amber-200/80 hover:border-amber-400 bg-amber-50/20'
                  : isApproved
                  ? 'border-slate-200 hover:border-emerald-300'
                  : 'border-rose-100 bg-rose-50/10'
              )}
            >
              {/* Left Info Column */}
              <div className="flex items-start gap-4 min-w-0 flex-1">
                {/* Student Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black flex items-center justify-center text-base shadow-sm">
                    {(item.student_name || 'Ö').charAt(0)}
                  </div>
                  {isPending && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white animate-pulse" />
                  )}
                </div>

                {/* Main Content */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {item.student_name || 'Öğrenci'}
                    </span>
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1',
                        badge.color
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black">
                      +{item.calculated_xp} XP
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 font-medium">
                    {item.details}
                  </p>

                  {/* Submission Timestamp & Coach Notes */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 font-medium">
                    <span>
                      Talep Tarihi: {formatDateTurkish(item.requested_at)}
                    </span>
                    {item.processed_at && (
                      <span className="text-slate-400">
                        • İşlenme: {formatDateTurkish(item.processed_at)}
                      </span>
                    )}
                    {item.coach_notes && (
                      <span className="text-indigo-600 font-semibold">
                        • Koç Notu: "{item.coach_notes}"
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle: Proof Thumbnail & Inspection Box */}
              <div className="flex items-center gap-3 shrink-0 self-stretch lg:self-center bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                {item.proof_url ? (
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() =>
                        setPreviewProof({
                          url: item.proof_url!,
                          name: item.proof_name || 'calisma_kaniti.png',
                          title: item.title,
                          studentName: item.student_name || 'Öğrenci',
                        })
                      }
                      className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-300 bg-white cursor-pointer group shadow-sm shrink-0"
                    >
                      <img
                        src={item.proof_url}
                        alt="Çalışma Kanıtı"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                        {item.proof_name || 'Kanıt Belgesi'}
                      </p>
                      <button
                        onClick={() =>
                          setPreviewProof({
                            url: item.proof_url!,
                            name: item.proof_name || 'calisma_kaniti.png',
                            title: item.title,
                            studentName: item.student_name || 'Öğrenci',
                          })
                        }
                        className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-0.5 underline"
                      >
                        <ZoomIn className="w-3 h-3" />
                        <span>Kanıtı İncele</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2 text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Görsel Kanıt Yok</span>
                  </div>
                )}
              </div>

              {/* Right: Actions or Status Indicator */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end sm:justify-start pt-2 lg:pt-0 border-t border-slate-100 lg:border-t-0">
                {isPending ? (
                  <>
                    <button
                      onClick={() => handleApprove(item)}
                      disabled={isProcessing}
                      className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer touch-manipulation"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Onayla (+{item.calculated_xp} XP)</span>
                    </button>

                    <button
                      onClick={() => setRejectingItem(item)}
                      disabled={isProcessing}
                      className="flex-1 sm:flex-initial px-3 py-2.5 min-h-[40px] rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-rose-600 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer touch-manipulation"
                    >
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Reddet</span>
                    </button>

                    <button
                      onClick={() => handleDeleteApproval(item)}
                      disabled={isProcessing}
                      title="Bu mükerrer veya hatalı kaydı kalıcı olarak sil"
                      className="p-2.5 min-h-[40px] min-w-[40px] rounded-xl bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-red-500 hover:text-red-600 transition-colors flex items-center justify-center cursor-pointer group shrink-0 touch-manipulation"
                    >
                      <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                    </button>
                  </>
                ) : isApproved ? (
                  <>
                    <div className="px-3.5 py-2 min-h-[40px] rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Onaylandı (+{item.calculated_xp} XP Verildi)</span>
                    </div>

                    <button
                      onClick={() => handleDeleteApproval(item)}
                      disabled={isProcessing}
                      title="Bu kaydı kalıcı olarak sil"
                      className="p-2.5 min-h-[40px] min-w-[40px] rounded-xl bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center cursor-pointer group shrink-0 touch-manipulation"
                    >
                      <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-3.5 py-2 min-h-[40px] rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black flex items-center gap-1.5 shadow-sm">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Reddedildi</span>
                    </div>

                    <button
                      onClick={() => handleDeleteApproval(item)}
                      disabled={isProcessing}
                      title="Bu kaydı kalıcı olarak sil"
                      className="p-2.5 min-h-[40px] min-w-[40px] rounded-xl bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center cursor-pointer group shrink-0 touch-manipulation"
                    >
                      <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {filteredApprovals.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <FileCheck className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              {statusFilter === 'pending'
                ? 'Onay Bekleyen İşlem Yok'
                : 'Filtreye Uygun Kayıt Bulunamadı'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
              {statusFilter === 'pending'
                ? 'Öğrencileriniz yeni bir soru çözüm günlüğü, deneme sonucu veya ödev kanıtı yüklediğinde bu listede görüntülenecektir.'
                : 'Farklı bir filtre veya arama kriteri seçerek diğer kayıtları görüntüleyebilirsiniz.'}
            </p>
          </div>
        )}
      </div>

      {/* Proof Preview Lightbox Modal */}
      {previewProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  <span>Çalışma Kanıtı Doğrulama Ekranı</span>
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {previewProof.studentName} • {previewProof.title}
                </p>
              </div>
              <button
                onClick={() => setPreviewProof(null)}
                className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Image */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-900/5">
              <div className="max-w-full rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-lg">
                <img
                  src={previewProof.url}
                  alt={previewProof.name}
                  className="max-h-[60vh] object-contain w-full"
                />
              </div>
              <p className="text-xs text-slate-500 font-mono mt-3">
                Dosya: {previewProof.name}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-slate-200 flex items-center justify-between bg-white">
              <span className="text-xs text-slate-500 font-medium">
                Doğrulama Sonrası XP Öğrenci Hesabına Yansıtılacaktır.
              </span>
              <button
                onClick={() => setPreviewProof(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Confirmation Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Talebi Reddet
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {rejectingItem.student_name} - {rejectingItem.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Öğrenciye iletilecek ret gerekçesini yazınız (Kanıt eksikliği, yanlış süre/soru sayısı vb.):
            </p>

            <textarea
              rows={3}
              placeholder="Örn: Yüklenen fotoğraf net değil veya soru sayısı ile uyuşmuyor, lütfen tekrar yükleyiniz."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white font-medium"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setRejectingItem(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Vazgeç
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Reddet ve Bildir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
