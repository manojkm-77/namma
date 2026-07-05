'use client';

import { useState, useEffect } from 'react';
import { Car, MapPin, Clock, DollarSign, BadgeCheck, XCircle } from 'lucide-react';
import { DataTable, type Column } from '@/components/data-table';
import { StatsCard } from '@/components/stats-card';
import { StatsCardSkeleton } from '@/components/skeleton';
import { SEED_RIDES, CITY_NAMES, RIDE_STATUSES, type SeedRide } from '@/lib/seed-data';

export default function RidesPage() {
  const [rides, setRides] = useState<SeedRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<SeedRide | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRides(SEED_RIDES);
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const completedRides = rides.filter((r) => r.status === 'completed');
  const cancelledRides = rides.filter((r) => r.status === 'cancelled');
  const totalFare = rides.reduce((sum, r) => sum + r.fareAmount, 0);

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'id',
      label: 'Ride ID',
      sortable: true,
      render: (ride) => (
        <span className="font-mono text-[11px] font-bold text-slate-500">#{(ride as unknown as unknown as SeedRide).id}</span>
      ),
    },
    {
      key: 'riderName',
      label: 'Rider',
      sortable: true,
      filterType: 'text',
    },
    {
      key: 'driverName',
      label: 'Driver',
      sortable: true,
      render: (ride) => (ride as unknown as SeedRide).driverName || <span className="text-slate-300 italic">Unassigned</span>,
    },
    {
      key: 'vehicleType',
      label: 'Vehicle',
      sortable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Auto', value: 'auto' },
        { label: 'Mini', value: 'mini' },
        { label: 'Sedan', value: 'sedan' },
        { label: 'SUV', value: 'suv' },
      ],
      render: (ride) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          (ride as unknown as SeedRide).vehicleType === 'auto' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {(ride as unknown as SeedRide).vehicleType.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'city',
      label: 'City',
      sortable: true,
      filterType: 'select',
      filterOptions: CITY_NAMES.map((c) => ({ label: c, value: c })),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterType: 'select',
      filterOptions: RIDE_STATUSES.map((s) => ({
        label: s.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value: s,
      })),
      render: (ride) => {
        const r = ride as unknown as SeedRide;
        const statusColors: Record<string, string> = {
          requested: 'bg-slate-100 text-slate-600',
          accepted: 'bg-blue-100 text-blue-800',
          arrived: 'bg-emerald-100 text-emerald-800',
          picked_up: 'bg-amber-100 text-amber-800',
          completed: 'bg-green-100 text-green-800',
          cancelled: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusColors[r.status] || 'bg-slate-100 text-slate-600'}`}>
            {r.status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      key: 'fareAmount',
      label: 'Fare',
      sortable: true,
      render: (ride) => (
        <span className="font-bold text-slate-900">₹{(ride as unknown as SeedRide).fareAmount}</span>
      ),
    },
    {
      key: 'paymentMethod',
      label: 'Payment',
      render: (ride) => (
        <span className="text-xs text-slate-500 capitalize">{(ride as unknown as SeedRide).paymentMethod.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      sortable: true,
      render: (ride) => {
        const r = ride as unknown as SeedRide;
        return (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            r.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {r.paymentStatus}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (ride) => (
        <span className="text-xs text-slate-400">
          {new Date((ride as unknown as SeedRide).createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Rides Management</h1>
        <p className="text-sm text-slate-400 mt-1">
          Full ride history with real-time filtering, sorting, and status tracking.
        </p>
      </header>

      {loading ? (
        <StatsCardSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard title="Total Rides" value={rides.length} icon={Car} iconBgClass="bg-amber-50" iconColorClass="text-amber-600" />
          <StatsCard title="Completed" value={completedRides.length} icon={BadgeCheck} iconBgClass="bg-emerald-50" iconColorClass="text-emerald-600" />
          <StatsCard title="Cancelled" value={cancelledRides.length} icon={XCircle} iconBgClass="bg-red-50" iconColorClass="text-red-500" />
          <StatsCard title="Total Revenue" value={`₹${totalFare}`} icon={DollarSign} iconBgClass="bg-indigo-50" iconColorClass="text-indigo-600" />
        </div>
      )}

      <DataTable
        columns={columns}
        data={rides as unknown as Record<string, unknown>[]}
        keyExtractor={(item) => (item as unknown as unknown as SeedRide).id}
        loading={loading}
        onRowClick={(item) => setSelectedRide(item as unknown as unknown as SeedRide)}
        emptyTitle="No rides found"
        emptyDescription={rides.length === 0 ? 'Ride data will appear here once trips start flowing through the system.' : 'Try adjusting your search or filter criteria.'}
        emptyActionLabel={rides.length === 0 ? undefined : 'Clear filters'}
        onEmptyAction={() => {}}
        searchPlaceholder="Search by rider, driver, or location..."
        pageSize={8}
      />

      {selectedRide && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedRide(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-xl border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Ride Details</h3>
              <button onClick={() => setSelectedRide(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Car className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-mono text-sm font-bold text-slate-900">#{selectedRide.id}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    selectedRide.status === 'completed' ? 'bg-green-100 text-green-800' :
                    selectedRide.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>{selectedRide.status.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Rider</p>
                  <p className="font-semibold text-slate-800">{selectedRide.riderName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Driver</p>
                  <p className="font-semibold text-slate-800">{selectedRide.driverName || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Vehicle</p>
                  <p className="font-semibold text-slate-800 capitalize">{selectedRide.vehicleType}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">City</p>
                  <p className="font-semibold text-slate-800">{selectedRide.city}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pickup</p>
                    <p className="text-sm text-slate-700">{selectedRide.pickupAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Drop</p>
                    <p className="text-sm text-slate-700">{selectedRide.dropAddress}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Distance</p>
                  <p className="font-bold text-slate-900">{selectedRide.distanceKm} km</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Duration</p>
                  <p className="font-bold text-slate-900">{selectedRide.estimatedDurationMins} min</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Fare</p>
                  <p className="font-bold text-slate-900">₹{selectedRide.fareAmount}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(selectedRide.createdAt).toLocaleString('en-IN')}
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  selectedRide.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedRide.paymentMethod.replace('_', ' ')} · {selectedRide.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
