import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentLocation } from '../services/location-service';
import type { Location } from '../types';

interface UseLocationResult {
  location: Location | null;
  error: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loc = await getCurrentLocation();
      if (mountedRef.current) {
        setLocation(loc);
        if (!loc) setError('Could not get location');
      }
    } catch {
      if (mountedRef.current) setError('Location permission denied');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => { mountedRef.current = false; };
  }, [refresh]);

  return { location, error, isLoading, refresh };
}
