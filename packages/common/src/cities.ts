// =============================================================================
// Canonical city + pricing config shared by server (fare calc), mobile apps
// (offline landmark autocomplete), and admin dashboard (config forms).
// Mirrors the CITIES seed array in @namma/db but lives in common so the mobile
// apps don't pull the Prisma client into their bundle.
// =============================================================================

import type { VehicleType } from './schemas-enums';
export type VehicleClass = 'auto' | 'cab';

export interface CityPricingTier {
  baseFare: number;
  baseKm: number;
  perKm: number;
  nightMult: number;
}

export interface CityLandmark {
  name: string;
  lat: number;
  lng: number;
}

export interface CityConfig {
  city: string;
  centerLat: number;
  centerLng: number;
  pricing: Record<VehicleClass, CityPricingTier>;
  landmarks: CityLandmark[];
}

export const CITIES: readonly CityConfig[] = [
  {
    city: 'Mysuru',
    centerLat: 12.2958,
    centerLng: 76.6394,
    pricing: {
      auto: { baseFare: 30, baseKm: 1.8, perKm: 15, nightMult: 1.5 },
      cab: { baseFare: 80, baseKm: 2.0, perKm: 18, nightMult: 1.25 },
    },
    landmarks: [
      { name: 'Mysore Palace', lat: 12.3051, lng: 76.6552 },
      { name: 'Mysuru Junction Railway', lat: 12.3162, lng: 76.6436 },
      { name: 'KSRTC Suburb Bus Stand', lat: 12.3103, lng: 76.6601 },
    ],
  },
  {
    city: 'Hubli-Dharwad',
    centerLat: 15.3647,
    centerLng: 75.124,
    pricing: {
      auto: { baseFare: 25, baseKm: 1.5, perKm: 14, nightMult: 1.5 },
      cab: { baseFare: 70, baseKm: 2.0, perKm: 17, nightMult: 1.25 },
    },
    landmarks: [
      { name: 'Hubli Railway Station', lat: 15.3526, lng: 75.1485 },
      { name: 'Dharwad New Bus Stand', lat: 15.4589, lng: 75.0078 },
    ],
  },
  {
    city: 'Mangaluru',
    centerLat: 12.9141,
    centerLng: 74.856,
    pricing: {
      auto: { baseFare: 35, baseKm: 1.5, perKm: 16, nightMult: 1.5 },
      cab: { baseFare: 90, baseKm: 2.0, perKm: 20, nightMult: 1.3 },
    },
    landmarks: [
      { name: 'Mangaluru Central Railway', lat: 12.8682, lng: 74.8437 },
      { name: 'KSRTC Bus Stand Bejai', lat: 12.8906, lng: 74.8400 },
      { name: 'Panambur Beach Entry', lat: 12.9482, lng: 74.8211 },
    ],
  },
];

export const ALL_LANDMARKS = CITIES.flatMap((c) =>
  c.landmarks.map((l) => ({ ...l, city: c.city }))
);

export const CITY_NAMES = CITIES.map((c) => c.city);

/** Map a granular vehicle_type to the pricing tier (auto vs cab). */
export function vehicleClassOf(vehicleType: VehicleType): VehicleClass {
  return vehicleType === 'auto' ? 'auto' : 'cab';
}

/** Night surcharge window: 22:00–05:00 local. */
export function isNightTime(date = new Date()): boolean {
  const h = date.getHours();
  return h >= 22 || h < 5;
}

/**
 * Fare calculator shared by server (ride-request) and rider app (estimate
 * preview). Returns rupees rounded to whole numbers as displayed to users.
 *
 *   fare = (baseFare + max(0, km − baseKm) × perKm) × nightMult × surgeMult
 */
export function calculateFare(params: {
  distanceKm: number;
  vehicleType: VehicleType;
  cityName: string;
  surgeMultiplier?: number;
  at?: Date;
}): { fare: number; breakdown: FareBreakdown } {
  const city = CITIES.find((c) => c.city === params.cityName);
  if (!city) {
    throw new Error(`Unknown city: ${params.cityName}`);
  }
  const tier = city.pricing[vehicleClassOf(params.vehicleType)];
  const night = isNightTime(params.at ?? new Date());
  const surge = params.surgeMultiplier ?? 1.0;

  const base = tier.baseFare;
  const extraKm = Math.max(0, params.distanceKm - tier.baseKm);
  const perKmCharge = extraKm * tier.perKm;
  const subtotal = base + perKmCharge;
  const nightSurcharge = night ? subtotal * (tier.nightMult - 1) : 0;
  const surgeSurcharge = subtotal * (surge - 1);

  const total = subtotal + nightSurcharge + surgeSurcharge;
  const fare = Math.round(total);

  return {
    fare,
    breakdown: {
      baseFare: base,
      perKmCharge: Math.round(perKmCharge),
      distanceKm: params.distanceKm,
      nightSurcharge: Math.round(nightSurcharge),
      surgeSurcharge: Math.round(surgeSurcharge),
      surgeMultiplier: surge,
      total: fare,
    },
  };
}

export interface FareBreakdown {
  baseFare: number;
  perKmCharge: number;
  distanceKm: number;
  nightSurcharge: number;
  surgeSurcharge: number;
  surgeMultiplier: number;
  total: number;
}

// ----------------------------------------------------------------- Design tokens
export const DESIGN_TOKENS = {
  primary: 'hsl(38, 92%, 50%)',
  secondary: 'hsl(222, 47%, 11%)',
  accent: 'hsl(142, 70%, 29%)',
  background: 'hsl(0, 0%, 98%)',
  radius: '12px',
} as const;

// ----------------------------------------------------------------- Platform-fee rules
export const PLATFORM_FEE = {
  perRideFlat: 5, // ₹5 deducted from driver wallet per cash/UPI ride
  dailySubscription: 10, // ₹10/day
  negativeThreshold: -100, // auto-offline when balance < −₹100
} as const;

// ----------------------------------------------------------------- Match pipeline constants
export const MATCH_PIPELINE = {
  initialRadiusM: 3000,
  fallbackRadiusM: 5000,
  offerTtlSec: 15,
  sequentialBatch: 1, // offer one driver at a time
  maxOffers: 50,
} as const;

// ----------------------------------------------------------------- Geo helpers (duplicated client-side so mobile can show ETA without server)
export function haversineKm(
  aLat: number, aLng: number,
  bLat: number, bLng: number
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
