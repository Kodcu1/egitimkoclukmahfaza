import React, { useState, useMemo } from 'react';
import { pdf } from '@react-pdf/renderer';
import {
  Download,
  RotateCcw,
  Printer,
  Copy,
  Check,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  FileCheck,
  Target,
  Award,
  Loader2,
  Users,
  ShieldCheck,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { ExamAnalysisPdfData } from './ExamAnalysisData';
import { RaporPdf } from './RaporPdf';
import { generateFallbackPdf } from './generateFallbackPdf';
import { useToast } from '../../../context/ToastContext';

interface ExamAnalysisPdfViewerProps {
  data?: ExamAnalysisPdfData;
  reports?: ExamAnalysisPdfData[];
  rawReportMarkdown?: string;
  batchReports?: { studentName: string; report: string }[];
  onReset: () => void;
}

export const ExamAnalysisPdfViewer: React.FC<ExamAnalysisPdfViewerProps> = ({
  data,
  reports,
  rawReportMarkdown,
  batchReports,
  onReset,
}) => {
  const { toast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedStudentIdx, setSelectedStudentIdx] = useState<number>(0);

  // Normalize student reports array
  const reportsList = useMemo<ExamAnalysisPdfData[]>(() => {
    if (reports && reports.length > 0) return reports;
    if (data) return [data];
    return [];
  }, [reports, data]);

  const isBatch = reportsList.length > 1;
  const activeStudentIdx = Math.min(selectedStudentIdx, Math.max(0, reportsList.length - 1));
  const currentReport = reportsList[activeStudentIdx] || reportsList[0];

  // Corresponding raw report text if available
  const currentRawReport = useMemo(() => {
    if (batchReports && batchReports.length > 0) {
      return batchReports[activeStudentIdx]?.report || batchReports[0]?.report || '';
    }
    return rawReportMarkdown || '';
  }, [batchReports, activeStudentIdx, rawReportMarkdown]);

  const defaultFilename = isBatch
    ? `Mahfaza_Toplu_Sinif_Analiz_${new Date().toISOString().split('T')[0]}.pdf`
    : currentReport
    ? `Mahfaza_${currentReport.ogrenci.ad.replace(/\s+/g, '_')}_Deneme_Analizi.pdf`
    : `Mahfaza_Deneme_Analizi.pdf`;

  // Fallback jsPDF download generator if @react-pdf font or worker fails
  const runJsPdfFallback = (filename: string) => {
    try {
      const fb = generateFallbackPdf(reportsList);
      fb.save(filename);
      toast.success('PDF başarıyla indirildi (Yedek motor ile).');
    } catch (fbErr) {
      console.error('jsPDF yedek indirme hatası:', fbErr);
      toast.error('PDF oluşturulamadı. Lütfen raporu yazdırma seçeneğini kullanın.');
    }
  };

  // Direct safe PDF download (Triggered by user click, 100% Edge-safe without iframe)
  const handleDownloadPdf = async () => {
    if (reportsList.length === 0) {
      toast.error('İndirilecek rapor verisi bulunamadı.');
      return;
    }

    setIsGeneratingPdf(true);
    toast.info('Vektörel A4 PDF hazırlanıyor, lütfen bekleyin...');

    try {
      // 1. Generate real vector PDF blob via @react-pdf/renderer
      const blob = await pdf(<RaporPdf reports={reportsList} />).toBlob();

      if (!blob || blob.size === 0) {
        throw new Error('Üretilen PDF dosyası boş veya geçersiz.');
      }

      // 2. Browser native file download (anchor click)
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = defaultFilename;
      document.body.appendChild(link);
      link.click();

      // 3. Clean up
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2500);

      toast.success('🎯 PDF raporu başarıyla indirildi!');
    } catch (error) {
      console.warn('react-pdf render uyarısı, jsPDF motoruna geçiliyor:', error);
      runJsPdfFallback(defaultFilename);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const textToCopy = currentRawReport || currentReport?.kocYorumu || '';
    if (!textToCopy) {
      toast.error('Kopyalanacak rapor metni bulunamadı.');
      return;
    }
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    toast.success('Rapor metni panoya kopyalandı.');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Helper to format clean text sections
  const formattedCoachText = useMemo(() => {
    if (currentRawReport) {
      return currentRawReport
        .replace(/#+\s*/g, '')
        .replace(/\*\*/g, '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
    }
    if (currentReport?.kocYorumu) {
      return currentReport.kocYorumu.split('\n\n');
    }
    return [
      'Öğrencinin güçlü olduğu konular tespit edilmiş olup, analizde %50 altında kalan kazanımlarda soru bankası taraması ve haftalık konu tekrarları tavsiye edilmektedir.',
    ];
  }, [currentRawReport, currentReport]);

  if (!currentReport) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-2xl">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-white">Görüntülenecek rapor verisi bulunamadı.</p>
        <button
          onClick={onReset}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          Yeniden Analiz Et
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-slate-900 text-slate-100 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
      {/* Top Header & Actions Bar (Edge-Safe, Zero Iframe Block) */}
      <div className="px-4 py-3.5 sm:px-6 bg-slate-800/95 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-white">
                {isBatch ? `Toplu Sınıf Analizi (${reportsList.length} Öğrenci)` : currentReport.ogrenci.ad}
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Analiz Tamamlandı</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {currentReport.sinav.ad} • {currentReport.sinav.tarih}
            </p>
          </div>
        </div>

        {/* Action Buttons: PDF Download, Print, Copy, Reset */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Direct Safe PDF Download Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            title="Vektörel PDF dosyasını bilgisayarınıza veya telefonunuza indirin"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>PDF Hazırlanıyor...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{isBatch ? 'Tüm Sınıfı PDF İndir' : 'PDF Raporunu İndir'}</span>
              </>
            )}
          </button>

          {/* Native Print / Save as PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-700/90 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl border border-slate-600 flex items-center gap-1.5 transition-all cursor-pointer hover:text-white"
            title="Yazıcıdan yazdırın veya PDF olarak kaydedin"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">Yazdır</span>
          </button>

          {/* Copy Report Text */}
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-2 bg-slate-700/90 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl border border-slate-600 flex items-center gap-1.5 transition-all cursor-pointer hover:text-white"
            title="Koçluk metnini panoya kopyalayın"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Kopyalandı</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">Metni Kopyala</span>
              </>
            )}
          </button>

          {/* Reset for New Analysis */}
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Yeni bir deneme sınavı analizi başlatın"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Yeni Analiz</span>
          </button>
        </div>
      </div>

      {/* Batch Student Tabs (If multiple students analyzed) */}
      {isBatch && (
        <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-700/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-amber-500" /> Öğrenci Seç:
          </span>
          {reportsList.map((r, idx) => {
            const isActive = idx === activeStudentIdx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedStudentIdx(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-700/70 hover:bg-slate-600 text-slate-300'
                }`}
              >
                <span>{r.ogrenci.ad}</span>
                <span className="ml-1.5 text-[10px] opacity-75 font-mono">
                  {r.genel.net} Net
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Edge-Safe Native Document Preview Container (Never blocked, 100% accessible) */}
      <div
        id="batch-pdf-container"
        className="flex-1 w-full bg-slate-950 p-4 sm:p-6 overflow-y-auto max-h-[72vh]"
      >
        <div className="max-w-4xl mx-auto space-y-5 print-student-page">
          {/* A4 Paper Style Container */}
          <div className="bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6">
            {/* Header Accent Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 rounded-full" />

            {/* Document Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-widest text-amber-600 uppercase">
                    MAHFAZA.CO
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-bold text-slate-500">EĞİTİM KOÇLUĞU SİSTEMİ</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  Deneme Sınavı & Konu Kazanım Raporu
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Yapay Zekâ Destekli Akademik Performans ve Stratejik Eylem Planı
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left sm:text-right shrink-0">
                <p className="text-sm font-black text-slate-900">{currentReport.ogrenci.ad}</p>
                <p className="text-xs font-bold text-amber-700">
                  {currentReport.ogrenci.sinif || '12. Sınıf / YKS Hazırlık'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">{currentReport.sinav.tarih}</p>
              </div>
            </div>

            {/* Summary Scorecard Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-700 text-xs font-bold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Doğru
                </div>
                <p className="text-2xl font-black text-emerald-900">{currentReport.genel.dogru}</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Soru</p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                <div className="flex items-center justify-center gap-1 text-rose-700 text-xs font-bold mb-1">
                  <XCircle className="w-3.5 h-3.5" /> Yanlış
                </div>
                <p className="text-2xl font-black text-rose-900">{currentReport.genel.yanlis}</p>
                <p className="text-[10px] text-rose-600 font-semibold mt-0.5">Soru</p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-700 text-xs font-bold mb-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Boş
                </div>
                <p className="text-2xl font-black text-amber-900">{currentReport.genel.bos}</p>
                <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Soru</p>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
                <div className="flex items-center justify-center gap-1 text-indigo-700 text-xs font-bold mb-1">
                  <Target className="w-3.5 h-3.5" /> Toplam Net
                </div>
                <p className="text-2xl font-black text-indigo-900">{currentReport.genel.net}</p>
                <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Net Puanı</p>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-violet-50 border border-violet-200 text-center">
                <div className="flex items-center justify-center gap-1 text-violet-700 text-xs font-bold mb-1">
                  <Award className="w-3.5 h-3.5" /> Başarı
                </div>
                <p className="text-2xl font-black text-violet-900">%{currentReport.genel.yuzde}</p>
                <p className="text-[10px] text-violet-600 font-semibold mt-0.5">Doğruluk Oranı</p>
              </div>
            </div>

            {/* Konu Analizi & Kazanım Tablosu */}
            {currentReport.konular && currentReport.konular.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    <span>Branş & Konu Bazlı Performans Karnesi</span>
                  </h4>
                  {currentReport.ortalamaSure && (
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      ⏱ Soru Başına: {currentReport.ortalamaSure}
                    </span>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Konu / Kazanım Başlığı</th>
                          <th className="py-2.5 px-2 text-center text-emerald-700">D</th>
                          <th className="py-2.5 px-2 text-center text-rose-700">Y</th>
                          <th className="py-2.5 px-2 text-center text-amber-700">B</th>
                          <th className="py-2.5 px-3 text-right">Kazanım Oranı</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentReport.konular.map((k, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {k.konuAdi}
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold text-emerald-600 font-mono">
                              {k.dogru}
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold text-rose-600 font-mono">
                              {k.yanlis}
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold text-amber-600 font-mono">
                              {k.bos}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden hidden sm:block">
                                  <div
                                    className={`h-full rounded-full ${
                                      k.oran >= 70
                                        ? 'bg-emerald-500'
                                        : k.oran >= 50
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(5, k.oran))}%` }}
                                  />
                                </div>
                                <span
                                  className={`text-[11px] font-black font-mono px-1.5 py-0.5 rounded ${
                                    k.oran >= 70
                                      ? 'text-emerald-700 bg-emerald-50'
                                      : k.oran >= 50
                                      ? 'text-amber-700 bg-amber-50'
                                      : 'text-rose-700 bg-rose-50'
                                  }`}
                                >
                                  %{k.oran}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* AI Koçluk Analizi & Stratejik Öneriler */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Yapay Zekâ Koçluk Değerlendirmesi & Eylem Planı</span>
              </h4>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs leading-relaxed text-slate-700">
                {formattedCoachText.map((paragraph, pIdx) => {
                  const isTitle =
                    paragraph.startsWith('🎯') ||
                    paragraph.startsWith('📊') ||
                    paragraph.startsWith('🔍') ||
                    paragraph.startsWith('🚀') ||
                    paragraph.startsWith('1.') ||
                    paragraph.startsWith('2.') ||
                    paragraph.startsWith('3.');

                  if (isTitle) {
                    return (
                      <h5 key={pIdx} className="font-black text-slate-900 text-sm mt-3 pt-2 border-t border-slate-200/70 first:border-none first:pt-0 first:mt-0 flex items-center gap-1.5">
                        {paragraph}
                      </h5>
                    );
                  }

                  if (paragraph.toLowerCase().includes('branş öğretmeni görüşü') || paragraph.toLowerCase().includes('brans ogretmeni')) {
                    return (
                      <div key={pIdx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-medium">
                        <strong>Branş Görüşü:</strong> {paragraph.replace(/.*branş öğretmeni görüşü:?/i, '').trim()}
                      </div>
                    );
                  }

                  return (
                    <p key={pIdx} className="whitespace-pre-wrap">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Footer Institutional Note */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mahfaza.co Akademik Doğrulama & Performans Takip Sistemi</span>
              </div>
              <p>Rapor No: MHF-{Date.now().toString().slice(-6)} • Otomatik Oluşturuldu</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
