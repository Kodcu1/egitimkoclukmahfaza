import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { ExamResult, Student, ExamType } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AddExamModal } from '../../components/modals/AddExamModal';
import { formatDateTurkish } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Award, Plus, Search, Trash2, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { AIExamAnalysisModal } from '../../components/ai/AIExamAnalysisModal';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const CoachExamsPage: React.FC = () => {
  const { toast } = useToast();
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('ALL');
  const [selectedExamType, setSelectedExamType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAIAnalysisModal, setShowAIAnalysisModal] = useState<boolean>(false);
  const [examToDelete, setExamToDelete] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [exList, stuList] = await Promise.all([db.getExams(), db.getStudents()]);
      setExams(exList);
      setStudents(stuList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredExams = exams.filter((ex) => {
    const matchesStudent = selectedStudentId === 'ALL' || ex.student_id === selectedStudentId;
    const matchesType = selectedExamType === 'ALL' || ex.exam_type === selectedExamType;
    const matchesSearch =
      ex.exam_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      students.find((s) => s.id === ex.student_id)?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStudent && matchesType && matchesSearch;
  });

  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    try {
      await db.deleteExam(examToDelete.id);
      setExamToDelete(null);
      toast.success('Deneme sınavı kaydı başarıyla silindi.');
      await loadData();
    } catch {
      toast.error('Deneme silinirken bir hata oluştu.');
    }
  };

  // Prepare chart data for selected student or overall
  const trendData = filteredExams
    .slice()
    .reverse()
    .map((e) => ({
      date: e.exam_date,
      name: e.exam_name.length > 15 ? e.exam_name.substring(0, 15) + '...' : e.exam_name,
      net: e.total_net,
      score: e.score || 0,
      type: e.exam_type,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Deneme Sınavları & Net Takibi</h2>
          <p className="text-xs text-slate-600 font-medium">
            Öğrencilerin TYT ve AYT Türkiye geneli ve kurum deneme sınavı performansları
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAIAnalysisModal(true)}
            leftIcon={<Sparkles className="w-4 h-4 text-amber-500" />}
            className="border-amber-300 bg-amber-50/60 hover:bg-amber-100 text-amber-950 font-semibold shadow-xs"
          >
            Çift Dosyalı AI Deneme Analizi
          </Button>

          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            disabled={students.length === 0}
          >
            Yeni Deneme Sınavı Gir
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Deneme adı veya öğrenci ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <Select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            <option value="ALL">Tüm Öğrenciler</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.field})
              </option>
            ))}
          </Select>

          <Select
            value={selectedExamType}
            onChange={(e) => setSelectedExamType(e.target.value)}
          >
            <option value="ALL">Tüm Sınav Türleri (TYT & AYT)</option>
            <option value="TYT">Yalnızca TYT</option>
            <option value="AYT">Yalnızca AYT</option>
          </Select>
        </div>
      </Card>

      {/* Net Progression Trend Chart */}
      {trendData.length > 1 && (
        <Card className="p-5 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Deneme Net Gelişim Trendi
              </h3>
              <p className="text-xs text-slate-600 font-medium">Tarihsel net artış eğrisi</p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#4f46e5' }}
                  name="Toplam Net"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Exams Table */}
      <Card className="p-0 overflow-hidden bg-white border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-4">Tarih</th>
                <th className="px-5 py-4">Öğrenci</th>
                <th className="px-5 py-4">Deneme Adı & Branş Dağılımı</th>
                <th className="px-5 py-4 text-center">D / Y / B</th>
                <th className="px-5 py-4 text-right">TOPLAM NET</th>
                <th className="px-5 py-4 text-right">Puan</th>
                <th className="px-5 py-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExams.map((ex) => {
                const stu = students.find((s) => s.id === ex.student_id);
                return (
                  <tr key={ex.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono text-slate-700 font-semibold whitespace-nowrap">
                      {formatDateTurkish(ex.exam_date)}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">
                      {stu?.name || 'Bilinmeyen'}
                    </td>
                    <td className="px-5 py-4 max-w-md">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{ex.exam_name}</span>
                        <Badge variant={ex.exam_type === 'TYT' ? 'primary' : 'amber'} size="sm">
                          {ex.exam_type}
                        </Badge>
                      </div>
                      
                      {/* Subject breakdown badges if available */}
                      {ex.subject_results && ex.subject_results.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {ex.subject_results.map((sr, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-mono"
                            >
                              <span className="font-semibold text-slate-800">{sr.subject_name || sr.test_name}:</span> {sr.correct}D {sr.wrong}Y ({sr.net.toFixed(2)}N)
                            </span>
                          ))}
                        </div>
                      )}

                      {ex.notes && <p className="text-[11px] text-slate-500 font-medium mt-1 italic">"{ex.notes}"</p>}
                    </td>
                    <td className="px-5 py-4 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{ex.total_correct}D</span>{' '}
                      <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">{ex.total_wrong}Y</span>{' '}
                      <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{ex.total_empty}B</span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600">Net Değeri</span>
                        <span className="font-mono font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">
                          {ex.total_net.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-amber-700 whitespace-nowrap">
                      {ex.score ? ex.score.toFixed(1) : '-'}
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setExamToDelete(ex)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Denemeyi Sil"
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

        {filteredExams.length === 0 && (
          <div className="p-8 text-center text-slate-600 font-medium text-xs">
            Kayıtlı deneme sınavı bulunamadı.
          </div>
        )}
      </Card>

      {/* Add Exam Modal */}
      {showAddModal && students.length > 0 && (
        <AddExamModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          studentId={selectedStudentId !== 'ALL' ? selectedStudentId : ''}
          students={students}
          onAddExam={async (newExam) => {
            await db.addExam(newExam);
            setShowAddModal(false);
            await loadData();
          }}
        />
      )}

      {/* Dual File AI Exam Analysis Modal */}
      {showAIAnalysisModal && (
        <AIExamAnalysisModal
          isOpen={showAIAnalysisModal}
          onClose={() => setShowAIAnalysisModal(false)}
          students={students}
          preselectedStudentId={selectedStudentId !== 'ALL' ? selectedStudentId : undefined}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!examToDelete}
        onClose={() => setExamToDelete(null)}
        onConfirm={handleDeleteExam}
        title="Deneme Sınavını Sil"
        message={`"${examToDelete?.exam_name}" adlı deneme sınavı kaydını silmek istediğinize emin misiniz?`}
        confirmText="Denemeyi Sil"
        cancelText="Vazgeç"
        variant="danger"
      />
    </div>
  );
};
