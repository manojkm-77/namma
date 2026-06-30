// =============================================================================
// String-literal union types mirroring the DB enums. Kept separate from the
// Zod schemas so non-Zod consumers (mobile components) can import them without
// pulling in zod at runtime.
// =============================================================================
export type VehicleType = 'auto' | 'mini' | 'sedan' | 'suv';
export type PaymentMethod = 'cash' | 'upi_direct' | 'wallet';
export type RideStatus =
  | 'requested'
  | 'accepted'
  | 'arrived'
  | 'picked_up'
  | 'completed'
  | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type DutyStatus = 'offline' | 'online' | 'busy';
export type TicketUrgency = 'normal' | 'high' | 'sos';
export type UserRole = 'rider' | 'driver' | 'admin';
