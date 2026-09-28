import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Plus,
  Search,
  Filter,
  Printer,
  Trash2,
  Calendar,
  Clock,
  User,
  Users,
  MessageSquare,
  FileText,
  Phone,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { db } from '../../lib/db';
import { ParentMeeting, Student } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { ParentMeetingModal } from '../../components/modals/ParentMeetingModal';
import { ParentMeetingPrintModal } from '../../components/modals/ParentMeetingPrintModal';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { useToast } from '../../context/ToastContext';

export const CoachParentMeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<ParentMeeting[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState<'ALL' | 'LGS' | 'YKS'>('ALL');
  const [meetingTypeFilter, setMeetingTypeFilter] = useState<string>('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMeetingForPrint, setSelectedMeetingForPrint] = useState<ParentMeeting | null>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<ParentMeeting | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [allMeetings, allStudents] = await Promise.all([
        db.getParentMeetings(user?.id),
        db.getStudents(user?.id),
      ]);
      setMeetings(allMeetings);
      setStudents(allStudents);
    } catch (err) {
      console.error('Failed to load parent meetings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdated = () => loadData();
    window.addEventListener('parent_meetings_updated', handleUpdated);
    return () => window.removeEventListener('parent_meetings_updated', handleUpdated);
  }, [user]);

  // Filtering
  const filteredMeetings = meetings.filter((m) => {
    const isLGS =
      m.student_grade?.includes('8') ||
      m.student_grade?.toLowerCase().includes('lgs') ||
      m.meeting_topic.toLowerCase().includes('lgs');
    const isYKS = !isLGS;

    if (examTypeFilter === 'LGS' && !isLGS) return false;
    if (examTypeFilter === 'YKS' && !isYKS) return false;

    if (meetingTypeFilter !== 'ALL' && m.meeting_type !== meetingTypeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchStudent = m.student_name.toLowerCase().includes(q);
      const matchParent = m.parent_name.toLowerCase().includes(q);
      const matchTopic = m.meeting_topic.toLowerCase().includes(q);
      const matchNotes = m.coach_notes.toLowerCase().includes(q);
      if (!matchStudent && !matchParent && !matchTopic && !matchNotes) return false;
    }

    return true;
  });

  // Strict Database Deletion (Item 4: UI updates ONLY after successful DB delete)
  const handleDeleteConfirm = async () => {
    if (!meetingToDelete) return;
    const targetId = meetingToDelete.id;

    try {
      setIsDeleting(true);
      // Delete from DB first
      await db.deleteParentMeeting(targetId);

      // ONLY on success update state
      setMeetings((prev) => prev.filter((m) => m.id !== targetId));
      setMeetingToDelete(null);
      toast.success('Veli görüşme tutanağı başarıyla silindi.');
      await loadData();
    } catch (err: any) {
      console.error('Parent meeting delete error:', err);
      toast.error('Silme işlemi veritabanı izni nedeniyle başarısız oldu!');
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats calculation
  const totalMeetings = meetings.length;
  const thisMonthMeetings = meetings.filter((m) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return m.meeting_date.startsWith(currentMonth);
  }).length;
  const upcomingMeetings = meetings.filter((m) => m.next_meeting_date).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Veli Görüşmeleri & Rehberlik Tutanakları
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Veli görüşme kayıtları, pedagojik rehberlik özetleri ve branş öğretmenleri elle doldurma çıktıları.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Veli Görüşmesi Kaydet</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-600 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Toplam Görüşme</span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{totalMeetings}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Arşivlenmiş ve tutanak altına alınmış tüm veli görüşmeleri
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Bu Ay Yapılanlar</span>
              <div className="text-2xl font-black text-emerald-700 mt-0.5">{thisMonthMeetings}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Cari ay içerisinde gerçekleştirilen veli temasları
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-600 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Planlanan Sonraki Randevular</span>
              <div className="text-2xl font-black text-amber-700 mt-0.5">{upcomingMeetings}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Takvime işlenmiş takip ve geri bildirim randevuları
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Öğrenci adı, veli adı veya konu ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Exam Type Filter (LGS / YKS) */}
          <div className="sm:col-span-4 flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setExamTypeFilter('ALL')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                examTypeFilter === 'ALL'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setExamTypeFilter('LGS')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                examTypeFilter === 'LGS'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              LGS (8. Sınıf)
            </button>
            <button
              onClick={() => setExamTypeFilter('YKS')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                examTypeFilter === 'YKS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              YKS (TYT/AYT)
            </button>
          </div>

          {/* Meeting Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={meetingTypeFilter}
              onChange={(e) => setMeetingTypeFilter(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Tüm Görüşme Türleri</option>
              <option value="Telefon">📞 Telefon Görüşmesi</option>
              <option value="Yüz Yüze">🏫 Yüz Yüze (Kurum)</option>
              <option value="Online (Zoom / Meet)">💻 Online (Zoom / Meet)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Meetings List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-black text-slate-900 text-sm sm:text-base">
              Kayıtlı Veli Görüşme Tutanakları ({filteredMeetings.length})
            </h2>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            Yazdır butonuna tıklayarak branş öğretmenleri elle doldurma formunu alabilirsiniz.
          </span>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredMeetings.map((m) => {
            const isLGS =
              m.student_grade?.includes('8') ||
              m.student_grade?.toLowerCase().includes('lgs') ||
              m.meeting_topic.toLowerCase().includes('lgs');

            return (
              <div key={m.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-900 text-sm">{m.student_name}</span>
                      <Badge variant={isLGS ? 'warning' : 'primary'} size="sm">
                        {isLGS ? 'LGS' : 'YKS'}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {m.meeting_type}
                      </Badge>
                    </div>
                    <div className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-2">
                      <span>Veli: {m.parent_name} ({m.parent_relation || 'Veli'})</span>
                      <span>•</span>
                      <span className="font-mono">{m.meeting_date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setSelectedMeetingForPrint(m)}
                      className="p-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      title="Yazdır / PDF Al"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setMeetingToDelete(m)}
                      className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <span className="font-black text-slate-800 block mb-0.5">{m.meeting_topic}</span>
                  <p className="text-slate-600 line-clamp-2">{m.coach_notes}</p>
                </div>

                {m.next_meeting_date && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg w-fit">
                    <Clock className="w-3 h-3" />
                    <span>Sonraki Randevu: {m.next_meeting_date}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                <th className="px-5 py-3.5">Tarih & Saat</th>
                <th className="px-5 py-3.5">Öğrenci & Grup</th>
                <th className="px-5 py-3.5">Veli Bilgisi</th>
                <th className="px-5 py-3.5">Görüşme Türü</th>
                <th className="px-5 py-3.5">Konu & Değerlendirme</th>
                <th className="px-5 py-3.5">Sonraki Randevu</th>
                <th className="px-5 py-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-xs">
              {filteredMeetings.map((m) => {
                const isLGS =
                  m.student_grade?.includes('8') ||
                  m.student_grade?.toLowerCase().includes('lgs') ||
                  m.meeting_topic.toLowerCase().includes('lgs');

                return (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-slate-800">
                      <div>{m.meeting_date}</div>
                      <div className="text-[11px] font-medium text-slate-500">{m.meeting_time}</div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-extrabold text-slate-900 text-sm">{m.student_name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant={isLGS ? 'warning' : 'primary'} size="sm">
                          {isLGS ? 'LGS' : 'YKS'}
                        </Badge>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {m.student_grade || (isLGS ? '8. Sınıf' : '12. Sınıf')}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {m.parent_name} ({m.parent_relation || 'Veli'})
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <a
                          href={`tel:${m.parent_phone}`}
                          className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-indigo-600 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{m.parent_phone || '-'}</span>
                        </a>
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge variant="default" size="sm" className="font-bold">
                        {m.meeting_type}
                      </Badge>
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{m.meeting_topic}</div>
                      <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{m.coach_notes || '-'}</p>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {m.next_meeting_date ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{m.next_meeting_date}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedMeetingForPrint(m)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer"
                          title="Öğretmen Çıktısı / Yazdır"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Yazdır / Branş Formu</span>
                        </button>

                        <button
                          onClick={() => setMeetingToDelete(m)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Tutanağı Sil"
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

        {filteredMeetings.length === 0 && !isLoading && (
          <div className="p-12 text-center text-slate-500">
            <PhoneCall className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-sm text-slate-700">Görüşme kaydı bulunamadı</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Arama kriterlerinize uygun veli görüşmesi bulunamadı veya henüz bir tutanak oluşturulmadı.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>İlk Veli Görüşmesini Ekle</span>
            </button>
          </div>
        )}
      </div>

      {/* Create New Parent Meeting Modal */}
      {showAddModal && (
        <ParentMeetingModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          students={students}
        />
      )}

      {/* Print / Export Report Modal */}
      {selectedMeetingForPrint && (
        <ParentMeetingPrintModal
          isOpen={!!selectedMeetingForPrint}
          onClose={() => setSelectedMeetingForPrint(null)}
          meeting={selectedMeetingForPrint}
          coachName={user?.name || 'Serkan Hoca (Baş Danışman & Eğitim Koçu)'}
          student={
            students.find(
              (s) =>
                s.id === selectedMeetingForPrint.student_id ||
                s.name.toLowerCase() === selectedMeetingForPrint.student_name.toLowerCase()
            ) || null
          }
        />
      )}

      {/* Delete Confirmation Modal (Strict Supabase DB verification) */}
      {meetingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Veli Görüşmesini Sil</h3>
                <p className="text-xs text-slate-500">Bu işlem tutanağı veritabanından kalıcı olarak kaldırır.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>{meetingToDelete.student_name}</strong> öğrencisinin velisi <strong>{meetingToDelete.parent_name}</strong> ile yapılan "{meetingToDelete.meeting_topic}" başlıklı görüşme kaydını silmek istediğinize emin misiniz?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMeetingToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Siliniyor...' : 'Evet, Kalıcı Olarak Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
