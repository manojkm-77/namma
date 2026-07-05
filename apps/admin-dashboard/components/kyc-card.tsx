'use client';

import { ShieldCheck, XCircle, FileText, Clock, User, Truck } from 'lucide-react';
import { Skeleton } from './skeleton';
import type { SeedKycApplication } from '@/lib/seed-data';

interface KycCardProps {
  application: SeedKycApplication;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  loading?: boolean;
}

export function KycCard({ application, onApprove, onReject, loading }: KycCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-56" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-primary/30 transition-all shadow-sm hover:shadow-md">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <User className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">{application.fullName}</h4>
            <p className="text-xs text-slate-400">{application.phoneNumber}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Truck className="h-3.5 w-3.5" />
            Vehicle
          </div>
          <p className="font-semibold text-sm text-slate-800">
            {application.vehicleType.toUpperCase()} — {application.licensePlate}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{application.modelName}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <FileText className="h-3.5 w-3.5" />
            Documents
          </div>
          <p className="font-semibold text-xs text-slate-800">Aadhar: {application.aadharNumber}</p>
          <p className="font-semibold text-xs text-slate-800 mt-0.5">License: {application.licenseNumber}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{application.city} · {new Date(application.submittedAt).toLocaleDateString()}</span>
        <div className="flex gap-2">
          <button
            onClick={() => onReject(application.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </button>
          <button
            onClick={() => onApprove(application.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:brightness-110 transition shadow-sm"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Approve & Verify
          </button>
        </div>
      </div>
    </div>
  );
}
