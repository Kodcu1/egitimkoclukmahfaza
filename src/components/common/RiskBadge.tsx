import React from 'react';
import { RiskLevel } from '../../types';
import { Badge } from './Badge';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, showIcon = true }) => {
  const getBadgeConfig = () => {
    switch (level) {
      case 'LOW':
        return {
          variant: 'success' as const,
          label: 'Düşük Risk',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'MEDIUM':
        return {
          variant: 'warning' as const,
          label: 'Orta Risk',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
        };
      case 'HIGH':
        return {
          variant: 'danger' as const,
          label: 'Yüksek Risk',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
        };
      case 'CRITICAL':
        return {
          variant: 'danger' as const,
          label: 'Kritik Risk',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-500 animate-pulse" />,
        };
      default:
        return {
          variant: 'default' as const,
          label: 'Bilinmiyor',
          icon: null,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <Badge variant={config.variant} className="font-semibold gap-1.5">
      {showIcon && config.icon}
      <span>{config.label}</span>
      {score !== undefined && <span className="opacity-80 font-normal">({score}%)</span>}
    </Badge>
  );
};
