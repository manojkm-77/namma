'use client';

import { type LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-slate-300" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 max-w-xs mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-primary text-slate-900 font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm hover:brightness-110 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
