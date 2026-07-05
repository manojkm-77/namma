import { useState, useEffect } from 'react';
import { MarkerSpec, DEFAULT_MAP_CENTER } from '../types';

export function useLiveDrivers(cityId?: string): MarkerSpec[] {
  const [drivers, setDrivers] = useState<MarkerSpec[]>([]);

  useEffect(() => {
    // Baseline seed data matching MarkerSpec to prevent UI breaking
    // This will be replaced by the Supabase Realtime PostGIS stream in the next phase
    const mockNearbyDrivers: MarkerSpec[] = [
      {
        id: 'mock-driver-1',
        kind: 'vehicle',
        label: 'KA-09-E-1234',
        coord: {
          latitude: DEFAULT_MAP_CENTER.latitude + 0.002,
          longitude: DEFAULT_MAP_CENTER.longitude + 0.002,
        },
        heading: 45,
      },
      {
        id: 'mock-driver-2',
        kind: 'vehicle',
        label: 'KA-09-F-5678',
        coord: {
          latitude: DEFAULT_MAP_CENTER.latitude - 0.003,
          longitude: DEFAULT_MAP_CENTER.longitude - 0.001,
        },
        heading: 180,
      },
    ];

    setDrivers(mockNearbyDrivers);
  }, [cityId]);

  return drivers;
}
