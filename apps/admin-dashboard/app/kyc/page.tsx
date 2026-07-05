'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Search, CheckCircle, XCircle } from 'lucide-react';
import { KycCard } from '@/components/kyc-card';
import { EmptyState } from '@/components/empty-state';
import { SEED_KYC_APPLICATIONS } from '@/lib/seed-data';

export default function KycPage() {
  const [applications, setApplications] = useState(SEED_KYC_APPLICATIONS);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = applications.filter((app) => {
    const matchesSearch = !search ||
      app.fullName.toLowerCase().includes(search.toLowerCase()) ||
      app.licensePlate.toLowerCase().includes(search.toLowerCase());
    const matchesCity = !cityFilter || app.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  const handleApprove = (id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
  };

  const handleReject = (id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
  };

  const cities = [...new Set(SEED_KYC_APPLICATIONS.map((a) => a.city))];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">KYC Review Center</h1>
          <p className="text-sm text-slate-400 mt-1">
            Verify driver identity documents before granting platform access
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm">
          <ShieldCheck className="h-5 w-5 text-amber-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {applications.length} Pending
          </span>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or plate..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
          />
        </div>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/30 outline-none"
        >
          <option value="">All Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        {filtered.length !== applications.length && (
          <span className="text-xs text-slate-400">
            Showing {filtered.length} of {applications.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <KycCard
              key={i}
              application={SEED_KYC_APPLICATIONS[0]}
              onApprove={() => {}}
              onReject={() => {}}
              loading
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100">
          <EmptyState
            icon={CheckCircle}
            title="All clear! No pending KYC applications"
            description={search || cityFilter ? 'Try changing your search or filter criteria.' : 'New driver applications will appear here for verification.'}
            actionLabel={search || cityFilter ? 'Clear filters' : undefined}
            onAction={() => { setSearch(''); setCityFilter(''); }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((app) => (
            <KycCard
              key={app.id}
              application={app}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-900">Bulk Actions</h3>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const ids = filtered.map((a) => a.id);
                ids.forEach((id) => handleApprove(id));
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:brightness-110 transition shadow-sm"
            >
              <CheckCircle className="h-4 w-4" />
              Approve All ({filtered.length})
            </button>
            <button
              onClick={() => {
                const ids = filtered.map((a) => a.id);
                ids.forEach((id) => handleReject(id));
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition"
            >
              <XCircle className="h-4 w-4" />
              Reject All ({filtered.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
