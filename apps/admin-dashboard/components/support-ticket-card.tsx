'use client';

import { AlertTriangle, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { SeedSupportTicket } from '@/lib/seed-data';

interface SupportTicketCardProps {
  ticket: SeedSupportTicket;
  onAssign?: (id: string) => void;
  onResolve?: (id: string) => void;
}

const URGENCY_CONFIG = {
  sos: { icon: AlertTriangle, bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-600 text-white', label: 'SOS Emergency' },
  high: { icon: AlertCircle, bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500 text-white', label: 'High Priority' },
  normal: { icon: MessageSquare, bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600', label: 'Normal' },
};

const STATUS_CONFIG = {
  open: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Open' },
  in_progress: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50', label: 'In Progress' },
  resolved: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Resolved' },
};

export function SupportTicketCard({ ticket, onAssign, onResolve }: SupportTicketCardProps) {
  const urgency = URGENCY_CONFIG[ticket.urgency];
  const UrgencyIcon = urgency.icon;
  const status = STATUS_CONFIG[ticket.status];
  const StatusIcon = status.icon;

  return (
    <div className={`bg-white rounded-2xl p-5 border-l-4 ${urgency.border} border border-slate-100 hover:shadow-md transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl ${urgency.bg} flex items-center justify-center`}>
            <UrgencyIcon className={`h-5 w-5 ${ticket.urgency === 'sos' ? 'text-red-600' : ticket.urgency === 'high' ? 'text-orange-500' : 'text-slate-500'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm">{ticket.userName}</h4>
              {ticket.urgency === 'sos' && (
                <span className="animate-pulse inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-600 text-white">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  SOS
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{ticket.userPhone} · {ticket.city}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </span>
      </div>

      <div className="mb-3">
        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{ticket.category.replace('_', ' ')}</span>
        <p className="text-sm text-slate-700 mt-1 line-clamp-2">{ticket.issueDescription}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          {new Date(ticket.createdAt).toLocaleString()}
          {ticket.rideId && (
            <>
              <span className="text-slate-300">·</span>
              <span className="font-mono text-[10px]">Ride: {ticket.rideId}</span>
            </>
          )}
        </div>
        <div className="flex gap-1.5">
          {ticket.status === 'open' && onAssign && (
            <button
              onClick={() => onAssign(ticket.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              Assign
            </button>
          )}
          {(ticket.status === 'open' || ticket.status === 'in_progress') && onResolve && (
            <button
              onClick={() => onResolve(ticket.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition shadow-sm ${
                ticket.urgency === 'sos' ? 'bg-red-600 hover:bg-red-700' : 'bg-accent hover:brightness-110'
              }`}
            >
              Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
