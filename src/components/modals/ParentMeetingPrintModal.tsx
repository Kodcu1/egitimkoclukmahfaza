import React, { useRef, useState, useEffect } from 'react';
import {
  Printer,
  Download,
  X,
  Phone,
  Calendar,
  Clock,
  UserCheck,
  FileText,
  School,
  Sparkles,
  Target,
} from 'lucide-react';
import { ParentMeeting, Student } from '../../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { useToast } from '../../context/ToastContext';
import { db } from '../../lib/db';
import { sanitizeClonedDocForHtml2Canvas } from '../../utils/pdfSanitizer';

const getHtml2Pdf = () => {
  // @ts-ignore
  if (typeof html2pdf === 'function') return html2pdf;
  // @ts-ignore
  if (html2pdf && typeof (html2pdf as any).default === 'function') return (html2pdf as any).default;
  // @ts-ignore
  if (typeof window !== 'undefined' && typeof (window as any).html2pdf === 'function') {
    return (window as any).html2pdf;
  }
  return null;
};

interface ParentMeetingPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: ParentMeeting | null;
  coachName?: string;
  student?: Student | null;
}

export const ParentMeetingPrintModal: React.FC<ParentMeetingPrintModalProps> = ({
  isOpen,
  onClose,
  meeting,
  coachName = 'Serkan Hoca (Baş Danışman & Eğitim Koçu)',
  student,
}) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [fetchedStudent, setFetchedStudent] = useState<Student | null>(student || null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (student) {
      setFetchedStudent(student);
    } else if (meeting?.student_id) {
      db.getStudentById(meeting.student_id).then((res) => {
        if (res) setFetchedStudent(res);
      }).catch((e) => console.warn('Could not fetch student details for print modal', e));
    }
  }, [student, meeting?.student_id]);

  if (!isOpen || !meeting) return null;

  const isLGS =
    meeting.student_grade?.includes('8') ||
    meeting.student_grade?.toLowerCase().includes('lgs') ||
    meeting.meeting_topic.toLowerCase().includes('lgs');

  // LGS Branches (No dummy text, clear and dedicated)
  const lgsBranches = [
    { name: 'Türkçe Öğretmeni' },
    { name: 'Matematik Öğretmeni' },
    { name: 'Fen Bilimleri Öğretmeni' },
    { name: 'T.C. İnkılap Tarihi ve Atatürkçülük Öğretmeni' },
    { name: 'Din Kültürü ve Ahlak Bilgisi Öğretmeni' },
    { name: 'Yabancı Dil (İngilizce) Öğretmeni' },
  ];

  // YKS Branches: Separated History, Geography, Philosophy Group + Cleaned of dummy text
  const yksBranches = [
    { name: 'Türk Dili ve Edebiyatı / Türkçe Öğretmeni' },
    { name: 'Matematik & Geometri Öğretmeni' },
    { name: 'Fizik Öğretmeni' },
    { name: 'Kimya Öğretmeni' },
    { name: 'Biyoloji Öğretmeni' },
    { name: 'Tarih Öğretmeni' },
    { name: 'Coğrafya Öğretmeni' },
    { name: 'Felsefe Grubu Öğretmeni' },
    { name: 'Yabancı Dil (İngilizce / YDT) Öğretmeni' },
  ];

  const branches = isLGS ? lgsBranches : yksBranches;

  // Student Target formatting: e.g. "Buhara Buze Kıratlı - 12. Sınıf | Hedef: Hacettepe Tıp"
  const activeStudentObj = student || fetchedStudent;
  const targetUniDept = [
    activeStudentObj?.target_university,
    activeStudentObj?.target_department,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const targetGoal =
    targetUniDept ||
    activeStudentObj?.target_school ||
    (isLGS ? 'Hedef Lise Belirlenmedi' : 'Hedef Üniversite / Bölüm Belirlenmedi');

  const studentGradeStr =
    meeting.student_grade ||
    activeStudentObj?.grade ||
    (isLGS ? '8. Sınıf' : '12. Sınıf');

  const studentHeadlineWithTarget = `${meeting.student_name} - ${studentGradeStr} | Hedef: ${targetGoal}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    try {
      setIsExporting(true);
      toast.info('Veli Görüşme Tutanağı PDF olarak hazırlanıyor...');

      const element = printAreaRef.current;
      const safeStudentName = (meeting.student_name || 'Ogrenci').replace(/[^a-zA-Z0-9_\-ğüşıöçĞÜŞİÖÇ ]/g, '');
      const filename = `Veli_Gorusme_Tutanagi_${safeStudentName}_${meeting.meeting_date}.pdf`;

      const opt = {
        margin: [6, 6, 6, 6],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1200,
          onclone: (clonedDoc: Document) => {
            sanitizeClonedDocForHtml2Canvas(clonedDoc);
          },
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      const h2p = getHtml2Pdf();
      if (h2p && element) {
        await h2p().set(opt).from(element).save();
        toast.success('Veli Görüşme Tutanağı PDF olarak indirildi.');
        return;
      }
      throw new Error('html2pdf kütüphanesi aktif değil');
    } catch (err) {
      console.warn('html2pdf export encountered issue, attempting canvas fallback:', err);
      try {
        const element = printAreaRef.current;
        if (!element) throw new Error('Yazdırılacak alan bulunamadı');
        const canvas = await html2canvas(element, {
          scale: 1.2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc: Document) => {
            sanitizeClonedDocForHtml2Canvas(clonedDoc);
          },
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pdfWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        const safeStudentName = (meeting.student_name || 'Ogrenci').replace(/[^a-zA-Z0-9_\-ğüşıöçĞÜŞİÖÇ ]/g, '');
        pdf.save(`Veli_Gorusme_Tutanagi_${safeStudentName}_${meeting.meeting_date}.pdf`);
        toast.success('Veli Görüşme Tutanağı PDF olarak indirildi.');
      } catch (fallbackErr) {
        console.error('PDF export fallback error:', fallbackErr);
        toast.error('PDF oluşturulurken bir hata oluştu. "Yazdır" butonuyla PDF olarak kaydedebilirsiniz.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-w-none print:max-h-none print:w-full">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <Printer className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-sm text-white">
                Veli Görüşme & Branş Öğretmenleri Değerlendirme Tutanağı
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">
                {meeting.student_name} • {meeting.meeting_date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır (Print)</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'İndiriliyor...' : 'PDF İndir'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0">
          <div
            ref={printAreaRef}
            className="pdf-export bg-white mx-auto p-6 sm:p-10 rounded-xl font-sans print:shadow-none print:border-none print:p-4 print:max-w-none"
            style={{ width: '100%', maxWidth: '210mm', backgroundColor: '#ffffff', color: '#111827', border: '1px solid #e2e8f0' }}
          >
            {/* Document Header */}
            <div className="pb-4 mb-5" style={{ borderBottom: '2px solid #0f172a' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg font-black flex items-center justify-center text-xs"
                    style={{ backgroundColor: '#312e81', color: '#ffffff' }}
                  >
                    M
                  </div>
                  <div>
                    <span
                      className="font-black text-sm tracking-tight uppercase"
                      style={{ color: '#0f172a' }}
                    >
                      MAHFAZA.CO EĞİTİM KOÇLUĞU PLATFORMU
                    </span>
                    <span
                      className="block text-[10px] font-bold"
                      style={{ color: '#4338ca' }}
                    >
                      Öğrenci Gelişim & Rehberlik Tutanak Servisi
                    </span>
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono font-bold" style={{ color: '#475569' }}>
                  <div>TUTANAK NO: #VG-{meeting.id.slice(-6).toUpperCase()}</div>
                  <div>Tarih: {meeting.meeting_date} | Saat: {meeting.meeting_time}</div>
                </div>
              </div>

              <div className="text-center mt-3">
                <h1
                  className="text-base sm:text-lg font-black uppercase tracking-tight"
                  style={{ color: '#020617' }}
                >
                  ÖĞRENCİ - VELİ GÖRÜŞME & BRANŞ ÖĞRETMENLERİ DEĞERLENDİRME TUTANAĞI
                </h1>
                <p
                  className="text-[11px] font-semibold mt-0.5"
                  style={{ color: '#475569' }}
                >
                  2026 - 2027 Eğitim Öğretim Yılı • {isLGS ? 'LGS Hazırlık Grubu' : 'YKS Hazırlık Grubu'}
                </p>
                <div
                  className="mt-2 py-1 px-3 rounded-lg inline-flex items-center gap-1.5"
                  style={{ backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}
                >
                  <Target className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                  <span
                    className="text-xs sm:text-sm font-extrabold tracking-tight"
                    style={{ color: '#1e1b4b' }}
                  >
                    {studentHeadlineWithTarget}
                  </span>
                </div>
              </div>
            </div>

            {/* Student & Parent Info Box */}
            <div
              className="rounded-lg p-3 mb-5 text-xs"
              style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <span className="block text-[10px] font-bold uppercase" style={{ color: '#64748b' }}>Öğrenci & Hedef Bilgisi</span>
                  <span className="font-extrabold text-xs sm:text-sm block" style={{ color: '#0f172a' }}>
                    {studentHeadlineWithTarget}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase" style={{ color: '#64748b' }}>Veli Adı & Yakınlık</span>
                  <span className="font-bold" style={{ color: '#0f172a' }}>
                    {meeting.parent_name} ({meeting.parent_relation || 'Veli'})
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase" style={{ color: '#64748b' }}>Veli Telefon No</span>
                  <span className="font-bold font-mono" style={{ color: '#0f172a' }}>{meeting.parent_phone || '-'}</span>
                </div>
              </div>

              <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2.5 pt-2.5"
                style={{ borderTop: '1px solid #e2e8f0' }}
              >
                <div>
                  <span className="block text-[10px] font-bold uppercase" style={{ color: '#64748b' }}>Görüşme Türü</span>
                  <span className="font-bold" style={{ color: '#4338ca' }}>{meeting.meeting_type} Görüşmesi</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase" style={{ color: '#64748b' }}>Danışman Eğitim Koçu</span>
                  <span className="font-bold" style={{ color: '#0f172a' }}>{coachName}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase" style={{ color: '#64748b' }}>Sonraki Randevu Tarihi</span>
                  <span className="font-bold font-mono" style={{ color: '#065f46' }}>
                    {meeting.next_meeting_date || 'Belirlenmedi'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 1: Coach & AI Evaluation (Top part of output) */}
            <div className="mb-6">
              <div
                className="flex items-center gap-2 mb-2 pb-1"
                style={{ borderBottom: '1px solid #c7d2fe' }}
              >
                <span
                  className="w-5 h-5 rounded-full font-black text-xs flex items-center justify-center"
                  style={{ backgroundColor: '#312e81', color: '#ffffff' }}
                >
                  1
                </span>
                <h2
                  className="text-xs sm:text-sm font-black uppercase tracking-tight"
                  style={{ color: '#0f172a' }}
                >
                  EĞİTİM KOÇU & REHBERLİK SERVİSİ GENEL DEĞERLENDİRMESİ
                </h2>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe' }}
                >
                  <span
                    className="font-black block text-[11px] mb-0.5 uppercase"
                    style={{ color: '#312e81' }}
                  >
                    Görüşme Konusu & Gündem:
                  </span>
                  <p className="font-bold" style={{ color: '#1e293b' }}>{meeting.meeting_topic}</p>
                </div>

                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                >
                  <span
                    className="font-black block text-[11px] mb-1 uppercase"
                    style={{ color: '#0f172a' }}
                  >
                    Koçluk ve Süreç Analizi Değerlendirme Notları:
                  </span>
                  <p className="whitespace-pre-wrap font-medium" style={{ color: '#1e293b' }}>
                    {meeting.coach_notes || 'Detaylı koç değerlendirmesi kaydedilmemiştir.'}
                  </p>
                </div>

                {meeting.action_items && (
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}
                  >
                    <span
                      className="font-black block text-[11px] mb-1 uppercase"
                      style={{ color: '#064e3b' }}
                    >
                      Kararlaştırılan Haftalık Aksiyon Planı ve Öğrenci Hedefleri:
                    </span>
                    <p className="whitespace-pre-wrap font-medium" style={{ color: '#065f46' }}>
                      {meeting.action_items}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: Branch Teachers Hand-written comment fields (Bottom part of output) */}
            <div className="mb-6">
              <div
                className="flex items-center justify-between mb-2 pb-1"
                style={{ borderBottom: '1px solid #c7d2fe' }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-full font-black text-xs flex items-center justify-center"
                    style={{ backgroundColor: '#312e81', color: '#ffffff' }}
                  >
                    2
                  </span>
                  <h2
                    className="text-xs sm:text-sm font-black uppercase tracking-tight"
                    style={{ color: '#0f172a' }}
                  >
                    BRANŞ ÖĞRETMENLERİ DERS DEĞERLENDİRME VE GÖRÜŞ ALANLARI
                  </h2>
                </div>
                <span className="text-[10px] font-bold italic" style={{ color: '#64748b' }}>
                  (Ders öğretmenleri tarafından elle doldurulacaktır)
                </span>
              </div>

              <div className="space-y-3.5">
                {branches.map((branch, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg p-2.5 relative break-inside-avoid"
                    style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs flex items-center gap-1.5" style={{ color: '#0f172a' }}>
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: '#4f46e5' }}
                        />
                        {branch.name}
                      </span>
                    </div>

                    {/* Dotted lines for hand-writing */}
                    <div className="space-y-2 mt-2">
                      <div className="h-4 w-full" style={{ borderBottom: '1px dashed #cbd5e1' }} />
                      <div className="h-4 w-full" style={{ borderBottom: '1px dashed #cbd5e1' }} />
                    </div>

                    {/* Teacher signature line */}
                    <div
                      className="flex items-center justify-between mt-2 pt-1.5 text-[10px] font-medium"
                      style={{ borderTop: '1px solid #f1f5f9', color: '#475569' }}
                    >
                      <span>Öğretmen Adı Soyadı: ........................................................</span>
                      <span>İmza: ........................</span>
                      <span>Tarih: ..... / ..... / 202...</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: Signatures and Confirmations */}
            <div
              className="pt-4 mt-6 break-inside-avoid"
              style={{ borderTop: '2px solid #0f172a' }}
            >
              <div
                className="text-[11px] font-bold uppercase text-center mb-3"
                style={{ color: '#64748b' }}
              >
                ONAY VE TAAHHÜT İMZALARI
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div
                  className="rounded-lg p-2.5"
                  style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}
                >
                  <span className="block font-black text-[11px] uppercase" style={{ color: '#0f172a' }}>ÖĞRENCİ</span>
                  <span className="block text-[10px] font-medium mt-0.5" style={{ color: '#475569' }}>{meeting.student_name}</span>
                  <div className="h-10 mt-1" style={{ borderBottom: '1px dashed #94a3b8' }} />
                  <span className="block text-[9px] mt-1" style={{ color: '#64748b' }}>İmza</span>
                </div>

                <div
                  className="rounded-lg p-2.5"
                  style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}
                >
                  <span className="block font-black text-[11px] uppercase" style={{ color: '#0f172a' }}>VELİ</span>
                  <span className="block text-[10px] font-medium mt-0.5" style={{ color: '#475569' }}>{meeting.parent_name}</span>
                  <div className="h-10 mt-1" style={{ borderBottom: '1px dashed #94a3b8' }} />
                  <span className="block text-[9px] mt-1" style={{ color: '#64748b' }}>İmza</span>
                </div>

                <div
                  className="rounded-lg p-2.5"
                  style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}
                >
                  <span className="block font-black text-[11px] uppercase" style={{ color: '#0f172a' }}>EĞİTİM KOÇU</span>
                  <span className="block text-[10px] font-medium mt-0.5" style={{ color: '#475569' }}>Serkan Hoca</span>
                  <div className="h-10 mt-1" style={{ borderBottom: '1px dashed #94a3b8' }} />
                  <span className="block text-[9px] mt-1" style={{ color: '#64748b' }}>İmza / Mühür</span>
                </div>

                <div
                  className="rounded-lg p-2.5"
                  style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}
                >
                  <span className="block font-black text-[11px] uppercase" style={{ color: '#0f172a' }}>KURUM MÜDÜRÜ</span>
                  <span className="block text-[10px] font-medium mt-0.5" style={{ color: '#475569' }}>Onay</span>
                  <div className="h-10 mt-1" style={{ borderBottom: '1px dashed #94a3b8' }} />
                  <span className="block text-[9px] mt-1" style={{ color: '#64748b' }}>İmza / Kaşe</span>
                </div>
              </div>

              <div
                className="text-center text-[9px] font-bold mt-4 font-mono"
                style={{ color: '#94a3b8' }}
              >
                MAHFAZA.CO • KİŞİSEL VERİLERİN KORUNMASI KANUNU (KVKK) VE REHBERLİK ETİK KURALLARINA UYGUNDUR.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
