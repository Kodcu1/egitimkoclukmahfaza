import React, { useState, useRef, useMemo } from 'react';
import {
  Sparkles,
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileImage,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  BookOpen,
  Copy,
  Check,
  FileQuestion,
  Info,
  Trash2,
  Plus,
  Layers,
  Printer,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { Badge } from '../common/Badge';
import { Student } from '../../types';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { useToast } from '../../context/ToastContext';
import { ExamAnalysisPdfViewer } from './pdf/ExamAnalysisPdfViewer';
import { parseToExamAnalysisData, ExamAnalysisPdfData } from './pdf/ExamAnalysisData';

// Safe direct blob download triggering browser native download
function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 2500);
}

// Resilient direct vector PDF generator (No canvas, No OKLCH, No memory limits)
function generateVectorPdf(
  items: { studentName: string; report: string }[],
  examType: string,
  filename: string = 'Mahfaza_Toplu_Analiz_Raporu.pdf'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  items.forEach((item, index) => {
    if (index > 0) {
      doc.addPage();
    }

    let y = margin;

    // Header Accent Bar
    doc.setFillColor(245, 158, 11); // Amber
    doc.rect(margin, y, contentWidth, 2.5, 'F');
    y += 7;

    // Institution Branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('MAHFAZA.CO • EĞİTİM KOÇLUĞU', margin, y);

    // Student Badge (Top Right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9); // amber-700
    const badgeText = `${item.studentName} • ${examType || 'Deneme Sınavı'}`;
    doc.text(badgeText, pageWidth - margin, y, { align: 'right' });

    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Yapay Zekâ Destekli Deneme Sınavı ve Konu Analiz Raporu', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(new Date().toLocaleDateString('tr-TR'), pageWidth - margin, y, { align: 'right' });

    y += 5;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;

    // Clean markdown
    const cleanReport = item.report
      .replace(/\r\n/g, '\n')
      .replace(/\*\*/g, '')
      .replace(/###/g, '')
      .replace(/##/g, '');

    const lines = cleanReport.split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (y > pageHeight - margin - 14) {
        doc.addPage();
        y = margin + 5;
      }

      if (!line) {
        y += 2.5;
        continue;
      }

      // Check for section headers (🎯, 📊, 🔍, 🚀)
      if (
        line.startsWith('🎯') ||
        line.startsWith('📊') ||
        line.startsWith('🔍') ||
        line.startsWith('🚀') ||
        line.startsWith('1.') ||
        line.startsWith('2.') ||
        line.startsWith('3.') ||
        line.startsWith('4.')
      ) {
        y += 2;
        doc.setFillColor(248, 250, 252); // slate-50
        doc.roundedRect(margin, y - 4, contentWidth, 6.5, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(line, margin + 2.5, y);
        y += 5.5;
      } else if (line.startsWith('Branş Öğretmeni Görüşü:') || line.startsWith('Brans Ogretmeni Gorusu:')) {
        y += 3;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(line, margin, y);
        y += 6;
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85); // slate-700
        const wrapped = doc.splitTextToSize(line, contentWidth - 4);
        for (const wl of wrapped) {
          if (y > pageHeight - margin - 14) {
            doc.addPage();
            y = margin + 5;
          }
          doc.text(wl, margin + 2, y);
          y += 4;
        }
      }
    }

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - margin - 5, pageWidth - margin, pageHeight - margin - 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Mahfaza.co Rehberlik & Koçluk Sistemi', margin, pageHeight - margin - 1.5);
    doc.text(`Öğrenci: ${item.studentName}`, pageWidth - margin, pageHeight - margin - 1.5, { align: 'right' });
  });

  const blob = doc.output('blob');
  triggerBlobDownload(blob, filename);
}

export interface AIExamAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  preselectedStudentId?: string;
}

interface UploadedFileState {
  id: string;
  file: File;
  name: string;
  size: number;
  mimeType: string;
  base64?: string;
  text?: string;
  previewUrl?: string;
}

