import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyTriageStudent } from '../../types';
import { aiService } from '../../services/aiService';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Target,
  AlertTriangle,
  Clock,
  Sparkles,
  Phone,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  TrendingDown,
  Calendar,
  MessageSquare,
} from 'lucide-react';

interface DailyTriageCardProps {
  coachId?: string;
  onSelectStudent?: (studentId: string) => void;
}

export const DailyTriageCard: React.FC<DailyTriageCardProps> = ({
  coachId,
  onSelectStudent,
}) => {
  const navigate = useNavigate();
  const [triageList, setTriageList] = useState<DailyTriageStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTriage = async () => {
      try {
        setIsLoading(true);
        const data = await aiService.getDailyTriageList(coachId);
        setTriageList(data);
      } catch (err) {
        console.error('Failed to load triage list:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTriage();
  }, [coachId]);

  const handleAction = (item: DailyTriageStudent) => {
    if (onSelectStudent) {
      onSelectStudent(item.student_id);
    } else {
      navigate(`/coach/students/${item.student_id}`);
    }
  };

  return (
    <Card className="border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-indigo-50/40 p-5 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 shadow-xs">
            <Target className="w-5 h-5 animate-pulse" />
          </span>
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              🎯 BUGÜN KİMLE İLGİLENMELİYİM?
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-900 border border-amber-400/40">
                AI Önceliklendirme
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Öğrencilerin son 7 günlük çalışma süreleri ve görev teslimlerine göre acil müdahale sırası
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/coach/risk-analysis')}
          className="text-xs border-amber-300 text-amber-900 hover:bg-amber-100/70"
        >
          Tüm Riskleri Gör →
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 flex justify-center">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : triageList.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">
          Bugün için acil ilgilenilmesi gereken öğrenci bulunmuyor. Her şey yolunda!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {triageList.slice(0, 6).map((item, idx) => (
            <div
              key={item.student_id}
              className={`p-4 rounded-2xl bg-white border transition-all duration-200 flex flex-col justify-between group hover:shadow-md hover:-translate-y-0.5 ${
                item.risk_level === 'CRITICAL'
                  ? 'border-rose-200/90 hover:border-rose-400'
                  : item.risk_level === 'MEDIUM'
                  ? 'border-amber-200/90 hover:border-amber-400'
                  : 'border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        idx === 0
                          ? 'bg-rose-600 text-white'
                          : idx === 1
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                        {item.student_name}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {item.student_field} • {item.target_department}
                      </span>
                    </div>
                  </div>

                  {item.risk_level === 'CRITICAL' ? (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black shrink-0">
                      🔴 Acil
                    </span>
                  ) : item.risk_level === 'MEDIUM' ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold shrink-0">
                      🟡 Takip
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                      🟢 İyi
                    </span>
                  )}
                </div>

                <div
                  className={`p-2 rounded-xl text-xs font-bold ${
                    item.risk_level === 'CRITICAL'
                      ? 'bg-rose-50 text-rose-900 border border-rose-100'
                      : item.risk_level === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-900 border border-amber-100'
                      : 'bg-slate-50 text-slate-700 border border-slate-100'
                  }`}
                >
                  ⚡ {item.reason}
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {item.details}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="text-[10px] text-slate-400 font-medium">
                  7 Gün: <strong className="text-slate-700">{item.recent_metrics.hours_7d}h</strong>
                  {item.recent_metrics.overdue_tasks > 0 && (
                    <span className="text-rose-600 font-bold ml-1.5">
                      ({item.recent_metrics.overdue_tasks} gecikmiş)
                    </span>
                  )}
                </div>

                <Button
                  variant={item.risk_level === 'CRITICAL' ? 'danger' : 'primary'}
                  size="sm"
                  onClick={() => handleAction(item)}
                  className="text-xs py-1 h-7 px-3 text-white font-bold shrink-0"
                >
                  {item.actionLabel} →
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
