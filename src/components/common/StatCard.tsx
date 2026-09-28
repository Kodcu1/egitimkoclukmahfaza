import React, { ReactNode } from 'react';
import { Card } from './Card';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  variant?: 'default' | 'indigo' | 'emerald' | 'amber' | 'rose';
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className,
  onClick,
}) => {
  const iconBgs = {
    default: 'bg-slate-100 text-slate-600 border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const valueColors = {
    default: 'text-slate-800',
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-500',
    rose: 'text-rose-600',
  };

  return (
    <Card
      variant="default"
      onClick={onClick}
      className={cn(
        'p-4 sm:p-5 group transition-all duration-300 bg-white border border-slate-200 shadow-xs hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200/90',
        onClick && 'cursor-pointer hover:border-indigo-400',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className={cn('text-2xl font-bold tracking-tight transition-transform duration-200 group-hover:scale-105 origin-left', valueColors[variant])}>
              {value}
            </h3>
          </div>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          {trend && (
            <p className="text-xs flex items-center gap-1 mt-1">
              <span className={cn('font-medium', trend.isPositive ? 'text-emerald-600' : 'text-rose-600')}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              {trend.label && <span className="text-slate-400">{trend.label}</span>}
            </p>
          )}
        </div>

        {icon && (
          <div
            className={cn(
              'p-2.5 rounded-xl border flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md shrink-0',
              iconBgs[variant]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

