import React, { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { AdminCoachProfile, DemoAccount, UserRole } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  UserCheck,
  Shield,
  Layers,
  Sparkles,
  BookOpen,
  Eye,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Award,
  TrendingUp,
  X,
  Target,
  Edit2,
  Trash2,
  Plus,
  Key,
  Copy,
  Check,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const AdminCoachesPage: React.FC = () => {
  const { toast } = useToast();
  const { user: currentAdmin } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'coaches' | 'demo_accounts'>('coaches');

  // Coaches State
  const [coaches, setCoaches] = useState<AdminCoachProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Demo Accounts State
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [loadingDemos, setLoadingDemos] = useState(false);
  const [demoSearchQuery, setDemoSearchQuery] = useState('');

  // Modals
  const [selectedCoach, setSelectedCoach] = useState<AdminCoachProfile | null>(null);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);

  // Edit Coach Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCoachData, setEditCoachData] = useState<{
    id: string;
    name: string;
    phone: string;
    specialty: string;
    bio: string;
    status: 'active' | 'pending' | 'inactive';
  }>({
    id: '',
    name: '',
    phone: '',
    specialty: '',
    bio: '',
    status: 'active',
  });

  // Delete Coach Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [coachToDelete, setCoachToDelete] = useState<AdminCoachProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create Demo Modal
  const [isCreateDemoModalOpen, setIsCreateDemoModalOpen] = useState(false);
  const [newDemoName, setNewDemoName] = useState('');
  const [newDemoEmail, setNewDemoEmail] = useState('');
  const [newDemoRole, setNewDemoRole] = useState<UserRole>('coach');
  const [newDemoDays, setNewDemoDays] = useState<number>(3);
  const [newDemoNotes, setNewDemoNotes] = useState('');
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coachesData, demosData] = await Promise.all([
        db.getCoachesForAdmin(),
        db.getDemoAccounts(),
      ]);
      setCoaches(coachesData);
      setDemoAccounts(demosData);
    } catch (err) {
      console.error('Failed to load coaches data:', err);
      toast.error('Koç ve demo verileri yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Toggle Coach Status
  const handleToggleStatus = async (coach: AdminCoachProfile) => {
    if (coach.is_founder || coach.email === 'serkankocak551@gmail.com') {
      toast.error('Kurucu Eğitimci hesabı durumu değiştirilemez.');
      return;
    }

    const nextStatus = coach.status === 'active' ? 'inactive' : 'active';
    try {
      await db.updateCoachStatusForAdmin(coach.id, nextStatus as any, currentAdmin?.email);
      setCoaches((prev) =>
        prev.map((c) => (c.id === coach.id || c.user_id === coach.id ? { ...c, status: nextStatus as any } : c))
      );
      toast.success(`Koç durumu "${nextStatus === 'active' ? 'Aktif' : 'Pasif'}" olarak güncellendi.`);
    } catch (err: any) {
      toast.error(err.message || 'Durum güncellenirken hata oluştu.');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (coach: AdminCoachProfile) => {
    setSelectedCoach(coach);
    setEditCoachData({
      id: coach.id || coach.user_id,
      name: coach.name,
      phone: coach.phone || '',
      specialty: coach.specialty || '',
      bio: coach.bio || '',
      status: coach.status,
    });
    setIsEditModalOpen(true);
  };

  // Save Coach Edit
  const handleSaveCoachEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCoachData.name.trim()) {
      toast.error('Koç ismi zorunludur.');
      return;
    }

    try {
      await db.updateCoachDetailsForAdmin(editCoachData.id, editCoachData, currentAdmin?.email);
      setCoaches((prev) =>
        prev.map((c) =>
          c.id === editCoachData.id || c.user_id === editCoachData.id
            ? { ...c, ...editCoachData }
            : c
        )
      );
      toast.success('Koç bilgileri başarıyla güncellendi.');
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Güncelleme başarısız oldu.');
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (coach: AdminCoachProfile) => {
    if (coach.is_founder || coach.email === 'serkankocak551@gmail.com') {
      toast.error('Kurucu Eğitimci hesabı kesinlikle silinemez!');
      return;
    }
    setCoachToDelete(coach);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Coach
  const handleConfirmDeleteCoach = async () => {
    if (!coachToDelete) return;
    setIsDeleting(true);

    try {
      const res = await db.deleteCoachForAdmin(coachToDelete.id || coachToDelete.user_id, currentAdmin?.email || 'mahfaza.co@gmail.com');
      setCoaches((prev) => prev.filter((c) => c.id !== coachToDelete.id && c.user_id !== coachToDelete.id));
      toast.success(`Koç hesabı silindi. ${res.unassignedStudentsCount} öğrenci serbest havuza aktarıldı.`);
      setIsDeleteModalOpen(false);
      setCoachToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Silme işlemi başarısız oldu.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Demo Accounts Operations
  const handleCreateDemoAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDemoName.trim() || !newDemoEmail.trim()) {
      toast.error('İsim ve E-posta zorunludur.');
      return;
    }

    setIsCreatingDemo(true);
    try {
      const newDemo = await db.createDemoAccount({
        name: newDemoName.trim(),
        email: newDemoEmail.trim().toLowerCase(),
        role: newDemoRole,
        durationDays: newDemoDays,
        notes: newDemoNotes.trim() || undefined,
        createdBy: currentAdmin?.email || 'admin',
      });
      setDemoAccounts((prev) => [newDemo, ...prev]);
      toast.success(`Demo hesap (${newDemo.email}) ${newDemoDays} günlük başarıyla oluşturuldu.`);
      setIsCreateDemoModalOpen(false);
      setNewDemoName('');
      setNewDemoEmail('');
      setNewDemoNotes('');
    } catch (err: any) {
      toast.error(err.message || 'Demo hesap oluşturulamadı.');
    } finally {
      setIsCreatingDemo(false);
    }
  };

  const handleExtendDemo = async (id: string, days: number) => {
    try {
      const updated = await db.extendDemoAccount(id, days);
      setDemoAccounts((prev) => prev.map((d) => (d.id === id ? updated : d)));
      toast.success(`Demo hesap süresi +${days} gün uzatıldı.`);
    } catch (err: any) {
      toast.error(err.message || 'Süre uzatılamadı.');
    }
  };

  const handleDeleteDemo = async (id: string) => {
    try {
      await db.deleteDemoAccount(id);
      setDemoAccounts((prev) => prev.filter((d) => d.id !== id));
      toast.success('Demo hesap silindi.');
    } catch (err: any) {
      toast.error(err.message || 'Silme başarısız.');
    }
  };

  const handleCopyCredentials = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Bilgiler panoya kopyalandı.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter coaches
  const filteredCoaches = coaches.filter((coach) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      coach.name.toLowerCase().includes(query) ||
      coach.email.toLowerCase().includes(query) ||
      (coach.specialty && coach.specialty.toLowerCase().includes(query)) ||
      (coach.phone && coach.phone.includes(query));

    const matchesStatus = statusFilter === 'all' || coach.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filter demos
  const filteredDemos = demoAccounts.filter((demo) => {
    const q = demoSearchQuery.toLowerCase().trim();
    return (
      !q ||
      demo.name.toLowerCase().includes(q) ||
      demo.email.toLowerCase().includes(q) ||
      (demo.notes && demo.notes.toLowerCase().includes(q))
    );
  });

  // Metrics
  const totalCoaches = coaches.length;
  const activeCoaches = coaches.filter((c) => c.status === 'active').length;
  const totalStudentsUnderCoaching = coaches.reduce((acc, c) => acc + (c.active_students_count || 0), 0);
  const activeDemosCount = demoAccounts.filter((d) => new Date(d.expires_at) > new Date()).length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const getRemainingDays = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Süresi Doldu';
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `${days} gün kaldı`;
  };

  return (
    <div className="space-y-6 -m-2 sm:-m-4 p-4 sm:p-6 bg-[#F1F5F9] min-h-full rounded-2xl sm:rounded-3xl">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 font-serif">Koç & Danışman Yönetimi</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {totalCoaches} Koç Kayıtlı
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Koç kadrosunu, uzmanlık alanlarını ve kurumsal geçici demo hesaplarını merkezi olarak yönetin.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'demo_accounts' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateDemoModalOpen(true)}
              className="flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Demo Hesap Oluştur</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 text-xs bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Listeyi Yenile</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('coaches')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'coaches'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Koç Kadrosu ({totalCoaches})</span>
        </button>

        <button
          onClick={() => setActiveTab('demo_accounts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'demo_accounts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Key className="w-4 h-4 text-amber-500" />
          <span>Geçici Demo Hesapları ({activeDemosCount} Aktif)</span>
        </button>
      </div>

      {/* TAB 1: COACHES MANAGEMENT */}
      {activeTab === 'coaches' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Toplam Koç</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalCoaches}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">{activeCoaches} Aktif Danışman</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Atanmış Öğrenci</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">{totalStudentsUnderCoaching}</p>
              <span className="text-[10px] text-slate-500 font-semibold">Tüm portföy toplamı</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kurucu Eğitimci</span>
              <p className="text-base font-bold text-slate-900 mt-2 truncate">Serkan KOÇAK</p>
              <span className="text-[10px] text-amber-600 font-bold">Mahfaza.co Baş Danışmanı</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ortalama Portföy</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {totalCoaches > 0 ? (totalStudentsUnderCoaching / totalCoaches).toFixed(1) : 0}
              </p>
              <span className="text-[10px] text-slate-500 font-semibold">Öğrenci / Koç</span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Koç adı, e-posta veya uzmanlık ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-amber-400 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                {(['all', 'active', 'inactive'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      statusFilter === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'all' ? 'Tümü' : st === 'active' ? 'Aktif' : 'Pasif'}
                  </button>
                ))}
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('table')}
                  title="Tablo Görünümü"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  title="Kart Görünümü"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Table or Grid */}
          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mb-3" />
              <p className="text-sm font-medium text-slate-600">Koç verileri yükleniyor...</p>
            </div>
          ) : filteredCoaches.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Koç Bulunamadı</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Danışman / Koç</th>
                      <th className="py-3.5 px-4">Uzmanlık & Alan</th>
                      <th className="py-3.5 px-4">İletişim</th>
                      <th className="py-3.5 px-4 text-center">Öğrenci Sayısı</th>
                      <th className="py-3.5 px-4">Durum</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                    {filteredCoaches.map((coach) => {
                      const isFounder = coach.is_founder || coach.email === 'serkankocak551@gmail.com';
                      return (
                        <tr key={coach.id} className="hover:bg-slate-50/70 transition-colors group">
                          {/* Profile */}
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <img
                                src={coach.avatar_url}
                                alt={coach.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                                }}
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                                    {coach.name}
                                  </span>
                                  {isFounder && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-900 text-amber-300 border border-amber-400/30">
                                      🎖️ Kurucu Eğitimci
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <Mail className="w-3 h-3" />
                                  {coach.email}
                                  {coach.is_verified || coach.email_confirmed_at || isFounder ? (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title="E-posta Doğrulandı">
                                      🟢 Doğrulandı
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title="E-posta Doğrulanmadı">
                                      🟡 Doğrulanmadı
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Specialty */}
                          <td className="py-4 px-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/80">
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                              <span>{coach.specialty || 'Akademik Danışman'}</span>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-4 px-4 font-mono text-xs text-slate-600">
                            {coach.phone || '+90 555 000 0000'}
                          </td>

                          {/* Student Count */}
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedCoach(coach);
                                setIsStudentsModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all cursor-pointer"
                            >
                              <GraduationCap className="w-3.5 h-3.5" />
                              <span>{coach.active_students_count} Öğrenci</span>
                            </button>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                coach.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  coach.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                              />
                              {coach.status === 'active' ? 'Aktif' : 'Pasif'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(coach)}
                                title="Bilgileri Düzenle"
                                className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {!isFounder && (
                                <>
                                  <button
                                    onClick={() => handleToggleStatus(coach)}
                                    title={coach.status === 'active' ? 'Pasife Al' : 'Aktif Et'}
                                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                      coach.status === 'active'
                                        ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                        : 'text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => handleOpenDelete(coach)}
                                    title="Koçu Sil"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCoaches.map((coach) => {
                const isFounder = coach.is_founder || coach.email === 'serkankocak551@gmail.com';
                return (
                  <div
                    key={coach.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={coach.avatar_url}
                            alt={coach.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                          />
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{coach.name}</h3>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs text-slate-400">{coach.email}</p>
                              {coach.is_verified || coach.email_confirmed_at || isFounder ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title="E-posta Doğrulandı">
                                  🟢 Doğrulandı
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title="E-posta Doğrulanmadı">
                                  🟡 Doğrulanmadı
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isFounder && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-900 text-amber-300 border border-amber-400/30">
                            Kurucu
                          </span>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>{coach.specialty || 'Akademik Koç'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 text-[11px] block">Öğrenciler</span>
                          <span className="font-bold text-slate-800 text-sm">{coach.active_students_count} Öğrenci</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px] block">Durum</span>
                          <span
                            className={`font-semibold text-xs ${
                              coach.status === 'active' ? 'text-emerald-600' : 'text-slate-500'
                            }`}
                          >
                            {coach.status === 'active' ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCoach(coach);
                          setIsStudentsModalOpen(true);
                        }}
                        className="flex-1 text-xs text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border-indigo-200"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Öğrencileri Gör
                      </Button>

                      <button
                        onClick={() => handleOpenEdit(coach)}
                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200"
                        title="Düzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEMO ACCOUNTS MANAGEMENT */}
      {activeTab === 'demo_accounts' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Demo hesap ara..."
                value={demoSearchQuery}
                onChange={(e) => setDemoSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-amber-400 focus:bg-white transition-all"
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateDemoModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Geçici Demo Hesabı Tanımla</span>
            </Button>
          </div>

          {filteredDemos.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center space-y-3">
              <Key className="w-10 h-10 text-amber-500/60 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Aktif Demo Hesap Bulunmuyor</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Kurumsal görüşmeler veya veli/öğrenci testleri için süreli demo hesabı oluşturabilirsiniz.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateDemoModalOpen(true)}
                className="text-xs bg-amber-500 text-slate-950 font-bold"
              >
                İlk Demo Hesabını Oluştur
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Kullanıcı & E-posta</th>
                      <th className="py-3.5 px-4">Rol</th>
                      <th className="py-3.5 px-4">Bitiş Süresi</th>
                      <th className="py-3.5 px-4">Açıklama / Kurum</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                    {filteredDemos.map((demo) => {
                      const isExpired = new Date(demo.expires_at) <= new Date();
                      return (
                        <tr key={demo.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-4 sm:px-6">
                            <div className="font-bold text-slate-900">{demo.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-xs text-slate-500">{demo.email}</span>
                              <button
                                onClick={() => handleCopyCredentials(`${demo.email} | Şifre: Seko1200.`, demo.id)}
                                title="Bilgileri Kopyala"
                                className="text-slate-400 hover:text-amber-600 transition-colors"
                              >
                                {copiedId === demo.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 capitalize">
                              {demo.role}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <div className="space-y-0.5">
                              <span
                                className={`text-xs font-bold ${
                                  isExpired ? 'text-rose-600' : 'text-emerald-600'
                                }`}
                              >
                                {getRemainingDays(demo.expires_at)}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {formatDate(demo.expires_at)}
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-xs text-slate-500">
                            {demo.notes || '—'}
                          </td>

                          <td className="py-4 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleExtendDemo(demo.id, 3)}
                                title="+3 Gün Uzat"
                                className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold border border-indigo-200 transition-colors"
                              >
                                +3 Gün
                              </button>
                              <button
                                onClick={() => handleExtendDemo(demo.id, 7)}
                                title="+7 Gün Uzat"
                                className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold border border-amber-200 transition-colors"
                              >
                                +7 Gün
                              </button>
                              <button
                                onClick={() => handleDeleteDemo(demo.id)}
                                title="Demoyu İptal Et"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EDIT COACH MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Koç Profilini Düzenle"
        subtitle="Danışman iletişim ve uzmanlık alanlarını güncelleyin"
        maxWidth="md"
      >
        <form onSubmit={handleSaveCoachEdit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Koç Adı Soyadı</label>
            <input
              type="text"
              value={editCoachData.name}
              onChange={(e) => setEditCoachData({ ...editCoachData, name: e.target.value })}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Telefon Numarası</label>
            <input
              type="text"
              value={editCoachData.phone}
              onChange={(e) => setEditCoachData({ ...editCoachData, phone: e.target.value })}
              placeholder="+90 555 000 0000"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:bg-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Uzmanlık & Branş</label>
            <input
              type="text"
              value={editCoachData.specialty}
              onChange={(e) => setEditCoachData({ ...editCoachData, specialty: e.target.value })}
              placeholder="Örn: YKS Sayısal & Tıp Danışmanı"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Biyografi & Notlar</label>
            <textarea
              rows={3}
              value={editCoachData.bio}
              onChange={(e) => setEditCoachData({ ...editCoachData, bio: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Durum</label>
            <select
              value={editCoachData.status}
              onChange={(e) => setEditCoachData({ ...editCoachData, status: e.target.value as any })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:bg-white"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsEditModalOpen(false)}>
              İptal
            </Button>
            <Button variant="primary" size="sm" type="submit" className="bg-amber-500 text-slate-950 font-bold">
              Değişiklikleri Kaydet
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE COACH MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Koç Hesabını Sil"
        subtitle="Bu işlem geri alınamaz"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-rose-900">
              <p className="font-bold">
                "{coachToDelete?.name}" adlı koçu sistemden silmek üzeresiniz.
              </p>
              <p className="text-rose-700 leading-relaxed">
                Bu koça atanmış olan <strong>{coachToDelete?.active_students_count || 0}</strong> öğrenci serbest havuza aktarılacak, hiçbir öğrencinin deneme, etüt, XP veya rozet verisi kaybolmayacaktır.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Vazgeç
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isDeleting}
              onClick={handleConfirmDeleteCoach}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Evet, Koçu Güvenle Sil
            </Button>
          </div>
        </div>
      </Modal>

      {/* CREATE DEMO ACCOUNT MODAL */}
      <Modal
        isOpen={isCreateDemoModalOpen}
        onClose={() => setIsCreateDemoModalOpen(false)}
        title="Yeni Geçici Demo Hesabı"
        subtitle="Kurumsal veya bireysel incelemeler için süreli hesap oluşturun"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDemoAccount} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">İsim & Soyisim</label>
            <input
              type="text"
              value={newDemoName}
              onChange={(e) => setNewDemoName(e.target.value)}
              placeholder="Örn: Özel Bilim Koleji (Demo)"
              required
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">E-posta Adresi</label>
            <input
              type="email"
              value={newDemoEmail}
              onChange={(e) => setNewDemoEmail(e.target.value)}
              placeholder="demo.kurum@mahfaza.co"
              required
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Rol</label>
              <select
                value={newDemoRole}
                onChange={(e) => setNewDemoRole(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:bg-white"
              >
                <option value="coach">Koç / Mentor</option>
                <option value="student">Öğrenci</option>
                <option value="parent">Veli</option>
                <option value="org_admin">Kurum Yöneticisi</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Geçerlilik Süresi</label>
              <select
                value={newDemoDays}
                onChange={(e) => setNewDemoDays(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:bg-white"
              >
                <option value={1}>1 Gün (Hızlı İnceleme)</option>
                <option value={3}>3 Gün (Standart Demo)</option>
                <option value={7}>7 Gün (Kurumsal Deneme)</option>
                <option value={14}>14 Gün (Genişletilmiş)</option>
                <option value={30}>30 Gün (1 Ay)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">Kurum / Talep Eden Notu</label>
            <input
              type="text"
              value={newDemoNotes}
              onChange={(e) => setNewDemoNotes(e.target.value)}
              placeholder="Örn: Ankara temsilciliği sunumu için"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:bg-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
            💡 Varsayılan şifre: <strong className="font-mono font-bold">Seko1200.</strong> olarak atanacaktır.
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateDemoModalOpen(false)}>
              İptal
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isCreatingDemo}
              className="bg-amber-500 text-slate-950 font-bold"
            >
              Demo Hesabı Oluştur
            </Button>
          </div>
        </form>
      </Modal>

      {/* COACH'S STUDENTS DETAIL MODAL */}
      <Modal
        isOpen={isStudentsModalOpen}
        onClose={() => setIsStudentsModalOpen(false)}
        title={selectedCoach ? `${selectedCoach.name} — Öğrenci Portföyü` : 'Öğrenci Portföyü'}
        subtitle={
          selectedCoach
            ? `${selectedCoach.active_students_count} Aktif Öğrenci • ${selectedCoach.email}`
            : 'Atanmış öğrenciler'
        }
        maxWidth="lg"
      >
        <div className="space-y-4">
          {selectedCoach && selectedCoach.students && selectedCoach.students.length > 0 ? (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {selectedCoach.students.map((stu) => (
                <div
                  key={stu.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                      {stu.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">{stu.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                          {stu.target_exam || 'YKS'} • {stu.grade || '12. Sınıf'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        <Target className="w-3 h-3 inline mr-1 text-amber-500" />
                        {stu.target_university || 'Hedef Üniversite'} • {stu.target_department || 'Bölüm'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-indigo-600 block">{stu.xp || 0} XP</span>
                    <span className="text-[10px] text-slate-400 font-mono">{stu.phone || stu.phoneNumber || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
              <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Bu Koça Henüz Öğrenci Atanmamış</p>
              <p className="text-xs text-slate-500 mt-1">
                Koç, kendi panelindeki Öğrenci Havuzu'ndan öğrenci seçebilir veya manuel davet gönderebilir.
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsStudentsModalOpen(false)}>
              Kapat
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
