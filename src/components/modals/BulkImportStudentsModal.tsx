import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { db } from '../../lib/db';
import { useToast } from '../../context/ToastContext';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Users,
  Loader2,
  FileText,
  HelpCircle,
} from 'lucide-react';

interface ParsedStudentRow {
  name: string;
  email: string;
  phone?: string;
  grade: '12. Sınıf' | 'Mezun' | '11. Sınıf';
  field: 'SAY' | 'EA' | 'SÖZ';
  target_university?: string;
  target_department?: string;
  target_rank?: number;
  target_score?: number;
  isValid: boolean;
  validationError?: string;
}

interface BulkImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  coachId: string;
}

export const BulkImportStudentsModal: React.FC<BulkImportStudentsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  coachId,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const resetState = () => {
    setParsedRows([]);
    setPasteText('');
    setIsProcessingFile(false);
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Helper to normalize and map raw row object keys
  const normalizeRow = (rawRow: Record<string, any>): ParsedStudentRow => {
    const keys = Object.keys(rawRow);
    const getVal = (...matchers: string[]) => {
      for (const m of matchers) {
        const found = keys.find((k) =>
          k.toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '').includes(m.toLowerCase())
        );
        if (found && rawRow[found] !== undefined && rawRow[found] !== null) {
          return String(rawRow[found]).trim();
        }
      }
      return '';
    };

    // Extract name (or combine first and last name columns)
    let name = getVal('adsoyad', 'adısoyadı', 'ogrenciadi', 'öğrenciadı', 'ogrenci', 'öğrenci', 'fullname', 'tamad');
    if (!name) {
      const firstName = getVal('ad', 'adı', 'firstname', 'isim');
      const lastName = getVal('soyad', 'soyadı', 'lastname');
      if (firstName || lastName) {
        name = `${firstName} ${lastName}`.trim();
      }
    }

    // If still no name, check if any column contains a full name (excluding numbers/dates)
    if (!name) {
      for (const k of keys) {
        const val = String(rawRow[k] || '').trim();
        if (val.length >= 3 && !/^\d+$/.test(val) && !val.includes('@') && !val.includes('http')) {
          name = val;
          break;
        }
      }
    }

    // Clean leading row numbers like "1. ", "12 - ", "1) "
    if (name) {
      name = name.replace(/^[0-9]+[\.\-\)\:\s\t]+/, '').trim();
    }

    let email = getVal('eposta', 'email', 'mail', 'e-posta');
    const phone = getVal('telefon', 'tel', 'phone', 'gsm', 'mobile', 'cep');
    const rawGrade = getVal('sinif', 'sınıf', 'grade');
    const rawField = getVal('alan', 'bolum', 'bölüm', 'tür', 'field', 'kol');
    const targetUni = getVal('universite', 'üniversite', 'targetuni', 'hedefuni') || 'İstanbul Üniversitesi';
    const targetDept = getVal('bolum', 'bölüm', 'hedefbolum', 'department') || 'Mühendislik / İktisat';
    const rawRank = getVal('siralama', 'sıralama', 'rank');
    const rawScore = getVal('puan', 'score', 'hedefpuan');

    // Generate valid email if missing
    if (!email && name) {
      const cleanName = name
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');
      email = `${cleanName || 'ogrenci'}_${Math.floor(100 + Math.random() * 900)}@mahfaza.com`;
    }

    // Determine field
    let field: 'SAY' | 'EA' | 'SÖZ' = 'SAY';
    const upperField = rawField.toUpperCase();
    if (upperField.includes('EA') || upperField.includes('ESIT') || upperField.includes('EŞİT')) {
      field = 'EA';
    } else if (upperField.includes('SOZ') || upperField.includes('SÖZ')) {
      field = 'SÖZ';
    }

    // Determine grade
    let grade: '12. Sınıf' | 'Mezun' | '11. Sınıf' = '12. Sınıf';
    if (rawGrade.toLowerCase().includes('mezun')) {
      grade = 'Mezun';
    } else if (rawGrade.includes('11')) {
      grade = '11. Sınıf';
    }

    const rankNum = parseInt(rawRank, 10);
    const scoreNum = parseFloat(rawScore);

    const isValid = Boolean(name && name.length >= 2);
    const validationError = !name || name.length < 2 ? 'Ad Soyad en az 2 karakter olmalıdır' : undefined;

    return {
      name,
      email,
      phone: phone || undefined,
      grade,
      field,
      target_university: targetUni,
      target_department: targetDept,
      target_rank: !isNaN(rankNum) && rankNum > 0 ? rankNum : 3000,
      target_score: !isNaN(scoreNum) && scoreNum > 0 ? scoreNum : 480,
      isValid,
      validationError,
    };
  };

  const processFile = async (file: File) => {
    setIsProcessingFile(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Try standard sheet_to_json
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
      let parsed = jsonRows.map(normalizeRow).filter((r) => r.isValid && r.name);

      // If standard header parsing found few or no valid rows, try raw 2D array parsing
      if (parsed.length === 0) {
        const raw2D = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(raw2D.length, 10); i++) {
          const rowStr = (raw2D[i] || []).map((c) => String(c).toLowerCase()).join(' ');
          if (rowStr.includes('ad') || rowStr.includes('isim') || rowStr.includes('öğrenci') || rowStr.includes('name')) {
            headerRowIdx = i;
            break;
          }
        }

        if (headerRowIdx >= 0) {
          const headers = (raw2D[headerRowIdx] || []).map((c) => String(c).trim());
          const rows: Record<string, any>[] = [];
          for (let r = headerRowIdx + 1; r < raw2D.length; r++) {
            const rowObj: Record<string, any> = {};
            headers.forEach((h, colIdx) => {
              if (h) rowObj[h] = raw2D[r]?.[colIdx] || '';
            });
            rows.push(rowObj);
          }
          parsed = rows.map(normalizeRow).filter((r) => r.isValid && r.name);
        } else {
          const plainRows: Record<string, any>[] = [];
          for (const r of raw2D) {
            if (Array.isArray(r)) {
              const firstNonEmpty = r.find((c) => String(c).trim().length > 1);
              if (firstNonEmpty) {
                plainRows.push({ ad: String(firstNonEmpty) });
              }
            }
          }
          parsed = plainRows.map(normalizeRow).filter((r) => r.isValid && r.name);
        }
      }

      if (parsed.length === 0) {
        toast.error('Dosyada geçerli öğrenci kaydı tespit edilemedi.');
        return;
      }

      setParsedRows(parsed);
      toast.success(`${parsed.length} öğrenci dosyadan başarıyla ayrıştırıldı.`);
    } catch (err: any) {
      console.error('File parsing error:', err);
      toast.error('Dosya okunurken bir hata oluştu: ' + (err.message || 'Bilinmeyen format'));
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleParseText = () => {
    if (!pasteText.trim()) {
      toast.error('Lütfen öğrenci listesini metin alanına yapıştırınız.');
      return;
    }

    const lines = pasteText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const isHeaderLine = (txt: string) => {
      const lower = txt.toLowerCase();
      return (
        (lower.includes('ad') && lower.includes('soyad')) ||
        lower.includes('öğrenci adı') ||
        lower.includes('sıra no') ||
        lower.includes('ogrenci no') ||
        lower.includes('sira no')
      );
    };

    const parsed: ParsedStudentRow[] = [];

    lines.forEach((line) => {
      if (isHeaderLine(line)) return;

      // Split by tab, comma or semicolon
      const parts = line.split(/[\t,;]+/).map((p) => p.trim());
      if (parts.length >= 1) {
        const name = parts[0];
        const email = parts[1] || '';
        const phone = parts[2] || '';
        const fieldRaw = parts[3] || 'SAY';
        const gradeRaw = parts[4] || '12. Sınıf';

        const row = normalizeRow({
          ad: name,
          email,
          telefon: phone,
          alan: fieldRaw,
          sinif: gradeRaw,
        });

        if (row.isValid && row.name) {
          parsed.push(row);
        }
      }
    });

    if (parsed.length === 0) {
      toast.error('Yapıştırılan metinden öğrenci ayrıştırılamadı.');
      return;
    }

    setParsedRows(parsed);
    toast.success(`${parsed.length} öğrenci metinden ayrıştırıldı.`);
  };

  const removeRow = (index: number) => {
    setParsedRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDownloadSample = () => {
    const sampleData = [
      {
        'Ad Soyad': 'Ahmet Yılmaz',
        'E-posta': 'ahmet.yilmaz@ornek.com',
        'Telefon': '05551234567',
        'Sınıf': '12. Sınıf',
        'Alan': 'SAY',
        'Hedef Üniversite': 'İstanbul Teknik Üniversitesi',
        'Hedef Bölüm': 'Bilgisayar Mühendisliği',
        'Hedef Sıralama': 2500,
        'Hedef Puan': 490,
      },
      {
        'Ad Soyad': 'Zeynep Kaya',
        'E-posta': 'zeynep.kaya@ornek.com',
        'Telefon': '05559876543',
        'Sınıf': 'Mezun',
        'Alan': 'EA',
        'Hedef Üniversite': 'Boğaziçi Üniversitesi',
        'Hedef Bölüm': 'İşletme',
        'Hedef Sıralama': 1800,
        'Hedef Puan': 495,
      },
      {
        'Ad Soyad': 'Mert Demir',
        'E-posta': 'mert.demir@ornek.com',
        'Telefon': '05554567890',
        'Sınıf': '12. Sınıf',
        'Alan': 'SAY',
        'Hedef Üniversite': 'Hacettepe Üniversitesi',
        'Hedef Bölüm': 'Tıp Fakültesi',
        'Hedef Sıralama': 1200,
        'Hedef Puan': 515,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Öğrenci Şablonu');
    XLSX.writeFile(wb, 'Mahfaza_Ogrenci_Yukleme_Sablonu.xlsx');
    toast.success('Örnek şablon Excel dosyası indirildi.');
  };

  const handleCommitImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error('İçe aktarılacak geçerli öğrenci kaydı bulunmuyor.');
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const row of validRows) {
      try {
        const studentUserId = 'user_' + Math.random().toString(36).substring(2, 10);
        await db.addStudent({
          user_id: studentUserId,
          name: row.name,
          email: row.email,
          phoneNumber: row.phone || '05550000000',
          phone: row.phone || '05550000000',
          grade: row.grade,
          field: row.field,
          coach_id: coachId,
          target_university: row.target_university || 'Hedef Belirlenmedi',
          target_department: row.target_department || 'Mühendislik / Tıp',
          target_rank: row.target_rank || 3000,
          target_score: row.target_score || 480,
        });
        successCount++;
      } catch (err) {
        console.error('Failed to import student:', row.name, err);
        errorCount++;
      }
    }

    setIsImporting(false);

    if (successCount > 0) {
      toast.success(`${successCount} öğrenci başarıyla portföyünüze eklendi!`);
      onSuccess();
      handleClose();
    } else {
      toast.error('Öğrenciler kaydedilirken hata oluştu.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Toplu Öğrenci İçe Aktar (Excel / CSV / Liste)"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6 text-slate-200">
        {/* Top Info Banner */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-100 text-sm">
                Excel, CSV veya Kopyalanmış Öğrenci Listesi
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Elinizdeki öğrenci listesini (.xlsx, .xls, .csv) yükleyerek veya doğrudan yapıştırarak saniyeler içinde koçluk portföyünüze aktarabilirsiniz.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadSample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-amber-400 border border-amber-500/20 transition-all shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Şablon İndir</span>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`pb-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'file'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Dosya Yükle (.xlsx / .csv)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'paste'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Metin / Liste Yapıştır
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'file' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-amber-500 bg-amber-500/5'
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {isProcessingFile ? (
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-sm text-slate-300 font-medium">Dosya okunuyor ve öğrenciler çözümleniyor...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Öğrenci dosyasını buraya sürükleyin veya <span className="text-amber-400 underline">göz atın</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Desteklenen formatlar: .xlsx, .xls, .csv
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Paste List */}
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <span>Öğrenci İsimlerini veya Tablo Verisini Yapıştırın:</span>
              <span className="text-slate-400 font-normal">(Her satırda bir öğrenci. Format: İsim [Tab/Virgül] E-posta [Tab/Virgül] Telefon)</span>
            </label>
            <textarea
              rows={5}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Örnek:
Ali Kaya	ali@ornek.com	05551112233	SAY	12. Sınıf
Ayşe Demir	ayse@ornek.com	05552223344	EA	Mezun
Can Yılmaz"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
            />
            <div className="flex justify-end">
              <Button type="button" onClick={handleParseText} variant="secondary" size="sm">
                Listeyi Ayrıştır
              </Button>
            </div>
          </div>
        )}

        {/* Parsed Preview Table */}
        {parsedRows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h4 className="font-semibold text-sm text-slate-200">
                  Ayrıştırılan Öğrenciler ({parsedRows.length})
                </h4>
              </div>
              <span className="text-xs text-slate-400">
                {parsedRows.filter((r) => r.isValid).length} geçerli öğrenci aktarılmaya hazır
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-xl bg-slate-900/50">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 sticky top-0 text-slate-300 font-medium border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Ad Soyad</th>
                    <th className="py-2.5 px-3">E-posta</th>
                    <th className="py-2.5 px-3">Sınıf</th>
                    <th className="py-2.5 px-3">Alan</th>
                    <th className="py-2.5 px-3">Hedef Üniversite & Bölüm</th>
                    <th className="py-2.5 px-3 text-center">Durum</th>
                    <th className="py-2.5 px-3 text-right">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-200">{row.name}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{row.email}</td>
                      <td className="py-2.5 px-3 text-slate-300">{row.grade}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold text-[10px]">
                          {row.field}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {row.target_university} - {row.target_department}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Hazır
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-medium" title={row.validationError}>
                            <AlertCircle className="w-3.5 h-3.5" />
                            Hatalı
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isImporting}>
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleCommitImport}
            disabled={parsedRows.length === 0 || isImporting || parsedRows.filter((r) => r.isValid).length === 0}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
          >
            {isImporting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Öğrenciler Aktarılıyor...</span>
              </div>
            ) : (
              <span>
                {parsedRows.length > 0
                  ? `${parsedRows.filter((r) => r.isValid).length} Öğrenciyi Portföye Ekle`
                  : 'Öğrencileri İçe Aktar'}
              </span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
