import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Student } from '../../types';
import { db } from '../../lib/db';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import {
  PhoneCall,
  Calendar,
  Clock,
  User,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  Video,
  MapPin,
  Sparkles,
} from 'lucide-react';

export interface ParentMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStudentId?: string;
  students?: Student[];
}

export const ParentMeetingModal: React.FC<ParentMeetingModalProps> = ({
  isOpen,
  onClose,
  preselectedStudentId,
  students: propStudents,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [studentList, setStudentList] = useState<Student[]>(propStudents || []);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(preselectedStudentId || '');
  const [parentName, setParentName] = useState<string>('');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [parentRelation, setParentRelation] = useState<'Anne' | 'Baba' | 'Vasi' | 'Diğer'>('Anne');
  
  // Meeting details
  const [meetingDate, setMeetingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [meetingTime, setMeetingTime] = useState<string>('19:00');
  const [meetingType, setMeetingType] = useState<'Telefon' | 'Yüz Yüze' | 'Online (Zoom / Meet)'>('Telefon');
  const [meetingTopic, setMeetingTopic] = useState<string>('Akademik Gelişim, Net Takibi ve Branş Analizi');
  const [coachNotes, setCoachNotes] = useState<string>('');
  const [actionItems, setActionItems] = useState<string>('');
  const [nextMeetingDate, setNextMeetingDate] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load real students
  useEffect(() => {
    if (isOpen) {
      const loadStudents = async () => {
        try {
          const list = await db.getStudents(user?.id);
          if (list && list.length > 0) {
            setStudentList(list);
            if (!preselectedStudentId && !selectedStudentId) {
              setSelectedStudentId(list[0].id);
            }
          }
        } catch (err) {
          console.error('Failed to load students for parent meeting:', err);
        }
      };
      loadStudents();
    }
  }, [isOpen, user?.id]);

  // Sync preselected
  useEffect(() => {
    if (preselectedStudentId) {
      setSelectedStudentId(preselectedStudentId);
    }
  }, [preselectedStudentId]);

  // Auto-fill student info if available
  const activeStudent = studentList.find((s) => s.id === selectedStudentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedStudentId && !activeStudent) {
      setErrorMsg('Lütfen öğrenci seçiniz.');
      return;
    }
    if (!meetingTopic.trim()) {
      setErrorMsg('Lütfen görüşme konusunu belirtiniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeStudent) {
        await db.addParentMeeting({
          coach_id: user?.id || 'coach_default',
          student_id: activeStudent.id,
          student_name: activeStudent.name,
          student_grade: activeStudent.grade,
          student_field: activeStudent.field,
          parent_name: parentName || 'Öğrenci Velisi',
          parent_phone: parentPhone || activeStudent.phoneNumber || activeStudent.phone || '0532 123 45 67',
          parent_relation: parentRelation,
          meeting_date: meetingDate,
          meeting_time: meetingTime,
          meeting_type: meetingType,
          meeting_topic: meetingTopic,
          coach_notes: coachNotes,
          action_items: actionItems,
          next_meeting_date: nextMeetingDate,
        });

        // Also create SMS/Activity log
        await db.addSmsLog({
          student_id: activeStudent.id,
          student_name: activeStudent.name,
          phone_number: parentPhone || activeStudent.phoneNumber || activeStudent.phone || '0532 123 45 67',
          action_type: 'Veli Görüşmesi',
          message_content: `Mahfaza Koçluk Veli Görüşmesi tamamlandı (${meetingDate} - ${meetingTopic}). Koç: ${user?.name || 'Serkan Hoca'}`,
          status: 'İletildi',
        });
      }

      toast.success(
        `📞 ${activeStudent?.name || 'Öğrenci'} velisi ile yapılan "${meetingTopic}" görüşme kaydı başarıyla arşivlendi!`
      );
      
      // Reset & close
      setCoachNotes('');
      setActionItems('');
      setNextMeetingDate('');
      onClose();
    } catch (err: any) {
      console.error('Error saving parent meeting:', err);
      toast.error('Görüşme kaydı kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Veli Görüşme Formu & Rehberlik Kaydı"
      subtitle="Öğrenci velisi ile yapılan telefon, yüz yüze veya online danışmanlık görüşmesini kaydedin"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Öğrenci ve Veli Bilgileri Grid */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Öğrenci & Veli Bilgileri</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Görüşülen Öğrenci
              </label>
              <Select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-white border-slate-300"
              >
                {studentList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.grade || '12. Sınıf'} - {s.field || 'SAY'})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Veli Yakınlık Derecesi
              </label>
              <Select
                value={parentRelation}
                onChange={(e) => setParentRelation(e.target.value as any)}
                className="bg-white border-slate-300"
              >
                <option value="Anne">Anne</option>
                <option value="Baba">Baba</option>
                <option value="Vasi">Vasi / Aile Büyüğü</option>
                <option value="Diğer">Diğer</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Veli Adı Soyadı (İsteğe bağlı)
              </label>
              <input
                type="text"
                placeholder="Örn: Ayşe Hanım"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                İletişim Numarası (Telefon)
              </label>
              <input
                type="tel"
                placeholder="05XX XXX XX XX"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Görüşme Detayları Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Görüşme Tarihi</span>
            </label>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Saat</span>
            </label>
            <input
              type="time"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
              <span>Görüşme Türü</span>
            </label>
            <Select
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value as any)}
              className="bg-white border-slate-300"
            >
              <option value="Telefon">📞 Telefon Görüşmesi</option>
              <option value="Yüz Yüze">🏢 Yüz Yüze (Kurum)</option>
              <option value="Online (Zoom / Meet)">💻 Online (Zoom / Meet)</option>
            </Select>
          </div>
        </div>

        {/* 3. Görüşme Konusu */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Görüşme Ana Konusu
          </label>
          <Select
            value={meetingTopic}
            onChange={(e) => setMeetingTopic(e.target.value)}
            className="bg-white border-slate-300"
          >
            <option value="Akademik Gelişim, Net Takibi ve Branş Analizi">
              Akademik Gelişim, Net Takibi ve Branş Analizi
            </option>
            <option value="Sınav Kaygısı, Motivasyon ve Stres Yönetimi">
              Sınav Kaygısı, Motivasyon ve Stres Yönetimi
            </option>
            <option value="Dikkat Dağınıklığı, Odaklanma ve Ekran Süresi">
              Dikkat Dağınıklığı, Odaklanma ve Ekran Süresi
            </option>
            <option value="Zaman Yönetimi ve Yeni Nesil Soru Çözüm Taktikleri">
              Zaman Yönetimi ve Yeni Nesil Soru Çözüm Taktikleri
            </option>
            <option value="Aile İçi İletişim, Ev Çalışma Ortamı ve Sınırların Korunması">
              Aile İçi İletişim, Ev Çalışma Ortamı ve Sınırların Korunması
            </option>
            <option value="Mesleki Rehberlik ve Hedef Üniversite Stratejisi">
              Mesleki Rehberlik ve Hedef Üniversite Stratejisi
            </option>
            <option value="Özel Durum / Acil Değerlendirme">
              Özel Durum / Acil Değerlendirme
            </option>
          </Select>
        </div>

        {/* 4. Koç Notları & Alınan Kararlar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Koç Notları & Görüşme Özeti
            </label>
            <textarea
              rows={4}
              placeholder="Görüşmede konuşulan başlıklar, velinin endişeleri veya paylaşılan geri bildirimler..."
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alınan Kararlar & Takip Planı
            </label>
            <textarea
              rows={4}
              placeholder="Öğrencinin haftalık soru hedefleri, telefon kısıtlaması, velinin evde sağlayacağı destekler vb..."
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* 5. Sonraki Görüşme Tarihi */}
        <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-semibold text-indigo-950">
              Bir Sonraki Veli Takip Tarihi (Opsiyonel):
            </span>
          </div>
          <input
            type="date"
            value={nextMeetingDate}
            onChange={(e) => setNextMeetingDate(e.target.value)}
            className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="py-2.5 px-4 text-xs font-semibold"
          >
            İptal
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 py-2.5 px-5 text-xs font-bold text-white shadow-md shadow-indigo-600/20"
          >
            {isSubmitting ? 'Kaydediliyor...' : 'Görüşme Kaydını Tamamla'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
