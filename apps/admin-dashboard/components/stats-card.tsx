'use client';

import { type LucideIcon } from 'lucide-react';
import { Skeleton } from './skeleton';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgClass?: string;
  iconColorClass?: string;
  trend?: { direction: 'up' | 'down'; value: string };
  loading?: boolean;
}

export function StatsCard({ title, value, icon: Icon, iconBgClass = 'bg-amber-50', iconColorClass = 'text-amber-600', trend, loading }: StatsCardProps) {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{value}</h3>
        {trend && (
          <p className={`text-xs font-semibold mt-1 ${trend.direction === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${iconBgClass}`}>
        <Icon className={`h-6 w-6 ${iconColorClass}`} />
      </div>
    </div>
  );
}
