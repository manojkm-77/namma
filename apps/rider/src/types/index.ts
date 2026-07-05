export type UserRole = 'rider' | 'driver' | 'admin';
export type RideStatus = 'requested' | 'accepted' | 'arrived' | 'picked_up' | 'completed' | 'cancelled';
export type VehicleType = 'auto' | 'mini' | 'sedan' | 'suv' | 'bike';
export type PaymentMethod = 'cash' | 'upi' | 'phonepe' | 'google_pay' | 'paytm' | 'wallet';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type Language = 'en' | 'kn';
export type BookingStep = 'search' | 'vehicle_select' | 'matching' | 'active' | 'completed';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  label?: string;
}

export interface SavedPlace {
  id: string;
  type: 'home' | 'work' | 'other';
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface VehicleOption {
  type: VehicleType;
  name: string;
  nameKn: string;
  image: string;
  capacity: number;
  baseFare: number;
  perKm: number;
  perMin: number;
  minFare: number;
  eta: number;
  surgeMultiplier: number;
}

export interface FareEstimate {
  vehicleType: VehicleType;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  surgeAmount: number;
  totalFare: number;
  couponDiscount: number;
  finalFare: number;
}

export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  photo: string;
  rating: number;
  vehicleType: VehicleType;
  vehicleNumber: string;
  vehicleModel: string;
  vehicleColor: string;
  latitude: number;
  longitude: number;
  heading: number;
}

export interface RideData {
  id: string;
  status: RideStatus;
  pickup: Location;
  drop: Location;
  driver: DriverInfo | null;
  fare: FareEstimate | null;
  otp: string;
  distanceKm: number;
  durationMin: number;
  createdAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  couponCode: string | null;
  scheduledAt: string | null;
}

export interface RideHistoryItem {
  id: string;
  status: RideStatus;
  pickupAddress: string;
  dropAddress: string;
  fareAmount: number;
  distanceKm: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  driverName: string;
  vehicleType: string;
  licensePlate: string;
  driverRating: number;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  transactionType: 'credit' | 'debit';
  description: string;
  createdAt: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountPercent: number;
  maxDiscount: number;
  minFare: number;
  validUntil: string;
  isActive: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface RideStats {
  totalRides: number;
  totalDistanceKm: number;
  totalSpent: number;
  memberSince: string;
  cancelledRides: number;
  rating: number;
}

export interface LoyaltyTier {
  name: string;
  nameKn: string;
  badge: string;
  color: string;
  bgColor: string;
  minRides: number;
  benefits: string[];
}
