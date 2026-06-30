import { prisma } from '@namma/db';
import { getNearbyDrivers, lockRideForDriver } from './redis.service';

interface MatchingResult {
  success: boolean;
  driverId?: string;
  reason?: string;
}

/**
 * Executes matching loop for a newly requested ride.
 * Dispatches offer sequentially to nearest drivers, expanding search if needed.
 */
export async function runMatchingPipeline(rideId: string): Promise<MatchingResult> {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId }
  });

  if (!ride || ride.status !== 'requested') {
    return { success: false, reason: 'Ride not found or already processed' };
  }

  const coords = await prisma.$queryRaw<Array<{ pickup_lat: number; pickup_lng: number }>>`
    SELECT 
      ST_Y(pickup_location::geometry) as pickup_lat,
      ST_X(pickup_location::geometry) as pickup_lng
    FROM rides
    WHERE id = ${rideId}::uuid
    LIMIT 1
  `;

  if (!coords || coords.length === 0) {
    return { success: false, reason: 'Ride coordinates not found' };
  }

  const pickupLat = coords[0].pickup_lat;
  const pickupLng = coords[0].pickup_lng;

  console.log(`Starting matching pipeline for Ride ${rideId} at coords (${pickupLat}, ${pickupLng})`);

  // Phase 1: Try close matching within 3km radius
  let nearby = await getNearbyDrivers(pickupLat, pickupLng, 3);
  
  // Filter only online, non-busy, and subscription-active drivers in PostgreSQL
  let candidates = await filterAvailableDrivers(nearby.map(n => n.driverId), ride.id);

  console.log(`Found ${candidates.length} nearby candidate drivers in 3km`);

  for (const driverId of candidates) {
    // Check if ride is cancelled during the loop
    const currentRide = await prisma.ride.findUnique({
      where: { id: rideId },
      select: { status: true }
    });
    if (!currentRide || currentRide.status !== 'requested') {
      return { success: false, reason: 'Ride was cancelled or accepted during search' };
    }

    // Try lock driver for this ride
    const acquiredLock = await lockRideForDriver(rideId, driverId, 15);
    if (!acquiredLock) {
      continue; // Skip if already offered or busy
    }

    console.log(`Offering ride ${rideId} to Driver ${driverId} for 15 seconds...`);
    
    // In a real application, here we push message to Driver app via FCM or WS
    // For this implementation, we will simulate the delay of waiting for the driver's response.
    // The driver can call `POST /api/driver/rides/accept` to accept.
    // We wait up to 15 seconds to see if the driver accepts the ride.
    const accepted = await waitForDriverResponse(rideId, driverId, 15000);
    if (accepted) {
      console.log(`Ride ${rideId} successfully accepted by Driver ${driverId}`);
      return { success: true, driverId };
    }

    console.log(`Driver ${driverId} timed out or rejected Ride ${rideId}`);
  }

  // Phase 2: Expand to 5km radius and broadcast (Broadcast Mode fallback)
  console.log(`No local drivers accepted. Initiating Broadcast Mode at 5km for Ride ${rideId}`);
  let farDrivers = await getNearbyDrivers(pickupLat, pickupLng, 5);
  let broadcastCandidates = await filterAvailableDrivers(farDrivers.map(n => n.driverId), ride.id);

  if (broadcastCandidates.length === 0) {
    await prisma.ride.update({
      where: { id: rideId },
      data: { status: 'cancelled' } // Mark as failed/cancelled if no driver available
    });
    return { success: false, reason: 'No drivers available in region' };
  }

  // Notify all broadcast candidates (in real app: push broadcast event)
  console.log(`Broadcasting ride ${rideId} to:`, broadcastCandidates);

  // We wait for the first driver to issue an accept command
  const acceptedInBroadcast = await waitForBroadcastResponse(rideId, 30000);
  if (acceptedInBroadcast) {
    const updatedRide = await prisma.ride.findUnique({
      where: { id: rideId },
      select: { driverId: true }
    });
    return { success: true, driverId: updatedRide?.driverId ?? undefined };
  }

  // No acceptance in broadcast mode
  await prisma.ride.update({
    where: { id: rideId },
    data: { status: 'cancelled' }
  });

  return { success: false, reason: 'Ride offer expired without acceptances' };
}

/**
 * Filter driver IDs against Postgres status verification
 */
async function filterAvailableDrivers(driverIds: string[], rideId: string): Promise<string[]> {
  if (driverIds.length === 0) return [];

  const eligibleDrivers = await prisma.driver.findMany({
    where: {
      id: { in: driverIds },
      dutyStatus: 'online',
      isKycVerified: true,
      subscriptionExpiresAt: { gt: new Date() }
    },
    select: { id: true }
  });

  return eligibleDrivers.map(d => d.id);
}

/**
 * Helper checking DB status changes to simulate asynchronous driver responses (polling table for accept)
 */
async function waitForDriverResponse(rideId: string, driverId: string, timeoutMs: number): Promise<boolean> {
  const intervalMs = 1000;
  let elapsed = 0;

  while (elapsed < timeoutMs) {
    const check = await prisma.ride.findUnique({
      where: { id: rideId },
      select: { status: true, driverId: true }
    });

    if (check?.status === 'accepted' && check.driverId === driverId) {
      return true;
    }
    if (check?.status === 'cancelled') {
      return false;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
    elapsed += intervalMs;
  }
  return false;
}

/**
 * Helper checking DB status changes in broadcast mode
 */
async function waitForBroadcastResponse(rideId: string, timeoutMs: number): Promise<boolean> {
  const intervalMs = 1000;
  let elapsed = 0;

  while (elapsed < timeoutMs) {
    const check = await prisma.ride.findUnique({
      where: { id: rideId },
      select: { status: true, driverId: true }
    });

    if (check?.status === 'accepted' && check.driverId) {
      return true;
    }
    if (check?.status === 'cancelled') {
      return false;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
    elapsed += intervalMs;
  }
  return false;
}
