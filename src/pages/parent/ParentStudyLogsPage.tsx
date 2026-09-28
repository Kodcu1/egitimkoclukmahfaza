import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/db';
import { StudyLog, Student } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { formatDateTurkish, formatDurationHours } from '../../utils/formatters';
import { BookOpen, Clock, CheckCircle } from 'lucide-react';

export const ParentStudyLogsPage: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [logs, setLogs] = useState<StudyLog[]>([]);
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
          const logList = await db.getStudyLogsByStudent(matched.id);
          setLogs(logList);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Veriler yükleniyor...</div>;
  }

  if (!student) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto my-12 space-y-4">
        <BookOpen className="w-12 h-12 text-indigo-400 mx-auto opacity-70" />
        <h3 className="text-base font-bold text-white">Eşleşmiş Öğrenci Bulunamadı</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Çalışma günlüklerini görüntülemek için lütfen Veli Paneli Ana Sayfası üzerinden öğrencinizin eşleşme kodunu girerek eşleşmeyi tamamlayınız.
        </p>
      </Card>
    );
  }

  const totalQuestions = logs.reduce((acc, curr) => acc + (curr.question_count || 0), 0);
  const totalMinutes = logs.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">
          {student.name} - Günlük Çalışma & Soru Çizelgesi
        </h2>
        <p className="text-xs text-slate-400">
          Öğrencinizin tamamladığı ders etütleri, konu kazanımları ve çözdüğü soru istatistikleri
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Toplam Çözülen Soru</p>
            <h4 className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
              {totalQuestions.toLocaleString()} Soru
            </h4>
          </div>
          <CheckCircle className="w-6 h-6 text-emerald-400 opacity-60" />
        </Card>

        <Card className="p-4 bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Toplam Çalışma Süresi</p>
            <h4 className="text-2xl font-bold text-amber-400 font-mono mt-0.5">
              {formatDurationHours(totalMinutes)}
            </h4>
          </div>
          <Clock className="w-6 h-6 text-amber-400 opacity-60" />
        </Card>

        <Card className="p-4 bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Etüt Oturumu</p>
            <h4 className="text-2xl font-bold text-indigo-400 font-mono mt-0.5">
              {logs.length} Seans
            </h4>
          </div>
          <BookOpen className="w-6 h-6 text-indigo-400 opacity-60" />
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Tarih</th>
                <th className="px-5 py-3.5">Ders & Konu</th>
                <th className="px-5 py-3.5">Süre</th>
                <th className="px-5 py-3.5 text-center">Çözülen Soru / Net</th>
                <th className="px-5 py-3.5">Öğrenci Notu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40">
                  <td className="px-5 py-3.5 font-mono text-slate-400">
                    {formatDateTurkish(log.study_date)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm">
                        {log.subject_name}
                      </Badge>
                      <span className="font-semibold text-slate-100">{log.topic_name}</span>
                    </div>
                    {log.subtopic_name && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{log.subtopic_name}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-amber-400 font-medium">
                    {formatDurationHours(log.duration_minutes)}
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-200">
                    {log.question_count} Soru {log.net_count ? `(${log.net_count} Net)` : ''}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 max-w-xs truncate">
                    {log.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs">
            Kayıtlı çalışma oturumu bulunamadı.
          </div>
        )}
      </Card>
    </div>
  );
};
