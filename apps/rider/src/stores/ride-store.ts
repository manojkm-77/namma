import { create } from 'zustand';
import type { Location, VehicleOption, FareEstimate, RideData, BookingStep } from '../types';
import { VEHICLE_OPTIONS, calculateFare, requestRide } from '../services/ride-service';
import { estimateDistance, estimateDuration } from '../services/location-service';

interface RideState {
  step: BookingStep;
  pickup: Location | null;
  drop: Location | null;
  selectedVehicle: VehicleOption | null;
  fareEstimate: FareEstimate | null;
  activeRide: RideData | null;
  nearbyDrivers: number;
  estimatedWaitMin: number;
  isLoading: boolean;
  error: string | null;

  setStep: (step: BookingStep) => void;
  setPickup: (location: Location) => void;
  setDrop: (location: Location) => void;
  selectVehicle: (vehicle: VehicleOption) => void;
  calculateFare: () => void;
  startBooking: (riderId: string) => Promise<void>;
  setActiveRide: (ride: RideData | null) => void;
  setNearbyDrivers: (count: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  step: 'search' as BookingStep,
  pickup: null as Location | null,
  drop: null as Location | null,
  selectedVehicle: null as VehicleOption | null,
  fareEstimate: null as FareEstimate | null,
  activeRide: null as RideData | null,
  nearbyDrivers: 0,
  estimatedWaitMin: 2,
  isLoading: false,
  error: null as string | null,
};

export const useRideStore = create<RideState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  setPickup: (location) => {
    set({ pickup: location });
    get().calculateFare();
  },

  setDrop: (location) => {
    set({ drop: location });
    get().calculateFare();
  },

  selectVehicle: (vehicle) => set({ selectedVehicle: vehicle }),

  calculateFare: () => {
    const { pickup, drop, selectedVehicle } = get();
    if (!pickup || !drop) return;

    const distanceKm = estimateDistance(
      pickup.latitude, pickup.longitude,
      drop.latitude, drop.longitude,
    );
    const durationMin = estimateDuration(distanceKm);
    const vehicle = selectedVehicle ?? VEHICLE_OPTIONS[0];
    const fare = calculateFare(vehicle, distanceKm, durationMin);
    set({ fareEstimate: fare });
  },

  startBooking: async (riderId) => {
    const { pickup, drop, fareEstimate } = get();
    if (!pickup || !drop || !fareEstimate) {
      set({ error: 'Please select pickup and drop locations' });
      return;
    }

    set({ isLoading: true, error: null, step: 'matching' });

    const ride = await requestRide(riderId, pickup, drop, fareEstimate);

    if (!ride) {
      set({ error: 'Failed to book ride. Please try again.', isLoading: false, step: 'search' });
      return;
    }

    set({ activeRide: ride, isLoading: false });
  },

  setActiveRide: (ride) => set({ activeRide: ride }),
  setNearbyDrivers: (count) => set({ nearbyDrivers: count }),
  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
