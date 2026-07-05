'use client';

import { useState, useEffect } from 'react';
import {
  Activity, Users, AlertTriangle, TrendingUp,
  MapPin, Car, Clock
} from 'lucide-react';
import { RideMap } from '@namma/ui/map';
import { StatsCard } from '@/components/stats-card';
import { StatsCardSkeleton } from '@/components/skeleton';
import { EmptyState } from '@/components/empty-state';
import { SEED_DRIVERS, SEED_RIDES } from '@/lib/seed-data';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const activeRides = SEED_RIDES.filter((r) =>
    ['requested', 'accepted', 'arrived', 'picked_up'].includes(r.status)
  );
  const driversOnline = SEED_DRIVERS.filter((d) => d.dutyStatus === 'online');
  const lowWalletDrivers = SEED_DRIVERS.filter((d) => d.walletBalance < 1000);

  const markers = driversOnline.slice(0, 20).map((d) => ({
    id: d.id,
    kind: 'vehicle' as const,
    label: d.licensePlate || 'Vehicle',
    coord: {
      latitude: d.lat ?? 12.2958,
      longitude: d.lng ?? 76.6394,
    },
  }));

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Live Operations</h1>
          <p className="text-sm text-slate-400 mt-1">Active Region: Mysuru, Mangaluru, Hubli-Dharwad</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping-slow" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Systems Nominal</span>
        </div>
      </header>

      {loading ? (
        <StatsCardSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Active Ride Requests"
            value={activeRides.length}
            icon={Activity}
            iconBgClass="bg-amber-50"
            iconColorClass="text-amber-600"
            trend={{ direction: 'up', value: '12% vs yesterday' }}
          />
          <StatsCard
            title="Drivers Online"
            value={driversOnline.length}
            icon={Users}
            iconBgClass="bg-indigo-50"
            iconColorClass="text-indigo-600"
            trend={{ direction: 'up', value: `${driversOnline.length} of ${SEED_DRIVERS.length} active` }}
          />
          <StatsCard
            title="Low Wallet Alerts"
            value={lowWalletDrivers.length}
            icon={AlertTriangle}
            iconBgClass="bg-red-50"
            iconColorClass="text-red-500"
            trend={{ direction: 'down', value: `${lowWalletDrivers.length} drivers < ₹1,000` }}
          />
          <StatsCard
            title="Avg Surge Multiplier"
            value="1.25x"
            icon={TrendingUp}
            iconBgClass="bg-emerald-50"
            iconColorClass="text-emerald-600"
            trend={{ direction: 'up', value: 'Peak hour active' }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">Regional Live View</h3>
            <span className="text-[10px] font-bold bg-slate-100 px-3 py-1.5 rounded-full text-slate-500 uppercase tracking-wider">
              Auto-refresh: 5s
            </span>
          </div>

          <div className="h-96 w-full rounded-xl overflow-hidden border border-slate-100">
            <RideMap
              markers={markers}
              camera={{
                center: { latitude: 12.2958, longitude: 76.6394 },
                zoom: 12,
              }}
              interactive
              style={{ borderRadius: 12 }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Active Rides Monitor</h3>

          {loading ? (
            <div className="space-y-3 flex-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-slate-100 rounded-xl p-4 space-y-2 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-24" />
                  <div className="h-3 bg-slate-100 rounded w-40" />
                  <div className="h-3 bg-slate-100 rounded w-32" />
                  <div className="h-3 bg-slate-100 rounded w-48" />
                </div>
              ))}
            </div>
          ) : activeRides.length === 0 ? (
            <div className="flex-1 flex items-center">
              <EmptyState
                icon={Car}
                title="No active rides"
                description="All rides have been completed. New ride requests will appear here."
              />
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {activeRides.map((ride) => (
                <div
                  key={ride.id}
                  className="border border-slate-100 rounded-xl p-4 space-y-2 hover:border-primary/30 transition cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-800">
                      <span className="text-slate-400 font-mono text-[10px]">#{ride.id}</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      ride.status === 'picked_up' ? 'bg-amber-100 text-amber-800' :
                      ride.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                      ride.status === 'arrived' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {ride.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p className="flex items-center gap-1.5"><Users className="h-3 w-3" /> {ride.riderName}</p>
                    <p className="flex items-center gap-1.5"><Car className="h-3 w-3" /> {ride.driverName || 'Assigning...'}</p>
                    <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {ride.pickupAddress} → {ride.dropAddress}</p>
                  </div>
                  <div className="border-t border-slate-50 pt-2 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="h-3 w-3" />
                      {ride.estimatedDurationMins} min
                      <span className="text-slate-300">·</span>
                      {ride.distanceKm} km
                    </div>
                    <span className="font-black text-slate-900">₹{ride.fareAmount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeRides.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 text-center">
              <span className="text-[10px] font-semibold text-slate-400">
                {activeRides.length} active ride{activeRides.length > 1 ? 's' : ''} · {driversOnline.length} drivers online
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
