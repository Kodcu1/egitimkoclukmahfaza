import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/db';
import { StudyLog, Student } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { AddStudyLogModal } from '../../components/modals/AddStudyLogModal';
import { formatDateTurkish, formatDurationHours } from '../../utils/formatters';
import { BookOpen, Plus, Search, Trash2, Clock, CheckCircle } from 'lucide-react';

export const StudentStudyLogsPage: React.FC = () => {
  const { user, studentData, refreshStudentData } = useAuth();
  const [student, setStudent] = useState<Student | null>(studentData);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
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
        const logList = await db.getStudyLogsByStudent(stu.id);
        setLogs(logList);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdated = () => {
      loadData();
      refreshStudentData();
    };
    window.addEventListener('study_logs_updated', handleUpdated);
    return () => window.removeEventListener('study_logs_updated', handleUpdated);
  }, [studentData]);

  const subjects = Array.from(new Set(logs.map((l) => l.subject_name))).filter(Boolean);

  const filteredLogs = logs.filter((log) => {
    const matchesSubject = selectedSubject === 'ALL' || log.subject_name === selectedSubject;
    const matchesSearch =
      log.topic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.subtopic_name && log.subtopic_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  const handleDeleteLog = async (id: string) => {
    if (window.confirm('Bu çalışma kaydını silmek istediğinize emin misiniz?')) {
      setLogs((prev) => prev.filter((l) => l.id !== id));
      await db.deleteStudyLog(id);
      await loadData();
      await refreshStudentData();
    }
  };

  const totalQuestions = filteredLogs.reduce((acc, curr) => acc + (curr.question_count || 0), 0);
  const totalMinutes = filteredLogs.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);

  if (!student) {
    return <div className="p-8 text-center text-slate-400">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Çalışma Günlüğüm & Soru Arşivi</h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Kademeli YKS 2027 müfredatında çözdüğün sorular, doğru/yanlış oranların ve etüt sürelerin
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-md hover:shadow-lg transition-all"
        >
          Yeni Çalışma Kaydı Gir
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300 transition-all duration-300 flex items-center justify-between group">
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Toplam Çözülen Soru</p>
            <h4 className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono mt-1 group-hover:scale-105 transition-transform origin-left">
              {totalQuestions.toLocaleString()} Soru
            </h4>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xs">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-amber-300 transition-all duration-300 flex items-center justify-between group">
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Toplam Çalışma Süresi</p>
            <h4 className="text-2xl sm:text-3xl font-black text-amber-700 font-mono mt-1 group-hover:scale-105 transition-transform origin-left">
              {formatDurationHours(totalMinutes)}
            </h4>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300 flex items-center justify-between group">
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Kayıtlı Oturum</p>
            <h4 className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono mt-1 group-hover:scale-105 transition-transform origin-left">
              {filteredLogs.length} Etüt
            </h4>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Konu veya alt konu ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <Select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="ALL">Tüm Branşlar / Dersler</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-800 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Tarih</th>
                <th className="px-5 py-3.5">Ders & Konu / Kazanım</th>
                <th className="px-5 py-3.5">Çalışma Süresi</th>
                <th className="px-5 py-3.5 text-center">D / Y / B</th>
                <th className="px-5 py-3.5 text-right">Net</th>
                <th className="px-5 py-3.5">Kanıt & Notlar</th>
                <th className="px-5 py-3.5 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                    {formatDateTurkish(log.study_date)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="primary" size="sm" className="font-bold">
                        {log.subject_name}
                      </Badge>
                      <span className="font-extrabold text-slate-900 text-sm">{log.topic_name}</span>
                    </div>
                    {log.subtopic_name && (
                      <p className="text-xs font-medium text-slate-600 mt-1">{log.subtopic_name}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 font-bold font-mono text-amber-800 whitespace-nowrap">
                    {formatDurationHours(log.duration_minutes)}
                  </td>
                  <td className="px-5 py-4 text-center font-mono whitespace-nowrap">
                    <span className="text-emerald-700 font-extrabold">{log.correct_count ?? '-'} D</span> •{' '}
                    <span className="text-rose-700 font-extrabold">{log.wrong_count ?? '-'} Y</span> •{' '}
                    <span className="text-slate-700 font-bold">{log.empty_count ?? '-'} B</span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-black text-indigo-800 text-sm whitespace-nowrap">
                    {log.net_count !== undefined ? `${log.net_count} Net` : '-'}
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    <div className="space-y-1">
                      {log.proof_url && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-700">
                          <span>📸 {log.proof_name || 'Çalışma Kanıtı Eklendi'}</span>
                        </div>
                      )}
                      <p className="text-xs font-medium text-slate-800 line-clamp-2">{log.notes || '-'}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Kaydı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-10 text-center text-slate-600 font-medium text-xs sm:text-sm">
            Kayıtlı çalışma günlüğü bulunamadı. Hemen "Yeni Çalışma Kaydı Gir" butonu ile ekleyin!
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AddStudyLogModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        studentId={student.id}
        onAddLog={async (newLog) => {
          await db.addStudyLog(newLog);
          setShowAddModal(false);
          await loadData();
          await refreshStudentData();
        }}
      />
    </div>
  );
};
