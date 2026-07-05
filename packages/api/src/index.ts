import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function getAsyncStorage() {
  try {
    const mod = require('@react-native-async-storage/async-storage');
    return mod.default || mod;
  } catch {
    return undefined;
  }
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getAsyncStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function createTypedClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: getAsyncStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export type UserRole = 'rider' | 'driver' | 'admin';
export type DutyStatus = 'offline' | 'online' | 'busy';
export type VehicleType = 'auto' | 'mini' | 'sedan' | 'suv';
export type RideStatus =
  | 'requested'
  | 'accepted'
  | 'arrived'
  | 'picked_up'
  | 'completed'
  | 'cancelled';

export interface UserProfile {
  id: string;
  phone_number: string;
  full_name: string;
  role: UserRole;
  fcm_token?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DriverProfile {
  id: string;
  is_active: boolean;
  duty_status: DutyStatus;
  rating: number;
  vehicle_type: VehicleType;
  license_plate: string;
  is_kyc_verified: boolean;
  last_ping_at: string;
}

export interface Ride {
  id: string;
  rider_id: string;
  driver_id?: string | null;
  status: RideStatus;
  pickup_address: string;
  pickup_location_lat: number;
  pickup_location_lng: number;
  drop_address: string;
  drop_location_lat: number;
  drop_location_lng: number;
  fare_amount: number;
  distance_km: number;
  otp_code: string;
  payment_method: 'cash' | 'upi_direct' | 'wallet';
  payment_status: 'pending' | 'completed' | 'failed';
  created_at: string;
  accepted_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface LiveLocation {
  id: string;
  entity_id: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  recorded_at: string;
}
