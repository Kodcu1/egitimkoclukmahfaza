import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/db';
import { ExamResult, Student } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Select } from '../../components/common/Select';
import { Input } from '../../components/common/Input';
import { AddExamModal } from '../../components/modals/AddExamModal';
import { formatDateTurkish } from '../../utils/formatters';
import { Award, Plus, Search, Trash2, TrendingUp, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const StudentExamsPage: React.FC = () => {
  const { user, studentData, refreshStudentData } = useAuth();
  const [student, setStudent] = useState<Student | null>(studentData);
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      let stu = studentData;
      if (!stu && user) {
        stu = await db.getStudentById(user.user_id || user.id);
        if (!stu) {
          const list = await db.getStudents();
          stu = list.find((s) => s.user_id === (user.user_id || user.id) || (s.email && s.email.toLowerCase() === user.email.toLowerCase())) || null;
        }
      }
      setStudent(stu);

      if (stu) {
        const exList = await db.getExamsByStudent(stu.id);
        setExams(exList);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentData]);

  const filteredExams = exams.filter((ex) => {
    const matchesType = selectedType === 'ALL' || ex.exam_type === selectedType;
    const matchesSearch = ex.exam_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleDeleteExam = async (id: string) => {
    if (window.confirm('Bu deneme sınavını silmek istediğinize emin misiniz?')) {
      await db.deleteExam(id);
      await loadData();
      await refreshStudentData();
    }
  };

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

  if (!student) {
    return <div className="p-8 text-center text-slate-600 font-medium">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Deneme Takibim & Net Karnelerim</h2>
          <p className="text-xs text-slate-600 font-medium">
            TYT ve AYT Türkiye geneli deneme sınavı sonuçların, net analizlerin ve puan trendin
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-xs"
        >
          Yeni Deneme Sonucu Gir (+25 XP)
        </Button>
      </div>

      {/* Net Progression Trend Chart */}
      {trendData.length > 0 && (
        <Card className="p-5 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Net Artış Grafiğim
              </h3>
              <p className="text-xs text-slate-600 font-medium">Zaman içindeki başarı eğrin</p>
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

      {/* Filter Bar */}
      <Card className="p-4 bg-white border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Deneme adı ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="ALL">Tüm Sınav Türleri (TYT & AYT)</option>
            <option value="TYT">Yalnızca TYT</option>
            <option value="AYT">Yalnızca AYT</option>
          </Select>
        </div>
      </Card>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExams.map((ex) => (
          <Card
            key={ex.id}
            className="flex flex-col justify-between bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-xs group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">{ex.exam_name}</h4>
                  <p className="text-xs text-slate-600 font-medium">{formatDateTurkish(ex.exam_date)}</p>
                </div>

                <Badge variant={ex.exam_type === 'TYT' ? 'primary' : 'amber'} className="group-hover:scale-105 transition-transform">
                  {ex.exam_type}
                </Badge>
              </div>

              {/* Net & Score Highlight */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-200/80 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">Doğru / Yanlış / Boş</span>
                  <div className="font-mono text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">{ex.total_correct} Doğru</span>
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/80">{ex.total_wrong} Yanlış</span>
                    <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{ex.total_empty} Boş</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 block">TOPLAM NET</span>
                  <span className="text-2xl font-extrabold font-mono text-slate-900 tracking-tight">
                    {ex.total_net.toFixed(2)}
                  </span>
                  {ex.score && (
                    <span className="block text-[11px] text-amber-700 font-mono font-bold">
                      {ex.score} Puan
                    </span>
                  )}
                </div>
              </div>

              {/* Subject Breakdown Pill List */}
              {ex.subject_results && ex.subject_results.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Branş Bazında Sonuçlar & Netler:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ex.subject_results.map((sr, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-600 font-mono flex items-center gap-1.5"
                      >
                        <strong className="text-slate-800 font-sans">{sr.subject_name || sr.test_name}:</strong>
                        <span>{sr.correct}D {sr.wrong}Y</span>
                        <span className="text-indigo-600 font-bold">({sr.net.toFixed(2)}N)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ex.notes && (
                <p className="text-xs text-slate-700 italic bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
                  <span className="font-bold text-amber-900 not-italic">Koç Notu:</span> {ex.notes}
                </p>
              )}
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => handleDeleteExam(ex.id)}
                className="text-slate-400 hover:text-rose-600 text-xs flex items-center gap-1 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Sil
              </button>
            </div>
          </Card>
        ))}
      </div>

      {filteredExams.length === 0 && (
        <Card className="text-center py-12 bg-white border border-slate-200 shadow-xs">
          <p className="text-sm text-slate-600 font-medium">Kayıtlı deneme sınavı bulunamadı.</p>
        </Card>
      )}

      {/* Add Exam Modal */}
      <AddExamModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        studentId={student.id}
        studentField={student.field}
        onAddExam={async (newExam) => {
          await db.addExam(newExam);
          setShowAddModal(false);
          await loadData();
          await refreshStudentData();
        }}
      />
    </div>
  );
};
