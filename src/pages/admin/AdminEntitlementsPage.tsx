import React, { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { StudentEntitlement, Student } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  Award,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Search,
  UserCheck,
  ShieldAlert,
  GraduationCap,
} from 'lucide-react';

export const AdminEntitlementsPage: React.FC = () => {
  const [entitlements, setEntitlements] = useState<StudentEntitlement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [accessTier, setAccessTier] = useState<'standard' | 'pro'>('pro');
  const [grantedBy, setGrantedBy] = useState('Mahfaza Koçluk Danışmanlığı');
  const [reason, setReason] = useState('Özel YKS 2027 Başarı Bursu');
  const [validUntil, setValidUntil] = useState('2027-06-30');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entList, stuList] = await Promise.all([
        db.getStudentEntitlements(),
        db.getStudents(),
      ]);
      setEntitlements(entList);
      setStudents(stuList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setSelectedStudentId('');
    setAccessTier('pro');
    setGrantedBy('Mahfaza Koçluk Danışmanlığı');
    setReason('Özel YKS 2027 Başarı Bursu');
    setValidUntil('2027-06-30');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveEntitlement = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedStudentId) {
      setErrorMsg('Lütfen öğrenci seçiniz.');
      return;
    }

    try {
      await db.saveStudentEntitlement({
        student_id: selectedStudentId,
        access_tier: accessTier,
        granted_by: grantedBy.trim() || 'Admin',
        reason: reason.trim() || 'Özel Burs',
        valid_until: new Date(validUntil + 'T23:59:59Z').toISOString(),
      });
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Kayıt sırasında hata oluştu.');
    }
  };

  const handleDeleteEntitlement = async () => {
    if (!deleteTargetId) return;
    await db.deleteStudentEntitlement(deleteTargetId);
    setDeleteTargetId(null);
    await loadData();
  };

  const filtered = entitlements.filter(
    (e) =>
      e.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.granted_by.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-100 font-serif">
              Bireysel Öğrenci Hibeleri & Başarı Bursları
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              YKS 2027
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Belirli öğrencilere doğrudan tahsis edilen 0 TL ücretli özel PRO yetkilendirmeleri.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Öğrenciye Özel PRO Bursu Tanımla
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Öğrenci adı, gerekçe veya hibe veren ara..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="bg-slate-900/60 border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Burs ve hibe kayıtları yükleniyor...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-300">Henüz bireysel burs kaydı bulunmamaktadır</p>
            <p className="text-xs text-slate-500 mt-1">Öğrencilere doğrudan başarı bursu tanımlamak için yukarıdaki butonu kullanabilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Öğrenci</th>
                  <th className="px-6 py-4 font-semibold">Yetki Seviyesi</th>
                  <th className="px-6 py-4 font-semibold">Burs Veren / Mentor</th>
                  <th className="px-6 py-4 font-semibold">Gerekçe / Not</th>
                  <th className="px-6 py-4 font-semibold">Geçerlilik</th>
                  <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((ent) => {
                  const isExpired = new Date(ent.valid_until).getTime() < new Date().getTime();
                  return (
                    <tr key={ent.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                            {ent.student_name ? ent.student_name.charAt(0).toUpperCase() : 'Ö'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-100">{ent.student_name}</p>
                            <p className="text-xs text-slate-400">{ent.student_email || 'Öğrenci Hesabı'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                          <Sparkles className="w-3 h-3" />
                          {ent.access_tier === 'pro' ? 'PRO Erişim' : 'Standard'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-200">
                        {ent.granted_by}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">
                        {ent.reason}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-300">
                          <p className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(ent.valid_until).toLocaleDateString('tr-TR')}
                          </p>
                          {isExpired ? (
                            <span className="text-[10px] text-red-400 font-semibold">Süresi Doldu</span>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-semibold">Aktif</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDeleteTargetId(ent.id)}
                          className="p-2 rounded-lg bg-slate-800 text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Bursu İptal Et"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Öğrenciye Özel PRO Bursu Tanımla"
      >
        <form onSubmit={handleSaveEntitlement} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Öğrenci Seçiniz *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              required
            >
              <option value="">Öğrenci Seçiniz...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.grade} - {s.field})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Erişim Seviyesi
              </label>
              <select
                value={accessTier}
                onChange={(e) => setAccessTier(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="pro">PRO (Önerilen)</option>
                <option value="standard">Standard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Hibe Veren / Yetkili
              </label>
              <Input
                value={grantedBy}
                onChange={(e) => setGrantedBy(e.target.value)}
                placeholder="Örn: Mahfaza Koçluk Danışmanlığı"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Burs Gerekçesi / Not
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Örn: Özel YKS 2027 Başarı Bursu"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Geçerlilik Bitiş Tarihi
            </label>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              required
            />
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
              Bursu Tanımla
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteEntitlement}
        title="Bursu İptal Et"
        message="Bu öğrencinin özel burs yetkisini kaldırmak istediğinize emin misiniz? Öğrenci standart plandan devam edecektir."
        confirmText="Bursu İptal Et"
        variant="danger"
      />
    </div>
  );
};