const AVAILABLE_BRANCHES = [
  'Tüm Sınav (Varsayılan)',
  'Türkçe',
  'Matematik',
  'Fen Bilimleri',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'T.C. İnkılap Tarihi',
  'Tarih',
  'Coğrafya',
  'Felsefe & Din Kültürü',
  'İngilizce',
];

export const AIExamAnalysisModal: React.FC<AIExamAnalysisModalProps> = ({
  isOpen,
  onClose,
  students,
  preselectedStudentId,
}) => {
  const { toast } = useToast();

  // Student & Exam config
  const [examGroupFilter, setExamGroupFilter] = useState<'ALL' | 'YKS' | 'LGS'>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preselectedStudentId || (students && students.length > 0 ? students[0].id : 'ALL_STUDENTS')
  );
  const [customStudentName, setCustomStudentName] = useState<string>('');
  const [examType, setExamType] = useState<string>('TYT');
  const [targetSubject, setTargetSubject] = useState<string>('Tüm Sınav (Varsayılan)');
  const [coachNotes, setCoachNotes] = useState<string>('');

  // 1. Multiple Result / Grade sheet files
  const [resultFiles, setResultFiles] = useState<UploadedFileState[]>([]);
  const resultInputRef = useRef<HTMLInputElement>(null);

  // 2. Multiple Question Booklet files
  const [bookletFiles, setBookletFiles] = useState<UploadedFileState[]>([]);
  const bookletInputRef = useRef<HTMLInputElement>(null);

  // Printable container ref for 100% Turkish UTF-8 PDF output
  const printReportRef = useRef<HTMLDivElement>(null);

  // Status
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [batchProgress, setBatchProgress] = useState<{
    completed: number;
    total: number;
    currentStudent: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
  const [batchReports, setBatchReports] = useState<{ studentName: string; report: string }[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Filter students by exam group (LGS vs YKS)
  const filteredStudents = students.filter((s) => {
    if (examGroupFilter === 'ALL') return true;
    const isLgs = s.grade?.includes('8') || s.field === 'LGS';
    if (examGroupFilter === 'LGS') return isLgs;
    return !isLgs;
  });

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const activeStudentName =
    selectedStudentId === 'ALL_STUDENTS'
      ? 'Tüm Öğrenciler'
      : selectedStudent
      ? selectedStudent.name
      : customStudentName.trim() || 'Tüm Öğrenciler';

  // Unified multi-student report array for 100% complete batch rendering & PDF export
  const effectiveReports = useMemo<{ studentName: string; report: string }[]>(() => {
    if (batchReports && batchReports.length > 0) {
      return batchReports;
    }
    if (reportMarkdown && reportMarkdown.trim().length > 0) {
      const parts = reportMarkdown
        .split(/\n\s*---\s*(?:\(Diğer öğrenciye geç\))?\s*\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (parts.length > 1) {
        return parts.map((sec, idx) => {
          const nameMatch = sec.match(/Öğrenci Adı:\s*([^\n\r]+)/i);
          const studentName =
            nameMatch && nameMatch[1]
              ? nameMatch[1].replace(/[*_#]/g, '').trim()
              : selectedStudentId === 'ALL_STUDENTS'
              ? `Öğrenci ${idx + 1}`
              : activeStudentName;
          return { studentName, report: sec };
        });
      }
      return [{ studentName: activeStudentName, report: reportMarkdown.trim() }];
    }
    return [];
  }, [batchReports, reportMarkdown, selectedStudentId, activeStudentName]);

  const canDownloadPdf = Boolean(
    (batchReports && batchReports.length > 0) ||
    (reportMarkdown && reportMarkdown.trim().length > 0)
  );
  const hasPdfReport = canDownloadPdf;

  // Process uploaded file into base64 or text
  const processFile = async (file: File): Promise<UploadedFileState> => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isExcel =
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.type.includes('spreadsheet') ||
      file.type.includes('excel');
    const isCsvOrText =
      file.type.includes('text') || file.name.endsWith('.csv') || file.name.endsWith('.txt');

    if (isExcel) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const csvText = XLSX.utils.sheet_to_csv(firstSheet);
      return {
        id,
        file,
        name: file.name,
        size: file.size,
        mimeType: 'text/csv',
        text: csvText,
      };
    }

    if (isCsvOrText) {
      const text = await file.text();
      return {
        id,
        file,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'text/plain',
        text,
      };
    }

    // PDF or Image -> Base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        resolve({
          id,
          file,
          name: file.name,
          size: file.size,
          mimeType: file.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
          base64,
          previewUrl: isImage ? dataUrl : undefined,
        });
      };
      reader.onerror = () => reject(new Error('Dosya okuma hatası'));
      reader.readAsDataURL(file);
    });
  };

  const handleResultFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    try {
      const newItems: UploadedFileState[] = [];
      for (let i = 0; i < files.length; i++) {
        const processed = await processFile(files[i]);
        newItems.push(processed);
      }
      setResultFiles((prev) => [...prev, ...newItems]);
      if (resultInputRef.current) resultInputRef.current.value = '';
    } catch {
      setError('Sonuç belgesi yüklenirken bir hata oluştu.');
      toast.error('Dosya okuma hatası');
    }
  };

  const handleBookletFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    try {
      const newItems: UploadedFileState[] = [];
      for (let i = 0; i < files.length; i++) {
        const processed = await processFile(files[i]);
        newItems.push(processed);
      }
      setBookletFiles((prev) => [...prev, ...newItems]);
      if (bookletInputRef.current) bookletInputRef.current.value = '';
    } catch {
      setError('Soru kitapçığı yüklenirken bir hata oluştu.');
      toast.error('Kitapçık dosya okuma hatası');
    }
  };

  const removeResultFile = (id: string) => {
    setResultFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const removeBookletFile = (id: string) => {
    setBookletFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAnalyze = async () => {
    if (resultFiles.length === 0) {
      const msg = 'Lütfen en az bir Sınav Sonuç Belgesi veya Karne yükleyin.';
      setError(msg);
      toast.error(msg);
      return;
    }

    // Determine coach's registered student array to send
    const targetStudentNames: string[] =
      selectedStudentId === 'ALL_STUDENTS'
        ? filteredStudents.map((s) => s.name)
        : selectedStudent
        ? [selectedStudent.name]
        : customStudentName.trim()
        ? [customStudentName.trim()]
        : filteredStudents.length > 0
        ? filteredStudents.map((s) => s.name)
        : ['Öğrenci'];

    if (targetStudentNames.length === 0) {
      const msg = 'Veritabanında analiz edilecek kayıtlı öğrenci bulunamadı. Lütfen öğrenci ekleyin veya manuel isim belirtin.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setReportMarkdown(null);
    setBatchReports([]);
    setBatchProgress({
      completed: 0,
      total: targetStudentNames.length,
      currentStudent: targetStudentNames[0] || '',
    });
    setAnalysisStep(`Kayıtlı öğrencileriniz analiz ediliyor: 0 / ${targetStudentNames.length}`);

    const abortController = new AbortController();

    try {
      const response = await fetch('/api/ai/analyze-mock-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        signal: abortController.signal,
        body: JSON.stringify({
          studentNames: targetStudentNames,
          studentName: targetStudentNames[0],
          grade: selectedStudent?.grade || (examGroupFilter !== 'ALL' ? `${examGroupFilter} Grubu` : ''),
          examType,
          targetSubject,
          resultFiles: resultFiles.map((f) => ({
            name: f.name,
            mimeType: f.mimeType,
            base64: f.base64,
            text: f.text,
          })),
          bookletFiles: bookletFiles.map((f) => ({
            name: f.name,
            mimeType: f.mimeType,
            base64: f.base64,
            text: f.text,
          })),
          additionalNotes: coachNotes,
        }),
      });

      if (!response.ok) {
        let errMessage = `Sunucu hatası (${response.status})`;
        try {
          const errData = await response.json();
          if (errData?.error) errMessage = errData.error;
        } catch {
          const txt = await response.text().catch(() => '');
          if (txt && txt.length < 250) errMessage = txt;
        }
        throw new Error(errMessage);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let collectedMarkdown = '';
        const collectedReports: { studentName: string; report: string }[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr) continue;

            try {
              const payload = JSON.parse(jsonStr);
              if (payload.type === 'progress') {
                setBatchProgress({
                  completed: payload.index,
                  total: payload.total,
                  currentStudent: payload.studentName,
                });
                setAnalysisStep(
                  `Kayıtlı öğrencileriniz analiz ediliyor: ${payload.index} / ${payload.total}`
                );
                if (payload.report) {
                  collectedMarkdown = collectedMarkdown
                    ? `${collectedMarkdown}\n\n---\n\n${payload.report}`
                    : payload.report;
                  collectedReports.push({
                    studentName: payload.studentName || `Öğrenci ${payload.index || collectedReports.length + 1}`,
                    report: payload.report,
                  });
                  setReportMarkdown(collectedMarkdown);
                  setBatchReports([...collectedReports]);
                }
              } else if (payload.type === 'done') {
                if (payload.fullReport && (!collectedMarkdown || collectedMarkdown.trim().length === 0)) {
                  collectedMarkdown = payload.fullReport;
                  setReportMarkdown(collectedMarkdown);
                }
              } else if (payload.type === 'error') {
                toast.error(payload.error || 'Analiz hatası');
              }
            } catch (parseErr) {
              console.warn('Error parsing SSE event:', parseErr);
            }
          }
        }

        // Process any residual data remaining in buffer
        if (buffer && buffer.trim()) {
          const remainingLines = buffer.split('\n');
          for (const rLine of remainingLines) {
            const trimmed = rLine.trim();
            if (!trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr) continue;
            try {
              const payload = JSON.parse(jsonStr);
              if (payload.type === 'progress' && payload.report) {
                collectedMarkdown = collectedMarkdown
                  ? `${collectedMarkdown}\n\n---\n\n${payload.report}`
                  : payload.report;
                collectedReports.push({
                  studentName: payload.studentName || `Öğrenci ${payload.index || collectedReports.length + 1}`,
                  report: payload.report,
                });
              } else if (payload.type === 'done' && payload.fullReport && !collectedMarkdown) {
                collectedMarkdown = payload.fullReport;
              }
            } catch (residualErr) {
              console.warn('Residual buffer error:', residualErr);
            }
          }
        }

        // Guarantee final persistent state
        if (collectedMarkdown && collectedMarkdown.trim().length > 0) {
          setReportMarkdown(collectedMarkdown);
          if (collectedReports.length > 0) {
            setBatchReports([...collectedReports]);
          } else {
            const parts = collectedMarkdown
              .split(/\n\s*---\s*(?:\(Diğer öğrenciye geç\))?\s*\n/)
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            setBatchReports(
              parts.map((p, idx) => ({
                studentName: targetStudentNames[idx] || `Öğrenci ${idx + 1}`,
                report: p,
              }))
            );
          }
        }

        toast.success('🎯 Kayıtlı öğrencilerin deneme analizleri tamamlandı!');
      } else {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Analiz sırasında sunucu hatası oluştu.');
        }
        const fullReport =
          data.report ||
          (Array.isArray(data.reports) ? data.reports.join('\n\n---\n\n') : '') ||
          'Analiz tamamlandı.';
        setReportMarkdown(fullReport);
        if (data.reports && Array.isArray(data.reports) && data.reports.length > 0) {
          setBatchReports(
            data.reports.map((r: string, idx: number) => ({
              studentName: data.studentNames?.[idx] || targetStudentNames[idx] || `Öğrenci ${idx + 1}`,
              report: r,
            }))
          );
        } else if (fullReport) {
          const parts = fullReport
            .split(/\n\s*---\s*(?:\(Diğer öğrenciye geç\))?\s*\n/)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
          setBatchReports(
            parts.map((p: string, idx: number) => ({
              studentName: data.studentNames?.[idx] || targetStudentNames[idx] || `Öğrenci ${idx + 1}`,
              report: p,
            }))
          );
        }
        toast.success('🎯 Yapay zekâ deneme analizi başarıyla tamamlandı!');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('AI Exam Analysis error:', err);
      const errMsg = err.message || 'Dosyalar çok büyük veya yapay zeka yanıt veremedi. Lütfen tekrar deneyin.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const handleCopyReport = () => {
    const textToCopy = reportMarkdown || batchReports.map((b) => b.report).join('\n\n---\n\n');
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    toast.success('Rapor panoya kopyalandı.');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const batchPdfData = useMemo<ExamAnalysisPdfData[]>(() => {
    if (effectiveReports && effectiveReports.length > 0) {
      return effectiveReports.map((item) => {
        const studentObj = students.find(
          (s) => s.name === item.studentName || s.id === selectedStudentId
        );
        return parseToExamAnalysisData(
          item.studentName,
          studentObj?.grade ? `${studentObj.grade}. Sınıf` : '12. Sınıf',
          examType,
          item.report
        );
      });
    }

    const rawReport = reportMarkdown || (batchReports.length > 0 ? batchReports[0]?.report : '') || '';
    const selectedStudentObj = students.find((s) => s.id === selectedStudentId);
    return [
      parseToExamAnalysisData(
        activeStudentName,
        selectedStudentObj?.grade ? `${selectedStudentObj.grade}. Sınıf` : '12. Sınıf',
        examType,
        rawReport
      ),
    ];
  }, [effectiveReports, reportMarkdown, batchReports, activeStudentName, students, selectedStudentId, examType]);

  const handleReset = () => {
    setReportMarkdown(null);
    setBatchReports([]);
    setResultFiles([]);
    setBookletFiles([]);
    setError(null);
    setBatchProgress(null);
    if (resultInputRef.current) resultInputRef.current.value = '';
    if (bookletInputRef.current) bookletInputRef.current.value = '';
  };

  const hasResults = Boolean(canDownloadPdf);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Çoklu Dosyalı & Branş Bazlı Deneme Analizi"
        subtitle="Sınav karnesi / optik form ile soru kitapçığını eşleştirerek nokta atışı konu analizi ve haftalık koçluk raporu üretin."
        maxWidth={hasResults ? '4xl' : '4xl'}
      >
      <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-1">
        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">İşlem Başarısız</p>
              <p className="text-xs mt-0.5 text-rose-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-500 hover:text-rose-700 text-xs font-semibold cursor-pointer"
            >
              Kapat
            </button>
          </div>
        )}

        {!hasResults ? (
          <>
            {/* Top Config Row: Student, Exam Type, Branch */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              {/* LGS / YKS Filter Pills */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Öğrenci & Sınav Kapsamı
                </span>
                <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-xs font-bold">
                  {(['ALL', 'YKS', 'LGS'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setExamGroupFilter(filter)}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        examGroupFilter === filter
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {filter === 'ALL' ? 'Tümü' : filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Student */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Öğrenci Seçimi ({filteredStudents.length})
                  </label>
                  <Select
                    value={selectedStudentId}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                      if (e.target.value) setCustomStudentName('');
                    }}
                    className="bg-white border-slate-300"
                  >
                    <option value="ALL_STUDENTS">👥 Tüm Öğrenciler (Toplu Sınıf Analizi)</option>
                    <option value="">-- Sınıf Listesinden Otomatik / Manuel İsim --</option>
                    {filteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.grade || '12. Sınıf'} - {s.field || 'SAY'})
                      </option>
                    ))}
                  </Select>
                </div>

                {/* 2. Exam Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sınav Türü
                  </label>
                  <Select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="bg-white border-slate-300"
                  >
                    <option value="TYT">TYT (Temel Yeterlilik Testi)</option>
                    <option value="AYT">AYT (Alan Yeterlilik Testi)</option>
                    <option value="LGS">LGS (Liselere Giriş Sınavı)</option>
                    <option value="KPSS">KPSS</option>
                  </Select>
                </div>

                {/* 3. Branş Bazlı (Tek Ders) Analiz Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Analiz Edilecek Branş</span>
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      Yeni Özellik
                    </span>
                  </label>
                  <Select
                    value={targetSubject}
                    onChange={(e) => setTargetSubject(e.target.value)}
                    className="bg-white border-amber-300 font-medium"
                  >
                    {AVAILABLE_BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </Select>
                  {targetSubject !== 'Tüm Sınav (Varsayılan)' && (
                    <p className="mt-1 text-[11px] text-amber-700 font-medium flex items-center gap-1">
                      <span>🎯</span>
                      <span><strong>Katı Branş Kuralı Aktif:</strong> Diğer dersler rapordan elenir, halüsinasyon engellenir ve yalnızca {targetSubject} incelenir.</span>
                    </p>
                  )}
                </div>
              </div>

              {!selectedStudentId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Manuel Öğrenci Adı (Listede yoksa)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Zeynep Kaya"
                    value={customStudentName}
                    onChange={(e) => setCustomStudentName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Koç Özel Notu (İsteğe bağlı)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Listeden Betül Ebrar Arslan'ı bul ve SADECE T.C. İnkılap Tarihi dersi için analiz et."
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* DUAL MULTI-FILE UPLOAD GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AREA 1: Result / Grade Sheet / Optical / Class List (Multiple) */}
              <div
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  resultFiles.length > 0
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-dashed border-slate-300 bg-white hover:border-amber-400 hover:bg-amber-50/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> 1. Sonuç Belgesi (Zorunlu)
                    </span>
                    {resultFiles.length > 0 && (
                      <Badge variant="success" size="sm" className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {resultFiles.length} Belge
                      </Badge>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-0.5">
                    Sınav Sonuç Belgesi / Sınıf Listesi
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Karne, optik form fotoğrafları, Excel veya toplu PDF dökümü. (Birden fazla dosya seçebilirsiniz)
                  </p>

                  <input
                    type="file"
                    ref={resultInputRef}
                    multiple
                    onChange={handleResultFilesChange}
                    accept="application/pdf,image/*,.xlsx,.xls,.csv,.txt"
                    className="hidden"
                  />

                  {/* Uploaded File List */}
                  {resultFiles.length > 0 && (
                    <div className="space-y-1.5 mb-3 max-h-44 overflow-y-auto">
                      {resultFiles.map((file) => (
                        <div
                          key={file.id}
                          className="p-2 bg-white border border-emerald-200 rounded-xl flex items-center justify-between shadow-2xs text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              {file.mimeType.includes('spreadsheet') || file.name.endsWith('.csv') ? (
                                <FileSpreadsheet className="w-4 h-4" />
                              ) : file.previewUrl ? (
                                <FileImage className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate max-w-[180px]">
                                {file.name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeResultFile(file.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Dosyayı kaldır"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => resultInputRef.current?.click()}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    className="w-full text-xs font-semibold py-2.5"
                  >
                    {resultFiles.length > 0 ? 'Daha Fazla Belge / Sayfa Ekle' : 'Belge(ler) Seç veya Yükle'}
                  </Button>
                </div>
              </div>

              {/* AREA 2: Question Booklet (Multiple Optional) */}
              <div
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  bookletFiles.length > 0
                    ? 'border-indigo-400 bg-indigo-50/20'
                    : 'border-dashed border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> 2. Soru Kitapçığı (İsteğe Bağlı)
                    </span>
                    {bookletFiles.length > 0 && (
                      <Badge variant="primary" size="sm" className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {bookletFiles.length} Kitapçık
                      </Badge>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-0.5">
                    Deneme Sınavı Soru Kitapçığı
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Soruların fotoğraf veya PDF hali. Yapay zekâ yanlış yapılan soruları kitapçıkla eşleştirir.
                  </p>

                  <input
                    type="file"
                    ref={bookletInputRef}
                    multiple
                    onChange={handleBookletFilesChange}
                    accept="application/pdf,image/*,.txt"
                    className="hidden"
                  />

                  {/* Uploaded Booklet List */}
                  {bookletFiles.length > 0 && (
                    <div className="space-y-1.5 mb-3 max-h-44 overflow-y-auto">
                      {bookletFiles.map((file) => (
                        <div
                          key={file.id}
                          className="p-2 bg-white border border-indigo-200 rounded-xl flex items-center justify-between shadow-2xs text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                              {file.previewUrl ? (
                                <FileImage className="w-4 h-4" />
                              ) : (
                                <BookOpen className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate max-w-[180px]">
                                {file.name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBookletFile(file.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Dosyayı kaldır"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => bookletInputRef.current?.click()}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    className="w-full text-xs font-semibold py-2.5"
                  >
                    {bookletFiles.length > 0 ? 'Daha Fazla Kitapçık Sayfası Ekle' : 'Kitapçık Dosyası Ekle'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {targetSubject !== 'Tüm Sınav (Varsayılan)'
                      ? `[${targetSubject}] Branşına Özel Analiz`
                      : 'Kapsamlı Tüm Sınav Analizi'}
                  </h4>
                  <p className="text-xs text-slate-600">
                    Öğrenci: <strong className="text-slate-900">{activeStudentName}</strong>
                    {bookletFiles.length > 0 ? ' • Soru Kitapçığı Eşleştirmeli' : ' • Belge Bazlı'}
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={handleAnalyze}
                disabled={isAnalyzing || resultFiles.length === 0}
                leftIcon={
                  isAnalyzing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )
                }
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 shadow-lg shadow-amber-500/25"
              >
                {isAnalyzing ? 'Yapay Zekâ Analiz Ediyor...' : 'Koçluk Raporunu Oluştur'}
              </Button>
            </div>

            {/* Loading progress indicator */}
            {isAnalyzing && (
              <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>
                      Kayıtlı öğrencileriniz analiz ediliyor:{' '}
                      <strong className="text-amber-800 text-sm">
                        {batchProgress?.completed ?? 0} / {batchProgress?.total ?? 1}
                      </strong>
                    </span>
                  </span>
                  {batchProgress && batchProgress.total > 0 && (
                    <Badge variant="warning" size="sm" className="font-bold">
                      %{Math.round((batchProgress.completed / batchProgress.total) * 100)}
                    </Badge>
                  )}
                </div>

                {batchProgress && batchProgress.total > 0 && (
                  <div className="w-full bg-amber-200/70 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${Math.max(
                          5,
                          Math.round((batchProgress.completed / batchProgress.total) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                )}

                {batchProgress?.currentStudent && (
                  <p className="text-[11px] text-amber-800 flex items-center gap-1.5">
                    <span>👤 Şu an incelenen öğrenci:</span>
                    <strong className="text-amber-950 font-bold">
                      {batchProgress.currentStudent}
                    </strong>
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          /* RESULT & REPORT VIEW: Edge-Safe Native Document + Direct PDF Download */
          <div className="space-y-4">
            <ExamAnalysisPdfViewer
              reports={batchPdfData}
              rawReportMarkdown={reportMarkdown || undefined}
              batchReports={effectiveReports}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </Modal>
    </>
  );
};
