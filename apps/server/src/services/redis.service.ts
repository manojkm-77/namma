import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Track Redis connection status
export let isRedisConnected = false;

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 1, // Fail fast to activate the in-memory fallback immediately
  retryStrategy() {
    return null; // Do not retry indefinitely to prevent crashing loops
  }
});

redis.on('connect', () => {
  isRedisConnected = true;
  console.log('Successfully connected to Redis');
});

redis.on('error', (err) => {
  isRedisConnected = false;
  console.warn('[Redis]: Local server is offline. Gracefully falling back to in-memory spatial cache.');
});

// ─── In-Memory Cache Fallbacks ────────────────────────────────────────────────

const memoryDriverLocations = new Map<string, { lat: number; lng: number; lastPing: number }>();
const memoryLocks = new Map<string, number>();

/**
 * Update driver location in Redis spatial index or In-Memory fallback
 */
export async function updateDriverLocation(driverId: string, lat: number, lng: number): Promise<void> {
  if (isRedisConnected) {
    try {
      await redis.geoadd('drivers:active', lng, lat, driverId);
      return;
    } catch (error) {
      console.error(`Failed to update location in Redis for driver ${driverId}:`, error);
    }
  }

  // In-memory fallback
  memoryDriverLocations.set(driverId, { lat, lng, lastPing: Date.now() });
}

/**
 * Remove driver from active spatial index or In-Memory fallback
 */
export async function removeDriverLocation(driverId: string): Promise<void> {
  if (isRedisConnected) {
    try {
      await redis.zrem('drivers:active', driverId);
      return;
    } catch (error) {
      console.error(`Failed to remove location from Redis for driver ${driverId}:`, error);
    }
  }

  // In-memory fallback
  memoryDriverLocations.delete(driverId);
}

/**
 * Retrieve active drivers within radius (In-Memory fallback implements Haversine formula)
 */
export async function getNearbyDrivers(
  lat: number,
  lng: number,
  radiusKm: number = 3
): Promise<Array<{ driverId: string; distance: number }>> {
  if (isRedisConnected) {
    try {
      const results = (await redis.georadius(
        'drivers:active',
        lng,
        lat,
        radiusKm,
        'km',
        'WITHDIST',
        'ASC'
      )) as Array<[string, string]>;

      if (results && Array.isArray(results)) {
        return results.map(([driverId, distStr]) => ({
          driverId,
          distance: parseFloat(distStr)
        }));
      }
    } catch (error) {
      console.error('Failed to query nearby drivers in Redis:', error);
    }
  }

  // In-memory Haversine fallback calculation
  const results: Array<{ driverId: string; distance: number }> = [];
  const R = 6371; // Earth radius in km

  for (const [driverId, loc] of memoryDriverLocations.entries()) {
    // Clear out stale driver location records (older than 2 minutes)
    if (Date.now() - loc.lastPing > 120000) {
      memoryDriverLocations.delete(driverId);
      continue;
    }

    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(loc.lat - lat);
    const dLng = toRad(loc.lng - lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat)) * Math.cos(toRad(loc.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    if (dist <= radiusKm) {
      results.push({ driverId, distance: dist });
    }
  }

  return results.sort((a, b) => a.distance - b.distance);
}

/**
 * Set a short term lease lock on a ride for a driver
 */
export async function lockRideForDriver(rideId: string, driverId: string, expirySeconds: number = 15): Promise<boolean> {
  if (isRedisConnected) {
    const lockKey = `lock:ride:${rideId}:driver:${driverId}`;
    try {
      const acquired = await redis.set(lockKey, 'locked', 'EX', expirySeconds, 'NX');
      return acquired === 'OK';
    } catch (error) {
      console.error('Failed to set lock in Redis:', error);
    }
  }

  // In-memory lease lock fallback
  const lockKey = `lock:ride:${rideId}:driver:${driverId}`;
  const now = Date.now();
  const existingExpiry = memoryLocks.get(lockKey);

  if (existingExpiry && existingExpiry > now) {
    return false; // Lock is already active
  }

  memoryLocks.set(lockKey, now + (expirySeconds * 1000));
  return true;
}
