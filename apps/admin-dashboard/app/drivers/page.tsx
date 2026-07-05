'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Wifi, WifiOff, Clock, ShieldCheck, AlertTriangle, DollarSign, Star, Phone, Car, MapPin } from 'lucide-react';
import { DataTable, type Column } from '@/components/data-table';
import { StatsCard } from '@/components/stats-card';
import { StatsCardSkeleton } from '@/components/skeleton';
import { EmptyState } from '@/components/empty-state';
import { SEED_DRIVERS, CITY_NAMES, VEHICLE_TYPES, type SeedDriver } from '@/lib/seed-data';

function DutyToggle({ driver, onToggle }: { driver: SeedDriver; onToggle: (id: string, newStatus: SeedDriver['dutyStatus']) => void }) {
  const [status, setStatus] = useState(driver.dutyStatus);
  const [pending, setPending] = useState(false);

  const cycle = useCallback(() => {
    const next: Record<string, SeedDriver['dutyStatus']> = {
      offline: 'online',
      online: 'busy',
      busy: 'offline',
    };
    const nextStatus = next[status];
    setStatus(nextStatus);
    setPending(true);
    const result = onToggle(driver.id, nextStatus);
    setTimeout(() => setPending(false), 400);
  }, [status, driver.id, onToggle]);

  const statusConfig = {
    online: { icon: Wifi, bg: 'bg-emerald-100 text-emerald-800', label: 'Online' },
    offline: { icon: WifiOff, bg: 'bg-slate-100 text-slate-500', label: 'Offline' },
    busy: { icon: Clock, bg: 'bg-amber-100 text-amber-800', label: 'Busy' },
  };

  const cfg = statusConfig[status];

  return (
    <button
      onClick={(e) => { e.stopPropagation(); cycle(); }}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${cfg.bg} ${pending ? 'opacity-50' : 'hover:scale-105 cursor-pointer'}`}
    >
      <cfg.icon className={`h-3 w-3 ${pending ? 'animate-spin' : ''}`} />
      {cfg.label}
    </button>
  );
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<SeedDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<SeedDriver | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDrivers(SEED_DRIVERS);
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const onlineCount = drivers.filter((d) => d.dutyStatus === 'online').length;
  const kycVerifiedCount = drivers.filter((d) => d.isKycVerified).length;
  const lowWalletCount = drivers.filter((d) => d.walletBalance < 1000).length;

  const handleDutyToggle = useCallback((id: string, newStatus: SeedDriver['dutyStatus']) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === id ? { ...d, dutyStatus: newStatus } : d))
    );
  }, []);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'fullName',
      label: 'Driver',
      sortable: true,
      filterType: 'text',
      render: (row) => {
        const d = row as unknown as SeedDriver;
        return (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-xs font-bold text-amber-700">
              {d.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-800">{d.fullName}</p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Phone className="h-2.5 w-2.5" />
                {d.phoneNumber}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'vehicleType',
      label: 'Vehicle',
      sortable: true,
      filterType: 'select',
      filterOptions: VEHICLE_TYPES.map((v) => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v })),
      render: (row) => {
        const d = row as unknown as SeedDriver;
        return (
          <div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              d.vehicleType === 'auto' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {d.vehicleType.toUpperCase()}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">{d.licensePlate}</p>
          </div>
        );
      },
    },
    {
      key: 'city',
      label: 'City',
      sortable: true,
      filterType: 'select',
      filterOptions: CITY_NAMES.map((c) => ({ label: c, value: c })),
    },
    {
      key: 'dutyStatus',
      label: 'Status',
      sortable: true,
      render: (row) => {
        const d = row as unknown as SeedDriver;
        return <DutyToggle driver={d} onToggle={handleDutyToggle} />;
      },
    },
    {
      key: 'rating',
      label: 'Rating',
      sortable: true,
      render: (row) => {
        const d = row as unknown as SeedDriver;
        return (
          <span className="flex items-center gap-1 text-sm font-semibold text-slate-700">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            {d.rating.toFixed(1)}
          </span>
        );
      },
    },
    {
      key: 'isKycVerified',
      label: 'KYC',
      sortable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Verified', value: 'true' },
        { label: 'Pending', value: 'false' },
      ],
      render: (row) => {
        const d = row as unknown as SeedDriver;
        return d.isKycVerified ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            <ShieldCheck className="h-3 w-3" /> Verified
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            <AlertTriangle className="h-3 w-3" /> Pending
          </span>
        );
      },
    },
    {
      key: 'totalRides',
      label: 'Rides',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-slate-700">{(row as unknown as SeedDriver).totalRides}</span>
      ),
    },
    {
      key: 'walletBalance',
      label: 'Wallet',
      sortable: true,
      render: (row) => {
        const balance = (row as unknown as SeedDriver).walletBalance;
        return (
          <span className={`font-bold text-sm ${balance < 1000 ? 'text-red-500' : 'text-slate-900'}`}>
            ₹{balance.toLocaleString('en-IN')}
          </span>
        );
      },
    },
    {
      key: 'modelName',
      label: 'Model',
      render: (row) => (
        <span className="text-xs text-slate-500">{(row as unknown as SeedDriver).modelName}</span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Drivers Fleet</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage drivers, monitor duty status, and review performance metrics.
        </p>
      </header>

      {loading ? (
        <StatsCardSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total Drivers"
            value={drivers.length}
            icon={Users}
            iconBgClass="bg-indigo-50"
            iconColorClass="text-indigo-600"
          />
          <StatsCard
            title="Online"
            value={onlineCount}
            icon={Wifi}
            iconBgClass="bg-emerald-50"
            iconColorClass="text-emerald-600"
            trend={{ direction: 'up', value: `${Math.round(onlineCount / drivers.length * 100)}% fleet active` }}
          />
          <StatsCard
            title="KYC Verified"
            value={kycVerifiedCount}
            icon={ShieldCheck}
            iconBgClass="bg-blue-50"
            iconColorClass="text-blue-600"
            trend={{ direction: 'up', value: `${Math.round(kycVerifiedCount / drivers.length * 100)}% of fleet` }}
          />
          <StatsCard
            title="Low Wallet"
            value={lowWalletCount}
            icon={DollarSign}
            iconBgClass="bg-red-50"
            iconColorClass="text-red-500"
            trend={{ direction: 'down', value: `${lowWalletCount} driver${lowWalletCount > 1 ? 's' : ''} < ₹1,000` }}
          />
        </div>
      )}

      <DataTable
        columns={columns}
        data={drivers as unknown as Record<string, unknown>[]}
        keyExtractor={(item) => (item as unknown as SeedDriver).id}
        loading={loading}
        onRowClick={(item) => setSelectedDriver(item as unknown as SeedDriver)}
        emptyTitle="No drivers registered"
        emptyDescription="Driver accounts will appear here once they register through the mobile app."
        searchPlaceholder="Search by name, phone, or plate..."
        pageSize={8}
      />

      {selectedDriver && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedDriver(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-sm font-bold text-amber-700">
                  {selectedDriver.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedDriver.fullName}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {selectedDriver.phoneNumber}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedDriver(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <Car className="h-4 w-4 text-slate-400 mx-auto mb-1" />
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Vehicle</p>
                  <p className="font-bold text-sm text-slate-800">{selectedDriver.vehicleType.toUpperCase()}</p>
                  <p className="text-[10px] text-slate-500">{selectedDriver.licensePlate}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <Star className="h-4 w-4 text-amber-500 mx-auto mb-1 fill-amber-500" />
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Rating</p>
                  <p className="font-bold text-2xl text-slate-900">{selectedDriver.rating.toFixed(1)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <DollarSign className="h-4 w-4 text-slate-400 mx-auto mb-1" />
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Wallet</p>
                  <p className={`font-bold text-sm ${selectedDriver.walletBalance < 1000 ? 'text-red-500' : 'text-slate-900'}`}>
                    ₹{selectedDriver.walletBalance.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    {selectedDriver.dutyStatus === 'online' ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700"><Wifi className="h-3.5 w-3.5" /> Online</span>
                    ) : selectedDriver.dutyStatus === 'busy' ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-700"><Clock className="h-3.5 w-3.5" /> Busy</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-slate-500"><WifiOff className="h-3.5 w-3.5" /> Offline</span>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">KYC</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${selectedDriver.isKycVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {selectedDriver.isKycVerified ? <ShieldCheck className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                    {selectedDriver.isKycVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Location</p>
                    <p className="font-semibold text-slate-700">{selectedDriver.city}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const next = { offline: 'online' as const, online: 'busy' as const, busy: 'offline' as const };
                    const nextStatus = next[selectedDriver.dutyStatus];
                    handleDutyToggle(selectedDriver.id, nextStatus);
                    setSelectedDriver({ ...selectedDriver, dutyStatus: nextStatus });
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-slate-900 text-xs font-bold hover:brightness-110 transition shadow-sm"
                >
                  Toggle Duty
                </button>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs text-slate-400">
                <span>Model: {selectedDriver.modelName}</span>
                <span>{selectedDriver.totalRides} total rides</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
