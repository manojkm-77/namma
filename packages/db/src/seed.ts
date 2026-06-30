// =============================================================================
// Seed data — idempotent. Safe to run on every deploy.
// Seeds surge zone polygons (approximated as small bbox around city centers),
// and stores canonical city pricing/landmarks for offline autocomplete.
// =============================================================================
import { prisma } from './index';

export const CITIES = [
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
] as const;

export type CityConfig = (typeof CITIES)[number];

/**
 * Approximate a city coverage zone as a polygon (±0.25° box, ~55km wide)
 * for surge-zone intersection. Real admin-configured zones override these.
 */
function cityBoundaryPolygon(centerLng: number, centerLat: number): string {
  const d = 0.25;
  const w = centerLng - d;
  const e = centerLng + d;
  const n = centerLat + d;
  const s = centerLat - d;
  // POLYGON rings must be closed: first == last vertex.
  return `POLYGON((${w} ${s}, ${e} ${s}, ${e} ${n}, ${w} ${n}, ${w} ${s}))`;
}

export async function seedDatabase(): Promise<void> {
  for (const city of CITIES) {
    // Upsert a coverage surge zone per city (multiplier 1.00 = no surge).
    const wkt = cityBoundaryPolygon(city.centerLng, city.centerLat);
    await prisma.$executeRaw`
      INSERT INTO surge_zones (id, city_name, zone_name, boundary, multiplier, is_active)
      VALUES (
        gen_random_uuid(),
        ${city.city},
        ${`${city.city} coverage`},
        ST_GeomFromText(${wkt}, 4326),
        1.00,
        TRUE
      )
      ON CONFLICT DO NOTHING;
    `;
  }

  // Canonical admin user (bootstrap account, can be disabled post-setup).
  await prisma.user.upsert({
    where: { phoneNumber: '+919000000000' },
    update: {},
    create: {
      phoneNumber: '+919000000000',
      fullName: 'Namma Admin',
      role: 'admin',
      preferredLanguage: 'en',
    },
  });
}

/**
 * Run via `pnpm --filter @namma/db seed`.
 */
async function main(): Promise<void> {
  await seedDatabase();
  console.log('[seed] OK — cities, surge zones, admin user seeded.');
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error('[seed] FAILED:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
