import React from 'react';
import { RiskLevel, ResultLabel } from '../../types';
import { ShieldCheck, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';

interface RiskBadgeProps {
  level?: RiskLevel;
  resultLabel?: ResultLabel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level = 'safe',
  resultLabel,
  size = 'md',
  showIcon = true,
}) => {
  let effectiveLevel = level;
  if (resultLabel === 'synthetic_clone') effectiveLevel = 'critical';
  if (resultLabel === 'suspicious') effectiveLevel = 'high';
  if (resultLabel === 'inconclusive') effectiveLevel = 'medium';
  if (resultLabel === 'authentic') effectiveLevel = 'safe';

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  const config = {
    safe: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot: 'bg-emerald-400',
      label: 'Authentic / Safe',
      icon: ShieldCheck,
    },
    low: {
      bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      dot: 'bg-sky-400',
      label: 'Low Risk',
      icon: ShieldCheck,
    },
    medium: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      dot: 'bg-amber-400',
      label: 'Suspicious / Review',
      icon: AlertTriangle,
    },
    high: {
      bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      dot: 'bg-orange-400',
      label: 'High Threat',
      icon: AlertTriangle,
    },
    critical: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      dot: 'bg-rose-500',
      label: 'Synthetic Clone',
      icon: AlertOctagon,
    },
  }[effectiveLevel] || {
    bg: 'bg-slate-800/60 text-slate-300 border-slate-700/60',
    dot: 'bg-slate-400',
    label: 'Unknown',
    icon: HelpCircle,
  };

  const Icon = config.icon;

  const displayLabel = resultLabel
    ? resultLabel === 'synthetic_clone'
      ? 'Synthetic Clone'
      : resultLabel.charAt(0).toUpperCase() + resultLabel.slice(1).replace('_', ' ')
    : config.label;

  return (
    <span
      className={`inline-flex items-center rounded-full border font-sans ${config.bg} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {showIcon && <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />}
      <span>{displayLabel}</span>
    </span>
  );
};
