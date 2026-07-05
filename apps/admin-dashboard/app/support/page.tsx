'use client';

import { useState, useEffect } from 'react';
import { LifeBuoy, AlertTriangle, Search, CheckCircle, Filter } from 'lucide-react';
import { SupportTicketCard } from '@/components/support-ticket-card';
import { StatsCard } from '@/components/stats-card';
import { StatsCardSkeleton } from '@/components/skeleton';
import { EmptyState } from '@/components/empty-state';
import { SEED_SUPPORT_TICKETS, CITY_NAMES } from '@/lib/seed-data';
import type { SeedSupportTicket } from '@/lib/seed-data';

export default function SupportPage() {
  const [tickets, setTickets] = useState<SeedSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setTickets(SEED_SUPPORT_TICKETS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const sosCount = tickets.filter((t) => t.urgency === 'sos').length;
  const openCount = tickets.filter((t) => t.status === 'open').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  const filtered = tickets.filter((t) => {
    const matchesSearch = !search ||
      t.userName.toLowerCase().includes(search.toLowerCase()) ||
      t.issueDescription.toLowerCase().includes(search.toLowerCase()) ||
      (t.rideId && t.rideId.toLowerCase().includes(search.toLowerCase()));
    const matchesUrgency = !urgencyFilter || t.urgency === urgencyFilter;
    const matchesStatus = !statusFilter || t.status === statusFilter;
    const matchesCity = !cityFilter || t.city === cityFilter;
    return matchesSearch && matchesUrgency && matchesStatus && matchesCity;
  });

  const handleAssign = (id: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: 'in_progress' as const } : t
      )
    );
  };

  const handleResolve = (id: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: 'resolved' as const } : t
      )
    );
  };

  const activeFilters = [urgencyFilter, statusFilter, cityFilter].filter(Boolean).length;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Support & Incident Desk</h1>
          <p className="text-sm text-slate-400 mt-1">
            Process rider and driver support tickets. SOS alerts are highlighted for immediate attention.
          </p>
        </div>
        {sosCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl animate-pulse-soft">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-xs font-black text-red-700 uppercase tracking-wider">
              {sosCount} SOS Alert{sosCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </header>

      {loading ? (
        <StatsCardSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total Tickets"
            value={tickets.length}
            icon={LifeBuoy}
            iconBgClass="bg-slate-100"
            iconColorClass="text-slate-600"
          />
          <StatsCard
            title="Open"
            value={openCount}
            icon={AlertTriangle}
            iconBgClass="bg-amber-50"
            iconColorClass="text-amber-600"
          />
          <StatsCard
            title="SOS Emergencies"
            value={sosCount}
            icon={AlertTriangle}
            iconBgClass="bg-red-50"
            iconColorClass="text-red-600"
          />
          <StatsCard
            title="Resolved"
            value={resolvedCount}
            icon={CheckCircle}
            iconBgClass="bg-emerald-50"
            iconColorClass="text-emerald-600"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets, users, ride IDs..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="text-sm bg-transparent outline-none cursor-pointer"
          >
            <option value="">All Urgency</option>
            <option value="sos">🔴 SOS</option>
            <option value="high">🟠 High</option>
            <option value="normal">⚪ Normal</option>
          </select>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white outline-none cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white outline-none cursor-pointer"
        >
          <option value="">All Cities</option>
          {CITY_NAMES.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        {activeFilters > 0 && (
          <button
            onClick={() => { setUrgencyFilter(''); setStatusFilter(''); setCityFilter(''); setSearch(''); }}
            className="text-xs font-semibold text-slate-500 hover:text-red-500 transition px-3 py-2"
          >
            Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-32" />
                  <div className="h-3 bg-slate-100 rounded w-24" />
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100">
          <EmptyState
            icon={CheckCircle}
            title="No tickets match your filters"
            description={tickets.length === 0 ? 'Support desk is clear. No incoming tickets at this time.' : 'Try adjusting your search or filter criteria to find what you need.'}
            actionLabel={activeFilters > 0 || search ? 'Clear all filters' : undefined}
            onAction={() => { setSearch(''); setUrgencyFilter(''); setStatusFilter(''); setCityFilter(''); }}
          />
        </div>
      ) : (
        <>
          {sosCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="font-bold text-sm text-red-800">SOS Alerts Require Immediate Action</p>
                  <p className="text-xs text-red-600">{sosCount} emergency ticket{sosCount > 1 ? 's' : ''} pending — prioritize above all other tickets</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered
              .sort((a, b) => {
                const urgencyOrder = { sos: 0, high: 1, normal: 2 };
                const statusOrder = { open: 0, in_progress: 1, resolved: 2 };
                const uDiff = (urgencyOrder[a.urgency] || 0) - (urgencyOrder[b.urgency] || 0);
                if (uDiff !== 0) return uDiff;
                return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
              })
              .map((ticket) => (
                <SupportTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onAssign={handleAssign}
                  onResolve={handleResolve}
                />
              ))}
          </div>
        </>
      )}
    </div>
  );
}
