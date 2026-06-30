import { Context } from 'hono';
import { prisma } from '@namma/db';
import { DriverStatusSchema } from '@namma/common';
import { updateDriverLocation, removeDriverLocation } from '../services/redis.service';

/**
 * Update Driver duty status (Legacy/Public API - reads driverId from body)
 */
export async function updateDutyStatus(c: Context) {
  try {
    const body = await c.req.json();
    const result = DriverStatusSchema.safeParse(body);

    if (!result.success) {
      return c.json({ success: false, errors: result.error.errors }, 400);
    }

    const { driverId, status, location } = result.data;

    // Check driver exists
    const driver = await prisma.driver.findUnique({
      where: { id: driverId }
    });

    if (!driver) {
      return c.json({ success: false, message: 'Driver not found' }, 404);
    }

    const updated = await prisma.driver.update({
      where: { id: driverId },
      data: {
        dutyStatus: status,
        isActive: status === 'online',
        ...(location && {
          currentLat: location.latitude,
          currentLng: location.longitude
        })
      }
    });

    if (status === 'online' && location) {
      await updateDriverLocation(driverId, location.latitude, location.longitude);
    } else {
      await removeDriverLocation(driverId);
    }

    return c.json({
      success: true,
      dutyStatus: updated.dutyStatus,
      isActive: updated.isActive
    });
  } catch (error: any) {
    console.error('Update Duty Status Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

/**
 * Sync real-time GPS telemetry from driver's app (Legacy/Public API - reads driverId from body)
 */
export async function syncTelemetryLocation(c: Context) {
  try {
    const { driverId, latitude, longitude } = await c.req.json();

    if (!driverId || latitude === undefined || longitude === undefined) {
      return c.json({ success: false, message: 'driverId, latitude, and longitude are required' }, 400);
    }

    // Check driver status in database
    const driver = await prisma.driver.findUnique({
      where: { id: driverId }
    });

    if (!driver) {
      return c.json({ success: false, message: 'Driver not found' }, 404);
    }

    // Update in Database
    await prisma.driver.update({
      where: { id: driverId },
      data: {
        currentLat: latitude,
        currentLng: longitude,
        lastPingAt: new Date()
      }
    });

    // If online, index location in Redis spatial cache
    if (driver.dutyStatus === 'online') {
      await updateDriverLocation(driverId, latitude, longitude);
    }

    return c.json({ success: true, message: 'Telemetry location synchronized' });
  } catch (error: any) {
    console.error('Telemetry Sync Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

/**
 * Update Driver duty status (Authenticated)
 */
export async function updateDutyStatusAuth(c: Context) {
  try {
    const jwtPayload = (c as any).get('jwtPayload') as { userId: string };
    const { dutyStatus } = await c.req.json() as { dutyStatus: 'online' | 'offline' | 'busy' };

    if (!dutyStatus || !['online', 'offline', 'busy'].includes(dutyStatus)) {
      return c.json({ success: false, error: 'Invalid dutyStatus' }, 400);
    }

    const driver = await prisma.driver.findFirst({
      where: { userId: jwtPayload.userId }
    });

    if (!driver) {
      return c.json({ success: false, error: 'Driver not found' }, 404);
    }

    const updated = await prisma.driver.update({
      where: { id: driver.id },
      data: {
        dutyStatus,
        isActive: dutyStatus === 'online'
      }
    });

    if (dutyStatus === 'online') {
      if (driver.currentLat && driver.currentLng) {
        await updateDriverLocation(driver.id, Number(driver.currentLat), Number(driver.currentLng));
      }
    } else {
      await removeDriverLocation(driver.id);
    }

    return c.json({
      success: true,
      dutyStatus: updated.dutyStatus,
      isActive: updated.isActive
    });
  } catch (error: any) {
    console.error('Update Duty Status Auth Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

/**
 * Sync real-time GPS telemetry from driver's app (Authenticated)
 */
export async function syncTelemetryLocationAuth(c: Context) {
  try {
    const jwtPayload = (c as any).get('jwtPayload') as { userId: string };
    const { latitude, longitude } = await c.req.json() as { latitude: number; longitude: number };

    if (latitude === undefined || longitude === undefined) {
      return c.json({ success: false, error: 'latitude and longitude are required' }, 400);
    }

    const driver = await prisma.driver.findFirst({
      where: { userId: jwtPayload.userId }
    });

    if (!driver) {
      return c.json({ success: false, error: 'Driver not found' }, 404);
    }

    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        currentLat: latitude,
        currentLng: longitude,
        lastPingAt: new Date()
      }
    });

    if (driver.dutyStatus === 'online') {
      await updateDriverLocation(driver.id, latitude, longitude);
    }

    return c.json({ success: true, message: 'Telemetry location synchronized' });
  } catch (error: any) {
    console.error('Telemetry Sync Auth Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

/**
 * Fetch Driver Dashboard metrics (Authenticated)
 */
export async function getDriverDashboard(c: Context) {
  try {
    const jwtPayload = (c as any).get('jwtPayload') as { userId: string };
    const driverData = await prisma.driver.findFirst({
      where: { userId: jwtPayload.userId },
      include: {
        user: { select: { fullName: true } },
        vehicle: true,
        wallet: true
      }
    });

    if (!driverData) {
      return c.json({ success: false, error: 'Driver not found' }, 404);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rides = await prisma.ride.findMany({
      where: {
        driverId: driverData.id,
        status: 'completed',
        completedAt: {
          gte: today
        }
      }
    });

    const ridesCompleted = rides.length;
    const grossEarnings = rides.reduce((sum, r) => sum + Number(r.fareAmount), 0);

    return c.json({
      driver: {
        name: driverData.user.fullName,
        rating: Number(driverData.rating),
        dutyStatus: driverData.dutyStatus,
        isKycVerified: driverData.isKycVerified,
        subscriptionExpiresAt: driverData.subscriptionExpiresAt ? driverData.subscriptionExpiresAt.toISOString() : null,
        vehicle: driverData.vehicle ? {
          vehicleType: driverData.vehicle.vehicleType,
          licensePlate: driverData.vehicle.licensePlate,
          modelName: driverData.vehicle.modelName
        } : null,
        wallet: driverData.wallet ? {
          balance: Number(driverData.wallet.balance)
        } : { balance: 0 }
      },
      todayStats: {
        ridesCompleted,
        grossEarnings
      }
    });
  } catch (error: any) {
    console.error('Driver Dashboard Error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
}
