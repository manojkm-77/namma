'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass, LayoutDashboard, ShieldCheck, Settings,
  Car, LifeBuoy, ChevronRight, Users
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Drivers', href: '/drivers', icon: Users },
  { label: 'KYC Review', href: '/kyc', icon: ShieldCheck },
  { label: 'Pricing', href: '/pricing', icon: Settings },
  { label: 'Rides', href: '/rides', icon: Car },
  { label: 'Support', href: '/support', icon: LifeBuoy },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-secondary text-secondary-foreground flex flex-col shrink-0">
      <div className="p-6 border-b border-slate-700/50">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Compass className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tighter text-white block leading-none">Namma</span>
            <span className="font-black text-lg tracking-tighter text-primary block leading-none">Ride</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50">
          <div className="h-2 w-2 rounded-full bg-accent animate-ping-slow" />
          <div className="text-xs text-slate-400">
            <p className="font-semibold text-slate-300">Ops Console</p>
            <p>v1.3 · Systems Nominal</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
