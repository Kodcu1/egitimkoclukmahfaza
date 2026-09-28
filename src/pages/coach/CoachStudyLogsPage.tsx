import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { StudyLog, Student } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AddStudyLogModal } from '../../components/modals/AddStudyLogModal';
import { formatDateTurkish, formatDurationHours } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { BookOpen, Plus, Search, Trash2, Clock, CheckCircle } from 'lucide-react';

export const CoachStudyLogsPage: React.FC = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [logToDelete, setLogToDelete] = useState<StudyLog | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [logList, stuList] = await Promise.all([db.getStudyLogs(), db.getStudents()]);
      setLogs(logList);
      setStudents(stuList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdated = () => loadData();
    window.addEventListener('study_logs_updated', handleUpdated);
    return () => window.removeEventListener('study_logs_updated', handleUpdated);
  }, []);

  const subjects = Array.from(new Set(logs.map((l) => l.subject_name))).filter(Boolean);

  const filteredLogs = logs.filter((log) => {
    const matchesStudent = selectedStudentId === 'ALL' || log.student_id === selectedStudentId;
    const matchesSubject = selectedSubject === 'ALL' || log.subject_name === selectedSubject;
    const matchesSearch =
      log.topic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.subtopic_name && log.subtopic_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      students.find((s) => s.id === log.student_id)?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStudent && matchesSubject && matchesSearch;
  });

  const handleDeleteLog = async () => {
    if (!logToDelete) return;
    try {
      await db.deleteStudyLog(logToDelete.id);
      setLogs((prev) => prev.filter((l) => l.id !== logToDelete.id));
      setLogToDelete(null);
      toast.success('Çalışma kaydı başarıyla silindi.');
      await loadData();
    } catch (err: any) {
      console.error('Delete study log error:', err);
      toast.error('Silme işlemi veritabanı izni nedeniyle başarısız oldu!');
    }
  };

  const totalQuestions = filteredLogs.reduce((acc, curr) => acc + (curr.question_count || 0), 0);
  const totalMinutes = filteredLogs.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Çalışma Günlükleri & Soru Takibi</h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Öğrencilerinizin kademeli YKS 2027 müfredatındaki ders, konu, süre ve soru çözümleri
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={students.length === 0}
          className="shadow-md hover:shadow-lg transition-all"
        >
          Çalışma Kaydı Ekle
        </Button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Filtrelenen Kayıt</p>
            <h4 className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono mt-1">{filteredLogs.length}</h4>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Toplam Çözülen Soru</p>
            <h4 className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono mt-1">
              {totalQuestions.toLocaleString()} Soru
            </h4>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Toplam Çalışma Süresi</p>
            <h4 className="text-2xl sm:text-3xl font-black text-amber-700 font-mono mt-1">
              {formatDurationHours(totalMinutes)}
            </h4>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Konu, alt konu veya öğrenci adı ara..."
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
                <th className="px-5 py-3.5">Öğrenci</th>
                <th className="px-5 py-3.5">Ders & Konu / Kazanım</th>
                <th className="px-5 py-3.5">Süre</th>
                <th className="px-5 py-3.5 text-center">Soru / Net</th>
                <th className="px-5 py-3.5">Kanıt & Notlar</th>
                <th className="px-5 py-3.5 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.map((log) => {
                const stu = students.find((s) => s.id === log.student_id);
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {formatDateTurkish(log.study_date)}
                    </td>
                    <td className="px-5 py-4 font-extrabold text-slate-900 text-sm whitespace-nowrap">
                      {stu?.name || 'Bilinmeyen'}
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
                      <span className="font-black text-slate-900 text-sm">{log.question_count} Soru</span>
                      {log.net_count !== undefined && (
                        <span className="block text-xs font-bold text-indigo-700 mt-0.5">
                          ({log.net_count} Net)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <div className="space-y-1">
                        {log.proof_url && (
                          <a
                            href={log.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100"
                          >
                            <span>📸 Kanıt: {log.proof_name || 'Görüntüle'}</span>
                          </a>
                        )}
                        <p className="text-xs font-medium text-slate-800 line-clamp-2">{log.notes || '-'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setLogToDelete(log)}
                        className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Kaydı Sil"
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

        {filteredLogs.length === 0 && (
          <div className="p-10 text-center text-slate-600 font-medium text-xs sm:text-sm">
            Kayıtlı çalışma günlüğü bulunamadı.
          </div>
        )}
      </div>

      {/* Add Study Log Modal */}
      {showAddModal && students.length > 0 && (
        <AddStudyLogModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          studentId={selectedStudentId !== 'ALL' ? selectedStudentId : ''}
          students={students}
          onAddLog={async (newLog) => {
            await db.addStudyLog(newLog);
            setShowAddModal(false);
            await loadData();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!logToDelete}
        onClose={() => setLogToDelete(null)}
        onConfirm={handleDeleteLog}
        title="Çalışma Günlüğünü Sil"
        message={`"${logToDelete?.topic_name}" konusuna ait çalışma kaydını silmek istediğinize emin misiniz? Bu işlem öğrencinin çözülen soru ve süre istatistiklerinden düşülecektir.`}
        confirmText="Kaydı Sil"
        cancelText="Vazgeç"
        variant="danger"
      />
    </div>
  );
};
