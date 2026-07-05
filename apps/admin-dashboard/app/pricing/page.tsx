'use client';

import { useState } from 'react';
import { Save, RotateCcw, DollarSign, Moon, Sun, Car } from 'lucide-react';
import { SEED_PRICING_CONFIGS, CITY_NAMES, VEHICLE_TYPES, type SeedPricingConfig } from '@/lib/seed-data';

type VehicleClass = 'auto' | 'mini' | 'sedan' | 'suv';

const VEHICLE_LABELS: Record<VehicleClass, string> = {
  auto: 'Auto Rickshaw',
  mini: 'Mini (Hatchback)',
  sedan: 'Sedan',
  suv: 'SUV',
};

const VEHICLE_ICONS: Record<string, string> = {
  auto: '🛺',
  mini: '🚗',
  sedan: '🚙',
  suv: '🚐',
};

export default function PricingPage() {
  const [selectedCity, setSelectedCity] = useState<string>(CITY_NAMES[0]);
  const [configs, setConfigs] = useState<SeedPricingConfig[]>(SEED_PRICING_CONFIGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentConfig = configs.find((c) => c.city === selectedCity)!;

  const updateConfig = (vehicle: VehicleClass, field: string, value: number) => {
    setConfigs((prev) =>
      prev.map((c) =>
        c.city === selectedCity
          ? { ...c, [vehicle]: { ...c[vehicle], [field]: value } }
          : c
      )
    );
    setSaved(false);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  const handleReset = () => {
    setConfigs(SEED_PRICING_CONFIGS);
    setSaved(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Dynamic Pricing Configuration</h1>
          <p className="text-sm text-slate-400 mt-1">
            Set fare matrices per city and vehicle type. Changes take effect immediately.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm ${
              saved ? 'bg-accent' : 'bg-primary text-slate-900 hover:brightness-110'
            } disabled:opacity-50`}
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">City</span>
        <div className="flex gap-1.5">
          {CITY_NAMES.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                selectedCity === city
                  ? 'bg-primary text-slate-900 shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {VEHICLE_TYPES.map((vehicle) => {
          const config = currentConfig[vehicle];
          return (
            <div
              key={vehicle}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg">
                  {VEHICLE_ICONS[vehicle]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{VEHICLE_LABELS[vehicle]}</h3>
                  <p className="text-xs text-slate-400">{vehicle === 'auto' ? '3-wheeler' : '4-wheeler'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                      <DollarSign className="h-3 w-3" /> Base Fare (₹)
                    </label>
                    <input
                      type="number"
                      value={config.baseFare}
                      onChange={(e) => updateConfig(vehicle, 'baseFare', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                      <Car className="h-3 w-3" /> Base Km
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={config.baseKm}
                      onChange={(e) => updateConfig(vehicle, 'baseKm', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                    <Car className="h-3 w-3" /> Per Km Charge (₹)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={config.perKm}
                    onChange={(e) => updateConfig(vehicle, 'perKm', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                    <Moon className="h-3 w-3" /> Night Surcharge Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="1"
                    value={config.nightMult}
                    onChange={(e) => updateConfig(vehicle, 'nightMult', parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Applied 22:00–05:00. Base fare × multiplier.</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mt-2">
                  <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-2">Estimate Preview</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="text-slate-400">5 km</p>
                      <p className="font-bold text-slate-900">₹{Math.round(config.baseFare + Math.max(0, 5 - config.baseKm) * config.perKm)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">10 km</p>
                      <p className="font-bold text-slate-900">₹{Math.round(config.baseFare + Math.max(0, 10 - config.baseKm) * config.perKm)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">15 km</p>
                      <p className="font-bold text-slate-900">₹{Math.round(config.baseFare + Math.max(0, 15 - config.baseKm) * config.perKm)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
