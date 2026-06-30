// =============================================================================
// Shared TypeScript types — the API contract between server and all clients.
// (Zod schemas live in schemas.ts and provide runtime validation; this file
// holds the static shapes used outside of request bodies.)
// =============================================================================
import type {
  VehicleType,
  PaymentMethod,
  RideStatus,
  PaymentStatus,
  DutyStatus,
  TicketUrgency,
} from './schemas-enums';
export * from './schemas-enums';

export interface JwtClaims {
  sub: string; // user id
  role: 'rider' | 'driver' | 'admin';
  driverId?: string | null;
  phoneNumber: string;
  iat?: number;
  exp?: number;
}

export interface ActiveRideView {
  ride: {
    id: string;
    status: RideStatus;
    pickupAddress: string;
    pickupLandmark: string | null;
    dropAddress: string;
    fareAmount: number;
    distanceKm: number;
    estimatedDurationMins: number;
    otpCode: string;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    createdAt: string;
  };
  driver?: {
    id: string;
    fullName: string;
    rating: number;
    vehicleType: VehicleType;
    licensePlate: string;
    modelName: string;
    currentLat: number | null;
    currentLng: number | null;
  } | null;
}

export interface FareEstimate {
  fare: number;
  distanceKm: number;
  estimatedDurationMins: number;
  breakdown: {
    baseFare: number;
    perKmCharge: number;
    nightSurcharge: number;
    surgeSurcharge: number;
    surgeMultiplier: number;
    total: number;
  };
}

export interface FcmOfferPayload {
  ride_id: string;
  pickup_landmark: string;
  distance_to_pickup: number;
  net_earning: number;
  fare_amount: number;
  vehicle_type: VehicleType;
  drop_address: string;
}

export interface WalletView {
  balance: number;
  subscriptionExpiresAt: string | null;
  recentTransactions: {
    id: string;
    amount: number;
    transactionType: 'credit' | 'debit';
    description: string | null;
    createdAt: string;
  }[];
}

// ------------------------------------------------------------- Error envelope
export const enum ErrorCode {
  ValidationFailed = 'VALIDATION_FAILED',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  NotFound = 'NOT_FOUND',
  Conflict = 'CONFLICT',
  ExternalService = 'EXTERNAL_SERVICE',
  KycRequired = 'KYC_REQUIRED',
  PaymentRequired = 'PAYMENT_REQUIRED',
  RateLimited = 'RATE_LIMITED',
  Internal = 'INTERNAL',
}

export interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = T | ApiError;

// ------------------------------------------------------------- Duty/payment shorthand types
export type { VehicleType, PaymentMethod, RideStatus, PaymentStatus, DutyStatus, TicketUrgency };
