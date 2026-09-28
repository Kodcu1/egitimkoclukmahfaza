import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { getLevelInfo } from '../../utils/calculations';
import { Sparkles, Trophy, Award, Zap } from 'lucide-react';
import { XpTransaction } from '../../types';
import { formatDateTurkish } from '../../utils/formatters';

interface XPCardProps {
  xp: number;
  recentTransactions?: XpTransaction[];
  showTransactions?: boolean;
}

export const XPCard: React.FC<XPCardProps> = ({
  xp,
  recentTransactions = [],
  showTransactions = true,
}) => {
  const levelInfo = getLevelInfo(xp);

  return (
    <Card className="bg-white border border-slate-200 shadow-sm text-slate-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
              <Trophy className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Deneyim ve Seviye
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight transition-transform duration-200 group-hover:scale-105 origin-left">
              {xp}
            </h3>
            <span className="text-xs text-amber-500 font-bold tracking-wider animate-pulse">XP</span>
          </div>
        </div>

        <Badge
          variant="amber"
          size="md"
          className="font-bold py-1.5 px-3 shadow-xs hover:scale-105 hover:brightness-110 transition-all duration-200 cursor-default"
        >
          Level {levelInfo.level} • {levelInfo.title}
        </Badge>
      </div>

      {/* Level Progress Bar with Animated Shimmer */}
      <div className="space-y-1.5 mb-5">
        <div className="flex justify-between text-xs text-slate-500 font-medium">
          <span>Level {levelInfo.level} ({levelInfo.minXp} XP)</span>
          <span className="text-amber-600 font-bold font-mono">
            {levelInfo.currentXpInLevel} / {levelInfo.neededXpInLevel} XP (%{levelInfo.progressPercentage})
          </span>
          <span>Level {levelInfo.level + 1} ({levelInfo.maxXp} XP)</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200/80 p-0.5 relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 transition-all duration-500 shadow-sm relative overflow-hidden"
            style={{ width: `${levelInfo.progressPercentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
          </div>
        </div>
      </div>

      {/* XP Earn Rules Hint */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] text-slate-600 border-t border-slate-100 pt-3 mb-4">
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:scale-105 transition-all duration-200 cursor-default">
          <span className="text-amber-600 font-bold block">+5 XP</span>
          <span>10 Soru</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:scale-105 transition-all duration-200 cursor-default">
          <span className="text-indigo-600 font-bold block">+10 XP</span>
          <span>Çalışma Kaydı</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:scale-105 transition-all duration-200 cursor-default">
          <span className="text-emerald-600 font-bold block">+25 XP</span>
          <span>Deneme Sınavı</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-purple-50 hover:border-purple-300 hover:scale-105 transition-all duration-200 cursor-default">
          <span className="text-purple-600 font-bold block">+20 XP</span>
          <span>Görev Teslimi</span>
        </div>
      </div>

      {/* Recent Transactions List */}
      {showTransactions && recentTransactions.length > 0 && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Son XP Hareketleri
          </p>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {recentTransactions.slice(0, 4).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-200"
              >
                <div className="truncate mr-2">
                  <p className="text-slate-800 font-medium truncate">{tx.reason}</p>
                  <p className="text-[10px] text-slate-400">{formatDateTurkish(tx.created_at)}</p>
                </div>
                <span
                  className={`font-mono font-bold shrink-0 ${
                    tx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
