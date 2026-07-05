import { supabase } from '@namma/api';
import type { RideData, RideHistoryItem, FareEstimate, VehicleOption, Location } from '../types';

export async function requestRide(
  riderId: string,
  pickup: Location,
  drop: Location,
  fare: FareEstimate,
): Promise<RideData | null> {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const { data, error } = await supabase
    .from('rides')
    .insert({
      rider_id: riderId,
      status: 'requested',
      pickup_address: pickup.address,
      pickup_location_lat: pickup.latitude,
      pickup_location_lng: pickup.longitude,
      drop_address: drop.address,
      drop_location_lat: drop.latitude,
      drop_location_lng: drop.longitude,
      fare_amount: fare.finalFare,
      distance_km: 0,
      otp_code: otp,
      payment_method: 'cash',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[requestRide Error]:', error.message);
    return null;
  }

  return {
    id: data.id,
    status: data.status,
    pickup,
    drop,
    driver: null,
    fare,
    otp,
    distanceKm: 0,
    durationMin: 0,
    createdAt: data.created_at,
    acceptedAt: null,
    startedAt: null,
    completedAt: null,
    paymentMethod: null,
    paymentStatus: 'pending',
    couponCode: null,
    scheduledAt: null,
  };
}

export async function fetchRideHistory(userId: string): Promise<RideHistoryItem[]> {
  const { data, error } = await supabase
    .from('rides')
    .select(`
      id, pickup_address, drop_address, fare_amount, distance_km,
      status, payment_method, payment_status, created_at,
      drivers (full_name, vehicle_type, license_plate)
    `)
    .eq('rider_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) {
    console.error('[fetchRideHistory Error]:', error?.message);
    return [];
  }

  return (data as any[]).map((row) => ({
    id: row.id,
    status: row.status,
    pickupAddress: row.pickup_address,
    dropAddress: row.drop_address,
    fareAmount: row.fare_amount ?? 0,
    distanceKm: row.distance_km ?? 0,
    paymentMethod: row.payment_method ?? 'cash',
    paymentStatus: row.payment_status ?? 'pending',
    createdAt: row.created_at,
    driverName: row.drivers?.full_name ?? 'Unknown',
    vehicleType: row.drivers?.vehicle_type ?? 'auto',
    licensePlate: row.drivers?.license_plate ?? '',
    driverRating: 0,
  }));
}

export async function cancelRide(rideId: string): Promise<boolean> {
  const { error } = await supabase
    .from('rides')
    .update({ status: 'cancelled' })
    .eq('id', rideId);

  if (error) console.error('[cancelRide Error]:', error.message);
  return !error;
}

export async function rateDriver(rideId: string, rating: number, feedback?: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ride_ratings')
      .upsert({
        ride_id: rideId,
        driver_rating: rating,
        feedback: feedback ?? null,
        created_at: new Date().toISOString(),
      });

    if (error) console.error('[rateDriver Error]:', error.message);
    return !error;
  } catch {
    console.warn('[rateDriver] ride_ratings table may not exist yet');
    return false;
  }
}

export const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    type: 'auto',
    name: 'Auto',
    nameKn: 'ಆಟೋ',
    image: '🛺',
    capacity: 3,
    baseFare: 25,
    perKm: 10,
    perMin: 1,
    minFare: 30,
    eta: 3,
    surgeMultiplier: 1,
  },
  {
    type: 'mini',
    name: 'Mini',
    nameKn: 'ಮಿನಿ',
    image: '🚗',
    capacity: 4,
    baseFare: 50,
    perKm: 12,
    perMin: 1.5,
    minFare: 60,
    eta: 5,
    surgeMultiplier: 1,
  },
  {
    type: 'sedan',
    name: 'Sedan',
    nameKn: 'ಸೆಡಾನ್',
    image: '🚙',
    capacity: 4,
    baseFare: 80,
    perKm: 16,
    perMin: 2,
    minFare: 100,
    eta: 7,
    surgeMultiplier: 1,
  },
  {
    type: 'suv',
    name: 'SUV',
    nameKn: 'ಎಸ್ಯುವಿ',
    image: '🚐',
    capacity: 6,
    baseFare: 120,
    perKm: 22,
    perMin: 3,
    minFare: 150,
    eta: 10,
    surgeMultiplier: 1,
  },
  {
    type: 'bike',
    name: 'Bike',
    nameKn: 'ಬೈಕ್',
    image: '🏍️',
    capacity: 1,
    baseFare: 15,
    perKm: 6,
    perMin: 0.5,
    minFare: 20,
    eta: 2,
    surgeMultiplier: 1,
  },
];

export function calculateFare(
  vehicle: VehicleOption,
  distanceKm: number,
  durationMin: number,
  couponDiscount: number = 0,
): FareEstimate {
  const distanceFare = distanceKm * vehicle.perKm;
  const timeFare = durationMin * vehicle.perMin;
  const surgeAmount = (vehicle.baseFare + distanceFare + timeFare) * (vehicle.surgeMultiplier - 1);
  const totalFare = Math.max(vehicle.baseFare + distanceFare + timeFare + surgeAmount, vehicle.minFare);
  return {
    vehicleType: vehicle.type,
    baseFare: vehicle.baseFare,
    distanceFare,
    timeFare,
    surgeMultiplier: vehicle.surgeMultiplier,
    surgeAmount,
    totalFare,
    couponDiscount,
    finalFare: Math.max(totalFare - couponDiscount, 0),
  };
}
