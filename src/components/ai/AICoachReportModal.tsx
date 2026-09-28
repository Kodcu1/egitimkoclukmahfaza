import React, { useState, useEffect } from 'react';
import { Student, AICoachReport } from '../../types';
import { aiService } from '../../services/aiService';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { useToast } from '../../context/ToastContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cleanTurkishText } from '../../utils/pdfReport';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  Bot,
  RotateCcw,
  X,
  CheckCircle2,
  AlertTriangle,
  Target,
  Clock,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';

interface AICoachReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
}

export const AICoachReportModal: React.FC<AICoachReportModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const { toast } = useToast();
  const [report, setReport] = useState<AICoachReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchReport = async (forceRefresh = false) => {
    if (!student) return;
    try {
      setIsLoading(true);
      const data = await aiService.generateCoachReport(student.id, forceRefresh);
      setReport(data);
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      toast.error('Koç raporu oluşturulurken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && student) {
      fetchReport(false);
    }
  }, [isOpen, student?.id]);

  if (!isOpen || !student) return null;

  const handleDownloadPdf = () => {
    if (!report) return;
    try {
      setIsExporting(true);
      const doc = new jsPDF();

      // Brand Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 38, 'F');

      doc.setTextColor(251, 191, 36); // amber-400
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(cleanTurkishText('MAHFAZA.CO • YKS 2027 EGITIM KOCLUGU'), 14, 18);

      doc.setTextColor(226, 232, 240); // slate-200
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(cleanTurkishText('AI Destekli Bireysel Ogrenci Gelisim & Danismanlik Raporu'), 14, 26);
      doc.text(cleanTurkishText(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`), 155, 26);

      // Student Meta
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(cleanTurkishText(`Ogrenci: ${student.name} (${student.field} - ${student.grade})`), 14, 48);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(cleanTurkishText(`Hedef: ${student.target_university || 'Belirtilmedi'} - ${student.target_department || 'Belirtilmedi'}`), 14, 55);

      let yPos = 65;

      const addSection = (title: string, content: string | string[]) => {
        if (yPos > 265) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229); // indigo-600
        doc.text(cleanTurkishText(title), 14, yPos);
        yPos += 6;

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85); // slate-700

        if (Array.isArray(content)) {
          content.forEach((item) => {
            const splitText = doc.splitTextToSize(`• ${cleanTurkishText(item)}`, 180);
            if (yPos + splitText.length * 5 > 275) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(splitText, 16, yPos);
            yPos += splitText.length * 5;
          });
        } else {
          const splitContent = doc.splitTextToSize(cleanTurkishText(content), 180);
          if (yPos + splitContent.length * 5 > 275) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(splitContent, 14, yPos);
          yPos += splitContent.length * 5;
        }
        yPos += 4;
      };

      addSection('1. GENEL DURUM OZETI', report.summary);
      addSection('2. AKADEMIK PERFORMANS VE NET ANALIZI', report.academic_performance);
      addSection('3. CALISMA DISIPLINI VE SUREKLILIK', report.study_discipline);
      addSection('4. GUCLU YONLER', report.strengths);
      addSection('5. GELISIM ALANLARI VE RISK FAKTORLERI', [...report.weaknesses, ...report.risks]);
      addSection('6. KOC TAVSIYELERI VE MUDAHALE STRATEJISI', report.coach_recommendations);
      addSection('7. GELECEK HAFTA HEDEFLERI', report.next_week_targets);

      // Footer on all pages
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          cleanTurkishText(`Mahfaza.co Danismanlik Sistemi • Bu rapor AI tarafindan olusturulmus olup Egitim Danismani onayina tabidir. • Sayfa ${p}/${totalPages}`),
          14,
          285
        );
      }

      doc.save(`Mahfaza_AI_Koc_Raporu_${student.name.replace(/\s+/g, '_')}.pdf`);
      toast.success('AI Koç Raporu PDF olarak indirildi.');
    } catch (e) {
      console.error('PDF generation error:', e);
      toast.error('PDF oluşturulamadı.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 transition-all animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <FileText className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight">AI Koçluk Gelişim Raporu</h3>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs font-bold text-indigo-200">
                  {student.name}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Veli Bilgilendirme ve Koçluk Arşiv Raporu • YKS 2027
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchReport(true)}
              disabled={isLoading}
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

        {/* Body Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto bg-slate-50/60">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
              <div className="text-center">
                <h4 className="font-bold text-slate-800 text-sm">Resmi Koçluk Raporu Hazırlanıyor...</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Öğrencinin tüm akademik verileri ve disiplin kayıtları derleniyor.
                </p>
              </div>
            </div>
          ) : report ? (
            <>
              {/* Student Header Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-black text-slate-900">{student.name}</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {student.field} Alanı • {student.grade} • Hedef: {student.target_university} - {student.target_department}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block">Rapor Tarihi</span>
                  <span className="text-xs font-extrabold text-slate-700">{new Date().toLocaleDateString('tr-TR')}</span>
                </div>
              </div>

              {/* 1. Summary */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="w-4 h-4" /> 1. Genel Durum Özeti
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {report.summary}
                </p>
              </div>

              {/* 2 & 3. Academic & Discipline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-amber-500" /> 2. Akademik Performans & Netler
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {report.academic_performance}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-500" /> 3. Çalışma Disiplini ve Süreklilik
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {report.study_discipline}
                  </p>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> 4. Güçlü Yönler ve Kazanımlar
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-700 font-medium">
                    {report.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> 5. Gelişim Alanları ve Risk Faktörleri
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-700 font-medium">
                    {[...report.weaknesses, ...report.risks].map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Coach Recommendations */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" /> 6. Koçun Stratejik Tavsiyeleri
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-800 font-semibold">
                  {report.coach_recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0">
                        {i + 1}
                      </span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Rapor formatı veli paylaşımına ve arşivlemeye uygundur.
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isExporting || isLoading || !report}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {isExporting ? 'PDF Hazırlanıyor...' : 'PDF Olarak İndir'}
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
              Kapat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
