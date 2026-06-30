import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getMessaging, type MulticastMessage, type BatchResponse } from 'firebase-admin/messaging';
import { prisma } from '@namma/db';

// ─── Firebase Admin Singleton ────────────────────────────────────────────────

function getFirebaseApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      '[FCM Init]: Missing required Firebase environment variables: ' +
      'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey })
  });
}

// ─── Payload Type Definitions ─────────────────────────────────────────────────

export interface RideOfferPayload {
  rideId: string;
  pickupAddress: string;
  dropAddress: string;
  fareAmount: number;
  distanceKm: number;
  estimatedMins: number;
  vehicleType: string;
  paymentMethod: string;
}

export interface RideStatusPayload {
  rideId: string;
  newStatus: string;
  driverName?: string;
  driverRating?: string;
  vehiclePlate?: string;
}

export interface GenericNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

type FcmSendResult =
  | { success: true; successCount: number; failureCount: number }
  | { success: false; error: string };

// ─── Core Dispatch Functions ──────────────────────────────────────────────────

/**
 * Sends a ride offer push notification to a single driver FCM token.
 * Returns typed success/failure discriminated union.
 */
export async function sendRideOfferToDriver(
  driverId: string,
  payload: RideOfferPayload
): Promise<FcmSendResult> {
  try {
    const app = getFirebaseApp();
    const messaging = getMessaging(app);

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: { select: { fcmToken: true, fullName: true } } }
    });

    if (!driver?.user.fcmToken) {
      console.warn(`[FCM]: Driver ${driverId} has no FCM token registered.`);
      return { success: false, error: 'Driver FCM token not registered.' };
    }

    const message: MulticastMessage = {
      tokens: [driver.user.fcmToken],
      notification: {
        title: `🚖 New Ride — ₹${payload.fareAmount}`,
        body: `📍 ${payload.pickupAddress} → ${payload.dropAddress}`
      },
      data: {
        type: 'RIDE_OFFER',
        rideId: payload.rideId,
        pickupAddress: payload.pickupAddress,
        dropAddress: payload.dropAddress,
        fareAmount: payload.fareAmount.toString(),
        distanceKm: payload.distanceKm.toString(),
        estimatedMins: payload.estimatedMins.toString(),
        vehicleType: payload.vehicleType,
        paymentMethod: payload.paymentMethod
      },
      android: {
        priority: 'high',
        ttl: 15000, // 15 seconds — offer expires
        notification: {
          channelId: 'ride_offers',
          priority: 'max',
          defaultSound: true,
          defaultVibrateTimings: true
        }
      },
      apns: {
        headers: { 'apns-priority': '10', 'apns-expiration': '15' },
        payload: {
          aps: {
            alert: {
              title: `🚖 New Ride — ₹${payload.fareAmount}`,
              body: `${payload.pickupAddress} → ${payload.dropAddress}`
            },
            sound: 'ride_offer.caf',
            badge: 1,
            contentAvailable: true
          }
        }
      }
    };

    const response: BatchResponse = await messaging.sendEachForMulticast(message);

    if (response.failureCount > 0) {
      response.responses.forEach((res, idx) => {
        if (!res.success) {
          console.error(`[FCM Delivery Fault] Token[${idx}]:`, res.error?.message ?? 'Unknown error');
          // Handle stale tokens
          if (
            res.error?.code === 'messaging/registration-token-not-registered' ||
            res.error?.code === 'messaging/invalid-registration-token'
          ) {
            // Async token cleanup — non-blocking
            prisma.user
              .update({
                where: { id: driver.user.fcmToken! },
                data: { fcmToken: null }
              })
              .catch((dbErr) => console.error('[FCM Token Cleanup DB Fault]:', dbErr));
          }
        }
      });
    }

    console.log(
      `[FCM Ride Offer]: Dispatched to driver ${driverId} — ` +
      `Success: ${response.successCount}, Failed: ${response.failureCount}`
    );

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (err) {
    console.error('[FCM sendRideOfferToDriver Exception]:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown FCM error.' };
  }
}

/**
 * Sends ride status update to a rider (e.g., driver accepted, arrived).
 */
