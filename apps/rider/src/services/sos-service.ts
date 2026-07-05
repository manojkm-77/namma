import * as Location from 'expo-location';
import { supabase } from '@namma/api';

export async function sendEmergencyAlert(
  userId: string,
  rideId?: string,
  preAcquiredCoords?: { latitude: number; longitude: number } | null,
): Promise<{ success: boolean; coords: { latitude: number; longitude: number } | null }> {
  try {
    let coords = preAcquiredCoords ?? null;
    if (!coords) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return { success: false, coords: null };
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    }

    await supabase.from('emergency_alerts').insert({
      user_id: userId,
      ride_id: rideId ?? null,
      latitude: coords.latitude,
      longitude: coords.longitude,
      triggered_at: new Date().toISOString(),
      status: 'dispatched',
    });

    return { success: true, coords };
  } catch {
    return { success: false, coords: preAcquiredCoords ?? null };
  }
}

export const EMERGENCY_NUMBERS = {
  police: '112',
  ambulance: '108',
  fire: '101',
  womenHelpline: '1091',
} as const;
