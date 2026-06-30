import { Context } from 'hono';
import { prisma, createRideWithGeog } from '@namma/db';
import { RequestRideSchema, AcceptRideSchema, VerifyRideOtpSchema, CompleteRideSchema } from '@namma/common';
import { runMatchingPipeline } from '../services/matching.service';
import { generateUpiDeepLink, processRideCommission } from '../services/payment.service';
import { getFareExplanation } from '../services/ai.service';
import { removeDriverLocation } from '../services/redis.service';

/**
 * Rider initiates a ride request
 */
export async function requestRide(c: Context) {
  try {
    const body = await c.req.json();
    const result = RequestRideSchema.safeParse(body);

    if (!result.success) {
      return c.json({ success: false, errors: result.error.errors }, 400);
    }

    const input = result.data;

    // Check if rider already has an active ride
    const existing = await prisma.ride.findFirst({
      where: {
        riderId: input.riderId,
        status: { in: ['requested', 'accepted', 'arrived', 'picked_up'] }
      }
    });

    if (existing) {
      return c.json({ success: false, message: 'You already have an active ride request.' }, 400);
    }

    // 1. Calculate fare using simple distance estimate (mock Maps Matrix API)
    const latDiff = Math.abs(input.pickupLocation.latitude - input.dropLocation.latitude);
    const lngDiff = Math.abs(input.pickupLocation.longitude - input.dropLocation.longitude);
    const distanceKm = Math.max((latDiff + lngDiff) * 111, 1); // rough approximation: 1 degree approx 111km
    const estimatedDuration = Math.round(distanceKm * 2.5); // approx 2.5 mins per km

    // Dynamic Pricing configuration (Mysuru auto default defaults)
    const baseFare = 30.00;
    const ratePerKm = 15.00;
    const distanceFare = distanceKm * ratePerKm;
    const surgeMultiplier = 1.0; // default multiplier
    const totalFare = (baseFare + distanceFare) * surgeMultiplier;

    // Generate random 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // 2. Create database record
    const ride = await createRideWithGeog({
      riderId: input.riderId,
      pickupAddress: input.pickupAddress,
      pickupLandmark: input.pickupLandmark,
      pickup: input.pickupLocation,
      dropAddress: input.dropAddress,
      drop: input.dropLocation,
      fareAmount: totalFare,
      distanceKm,
      estimatedDurationMins: estimatedDuration,
      otpCode: otp,
      paymentMethod: input.paymentMethod
    });

    // 3. Trigger matching pipeline asynchronously
    // Using simple execution wrapper so response is immediate to the rider UI
    runMatchingPipeline(ride.id)
      .then(res => {
        console.log(`Matching Pipeline completed for Ride ${ride.id}. Success: ${res.success}`);
      })
      .catch(err => {
        console.error(`Matching Pipeline error for Ride ${ride.id}:`, err);
      });

    return c.json({
      success: true,
      rideId: ride.id,
      fare: totalFare,
      distanceKm,
      otpCode: otp
    });
  } catch (error: any) {
    console.error('Request Ride Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

/**
 * Driver accepts the offered ride
 */
export async function acceptRide(c: Context) {
  try {
    const body = await c.req.json();
    const result = AcceptRideSchema.safeParse(body);

    if (!result.success) {
      return c.json({ success: false, errors: result.error.errors }, 400);
    }

    const { rideId, driverId } = result.data;

    // Check driver's status is online and driver exists
    const driverProfile = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true }
    });

    if (!driverProfile || driverProfile.dutyStatus !== 'online') {
      return c.json({ success: false, message: 'Driver is not available or offline' }, 400);
    }

    // Execute atomic ride status update from requested to accepted
    const success = await prisma.$transaction(async (tx) => {
      const activeRide = await tx.ride.findUnique({
        where: { id: rideId }
      });

      if (!activeRide || activeRide.status !== 'requested') {
        return false;
      }

      await tx.ride.update({
        where: { id: rideId },
        data: {
          driverId,
          status: 'accepted',
          acceptedAt: new Date()
        }
      });

      await tx.driver.update({
        where: { id: driverId },
        data: { dutyStatus: 'busy' }
      });

      return true;
    });

    if (!success) {
      return c.json({ success: false, message: 'Ride was already accepted or cancelled' }, 409);
    }

    // Remove from active location sets in Redis since driver is busy
    await removeDriverLocation(driverId);

    return c.json({ success: true, message: 'Ride accepted successfully' });
  } catch (error: any) {
    console.error('Accept Ride Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

/**
 * Driver verifies OTP and starts the ride
 */
export async function verifyOtpAndStartRide(c: Context) {
  try {
    const body = await c.req.json();
    const result = VerifyRideOtpSchema.safeParse(body);

    if (!result.success) {
      return c.json({ success: false, errors: result.error.errors }, 400);
    }

    const { rideId, otp } = result.data;

    const ride = await prisma.ride.findUnique({
      where: { id: rideId }
    });

    if (!ride || ride.status !== 'accepted') {
      return c.json({ success: false, message: 'Ride is not in accepted status' }, 400);
    }

    if (ride.otpCode !== otp) {
      return c.json({ success: false, message: 'Incorrect OTP' }, 401);
    }

    await prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'picked_up',
        startedAt: new Date()
      }
    });

    return c.json({ success: true, message: 'OTP verified. Ride started.' });
  } catch (error: any) {
    console.error('Verify OTP Start Ride Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

/**
 * Complete the ride and trigger transactions
 */
export async function completeRide(c: Context) {
  try {
    const body = await c.req.json();
    const result = CompleteRideSchema.safeParse(body);

    if (!result.success) {
      return c.json({ success: false, errors: result.error.errors }, 400);
    }

    const { rideId } = result.data;

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: { include: { user: true } } }
    });

    if (!ride || ride.status !== 'picked_up' || !ride.driverId) {
      return c.json({ success: false, message: 'Ride cannot be completed.' }, 400);
    }

    // Complete ride in DB
    await prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        paymentStatus: ride.paymentMethod === 'cash' ? 'completed' : 'pending'
      }
    });

    // Reset Driver availability status to online
    await prisma.driver.update({
      where: { id: ride.driverId },
      data: { dutyStatus: 'online' }
    });

    // Deduct platform service fee (Rs. 5) from driver's wallet
    await processRideCommission(ride.driverId, ride.id);

    // Generate direct payment UPI link if selected
    let paymentLink = null;
    if (ride.paymentMethod === 'upi_direct') {
      const upiAddress = `${ride.driver?.user.phoneNumber}@ybl`; // default mock UPI ID mapped to phone
      paymentLink = generateUpiDeepLink(
        upiAddress,
        ride.driver?.user.fullName ?? 'Driver',
        Number(ride.fareAmount),
        ride.id
      );
    }

    return c.json({
      success: true,
      message: 'Ride completed successfully',
      fareAmount: ride.fareAmount,
      paymentMethod: ride.paymentMethod,
      paymentLink
    });
  } catch (error: any) {
    console.error('Complete Ride Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

/**
 * Retrieve active ride details for Rider or Driver
 */
export async function getActiveRide(c: Context) {
  try {
    const userId = c.req.query('userId');
    const role = c.req.query('role');

    if (!userId || !role) {
      return c.json({ success: false, message: 'userId and role query parameters are required' }, 400);
    }

    let activeRide = null;

    if (role === 'rider') {
      activeRide = await prisma.ride.findFirst({
        where: {
          riderId: userId,
          status: { in: ['requested', 'accepted', 'arrived', 'picked_up'] }
        },
        include: { driver: { include: { user: true } } }
      });
    } else {
      const driverProfile = await prisma.driver.findFirst({
        where: { userId }
      });

      if (driverProfile) {
        activeRide = await prisma.ride.findFirst({
          where: {
            driverId: driverProfile.id,
            status: { in: ['accepted', 'arrived', 'picked_up'] }
          },
          include: { rider: true }
        });
      }
    }

    if (!activeRide) {
      return c.json({ success: false, hasActive: false });
    }

    return c.json({
      success: true,
      hasActive: true,
      ride: activeRide
    });
  } catch (error: any) {
    console.error('Get Active Ride Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

/**
 * Cancel ride request
 */
export async function cancelRide(c: Context) {
  try {
    const { rideId } = await c.req.json();
    
    if (!rideId) {
      return c.json({ success: false, message: 'rideId is required' }, 400);
    }

    const ride = await prisma.ride.findUnique({
      where: { id: rideId }
    });

    if (!ride || ['completed', 'cancelled'].includes(ride.status)) {
      return c.json({ success: false, message: 'Ride is already closed.' }, 400);
    }

    // Cancel the ride
    await prisma.ride.update({
      where: { id: rideId },
      data: { status: 'cancelled' }
    });

    // If driver was already assigned, return driver to online status
    if (ride.driverId) {
      await prisma.driver.update({
        where: { id: ride.driverId },
        data: { dutyStatus: 'online' }
      });
    }

    return c.json({ success: true, message: 'Ride request cancelled successfully' });
  } catch (error: any) {
    console.error('Cancel Ride Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}
