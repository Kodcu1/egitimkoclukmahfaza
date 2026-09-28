import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/db';
import { Student } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { RiskBadge } from '../common/RiskBadge';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Users,
  ChevronRight,
  TrendingDown,
  Clock,
  Sparkles,
} from 'lucide-react';

interface AIRiskCenterCardProps {
  onSelectStudent?: (student: Student) => void;
}

export const AIRiskCenterCard: React.FC<AIRiskCenterCardProps> = ({ onSelectStudent }) => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'MEDIUM' | 'LOW'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const list = await db.getStudents();
        setStudents(list);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const criticalStudents = students.filter(
    (s) => s.risk_level === 'HIGH' || s.risk_level === 'CRITICAL' || s.risk_score >= 50
  );
  const mediumStudents = students.filter(
    (s) => s.risk_level === 'MEDIUM' || (s.risk_score >= 25 && s.risk_score < 50)
  );
  const lowStudents = students.filter(
    (s) => s.risk_level === 'LOW' && s.risk_score < 25
  );

  const displayedList =
    filter === 'CRITICAL'
      ? criticalStudents
      : filter === 'MEDIUM'
      ? mediumStudents
      : filter === 'LOW'
      ? lowStudents
      : students;

  return (
    <Card className="p-5 border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
            <ShieldAlert className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              🚨 AI Öğrenci Risk Merkezi
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Öğrencilerin akademik ve çalışma disiplini risklerinin dinamik sınıflandırması
            </p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tümü ({students.length})
          </button>
          <button
            onClick={() => setFilter('CRITICAL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              filter === 'CRITICAL' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-700 hover:bg-rose-100/50'
            }`}
          >
            🔴 Kritik ({criticalStudents.length})
          </button>
          <button
            onClick={() => setFilter('MEDIUM')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              filter === 'MEDIUM' ? 'bg-amber-500 text-slate-950 shadow-2xs' : 'text-amber-800 hover:bg-amber-100/50'
            }`}
          >
            🟡 Takip ({mediumStudents.length})
          </button>
          <button
            onClick={() => setFilter('LOW')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              filter === 'LOW' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-700 hover:bg-emerald-100/50'
            }`}
          >
            🟢 İyi ({lowStudents.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayedList.map((s) => (
          <div
            key={s.id}
            onClick={() => {
              if (onSelectStudent) onSelectStudent(s);
              else navigate(`/coach/students/${s.id}`);
            }}
            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
              s.risk_level === 'HIGH' || s.risk_level === 'CRITICAL' || s.risk_score >= 50
                ? 'border-rose-200 bg-rose-50/40 hover:border-rose-400'
                : s.risk_level === 'MEDIUM' || (s.risk_score >= 25 && s.risk_score < 50)
                ? 'border-amber-200 bg-amber-50/40 hover:border-amber-400'
                : 'border-slate-200 bg-slate-50/40 hover:border-indigo-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">{s.name}</h4>
                <p className="text-xs text-slate-500 font-medium">
                  {s.field} • {s.grade}
                </p>
              </div>
              <RiskBadge level={s.risk_level} score={s.risk_score} />
            </div>

            <div className="mt-2.5 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800 line-clamp-1">
                🎯 {s.target_university} - {s.target_department}
              </p>
              <p className="text-[11px] text-rose-700 font-medium line-clamp-2 bg-white/80 p-1.5 rounded-lg border border-rose-100 mt-1">
                {s.risk_reasons?.[0] || 'Hedef sıralama bareminde takip gerekli.'}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-indigo-600">
              <span>Öğrenci Profilini Aç</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
