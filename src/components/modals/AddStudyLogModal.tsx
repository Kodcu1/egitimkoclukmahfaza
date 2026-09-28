import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { CurriculumTree, CurriculumSelection } from '../dashboard/CurriculumTree';
import { StudyLog, ExamType, Student } from '../../types';
import { calculateNet } from '../../utils/calculations';
import { BookOpen, Sparkles, UploadCloud, FileCheck, X, Image as ImageIcon, User } from 'lucide-react';

interface AddStudyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  students?: Student[];
  onAddLog: (log: Omit<StudyLog, 'id' | 'created_at'>) => Promise<void>;
}

export const AddStudyLogModal: React.FC<AddStudyLogModalProps> = ({
  isOpen,
  onClose,
  studentId,
  students,
  onAddLog,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<string>(studentId);

  useEffect(() => {
    setSelectedStudent(studentId);
  }, [studentId]);

  const [curriculum, setCurriculum] = useState<CurriculumSelection>({
    examType: 'TYT',
    testName: 'Türkçe Testi',
    subjectName: 'Türkçe',
    topicName: 'Paragrafta Anlam',
    subtopicName: 'Ana Düşünce',
  });

  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [questionCount, setQuestionCount] = useState<number>(40);
  const [correctCount, setCorrectCount] = useState<number>(34);
  const [wrongCount, setWrongCount] = useState<number>(4);
  const [emptyCount, setEmptyCount] = useState<number>(2);
  const [studyDate, setStudyDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  
  // Mandatory proof upload states
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofName, setProofName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const net = calculateNet(correctCount, wrongCount);
  const xpReward = 10 + Math.floor(questionCount / 10) * 5;

  const handleCurriculumChange = (sel: CurriculumSelection) => {
    setCurriculum(sel);
  };

  const handleCorrectChange = (val: number) => {
    const c = Math.max(0, val);
    setCorrectCount(c);
    setEmptyCount(Math.max(0, questionCount - c - wrongCount));
  };

  const handleWrongChange = (val: number) => {
    const w = Math.max(0, val);
    setWrongCount(w);
    setEmptyCount(Math.max(0, questionCount - correctCount - w));
  };

  const handleQuestionChange = (val: number) => {
    const q = Math.max(0, val);
    setQuestionCount(q);
    setEmptyCount(Math.max(0, q - correctCount - wrongCount));
  };

  const processFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setProofUrl(e.target.result as string);
        setProofName(file.name);
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSetSampleProof = () => {
    // Generate a clean dummy SVG base64 test paper preview for testing
    const sampleSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f8fafc"/><rect x="20" y="20" width="360" height="260" rx="12" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="40" y="60" font-family="sans-serif" font-size="16" font-weight="bold" fill="%231e293b">YKS 2027 Soru Bankasi Calisma Fisi</text><text x="40" y="90" font-family="sans-serif" font-size="12" fill="%2364748b">${curriculum.subjectName} - ${curriculum.topicName}</text><line x1="40" y1="110" x2="360" y2="110" stroke="%23e2e8f0" stroke-width="2"/><circle cx="50" cy="140" r="10" fill="%2322c55e"/><text x="70" y="145" font-family="sans-serif" font-size="12" fill="%231e293b">1-15. Sorular Cozuldu (D: ${correctCount}, Y: ${wrongCount})</text><circle cx="50" cy="180" r="10" fill="%233b82f6"/><text x="70" y="185" font-family="sans-serif" font-size="12" fill="%231e293b">Etut Suresi: ${durationMinutes} dk</text><rect x="40" y="220" width="160" height="30" rx="6" fill="%234f46e5"/><text x="60" y="240" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23ffffff">OGRENCI PARAF</text></svg>`;
    setProofUrl(sampleSvg);
    setProofName(`yks_${curriculum.subjectName.toLowerCase()}_test_kaniti.png`);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (questionCount <= 0 && durationMinutes <= 0) {
      setErrorMsg('Lütfen çalışma süresi veya soru sayısı giriniz.');
      return;
    }

    if (correctCount + wrongCount + emptyCount > questionCount) {
      setErrorMsg('Doğru + Yanlış + Boş sayısı toplam soru sayısını aşamaz.');
      return;
    }

    const targetStudent = selectedStudent || studentId;
    if (!targetStudent) {
      setErrorMsg('⚠️ Lütfen bir öğrenci seçiniz.');
      return;
    }

    // MANDATORY PROOF VALIDATION
    if (!proofUrl) {
      setErrorMsg('⚠️ Zorunlu Kanıt: Öğrenci bir çalışma kanıtı (fotoğraf/belge) yüklemeden kaydı gönderemez!');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddLog({
        student_id: targetStudent,
        exam_type: curriculum.examType,
        test_name: curriculum.testName,
        subject_name: curriculum.subjectName,
        topic_name: curriculum.topicName,
        subtopic_name: curriculum.subtopicName,
        duration_minutes: Number(durationMinutes),
        question_count: Number(questionCount),
        correct_count: Number(correctCount),
        wrong_count: Number(wrongCount),
        empty_count: Number(emptyCount),
        net_count: net,
        study_date: studyDate,
        notes: notes.trim() || undefined,
        proof_url: proofUrl,
        proof_name: proofName,
      });

      onClose();
    } catch (err) {
      setErrorMsg('Çalışma kaydı eklenirken bir hata oluştu.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yeni Çalışma Kaydı Ekle"
      subtitle="Kademeli YKS 2027 müfredatı ile kanıtlı konu ve soru takibi"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Student Selector if called by coach without single preselected student */}
        {students && students.length > 0 && !studentId && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Öğrenci Seçimi *</span>
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
              required
            >
              <option value="">Lütfen Öğrenci Seçiniz...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.grade || '12. Sınıf'} - {s.field || 'SAY'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Cascading Curriculum Selector */}
        <CurriculumTree
          initialExam={curriculum.examType}
          initialSubject={curriculum.subjectName}
          initialTopic={curriculum.topicName}
          initialSubtopic={curriculum.subtopicName}
          onChange={handleCurriculumChange}
        />

        {/* Study Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Çalışma Tarihi"
            type="date"
            value={studyDate}
            onChange={(e) => setStudyDate(e.target.value)}
          />
          <Input
            label="Çalışma Süresi (Dakika)"
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input
            label="Toplam Soru"
            type="number"
            min={0}
            value={questionCount}
            onChange={(e) => handleQuestionChange(parseInt(e.target.value) || 0)}
          />
          <Input
            label="Doğru (D)"
            type="number"
            min={0}
            max={questionCount}
            value={correctCount}
            onChange={(e) => handleCorrectChange(parseInt(e.target.value) || 0)}
            className="text-emerald-700 font-bold"
          />
          <Input
            label="Yanlış (Y)"
            type="number"
            min={0}
            max={questionCount}
            value={wrongCount}
            onChange={(e) => handleWrongChange(parseInt(e.target.value) || 0)}
            className="text-rose-700 font-bold"
          />
          <Input
            label="Boş (B)"
            type="number"
            min={0}
            value={emptyCount}
            onChange={(e) => setEmptyCount(parseInt(e.target.value) || 0)}
            className="text-slate-700 font-bold"
          />
        </div>

        {/* Calculated Net & XP Bar */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Kazanılacak Deneyim:</span>
            <span className="font-black text-amber-700 text-sm">+{xpReward} XP (Onay Bekleyecek)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Hesaplanan Net:</span>
            <span className="text-lg font-black font-mono text-indigo-700">{net} Net</span>
          </div>
        </div>

        {/* MANDATORY PROOF UPLOAD FIELD */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>Çalışma Kanıtı Yükle</span>
              <span className="text-rose-600">* (Zorunlu)</span>
            </label>
            <button
              type="button"
              onClick={handleSetSampleProof}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
            >
              <ImageIcon className="w-3 h-3" />
              <span>Örnek Test Fotoğrafı Ekle</span>
            </button>
          </div>

          {!proofUrl ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Soru bankası veya çözüm fotoğrafını buraya sürükleyin ya da <span className="text-indigo-600 underline">seçin</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, JPEG veya PDF (Maks. 10MB)</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-emerald-900 truncate">{proofName || 'Çalışma Kanıtı'}</p>
                  <p className="text-[11px] text-emerald-700 font-medium">Kanıt belgesi hazırlandı</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProofUrl(null);
                  setProofName('');
                }}
                className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                title="Kanıtı Kaldır"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <Input
          label="Çalışma Notları & Hatalı Konular"
          placeholder="Örn: 2 adet ana düşünce sorusunda çeldiriciye düşüldü, kurallar tekrar edilecek."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<BookOpen className="w-4 h-4" />}
            className="shadow-md hover:shadow-lg font-bold"
          >
            Kaydı Ekle (+{xpReward} XP)
          </Button>
        </div>
      </form>
    </Modal>
  );
};
