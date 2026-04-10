import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: string;
  isCurrency?: boolean;
  color?: 'cyan' | 'emerald' | 'amber' | 'red';
  loading?: boolean;
}

export default function StatsCard({ title, value, icon: Icon, trend, isCurrency = true, color = 'cyan', loading }: StatsCardProps) {
  const colorMap = {
    cyan:    'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    amber:   'text-amber-500 bg-amber-500/10 border-amber-500/20',
    red:     'text-rose-500 bg-rose-500/10 border-rose-500/20',
  };

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest leading-none mb-2 text-[var(--text-secondary)]">{title}</p>
          {loading ? (
             <div className="h-8 w-32 skeleton mt-1" />
          ) : (
             <h3 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
               {isCurrency ? formatCurrency(Number(value)) : value}
             </h3>
          )}
          {trend && !loading && (
            <div className="flex items-center gap-1.5 mt-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border)]">{trend}</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-2xl border shadow-sm transition-transform group-hover:scale-110', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

