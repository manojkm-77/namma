import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/sidebar';

export const metadata: Metadata = {
  title: 'Namma Ride Admin Console',
  description: 'Regional monitoring & operations dashboard for Namma Ride',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-surface">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-8 overflow-y-auto max-w-[1600px]">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
