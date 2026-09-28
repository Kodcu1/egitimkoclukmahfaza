import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/db';
import { Task, Student } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { formatDateTurkish } from '../../utils/formatters';
import { CheckSquare, Clock, Sparkles } from 'lucide-react';

export const ParentTasksPage: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
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
          const taskList = await db.getTasksByStudent(matched.id);
          setTasks(taskList);
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
        <CheckSquare className="w-12 h-12 text-emerald-400 mx-auto opacity-70" />
        <h3 className="text-base font-bold text-white">Eşleşmiş Öğrenci Bulunamadı</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Görev takibini görüntülemek için lütfen Veli Paneli Ana Sayfası üzerinden öğrencinizin eşleşme kodunu girerek eşleşmeyi tamamlayınız.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">
          {student.name} - Koçluk Ödev ve Görev Takibi
        </h2>
        <p className="text-xs text-slate-400">
          Öğrencinize atanan haftalık soru fasikülleri, deneme ve etüt görevlerinin güncel durumları
        </p>
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((t) => {
          const isDone = t.status === 'Tamamlandı';

          return (
            <Card
              key={t.id}
              className={`p-4 space-y-3 bg-slate-900 border ${
                isDone ? 'border-emerald-900/40 opacity-80' : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-xs text-slate-400">{t.priority} Öncelik</span>
                <Badge variant={isDone ? 'success' : 'warning'} size="sm">
                  {t.status}
                </Badge>
              </div>

              <h4 className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                {t.title}
              </h4>

              {t.description && (
                <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  {t.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Teslim: {formatDateTurkish(t.due_date)}
                </span>
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> +{t.xp_reward} XP
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-sm text-slate-400">Atanmış koçluk görevi bulunamadı.</p>
        </Card>
      )}
    </div>
  );
};
