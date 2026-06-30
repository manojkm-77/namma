"use client";

import React, { useState } from 'react';
import { 
  Activity, 
  Users, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  Settings, 
  AlertTriangle,
  TrendingUp,
  Map,
  Compass
} from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'kyc' | 'pricing'>('overview');
  
  // Dummy local state to represent loaded data
  const [pricing, setPricing] = useState({
    city: 'Mysuru',
    baseFare: 30,
    perKm: 15,
    nightSurge: 1.5,
    rainSurge: 1.25
  });

  const [kycQueue, setKycQueue] = useState([
    {
      id: 'kyc-1',
      name: 'Anil Kumar',
      vehicle: 'Auto (KA-09-A-4432)',
      aadhar: '5432-1098-7654',
      license: 'DL-KA0920230009',
      status: 'pending'
    },
    {
      id: 'kyc-2',
      name: 'Manjunatha S',
      vehicle: 'Sedan (KA-03-MB-9081)',
      aadhar: '8901-2345-6789',
      license: 'DL-KA0320210087',
      status: 'pending'
    }
  ]);

  const [activeRides, setActiveRides] = useState([
    { id: 'r-1', rider: 'Savitha', driver: 'Anand P', from: 'KSRTC Bus Stand', to: 'Mysore Palace', status: 'picked_up', fare: 75 },
    { id: 'r-2', rider: 'Darshan', driver: 'Lokesh K', from: 'Junction Railway Station', to: 'Chamundi Hill', status: 'accepted', fare: 210 }
  ]);

  const handleApproveKyc = (id: string) => {
    setKycQueue(prev => prev.filter(item => item.id !== id));
    alert('Driver KYC approved successfully!');
  };

  return (
    <div className="flex min-h-screen text-slate-800">
      {/* Sidebar navigation panel */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col p-6 space-y-8">
        <div className="flex items-center space-x-3">
          <Compass className="h-8 w-8 text-amber-500 animate-spin-slow" />
          <span className="font-bold text-xl tracking-tight text-white">Namma Ride</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-3 w-full p-3 rounded-lg text-left transition ${
              activeTab === 'overview' ? 'bg-amber-500 text-slate-900 font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Activity className="h-5 w-5" />
            <span>Live Activity Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('kyc')}
            className={`flex items-center space-x-3 w-full p-3 rounded-lg text-left transition ${
              activeTab === 'kyc' ? 'bg-amber-500 text-slate-900 font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <ShieldCheck className="h-5 w-5" />
            <span>Driver KYC Queue</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center space-x-3 w-full p-3 rounded-lg text-left transition ${
              activeTab === 'pricing' ? 'bg-amber-500 text-slate-900 font-semibold' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>Pricing & Surge Config</span>
          </button>
        </nav>

        <div className="border-t border-slate-800 pt-4 text-xs text-slate-400">
          <span>Operations Console v1.2</span>
        </div>
      </aside>

      {/* Main content body */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {activeTab === 'overview' && 'Live Operations'}
              {activeTab === 'kyc' && 'KYC Review Center'}
              {activeTab === 'pricing' && 'Dynamic Pricing Configuration'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">Active Region: Mysuru, Karnataka</p>
          </div>
          <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg border shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-semibold text-slate-600">SYSTEMS ACTIVE</span>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick stats banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Active Ride Requests</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 mt-1">24</h3>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                  <Activity className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Drivers Online</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 mt-1">118</h3>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Low Wallet Alerts</p>
                  <h3 className="text-3xl font-extrabold text-red-600 mt-1">5</h3>
                </div>
                <div className="p-3 bg-red-50 rounded-xl text-red-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Surge Multiplier</p>
                  <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">1.25x</h3>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Split layout map & lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Regional Live View</h3>
                  <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-500">Auto-refresh: 5s</span>
                </div>
                {/* Visual simulated map */}
                <div className="h-96 w-full rounded-xl bg-slate-100 border relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-70"></div>
                  
                  {/* Mock Palace Landmark Pin */}
                  <div className="absolute top-1/4 left-1/3 flex flex-col items-center">
                    <MapPin className="h-6 w-6 text-red-600 drop-shadow" />
                    <span className="bg-white px-2 py-0.5 rounded shadow text-[10px] font-bold mt-1">Palace Landmark</span>
                  </div>

                  {/* Mock Railway Station Landmark Pin */}
                  <div className="absolute bottom-1/3 right-1/4 flex flex-col items-center">
                    <MapPin className="h-6 w-6 text-red-600 drop-shadow" />
                    <span className="bg-white px-2 py-0.5 rounded shadow text-[10px] font-bold mt-1">Railway Station</span>
                  </div>

                  {/* Drivers pins */}
                  <div className="absolute top-1/2 left-1/2 animate-bounce flex flex-col items-center">
                    <Compass className="h-5 w-5 text-amber-600 drop-shadow" />
                    <span className="bg-amber-100 px-1 py-0.5 rounded text-[8px] font-bold mt-0.5">Auto #889</span>
                  </div>

                  <span className="text-slate-400 text-xs z-10 font-medium">GPS Tracking Overlay Map Grid</span>
                </div>
              </div>

              {/* Ride details panel */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Active Rides Monitor</h3>
                <div className="space-y-4 flex-1">
                  {activeRides.map(ride => (
                    <div key={ride.id} className="border p-4 rounded-xl space-y-2 hover:border-amber-300 transition">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-800">Ride #{ride.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          ride.status === 'picked_up' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ride.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 space-y-1">
                        <p><strong>Passenger:</strong> {ride.rider}</p>
                        <p><strong>Driver:</strong> {ride.driver}</p>
                        <p><strong>Route:</strong> {ride.from} → {ride.to}</p>
                      </div>
                      <div className="border-t pt-2 flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium">Direct Settlement</span>
                        <span className="font-extrabold text-slate-900">Rs {ride.fare}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Pending Review Applications</h3>
                <p className="text-slate-400 text-xs mt-1">Cross-check document matches before approval verification triggers.</p>
              </div>
              <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-semibold text-slate-600">
                {kycQueue.length} Apps Waiting
              </span>
            </div>

            {kycQueue.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShieldCheck className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                <p>All driver applications have been processed!</p>
              </div>
            ) : (
              <div className="divide-y">
                {kycQueue.map(driver => (
                  <div key={driver.id} className="py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-base">{driver.name}</h4>
                      <p className="text-slate-500 text-sm">{driver.vehicle}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                        <span><strong>Aadhar:</strong> {driver.aadhar}</span>
                        <span><strong>License:</strong> {driver.license}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleApproveKyc(driver.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition"
                      >
                        Approve Document Matches
                      </button>
                      <button 
                        onClick={() => alert('Applicant application rejected.')}
                        className="bg-white border hover:bg-slate-50 text-slate-600 font-semibold text-xs px-4 py-2.5 rounded-lg transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 max-w-2xl space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-4">Fare Matrix Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">City Area</label>
                <select 
                  className="w-full border p-3 rounded-xl bg-slate-50 text-sm focus:ring-2 focus:ring-amber-500"
                  value={pricing.city}
                  onChange={(e) => setPricing(prev => ({ ...prev, city: e.target.value }))}
                >
                  <option value="Mysuru">Mysuru</option>
                  <option value="Hubli-Dharwad">Hubli-Dharwad</option>
                  <option value="Mangaluru">Mangaluru</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Base Fare (Rs)</label>
                  <input
                    type="number"
                    value={pricing.baseFare}
                    onChange={(e) => setPricing(prev => ({ ...prev, baseFare: parseInt(e.target.value) || 0 }))}
                    className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Distance Charge (Rs / Km)</label>
                  <input
                    type="number"
                    value={pricing.perKm}
                    onChange={(e) => setPricing(prev => ({ ...prev, perKm: parseInt(e.target.value) || 0 }))}
                    className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Night Surge Multiplier</label>
                  <input
                    type="number"
                    step="0.05"
                    value={pricing.nightSurge}
                    onChange={(e) => setPricing(prev => ({ ...prev, nightSurge: parseFloat(e.target.value) || 1 }))}
                    className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rain/Weather Multiplier</label>
                  <input
                    type="number"
                    step="0.05"
                    value={pricing.rainSurge}
                    onChange={(e) => setPricing(prev => ({ ...prev, rainSurge: parseFloat(e.target.value) || 1 }))}
                    className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => alert('Pricing updates saved successfully!')}
                  className="w-full bg-amber-500 text-slate-900 font-extrabold text-sm py-3 rounded-xl shadow-md hover:bg-amber-600 transition"
                >
                  Save Fare Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
