import React from 'react';
import { Badge as BadgeType, StudentBadge } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import {
  Sparkles,
  Flame,
  Crown,
  Clock,
  Zap,
  Award,
  BookOpen,
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  Landmark,
  Target,
  Lock,
} from 'lucide-react';
import { formatDateTurkish } from '../../utils/formatters';

interface BadgeCardProps {
  badge: BadgeType;
  studentBadge?: StudentBadge;
  currentProgress?: number;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge, studentBadge, currentProgress }) => {
  const isEarned = Boolean(studentBadge);

  const getIcon = (iconName: string, earned: boolean) => {
    const props = {
      className: `w-6 h-6 transition-transform duration-300 ${
        earned ? 'text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]' : 'text-slate-400'
      }`,
    };
    switch (iconName) {
      case 'Sparkles': return <Sparkles {...props} />;
      case 'Flame': return <Flame {...props} />;
      case 'Crown': return <Crown {...props} />;
      case 'Clock': return <Clock {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'Award': return <Award {...props} />;
      case 'BookOpen': return <BookOpen {...props} />;
      case 'Calculator': return <Calculator {...props} />;
      case 'Atom': return <Atom {...props} />;
      case 'FlaskConical': return <FlaskConical {...props} />;
      case 'Dna': return <Dna {...props} />;
      case 'Landmark': return <Landmark {...props} />;
      case 'Target': return <Target {...props} />;
      default: return <Award {...props} />;
    }
  };

  return (
    <div
      className={`relative rounded-3xl p-5 transition-all duration-300 group ${
        isEarned
          ? 'bg-slate-900 border border-amber-500/50 shadow-md shadow-amber-500/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/15 hover:border-amber-400'
          : 'bg-slate-100/90 border border-slate-200 opacity-70 hover:opacity-95 hover:-translate-y-1 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Badge Icon Shield */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 transition-all duration-300 ${
            isEarned
              ? 'bg-gradient-to-br from-amber-950/80 to-slate-950 border-amber-500/60 shadow-md shadow-amber-500/20 group-hover:scale-105 group-hover:border-amber-400'
              : 'bg-white border-slate-200 text-slate-400 shadow-xs'
          }`}
        >
          {isEarned ? (
            getIcon(badge.icon, true)
          ) : (
            <div className="relative">
              {getIcon(badge.icon, false)}
              <div className="absolute -bottom-1.5 -right-1.5 p-0.5 rounded-full bg-slate-200 border border-slate-300">
                <Lock className="w-2.5 h-2.5 text-slate-500" />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4
              className={`text-sm font-bold truncate transition-colors ${
                isEarned ? 'text-white group-hover:text-amber-300' : 'text-slate-800'
              }`}
            >
              {badge.title}
            </h4>
            {isEarned ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs">
                Kazanıldı
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-200 text-slate-600">
                Kilitli
              </span>
            )}
          </div>

          <p
            className={`text-xs leading-relaxed line-clamp-2 ${
              isEarned ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            {badge.description}
          </p>

          {isEarned && studentBadge?.earned_at && (
            <p className="text-[10px] text-amber-400/90 pt-1 font-medium font-mono">
              Kazanılma: {formatDateTurkish(studentBadge.earned_at)}
            </p>
          )}

          {!isEarned && currentProgress !== undefined && (
            <div className="pt-2">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono">
                <span>İlerleme</span>
                <span>
                  {currentProgress} / {badge.requirement_value}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (currentProgress / badge.requirement_value) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
