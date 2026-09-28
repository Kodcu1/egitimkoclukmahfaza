import React from 'react';
import { cn } from '../../utils/cn';

interface ProgressProps {
  value: number;
  max?: number;
  variant?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'indigo',
  size = 'md',
  showLabel = false,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const variants = {
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    cyan: 'bg-cyan-500',
    gradient: 'bg-gradient-to-r from-indigo-600 via-blue-500 to-amber-500',
  };

  return (
    <div className={cn('w-full space-y-1', className)}>
      <div className={cn('w-full rounded-full bg-slate-100 border border-slate-200/60 overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', variants[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500 font-medium">
          <span>%{percentage}</span>
          <span>
            {value} / {max}
          </span>
        </div>
      )}
    </div>
  );
};

