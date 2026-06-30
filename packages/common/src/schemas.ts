// =============================================================================
// Shared Zod schemas — used by the Hono server (request validation) AND the
// React Native forms (client validation). Single source of truth.
// =============================================================================
import { z } from 'zod';

// ------------------------------------------------------------- Primitives
export const uuidSchema = z.string().uuid('Must be a valid UUID');
export const phoneSchema = z
  .string()
  .regex(/^\+91\d{10}$/, 'Phone must be in +91XXXXXXXXXX format');
export const otpSchema = z.string().regex(/^\d{4}$/, 'OTP must be 4 digits');
export const latSchema = z.number().min(-90).max(90);
export const lngSchema = z.number().min(-180).max(180);
export const coordSchema = z.object({
  latitude: latSchema,
  longitude: lngSchema,
});

// ------------------------------------------------------------- Auth
export const sendOtpSchema = z.object({
  phoneNumber: phoneSchema,
});
export type SendOtpInput = z.infer<typeof sendOtpSchema>;

export const verifyOtpSchema = z.object({
  phoneNumber: phoneSchema,
  otp: otpSchema,
  role: z.enum(['rider', 'driver', 'admin']),
  fullName: z.string().min(2).max(100).optional(),
  preferredLanguage: z.enum(['kn', 'en', 'hi']).default('kn'),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const authResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: uuidSchema,
    phoneNumber: phoneSchema,
    fullName: z.string(),
    role: z.enum(['rider', 'driver', 'admin']),
    preferredLanguage: z.string(),
    isNewUser: z.boolean(),
    driverId: uuidSchema.nullable(),
    isKycVerified: z.boolean().nullable(),
  }),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

// ------------------------------------------------------------- Driver
export const updateDriverStatusSchema = z.object({
  dutyStatus: z.enum(['offline', 'online', 'busy']),
});
export type UpdateDriverStatusInput = z.infer<typeof updateDriverStatusSchema>;

export const driverLocationPingSchema = z.object({
  latitude: latSchema,
  longitude: lngSchema,
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
});
export type DriverLocationPing = z.infer<typeof driverLocationPingSchema>;

// ------------------------------------------------------------- Rides
export const paymentMethodSchema = z.enum(['cash', 'upi_direct', 'wallet']);
export const vehicleTypeSchema = z.enum(['auto', 'mini', 'sedan', 'suv']);

export const requestRideSchema = z.object({
  pickup: z.object({
    address: z.string().min(3).max(300),
    landmark: z.string().max(100).optional(),
    latitude: latSchema,
    longitude: lngSchema,
  }),
  drop: z.object({
    address: z.string().min(3).max(300),
    latitude: latSchema,
    longitude: lngSchema,
  }),
  vehicleType: vehicleTypeSchema.default('auto'),
  paymentMethod: paymentMethodSchema.default('cash'),
  cityName: z.string().min(2).max(60),
  scheduledFor: z.string().datetime().optional(),
});
export type RequestRideInput = z.infer<typeof requestRideSchema>;

export const cancelRideSchema = z.object({
  rideId: uuidSchema,
  reason: z.string().min(2).max(300),
});
export type CancelRideInput = z.infer<typeof cancelRideSchema>;

export const acceptRideSchema = z.object({
  rideId: uuidSchema,
});
export type AcceptRideInput = z.infer<typeof acceptRideSchema>;

export const verifyOtpRideSchema = z.object({
  rideId: uuidSchema,
  otp: otpSchema,
});
export type VerifyRideOtpInput = z.infer<typeof verifyOtpRideSchema>;

export const completeRideSchema = z.object({
  rideId: uuidSchema,
  paymentStatus: z.enum(['completed', 'failed']).default('completed'),
});
export type CompleteRideInput = z.infer<typeof completeRideSchema>;

