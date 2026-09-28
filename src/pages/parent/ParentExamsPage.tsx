import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/db';
import { ExamResult, Student } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { formatDateTurkish } from '../../utils/formatters';
import { Award, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const ParentExamsPage: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const allStudents = await db.getStudents();
        const matched = allStudents.find(
          (s) => s.parent_id === user?.id || (user?.user_id && s.parent_id === user.user_id)
        );
        if (matched) {
          setStudent(matched);
          const exList = await db.getExamsByStudent(matched.id);
          setExams(exList);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  const trendData = exams
    .slice()
    .reverse()
    .map((e) => ({
      date: e.exam_date,
      name: e.exam_name.length > 15 ? e.exam_name.substring(0, 15) + '...' : e.exam_name,
      net: e.total_net,
      score: e.score || 0,
      type: e.exam_type,
    }));

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Veriler yükleniyor...</div>;
  }

  if (!student) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto my-12 space-y-4">
        <Award className="w-12 h-12 text-amber-400 mx-auto opacity-70" />
        <h3 className="text-base font-bold text-white">Eşleşmiş Öğrenci Bulunamadı</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Deneme sınavı sonuçlarını görüntülemek için lütfen Veli Paneli Ana Sayfası üzerinden öğrencinizin eşleşme kodunu girerek eşleşmeyi tamamlayınız.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">
            {student.name} - Deneme Karneleri & Net Analizleri
          </h2>
          <p className="text-xs text-slate-400">
            Öğrencinizin TYT ve AYT Türkiye geneli ve kurum denemelerindeki net sonuçları
          </p>
        </div>
      </div>

      {trendData.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Tarihsel Net Artış Çizgisi
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#6366f1' }}
                  name="Toplam Net"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map((ex) => (
          <Card key={ex.id} className="p-4 space-y-3 bg-slate-900 border-slate-800">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm text-slate-100">{ex.exam_name}</h4>
                <p className="text-xs text-slate-400">{formatDateTurkish(ex.exam_date)}</p>
              </div>
              <Badge variant={ex.exam_type === 'TYT' ? 'primary' : 'amber'}>{ex.exam_type}</Badge>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Doğru / Yanlış / Boş</span>
                <span className="font-mono text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-1.5 py-0.5 rounded">{ex.total_correct}D</span>
                  <span className="text-rose-400 bg-rose-950/40 border border-rose-800/60 px-1.5 py-0.5 rounded">{ex.total_wrong}Y</span>
                  <span className="text-slate-400 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded">{ex.total_empty}B</span>
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-400 block">TOPLAM NET</span>
                <span className="text-xl font-extrabold font-mono text-white tracking-tight">
                  {ex.total_net.toFixed(2)}
                </span>
                {ex.score && (
                  <span className="block text-[11px] text-amber-400 font-mono font-bold">
                    {ex.score} Puan
                  </span>
                )}
              </div>
            </div>

            {ex.subject_results && ex.subject_results.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Branş Detayları:</p>
                <div className="flex flex-wrap gap-1.5">
                  {ex.subject_results.map((sr, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono flex items-center gap-1.5"
                    >
                      <strong className="text-slate-200 font-sans">{sr.subject_name || sr.test_name}:</strong>
                      <span>{sr.correct}D {sr.wrong}Y</span>
                      <span className="text-indigo-400 font-bold">({sr.net.toFixed(2)}N)</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {ex.notes && (
              <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                Koç Değerlendirmesi: {ex.notes}
              </p>
            )}
          </Card>
        ))}
      </div>

      {exams.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-sm text-slate-400">Henüz kayıtlı bir deneme sınavı bulunmuyor.</p>
        </Card>
      )}
    </div>
  );
};
