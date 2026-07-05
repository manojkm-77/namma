/**
 * Physics-based routing engine for adjusting vehicle velocity and ETA.
 * It simulates power requirements (gravity, rolling resistance, air drag)
 * and adjusts speeds based on road surfaces (Asphalt, Gravel, Dirt) and terrain slope.
 */

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
  elevation?: number; // in meters
}

export interface SegmentTelemetry {
  distanceMeters: number;
  elevationDeltaMeters: number;
  slopePct: number;
  baseSpeedKmh: number;
  adjustedSpeedKmh: number;
  transitTimeSeconds: number;
}

export interface RouteAdjustmentResult {
  totalDistanceMeters: number;
  totalElevationGainMeters: number;
  totalElevationLossMeters: number;
  originalDurationSeconds: number;
  adjustedDurationSeconds: number;
  segments: SegmentTelemetry[];
}

// Haversine formula to compute distance between two coordinates in meters
export function getHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

/**
 * Calculates the adjusted velocity and ETA for a route based on terrain elevation profiles and road surface types.
 *
 * Physics constants used:
 * - Vehicle + Rider Mass (m): 150 kg
 * - Drivetrain Efficiency (eta): 0.85
 * - Max Motor Power (P_max): 1800 Watts
 * - Air Drag Coefficient * Frontal Area (Cd * A): 0.45 m^2
 * - Air Density (rho): 1.2 kg/m^3
 * - Gravity (g): 9.80665 m/s^2
 */
