import React from 'react';
import { Card } from '../common/Card';
import { RiskBadge } from '../common/RiskBadge';
import { RiskLevel } from '../../types';
import { ShieldAlert, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';

interface RiskCardProps {
  score: number;
  level: RiskLevel;
  reasons?: string[];
  studentName?: string;
}

export const RiskCard: React.FC<RiskCardProps> = ({ score, level, reasons = [], studentName }) => {
  const getTheme = () => {
    switch (level) {
      case 'CRITICAL':
        return {
          cardBorder: 'border-rose-700/60 bg-rose-950/20',
          textColor: 'text-rose-400',
          barColor: 'bg-rose-500',
        };
      case 'HIGH':
        return {
          cardBorder: 'border-rose-800/40 bg-rose-950/10',
          textColor: 'text-rose-400',
          barColor: 'bg-rose-500',
        };
      case 'MEDIUM':
        return {
          cardBorder: 'border-amber-800/40 bg-amber-950/10',
          textColor: 'text-amber-400',
          barColor: 'bg-amber-500',
        };
      case 'LOW':
      default:
        return {
          cardBorder: 'border-emerald-800/40 bg-emerald-950/10',
          textColor: 'text-emerald-400',
          barColor: 'bg-emerald-500',
        };
    }
  };

  const theme = getTheme();

  return (
    <Card className={theme.cardBorder}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
            {level === 'LOW' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : level === 'MEDIUM' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">
              {studentName ? `${studentName} • ` : ''}YKS Risk Analizi
            </h4>
            <p className="text-xs text-slate-400">Yapay zeka ve kural tabanlı hedef tutarlılık puanı</p>
          </div>
        </div>

        <RiskBadge level={level} score={score} />
      </div>

      {/* Progress Metric Bar */}
      <div className="space-y-1 mb-4">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Risk İndeksi (0 - 100)</span>
          <span className={`font-bold font-mono ${theme.textColor}`}>%{score}</span>
        </div>
        <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${theme.barColor}`}
            style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
          />
        </div>
      </div>

      {/* Reasons / Factors Breakdown */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Tespit Edilen Faktörler & Tavsiyeler
        </p>
        <div className="space-y-1.5">
          {reasons && reasons.length > 0 ? (
            reasons.map((r, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-slate-300"
              >
                {level === 'LOW' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <span>{r}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">Herhangi bir risk faktörü bulunmuyor.</p>
          )}
        </div>
      </div>
    </Card>
  );
};
