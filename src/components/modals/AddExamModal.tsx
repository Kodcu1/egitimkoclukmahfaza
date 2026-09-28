import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { ExamResult, ExamType, ExamSubjectResult, StudentField, Student } from '../../types';
import { calculateNet } from '../../utils/calculations';
import { Calculator, Award, User } from 'lucide-react';

interface SubjectEntry {
  testName: string;
  subjectName: string;
  maxQuestions: number;
  correct: number;
  wrong: number;
  empty: number;
}

interface AddExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  students?: Student[];
  studentField?: StudentField;
  onAddExam: (examData: Omit<ExamResult, 'id' | 'created_at'>) => Promise<void>;
}

export const AddExamModal: React.FC<AddExamModalProps> = ({
  isOpen,
  onClose,
  studentId,
  students,
  onAddExam,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<string>(studentId);

  useEffect(() => {
    setSelectedStudent(studentId);
  }, [studentId]);

  const [examType, setExamType] = useState<ExamType>('TYT');
  const [examName, setExamName] = useState<string>('Özdebir Türkiye Geneli TYT Denemesi');
  const [examDate, setExamDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Subject templates
  const getInitialSubjects = (type: ExamType): SubjectEntry[] => {
    if (type === 'TYT') {
      return [
        { testName: 'Türkçe Testi', subjectName: 'Türkçe', maxQuestions: 40, correct: 32, wrong: 4, empty: 4 },
        { testName: 'Temel Matematik Testi', subjectName: 'Temel Matematik', maxQuestions: 30, correct: 24, wrong: 3, empty: 3 },
        { testName: 'Temel Matematik Testi', subjectName: 'Geometri', maxQuestions: 10, correct: 6, wrong: 2, empty: 2 },
        { testName: 'Sosyal Bilimler Testi', subjectName: 'Tarih', maxQuestions: 5, correct: 4, wrong: 1, empty: 0 },
        { testName: 'Sosyal Bilimler Testi', subjectName: 'Coğrafya', maxQuestions: 5, correct: 4, wrong: 1, empty: 0 },
        { testName: 'Sosyal Bilimler Testi', subjectName: 'Felsefe', maxQuestions: 5, correct: 4, wrong: 1, empty: 0 },
        { testName: 'Sosyal Bilimler Testi', subjectName: 'Din Kültürü', maxQuestions: 5, correct: 5, wrong: 0, empty: 0 },
        { testName: 'Fen Bilimleri Testi', subjectName: 'Fizik', maxQuestions: 7, correct: 4, wrong: 2, empty: 1 },
        { testName: 'Fen Bilimleri Testi', subjectName: 'Kimya', maxQuestions: 7, correct: 5, wrong: 1, empty: 1 },
        { testName: 'Fen Bilimleri Testi', subjectName: 'Biyoloji', maxQuestions: 6, correct: 4, wrong: 1, empty: 1 },
      ];
    } else {
      // AYT
      return [
        { testName: 'Matematik Testi', subjectName: 'Matematik', maxQuestions: 30, correct: 25, wrong: 3, empty: 2 },
        { testName: 'Matematik Testi', subjectName: 'Geometri', maxQuestions: 10, correct: 7, wrong: 1, empty: 2 },
        { testName: 'Fen Bilimleri Testi', subjectName: 'Fizik', maxQuestions: 14, correct: 10, wrong: 2, empty: 2 },
        { testName: 'Fen Bilimleri Testi', subjectName: 'Kimya', maxQuestions: 13, correct: 11, wrong: 1, empty: 1 },
        { testName: 'Fen Bilimleri Testi', subjectName: 'Biyoloji', maxQuestions: 13, correct: 10, wrong: 2, empty: 1 },
        { testName: 'Edebiyat-Sosyal-1', subjectName: 'Türk Dili ve Edebiyatı', maxQuestions: 24, correct: 0, wrong: 0, empty: 24 },
        { testName: 'Edebiyat-Sosyal-1', subjectName: 'Tarih-1', maxQuestions: 10, correct: 0, wrong: 0, empty: 10 },
        { testName: 'Edebiyat-Sosyal-1', subjectName: 'Coğrafya-1', maxQuestions: 6, correct: 0, wrong: 0, empty: 6 },
      ];
    }
  };

  const [subjects, setSubjects] = useState<SubjectEntry[]>(getInitialSubjects('TYT'));

  const handleExamTypeChange = (type: ExamType) => {
    setExamType(type);
    setSubjects(getInitialSubjects(type));
    setExamName(type === 'TYT' ? '3D Türkiye Geneli TYT Denemesi' : 'Apotemi AYT Denemesi');
  };

  const updateSubject = (index: number, field: 'correct' | 'wrong' | 'empty', val: number) => {
    const updated = [...subjects];
    const item = { ...updated[index] };
    const num = Math.max(0, Math.floor(val || 0));

    if (field === 'correct') {
      item.correct = Math.min(item.maxQuestions, num);
      item.empty = Math.max(0, item.maxQuestions - item.correct - item.wrong);
    } else if (field === 'wrong') {
      item.wrong = Math.min(item.maxQuestions - item.correct, num);
      item.empty = Math.max(0, item.maxQuestions - item.correct - item.wrong);
    } else {
      item.empty = Math.min(item.maxQuestions, num);
    }

    updated[index] = item;
    setSubjects(updated);
  };

  // Calculations
  const totalCorrect = subjects.reduce((sum, s) => sum + s.correct, 0);
  const totalWrong = subjects.reduce((sum, s) => sum + s.wrong, 0);
  const totalEmpty = subjects.reduce((sum, s) => sum + s.empty, 0);
  const totalQuestions = subjects.reduce((sum, s) => sum + s.maxQuestions, 0);
  const totalNet = Number(calculateNet(totalCorrect, totalWrong).toFixed(2));

  // Estimated raw score
  const estimatedScore = Number(
    (examType === 'TYT' ? 100 + totalNet * 3.3 : 100 + totalNet * 4.8).toFixed(1)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!examName.trim()) {
      setErrorMsg('Lütfen deneme sınavının adını giriniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      const subjectResults: ExamSubjectResult[] = subjects.map((s, idx) => ({
        id: 'esr_' + idx + '_' + Math.random().toString(36).substring(2, 6),
        exam_result_id: '',
        test_name: s.testName,
        subject_name: s.subjectName,
        correct: s.correct,
        wrong: s.wrong,
        empty: s.empty,
        net: calculateNet(s.correct, s.wrong),
      }));

      const targetStudent = selectedStudent || studentId;
      if (!targetStudent) {
        setErrorMsg('⚠️ Lütfen bir öğrenci seçiniz.');
        setIsSubmitting(false);
        return;
      }

      await onAddExam({
        student_id: targetStudent,
        exam_type: examType,
        exam_name: examName.trim(),
        exam_date: examDate,
        total_questions: totalQuestions,
        total_correct: totalCorrect,
        total_wrong: totalWrong,
        total_empty: totalEmpty,
        total_net: totalNet,
        score: estimatedScore,
        notes: notes.trim() || undefined,
        subject_results: subjectResults,
      });

      onClose();
    } catch (err) {
      setErrorMsg('Deneme sınavı kaydedilirken bir hata oluştu.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yeni Deneme Sınavı Girişi"
      subtitle="TYT ve AYT ders bazlı net motoru ile otomatik hesaplama"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Student Selector if called without single preselected student */}
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Sınav Türü"
            value={examType}
            onChange={(e) => handleExamTypeChange(e.target.value as ExamType)}
          >
            <option value="TYT">TYT (120 Soru - 165 dk)</option>
            <option value="AYT">AYT (Alan Yeterlilik - 180 dk)</option>
          </Select>

          <Input
            label="Deneme Yayın / Adı"
            placeholder="Örn: 3D TYT Türkiye Geneli 1"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            className="sm:col-span-1"
          />

          <Input
            label="Sınav Tarihi"
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
          />
        </div>

        {/* Subjects & Net Matrix */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-800">
            <span>Ders / Alt Bölüm</span>
            <div className="flex gap-4 font-mono text-center">
              <span className="w-11 text-emerald-700 font-extrabold">Doğru</span>
              <span className="w-11 text-rose-700 font-extrabold">Yanlış</span>
              <span className="w-11 text-slate-700 font-extrabold">Boş</span>
              <span className="w-14 text-indigo-800 font-extrabold">Net</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto p-2 space-y-1 bg-white">
            {subjects.map((sub, idx) => {
              const currentNet = calculateNet(sub.correct, sub.wrong);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 px-2.5 text-xs hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">
                      {sub.subjectName}
                    </span>
                    <span className="text-[11px] font-medium text-slate-600">
                      {sub.maxQuestions} Soru • {sub.testName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={sub.maxQuestions}
                      value={sub.correct}
                      onChange={(e) => updateSubject(idx, 'correct', parseInt(e.target.value) || 0)}
                      className="w-11 bg-emerald-50 border border-emerald-300 rounded-lg px-1.5 py-1 text-center font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm"
                      title="Doğru Sayısı"
                    />
                    <input
                      type="number"
                      min={0}
                      max={sub.maxQuestions}
                      value={sub.wrong}
                      onChange={(e) => updateSubject(idx, 'wrong', parseInt(e.target.value) || 0)}
                      className="w-11 bg-rose-50 border border-rose-300 rounded-lg px-1.5 py-1 text-center font-mono font-bold text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs sm:text-sm"
                      title="Yanlış Sayısı"
                    />
                    <input
                      type="number"
                      min={0}
                      max={sub.maxQuestions}
                      value={sub.empty}
                      onChange={(e) => updateSubject(idx, 'empty', parseInt(e.target.value) || 0)}
                      className="w-11 bg-slate-100 border border-slate-300 rounded-lg px-1.5 py-1 text-center font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm"
                      title="Boş Sayısı"
                    />
                    <div className="w-14 text-right font-mono font-black text-indigo-700 text-sm">
                      {currentNet.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calculated Total Bar */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800 text-white shadow-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-300 font-medium block">D / Y / B Dağılımı:</span>
              <span className="font-mono font-extrabold text-sm">
                <span className="text-emerald-400">{totalCorrect} Doğru</span> •{' '}
                <span className="text-rose-400">{totalWrong} Yanlış</span> •{' '}
                <span className="text-slate-300">{totalEmpty} Boş</span>
              </span>
            </div>
            <div className="border-l border-white/20 pl-4">
              <span className="text-slate-300 font-medium block">Tahmini Ham Puan:</span>
              <span className="font-mono font-extrabold text-amber-300 text-sm">
                {estimatedScore} Puan
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-indigo-200 block">Toplam Sınav Neti</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              {totalNet} Net
            </span>
          </div>
        </div>

        <Input
          label="Deneme Değerlendirme & Koç Notu"
          placeholder="Örn: Paragraf hızlandı, geometri sorularına süre yetmedi."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Award className="w-4 h-4" />}
          >
            Denemeyi Kaydet (+25 XP)
          </Button>
        </div>
      </form>
    </Modal>
  );
};