// ------------------------------------------------------------- Wallet
export const withdrawSchema = z.object({
  amount: z.number().positive().max(50000, 'Max ₹50,000 per withdrawal'),
  upiId: z.string().regex(/^[\w.\-]+@[\w]+$/, 'Invalid UPI ID'),
});
export type WithdrawInput = z.infer<typeof withdrawSchema>;

// ------------------------------------------------------------- AI
export const kycOcrSchema = z.object({
  imageUrl: z.string().url(),
  documentHint: z.enum(['driving_license', 'aadhar']).optional(),
});
export type KycOcrInput = z.infer<typeof kycOcrSchema>;

export const kycOcrResultSchema = z.object({
  document_type: z.enum(['driving_license', 'aadhar']),
  document_number: z.string(),
  name: z.string(),
  expiry_date: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  confidence_score: z.number().min(0).max(1),
  issues_detected: z.array(z.string()),
});
export type KycOcrResult = z.infer<typeof kycOcrResultSchema>;

export const fareExplainSchema = z.object({
  fareBreakdown: z.any(),
  vehicleType: vehicleTypeSchema,
  surgeReason: z.string().optional(),
  cityName: z.string(),
  language: z.enum(['kn', 'en']).default('kn'),
});
export type FareExplainInput = z.infer<typeof fareExplainSchema>;

export const supportClassifySchema = z.object({
  ticketId: uuidSchema.optional(),
  category: z.string().min(2).max(60),
  issueDescription: z.string().min(2).max(4000),
});
export type SupportClassifyInput = z.infer<typeof supportClassifySchema>;

export const supportClassifyResultSchema = z.object({
  ai_urgency: z.enum(['normal', 'high', 'sos']),
  ai_classification: z.string(),
  requires_immediate_action: z.boolean(),
  suggested_response: z.string(),
});
export type SupportClassifyResult = z.infer<typeof supportClassifyResultSchema>;

// ------------------------------------------------------------- Support
export const createTicketSchema = z.object({
  category: z.string().min(2).max(60),
  issueDescription: z.string().min(2).max(4000),
  rideId: uuidSchema.optional(),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

// ------------------------------------------------------------- KYC submission
export const submitKycSchema = z.object({
  aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar must be 12 digits'),
  aadharFrontUrl: z.string().url(),
  aadharBackUrl: z.string().url(),
  licenseNumber: z.string().min(5).max(20),
  licenseFrontUrl: z.string().url(),
});
export type SubmitKycInput = z.infer<typeof submitKycSchema>;

// ------------------------------------------------------------- Vehicle
export const registerVehicleSchema = z.object({
  vehicleType: vehicleTypeSchema,
  licensePlate: z
    .string()
    .regex(/^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{4}$/, 'e.g. KA12AB1234'),
  modelName: z.string().min(2).max(50),
  insuranceExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rcFileUrl: z.string().url(),
});
export type RegisterVehicleInput = z.infer<typeof registerVehicleSchema>;

// ------------------------------------------------------------- Reviews
export const createReviewSchema = z.object({
  rideId: uuidSchema,
  rating: z.number().int().min(1).max(5),
  comments: z.string().max(500).optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// ------------------------------------------------------------- Maps
export const landmarksQuerySchema = z.object({
  city: z.string().min(2).max(60).optional(),
});
export type LandmarksQuery = z.infer<typeof landmarksQuerySchema>;

// ------------------------------------------------------------- Admin
export const approveKycSchema = z.object({
  kycId: uuidSchema,
  decision: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().max(500).optional(),
});
export type ApproveKycInput = z.infer<typeof approveKycSchema>;

export const updatePricingSchema = z.object({
  cityName: z.string().min(2).max(60),
  auto: z.object({
    baseFare: z.number().min(0),
    baseKm: z.number().min(0),
    perKm: z.number().min(0),
    nightMult: z.number().min(1),
  }),
  cab: z.object({
    baseFare: z.number().min(0),
    baseKm: z.number().min(0),
    perKm: z.number().min(0),
    nightMult: z.number().min(1),
  }),
});
export type UpdatePricingInput = z.infer<typeof updatePricingSchema>;
