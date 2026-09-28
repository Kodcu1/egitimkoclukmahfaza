import React, { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { SponsoredClass, Student } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Users,
  Calendar,
  Sparkles,
  Search,
  UserPlus,
  UserMinus,
  CheckCircle2,
  Clock,
  ShieldAlert,
  BookOpen,
} from 'lucide-react';

export const AdminSponsoredClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<SponsoredClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SponsoredClass | null>(null);
  const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false);
  const [selectedClassForStudents, setSelectedClassForStudents] = useState<SponsoredClass | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [planTier, setPlanTier] = useState<'standard' | 'pro'>('pro');
  const [quota, setQuota] = useState(30);
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2027-06-30');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete Confirm
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classList, studentList] = await Promise.all([
        db.getSponsoredClasses(),
        db.getStudents(),
      ]);
      setClasses(classList);
      setStudents(studentList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingClass(null);
    setName('DERECE SINIFI — 12/A');
    setTeacherName('Mahfaza Koçluk Danışmanlığı');
    setPlanTier('pro');
    setQuota(30);
    setStartDate('2026-08-01');
    setEndDate('2027-06-30');
    setIsActive(true);
    setNotes('YKS 2027 Dönemi Boyunca Tam Ücretsiz PRO Erişim');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: SponsoredClass) => {
    setEditingClass(cls);
    setName(cls.name);
    setTeacherName(cls.teacher_name);
    setPlanTier(cls.plan_tier);
    setQuota(cls.quota);
    setStartDate(cls.start_date.split('T')[0]);
    setEndDate(cls.end_date.split('T')[0]);
    setIsActive(cls.is_active);
    setNotes(cls.notes || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !teacherName.trim()) {
      setErrorMsg('Lütfen sınıf adı ve öğretmen adını giriniz.');
      return;
    }

    try {
      await db.saveSponsoredClass({
        id: editingClass?.id,
        name: name.trim(),
        teacher_name: teacherName.trim(),
        plan_tier: planTier,
        quota: Number(quota),
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate + 'T23:59:59Z').toISOString(),
        is_active: isActive,
        notes: notes.trim(),
        student_ids: editingClass ? editingClass.student_ids : [],
      });
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Kayıt sırasında hata oluştu');
    }
  };

  const handleDeleteClass = async () => {
    if (!deleteTargetId) return;
    await db.deleteSponsoredClass(deleteTargetId);
    setDeleteTargetId(null);
    await loadData();
  };

  const handleOpenManageStudents = (cls: SponsoredClass) => {
    setSelectedClassForStudents(cls);
    setSelectedStudentToAdd('');
    setErrorMsg(null);
    setIsManageStudentsOpen(true);
  };

  const handleAddStudentToClass = async () => {
    if (!selectedClassForStudents || !selectedStudentToAdd) return;
    try {
      setErrorMsg(null);
      const updated = await db.addStudentToSponsoredClass(
        selectedClassForStudents.id,
        selectedStudentToAdd
      );
      setSelectedClassForStudents(updated);
      setSelectedStudentToAdd('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Öğrenci eklenemedi');
    }
  };

  const handleRemoveStudentFromClass = async (studentId: string) => {
    if (!selectedClassForStudents) return;
    try {
      setErrorMsg(null);
      const updated = await db.removeStudentFromSponsoredClass(
        selectedClassForStudents.id,
        studentId
      );
      setSelectedClassForStudents(updated);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Öğrenci çıkarılamadı');
    }
  };

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacher_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-100 font-serif">
              Sponsorlu Sınıflar & Ücretsiz Öğrenci Hibeleri
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              YKS 2027
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Öğretmen ve mentörlere tahsis edilen, öğrencilerine 0 TL karşılığında tam PRO yetkisi sağlayan sınıf kontenjanları.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Sponsorlu Sınıf Tanımla
        </Button>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-bold text-amber-300 text-sm">
            Ticari Strateji: Kontrollü Ücretsiz Eğitim Modeli
          </p>
          <p>
            Mahfaza.co genel kullanıcılar için ücretli bir SaaS ürünüdür. Ancak yetkilendirilen <strong>Eğitim Danışmanları ve Kurum Yöneticileri</strong> kendi sınıflarındaki öğrencileri (örneğin 12/A) bu panelden ekleyerek <strong>YKS 2027 dönemi sonuna kadar (30 Haziran 2027)</strong> 0 TL'ye tam PRO paketten yararlandırabilir.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sınıf adı veya öğretmen ara..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Classes Table */}
      <Card className="bg-slate-900/60 border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Sponsorlu sınıflar yükleniyor...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-300">Henüz sponsorlu sınıf bulunamadı</p>
            <p className="text-xs text-slate-500 mt-1">Yeni bir sınıf oluşturarak öğrencilere ücretsiz PRO erişim tanımlayabilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Sınıf & Öğretmen</th>
                  <th className="px-6 py-4 font-semibold">Paket Seviyesi</th>
                  <th className="px-6 py-4 font-semibold">Öğrenci Kontenjanı</th>
                  <th className="px-6 py-4 font-semibold">Geçerlilik Tarihi</th>
                  <th className="px-6 py-4 font-semibold">Durum</th>
                  <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredClasses.map((cls) => {
                  const isExpired = new Date(cls.end_date).getTime() < new Date().getTime();
                  return (
                    <tr key={cls.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                            <GraduationCap className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-100">{cls.name}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>Öğretmen:</span>
                              <span className="font-medium text-amber-300">{cls.teacher_name}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                          <Sparkles className="w-3 h-3" />
                          {cls.plan_tier === 'pro' ? 'Öğrenci PRO (0 TL)' : 'Standard (0 TL)'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full max-w-[100px] bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, (cls.student_ids.length / cls.quota) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-200">
                            {cls.student_ids.length} / {cls.quota}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-300 space-y-0.5">
                          <p className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(cls.end_date).toLocaleDateString('tr-TR')}
                          </p>
                          {isExpired ? (
                            <span className="text-[10px] text-red-400 font-semibold">Süresi Doldu</span>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-semibold">YKS 2027 Aktif</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {cls.is_active && !isExpired ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            Pasif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenManageStudents(cls)}
                            className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 text-xs"
                          >
                            <Users className="w-3.5 h-3.5 mr-1" />
                            Öğrencileri Yönet ({cls.student_ids.length})
                          </Button>
                          <button
                            onClick={() => handleOpenEdit(cls)}
                            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(cls.id)}
                            className="p-2 rounded-lg bg-slate-800 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Sil"
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
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Sponsorlu Sınıfı Düzenle' : 'Yeni Sponsorlu Sınıf Tanımla'}
      >
        <form onSubmit={handleSaveClass} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Sınıf / Grup Adı *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: SERKAN HOCA — 12/A"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Öğretmen / Mentor Adı *
            </label>
            <Input
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="Örn: Kıdemli Eğitim Koçu / Danışman Adı"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tahsis Edilen Paket
              </label>
              <select
                value={planTier}
                onChange={(e) => setPlanTier(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="pro">Öğrenci PRO (Tavsiye Edilen)</option>
                <option value="standard">Öğrenci Standard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Maksimum Öğrenci Kontenjanı
              </label>
              <Input
                type="number"
                min="1"
                max="500"
                value={quota}
                onChange={(e) => setQuota(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Başlangıç Tarihi
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bitiş Tarihi (YKS 2027)
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Not / Sponsorluk Amacı
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Örn: YKS 2027 Derece Hazırlık Sınıfı — Mahfaza.co Özel Hibesi"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="class-active-toggle"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
            />
            <label htmlFor="class-active-toggle" className="text-xs font-semibold text-slate-300 cursor-pointer">
              Sponsorlu Sınıf Aktif (Öğrencilere Anında PRO Erişim Tanımla)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
            >
              {editingClass ? 'Güncellemeleri Kaydet' : 'Sponsorlu Sınıfı Oluştur'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage Students Modal */}
      {selectedClassForStudents && (
        <Modal
          isOpen={isManageStudentsOpen}
          onClose={() => setIsManageStudentsOpen(false)}
          title={`Sınıf Öğrencileri: ${selectedClassForStudents.name}`}
        >
          <div className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quota Indicator */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Kontenjan Durumu:</span>
              <span className="font-bold text-amber-300">
                {selectedClassForStudents.student_ids.length} / {selectedClassForStudents.quota} Öğrenci
              </span>
            </div>

            {/* Add Student Control */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Sınıfa Yeni Öğrenci Ekle (Ücretsiz PRO Tanımla)
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedStudentToAdd}
                  onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Öğrenci Seçiniz...</option>
                  {students
                    .filter((s) => !selectedClassForStudents.student_ids.includes(s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.grade} - {s.field})
                      </option>
                    ))}
                </select>
                <Button
                  type="button"
                  onClick={handleAddStudentToClass}
                  disabled={!selectedStudentToAdd}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shrink-0 text-xs"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Ekle
                </Button>
              </div>
            </div>

            {/* Enrolled Students List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Kayıtlı Öğrenciler ({selectedClassForStudents.student_ids.length})
              </p>
              {selectedClassForStudents.student_ids.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Bu sınıfta henüz öğrenci bulunmamaktadır.</p>
              ) : (
                selectedClassForStudents.student_ids.map((stId) => {
                  const student = students.find((s) => s.id === stId);
                  return (
                    <div
                      key={stId}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-bold">
                          {student?.name ? student.name.charAt(0).toUpperCase() : 'Ö'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">
                            {student?.name || 'Öğrenci Kaydı'}
                          </p>
                          <p className="text-[10px] text-amber-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {selectedClassForStudents.plan_tier.toUpperCase()} Erişim Aktif
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStudentFromClass(stId)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Sınıftan Çıkar"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsManageStudentsOpen(false)}
              >
                Kapat
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteClass}
        title="Sponsorlu Sınıfı Sil"
        message="Bu sponsorlu sınıfı silmek istediğinize emin misiniz? Sınıfa dahil olan öğrencilerin ücretsiz PRO erişimi iptal olacaktır."
        confirmText="Evet, Sınıfı Sil"
        variant="danger"
      />
    </div>
  );
};