export async function sendRideStatusToRider(
  riderId: string,
  payload: RideStatusPayload
): Promise<FcmSendResult> {
  try {
    const app = getFirebaseApp();
    const messaging = getMessaging(app);

    const rider = await prisma.user.findUnique({
      where: { id: riderId },
      select: { fcmToken: true }
    });

    if (!rider?.fcmToken) {
      console.warn(`[FCM]: Rider ${riderId} has no FCM token registered.`);
      return { success: false, error: 'Rider FCM token not registered.' };
    }

    const statusMessages: Record<string, { title: string; body: string }> = {
      accepted: {
        title: '✅ Driver Found!',
        body: `${payload.driverName ?? 'Your driver'} (${payload.vehiclePlate ?? ''}) is on the way.`
      },
      arrived: {
        title: '📍 Driver Arrived',
        body: `Your driver is waiting at the pickup point.`
      },
      picked_up: {
        title: '🚗 Ride Started',
        body: `You are now on your way. Have a safe journey!`
      },
      completed: {
        title: '🎉 Ride Completed',
        body: `Hope you had a great ride! Please rate your experience.`
      },
      cancelled: {
        title: '❌ Ride Cancelled',
        body: `Your ride was cancelled. You can book a new ride anytime.`
      }
    };

    const notifContent = statusMessages[payload.newStatus] ?? {
      title: 'Ride Update',
      body: `Your ride status changed to ${payload.newStatus}.`
    };

    const message: MulticastMessage = {
      tokens: [rider.fcmToken],
      notification: { title: notifContent.title, body: notifContent.body },
      data: {
        type: 'RIDE_STATUS_UPDATE',
        rideId: payload.rideId,
        newStatus: payload.newStatus,
        driverName: payload.driverName ?? '',
        vehiclePlate: payload.vehiclePlate ?? ''
      },
      android: {
        priority: 'high',
        notification: { channelId: 'ride_updates', priority: 'high', defaultSound: true }
      },
      apns: {
        headers: { 'apns-priority': '10' },
        payload: { aps: { alert: notifContent, sound: 'default', badge: 1 } }
      }
    };

    const response = await messaging.sendEachForMulticast(message);
    return { success: true, successCount: response.successCount, failureCount: response.failureCount };
  } catch (err) {
    console.error('[FCM sendRideStatusToRider Exception]:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown FCM error.' };
  }
}

/**
 * Broadcasts a generic notification to a list of FCM tokens.
 * Used for admin broadcasts, wallet alerts, KYC status changes.
 */
export async function sendGenericNotification(
  fcmTokens: string[],
  payload: GenericNotificationPayload
): Promise<FcmSendResult> {
  if (fcmTokens.length === 0) {
    return { success: false, error: 'No FCM tokens provided.' };
  }

  try {
    const app = getFirebaseApp();
    const messaging = getMessaging(app);

    // FCM sendEachForMulticast supports max 500 tokens per batch
    const BATCH_SIZE = 500;
    let totalSuccess = 0;
    let totalFailure = 0;

    for (let i = 0; i < fcmTokens.length; i += BATCH_SIZE) {
      const tokenBatch = fcmTokens.slice(i, i + BATCH_SIZE);
      const message: MulticastMessage = {
        tokens: tokenBatch,
        notification: { title: payload.title, body: payload.body },
        data: payload.data ?? {},
        android: {
          priority: 'normal',
          notification: { channelId: 'general', defaultSound: true }
        },
        apns: {
          payload: {
            aps: {
              alert: { title: payload.title, body: payload.body },
              sound: 'default'
            }
          }
        }
      };

      const response = await messaging.sendEachForMulticast(message);
      totalSuccess += response.successCount;
      totalFailure += response.failureCount;
    }

    console.log(
      `[FCM Generic Broadcast]: Total Success: ${totalSuccess}, Total Failed: ${totalFailure}`
    );
    return { success: true, successCount: totalSuccess, failureCount: totalFailure };
  } catch (err) {
    console.error('[FCM sendGenericNotification Exception]:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown FCM error.' };
  }
}

/**
 * Registers or refreshes an FCM token for a user.
 */
export async function registerFcmToken(
  userId: string,
  fcmToken: string
): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken }
    });
    console.log(`[FCM Token Registered]: User ${userId}`);
  } catch (err) {
    console.error('[FCM Token Registration DB Fault]:', err);
    throw err;
  }
}
