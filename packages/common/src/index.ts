export * from './types';
export * from './schemas';
export * from './schemas-enums';
export * from './cities';

import { z } from 'zod';
import {
  sendOtpSchema,
  verifyOtpSchema,
  verifyOtpRideSchema,
  completeRideSchema,
  uuidSchema,
  coordSchema,
  paymentMethodSchema
} from './schemas';

export const SendOtpSchema = sendOtpSchema;
export const VerifyOtpSchema = verifyOtpSchema;

export const DriverStatusSchema = z.object({
  driverId: uuidSchema,
  status: z.enum(['offline', 'online', 'busy']),
  location: coordSchema.optional(),
});

export const RequestRideSchema = z.object({
  riderId: uuidSchema,
  pickupAddress: z.string(),
  pickupLandmark: z.string().optional().nullable(),
  pickupLocation: coordSchema,
  dropAddress: z.string(),
  dropLocation: coordSchema,
  paymentMethod: paymentMethodSchema.default('cash'),
});

export const AcceptRideSchema = z.object({
  rideId: uuidSchema,
  driverId: uuidSchema,
});

export const VerifyRideOtpSchema = verifyOtpRideSchema;
export const CompleteRideSchema = completeRideSchema;