export function calculateAdjustedRoute(
  coordinates: RouteCoordinate[],
  surfaceCondition: 'asphalt' | 'gravel' | 'dirt' = 'asphalt',
  baseSpeedKmh: number = 40
): RouteAdjustmentResult {
  if (coordinates.length < 2) {
    return {
      totalDistanceMeters: 0,
      totalElevationGainMeters: 0,
      totalElevationLossMeters: 0,
      originalDurationSeconds: 0,
      adjustedDurationSeconds: 0,
      segments: [],
    };
  }

  // Physics constants for a standard logistics electric vehicle (scooter/light cargo bike)
  const massKg = 150;
  const g = 9.80665;
  const rho = 1.2;
  const cdA = 0.45;
  const motorMaxPowerW = 1800;
  const efficiency = 0.85;

  // Rolling resistance coefficient based on surface condition
  const surfaceRollingResistance: Record<typeof surfaceCondition, number> = {
    asphalt: 0.015,
    gravel: 0.035,
    dirt: 0.06,
  };

  // Speed multiplier based on surface traction limits
  const surfaceSpeedMultiplier: Record<typeof surfaceCondition, number> = {
    asphalt: 1.0,
    gravel: 0.8,
    dirt: 0.6,
  };

  const rollingCoeff = surfaceRollingResistance[surfaceCondition];
  const surfaceMult = surfaceSpeedMultiplier[surfaceCondition];

  let totalDistanceMeters = 0;
  let totalElevationGainMeters = 0;
  let totalElevationLossMeters = 0;
  let originalDurationSeconds = 0;
  let adjustedDurationSeconds = 0;
  const segments: SegmentTelemetry[] = [];

  for (let i = 0; i < coordinates.length - 1; i++) {
    const start = coordinates[i];
    const end = coordinates[i + 1];

    const dist = getHaversineDistance(
      start.latitude,
      start.longitude,
      end.latitude,
      end.longitude
    );

    // Skip segments that are extremely small to avoid noise/numerical issues
    if (dist < 0.5) continue;

    const h1 = start.elevation ?? 0;
    const h2 = end.elevation ?? 0;
    const elevDelta = h2 - h1;

    if (elevDelta > 0) {
      totalElevationGainMeters += elevDelta;
    } else {
      totalElevationLossMeters += Math.abs(elevDelta);
    }

    const slopePct = dist > 0 ? (elevDelta / dist) * 100 : 0;
    const slopeAngleRad = Math.atan(elevDelta / dist);

    // Calculate maximum possible speed on this slope due to motor power constraint
    // We solve the power balance equation: P_max * efficiency = (F_gravity + F_rolling + F_drag) * v
    // F_gravity = m * g * sin(slopeAngle)
    // F_rolling = m * g * C_r * cos(slopeAngle)
    // F_drag = 0.5 * rho * CdA * v^2
    const fGravity = massKg * g * Math.sin(slopeAngleRad);
    const fRolling = massKg * g * rollingCoeff * Math.cos(slopeAngleRad);
    const fStatic = fGravity + fRolling;

    // Base speed on flat asphalt in m/s
    const baseSpeedMs = (baseSpeedKmh / 3.6) * surfaceMult;

    // Solve for v in cubic equation: 0.5 * rho * CdA * v^3 + fStatic * v - P_available = 0
    const pAvailableW = motorMaxPowerW * efficiency;
    
    // We use a numerical search (Newton-Raphson or binary search) to solve for v
    let vSolvedMs = baseSpeedMs;

    if (fStatic > 0) {
      // For inclines, solve power limit
      let low = 0.5; // absolute minimum speed
      let high = baseSpeedMs;
      for (let step = 0; step < 10; step++) {
        const mid = (low + high) / 2;
        const powerRequired = (fStatic + 0.5 * rho * cdA * mid * mid) * mid;
        if (powerRequired > pAvailableW) {
          high = mid;
        } else {
          low = mid;
        }
      }
      vSolvedMs = low;
    } else {
      // For declines, gravity helps! But we cap the speed for safety
      const downhillLimitKmh = baseSpeedKmh + Math.min(15, Math.abs(slopePct) * 1.5);
      vSolvedMs = Math.min(downhillLimitKmh / 3.6, baseSpeedMs * 1.15);
    }

    // Road conditions limits
    const adjustedSpeedKmh = Math.max(5, Math.min(baseSpeedKmh + 20, vSolvedMs * 3.6));
    const transitTime = dist / (adjustedSpeedKmh / 3.6);

    totalDistanceMeters += dist;
    originalDurationSeconds += dist / (baseSpeedKmh / 3.6);
    adjustedDurationSeconds += transitTime;

    segments.push({
      distanceMeters: dist,
      elevationDeltaMeters: elevDelta,
      slopePct,
      baseSpeedKmh,
      adjustedSpeedKmh,
      transitTimeSeconds: transitTime,
    });
  }

  return {
    totalDistanceMeters,
    totalElevationGainMeters,
    totalElevationLossMeters,
    originalDurationSeconds,
    adjustedDurationSeconds,
    segments,
  };
}

/**
 * Simulates a realistic 3D routing profile around Mysuru (Chamundi Hills climbing route)
 * which provides elevation data (ideal for testing 3D terrain and dynamic ETA scaling).
 */
export function generateMockElevationRoute(): RouteCoordinate[] {
  const centerLat = 12.275;
  const centerLng = 76.668;
  const points: RouteCoordinate[] = [];

  // Generate 40 points climbing up and around Chamundi Hill
  // Elevation ranges from 740m (Mysore flat) up to 1000m (hill top)
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const angle = t * Math.PI * 2.5; // spiral climbing route
    const radius = 0.015 * (1 - t * 0.4); // spiral inward

    const lat = centerLat + Math.sin(angle) * radius;
    const lng = centerLng + Math.cos(angle) * radius;

    // Sigmoidal elevation profile climbing Chamundi Hill (740m -> 980m -> 760m)
    let elev = 740;
    if (t < 0.6) {
      // Climb phase
      const climbT = t / 0.6;
      elev = 740 + (980 - 740) * (3 * climbT * climbT - 2 * climbT * climbT * climbT);
    } else {
      // Descent phase
      const descentT = (t - 0.6) / 0.4;
      elev = 980 - (980 - 750) * (3 * descentT * descentT - 2 * descentT * descentT * descentT);
    }

    points.push({
      latitude: lat,
      longitude: lng,
      elevation: elev,
    });
  }

  return points;
}
