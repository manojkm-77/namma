// =============================================================================
// Spatial helpers — all PostGIS reads/writes funnel through here.
// Prisma cannot read `Unsupported("geography")` columns directly, so we use
// `$queryRaw` / `$executeRaw` (the only sanctioned raw SQL in the codebase,
// located here in the db package, not in app code).
// =============================================================================
import { prisma } from './index';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface NearbyDriver {
  id: string;
  distance_m: number;
  current_lat: number | null;
  current_lng: number | null;
}

/**
 * Create a WKT point literal, e.g. SRID=4326;POINT(76.6394 12.2958).
 * PostGIS expects (longitude, latitude) ordering.
 */
export function pointWkt({ latitude, longitude }: LatLng): string {
  return `SRID=4326;POINT(${longitude} ${latitude})`;
}

/**
 * Haversine distance in km between two coordinates (used for fare estimates
 * before any DB round-trip, and for client-side checks).
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371; // km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Find online, KYC-verified drivers whose location_geog is within `radiusM`
 * of the pickup, ordered nearest first. Uses the GIST index on drivers.
 */
export async function findNearbyDrivers(pickup: LatLng, radiusM = 3000): Promise<NearbyDriver[]> {
  const wkt = pointWkt(pickup);
  const rows = await prisma.$queryRaw<NearbyDriver[]>`
    SELECT
      d.id,
      ST_Distance(d.location_geog, ${wkt}::geography) AS distance_m,
      d.current_lat,
      d.current_lng
    FROM drivers d
    WHERE d.duty_status = 'online'
      AND d.is_kyc_verified = TRUE
      AND d.subscription_expires_at > NOW()
      AND ST_DWithin(d.location_geog, ${wkt}::geography, ${radiusM}::double precision)
    ORDER BY distance_m ASC
    LIMIT 50;
  `;
  return rows;
}

/**
 * Insert a ride with geography columns (Prisma can't touch pickup_location /
 * drop_location directly because they are Unsupported types).
 */
export async function createRideWithGeog(input: {
  riderId: string;
  pickupAddress: string;
  pickupLandmark?: string | null;
  pickup: LatLng;
  dropAddress: string;
  drop: LatLng;
  fareAmount: number;
  distanceKm: number;
  estimatedDurationMins: number;
  otpCode: string;
  paymentMethod: string;
}): Promise<{ id: string }> {
  const pickupWkt = pointWkt(input.pickup);
  const dropWkt = pointWkt(input.drop);
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO rides (
      rider_id, status, pickup_address, pickup_landmark, pickup_location,
      drop_address, drop_location, fare_amount, distance_km,
      estimated_duration_mins, otp_code, payment_method, payment_status
    ) VALUES (
      ${input.riderId}::uuid, 'requested', ${input.pickupAddress}, ${input.pickupLandmark ?? null},
      ${pickupWkt}::geography, ${input.dropAddress}, ${dropWkt}::geography,
      ${input.fareAmount}::numeric, ${input.distanceKm}::numeric,
      ${input.estimatedDurationMins}::int, ${input.otpCode}, ${input.paymentMethod}, 'pending'
    )
    RETURNING id;
  `;
  return rows[0];
}

/**
 * Append a coordinate to a ride's breadcrumb trail.
 */
export async function appendRideLocation(rideId: string, coord: LatLng): Promise<void> {
  const wkt = pointWkt(coord);
  await prisma.$executeRaw`
    INSERT INTO ride_locations (ride_id, coordinate)
    VALUES (${rideId}::uuid, ${wkt}::geography);
  `;
}

/**
 * Resolve the active surge multiplier for a coordinate by intersecting it
 * against active surge zone polygons. Returns 1.00 when no zone matches.
 */
export async function resolveSurgeMultiplier(coord: LatLng): Promise<number> {
  const wkt = pointWkt(coord);
  const rows = await prisma.$queryRaw<{ multiplier: number }[]>`
    SELECT COALESCE(MAX(s.multiplier), 1.00)::float AS multiplier
    FROM surge_zones s
    WHERE s.is_active = TRUE
      AND ST_Contains(s.boundary, ${wkt}::geometry);
  `;
  return rows[0]?.multiplier ?? 1.0;
}

/**
 * Distance in metres between the last recorded ride coordinate and a probe
 * point — used by the route-deviation safety check.
 */
export async function deviationFromPlannedRouteM(
  rideId: string,
  probe: LatLng
): Promise<number | null> {
  const wkt = pointWkt(probe);
  const rows = await prisma.$queryRaw<{ deviation_m: number | null }[]>`
    WITH last AS (
      SELECT coordinate
      FROM ride_locations
      WHERE ride_id = ${rideId}::uuid
      ORDER BY recorded_at DESC
      LIMIT 1
    )
    SELECT ST_Distance(last.coordinate, ${wkt}::geography) AS deviation_m
    FROM last;
  `;
  return rows[0]?.deviation_m ?? null;
}
