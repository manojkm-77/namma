import { useState, useEffect, useRef } from 'react';
import { DeviceMotion, DeviceMotionMeasurement } from 'expo-sensors';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

// ─── Type Definitions ─────────────────────────────────────────────────────────

export interface TelemetryFrame {
  timestamp: number;
  latitude: number;
  longitude: number;
  speedKmh: number;
  rollDegrees: number;
  pitchDegrees: number;
  leanAngleDegrees: number;
  verticalGForce: number;
  frictionCoefficient: number;
  powerWatts: number;
  energyWhKm: number;
  inclinePct: number;
}

export interface TelemetryHookConfig {
  updateIntervalMs?: number;
  bufferSizeLimit?: number;
  syncIntervalMs?: number;
  simulationMode?: boolean;
}

// ─── Physics Constants (Scooter / Light EV) ────────────────────────────────────
const VEHICLE_MASS_KG = 150; // Vehicle + Rider + Cargo
const GRAVITY_M_S2 = 9.80665;
const AIR_DENSITY_RHO = 1.2; // kg/m^3
const DRAG_COEFF_AREA_CDA = 0.45; // m^2
const ROLLING_RESISTANCE_CR = 0.015; // Standard tires
const MOTOR_EFFICIENCY_ETA = 0.85; // Drivetrain efficiency
const REGEN_EFFICIENCY = 0.30; // 30% kinetic energy recovery on braking

// Smoothing factor for Exponential Moving Average (EMA) filter (0 to 1)
const EMA_ALPHA = 0.15;

/**
 * Custom Hook: useTelemetry
 * Captures real-time IMU sensor readings from the device, resolves pitch/roll, G-forces,
 * utilized friction coefficient, and calculates dynamic physics-based Wh/km energy consumption.
 */
export function useTelemetry(
  currentLocation: { latitude: number; longitude: number; speedKmh: number } | null,
  config: TelemetryHookConfig = {}
) {
  const {
    updateIntervalMs = 100, // 10Hz sampling
    bufferSizeLimit = 50,
    syncIntervalMs = 5000,
    simulationMode = false,
  } = config;

  const queryClient = useQueryClient();

  // Telemetry state
  const [isSensorAvailable, setIsSensorAvailable] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentFrame, setCurrentFrame] = useState<TelemetryFrame | null>(null);
  
  // Refs for tracking sensor buffers and smoothing values
  const frameBufferRef = useRef<TelemetryFrame[]>([]);
  const lastSyncTimeRef = useRef<number>(Date.now());
  const speedRef = useRef<number>(0);
  
  // EMA smoothed variables to filter sensor noise/engine vibration
  const smoothedRollRef = useRef<number>(0);
  const smoothedPitchRef = useRef<number>(0);
  const smoothedVertGRef = useRef<number>(1.0);
  const smoothedFrictionRef = useRef<number>(0.0);

  // Sync speed into a ref for the polling listener
  useEffect(() => {
    if (currentLocation) {
      speedRef.current = currentLocation.speedKmh;
    }
  }, [currentLocation]);

  // React Query Mutation to upload telemetry data
  const syncMutation = useMutation({
    mutationFn: async (frames: TelemetryFrame[]) => {
      // Send location sync to the existing API, and upload the detailed telemetry payload.
      // If the telemetry endpoint doesn't exist, we fall back gracefully.
      const latestFrame = frames[frames.length - 1];
      
      // Post coordinates to standard driver location endpoint
      await apiFetch('/api/driver/location', {
        method: 'POST',
        body: JSON.stringify({
          latitude: latestFrame.latitude,
          longitude: latestFrame.longitude,
          speedKmh: latestFrame.speedKmh,
        }),
      });

      // Synchronize full telemetry logs
      const result = await apiFetch('/api/driver/telemetry', {
        method: 'POST',
        body: JSON.stringify({ telemetry: frames }),
      });
      
      return result;
    },
    onSuccess: () => {
      // Optional: invalidate queries if there is a query tracking backend telemetry history
      queryClient.invalidateQueries({ queryKey: ['telemetry-history'] });
    },
    onError: (err) => {
      console.warn('[Telemetry Remote Sync Failed]:', err);
    }
  });

  // ─── Telemetry Processing Logic ───────────────────────────────────────────
  const processSensorData = (
    accelerometer: { x: number; y: number; z: number },
    rotation: { alpha: number; beta: number; gamma: number } | null,
    accelIncGravity?: { x: number; y: number; z: number }
  ) => {
    const lat = currentLocation?.latitude ?? 12.2958;
    const lng = currentLocation?.longitude ?? 76.6394;
    const speedKmh = speedRef.current;
    const speedMs = speedKmh / 3.6;

    let roll = 0;
    let pitch = 0;

    if (rotation) {
      // Rotation provides Euler angles directly (in radians)
      // gamma is roll (left/right tilt) around Y-axis [-90, 90]
      // beta is pitch (forward/back tilt) around X-axis [-180, 180]
      roll = (rotation.gamma * 180) / Math.PI;
      pitch = (rotation.beta * 180) / Math.PI;
    } else {
      // Fallback: estimate tilt angles from static acceleration
      // roll = atan2(x, z)
      // pitch = atan2(-y, sqrt(x^2 + z^2))
      roll = (Math.atan2(accelerometer.x, accelerometer.z) * 180) / Math.PI;
      const horizontalMagnitude = Math.sqrt(accelerometer.x * accelerometer.x + accelerometer.z * accelerometer.z);
      pitch = (Math.atan2(-accelerometer.y, horizontalMagnitude) * 180) / Math.PI;
    }

    // Apply EMA filter to damp sensor noise
    smoothedRollRef.current = EMA_ALPHA * roll + (1 - EMA_ALPHA) * smoothedRollRef.current;
    smoothedPitchRef.current = EMA_ALPHA * pitch + (1 - EMA_ALPHA) * smoothedPitchRef.current;

    // Lean Angle is the magnitude of the roll (lateral tilt)
    const leanAngle = Math.min(60, Math.abs(smoothedRollRef.current));

    // Vertical G-forces: normal force perpendicular to vehicle frame
    // We normalize acceleration including gravity in the Z-axis by earth gravity constant.
    const rawVertG = accelIncGravity 
      ? Math.abs(accelIncGravity.z / GRAVITY_M_S2)
      : Math.abs((accelerometer.z + GRAVITY_M_S2) / GRAVITY_M_S2);
    smoothedVertGRef.current = EMA_ALPHA * rawVertG + (1 - EMA_ALPHA) * smoothedVertGRef.current;

    // Friction Coefficient utilized (mu): Ratio of lateral & longitudinal user accelerations to gravity
    // mu = sqrt(ax^2 + ay^2) / g
    const horizontalAccelerationMag = Math.sqrt(
      accelerometer.x * accelerometer.x + accelerometer.y * accelerometer.y
    );
    const rawFriction = Math.min(1.2, horizontalAccelerationMag / GRAVITY_M_S2);
    smoothedFrictionRef.current = EMA_ALPHA * rawFriction + (1 - EMA_ALPHA) * smoothedFrictionRef.current;

    // Incline Percentage (calculated from pitch)
    // pitch represents climb/descent slope angle
    const inclinePct = Math.tan((smoothedPitchRef.current * Math.PI) / 180) * 100;

    // ─── Energy Consumption (Wh/km) ───
    // F_total = F_gravity + F_rolling + F_drag + F_inertia
    const thetaRad = (smoothedPitchRef.current * Math.PI) / 180;
    const fGravity = VEHICLE_MASS_KG * GRAVITY_M_S2 * Math.sin(thetaRad);
    const fRolling = VEHICLE_MASS_KG * GRAVITY_M_S2 * ROLLING_RESISTANCE_CR * Math.cos(thetaRad);
    const fDrag = 0.5 * AIR_DENSITY_RHO * DRAG_COEFF_AREA_CDA * speedMs * speedMs;
    // Inertial acceleration force (along Y axis - longitudinal)
    const fInertia = VEHICLE_MASS_KG * accelerometer.y;

    const fPropulsion = fGravity + fRolling + fDrag + fInertia;
    
    let powerWatts = 0;
    if (fPropulsion >= 0) {
      // Drivetrain loss
      powerWatts = (fPropulsion * speedMs) / MOTOR_EFFICIENCY_ETA;
    } else {
      // Regenerative braking: capture portion of deceleration energy
      powerWatts = fPropulsion * speedMs * REGEN_EFFICIENCY;
    }

    // Wh per km: (Power in Watts / speed in km/h)
    // Clamp to reasonable limits to avoid infinity division issues at rest
    let energyWhKm = 0;
    if (speedKmh > 1) {
      energyWhKm = Math.max(-50, Math.min(300, powerWatts / speedKmh));
    }

    const frame: TelemetryFrame = {
      timestamp: Date.now(),
      latitude: lat,
      longitude: lng,
      speedKmh,
      rollDegrees: smoothedRollRef.current,
      pitchDegrees: smoothedPitchRef.current,
      leanAngleDegrees: leanAngle,
      verticalGForce: smoothedVertGRef.current,
      frictionCoefficient: smoothedFrictionRef.current,
      powerWatts,
      energyWhKm,
      inclinePct,
    };

    // Buffer and upload handling
    frameBufferRef.current.push(frame);
    setCurrentFrame(frame);

    // Sync buffer periodically or when size limit is hit
    const now = Date.now();
    const shouldSync = 
      frameBufferRef.current.length >= bufferSizeLimit || 
      (now - lastSyncTimeRef.current >= syncIntervalMs && frameBufferRef.current.length > 0);

    if (shouldSync && !syncMutation.isPending) {
      const payload = [...frameBufferRef.current];
      frameBufferRef.current = [];
      lastSyncTimeRef.current = now;
      syncMutation.mutate(payload);
    }
  };

  // ─── Simulated Device Motion (For Emulators / Web / Development) ─────────
  useEffect(() => {
    if (!simulationMode && !isSensorAvailable) return;
    if (!simulationMode) return;

    let simTime = 0;
    const interval = setInterval(() => {
      simTime += updateIntervalMs / 1000;
      
      // Simulate riding: speed oscillates, banking on curves, climbing steep road
      const activeSpeedKmh = speedRef.current > 0 ? speedRef.current : 25 + Math.sin(simTime * 0.5) * 10;
      const speedMs = activeSpeedKmh / 3.6;

      // Simulate a winding path: periodic rolling left and right
      const rollValue = Math.sin(simTime * 1.2) * 22; // up to 22 deg banks
      // Simulate hill profiles: pitch climbs and descents
      const pitchValue = Math.cos(simTime * 0.8) * 6; // up to 6 deg climbs (~10% incline)

      // Dynamic acceleration calculation derived from speed changes
      const accelX = (activeSpeedKmh / 15) * Math.cos(simTime * 1.2) * 1.5; // lateral forces
      const accelY = Math.cos(simTime * 0.5) * 0.8; // acceleration/braking
      // Add road bumps to vertical Z acceleration
      const accelZ = (Math.sin(simTime * 20) > 0.85 ? 4.5 : 0.0) + Math.random() * 0.5;

      const accelerometer = { x: accelX, y: accelY, z: accelZ };
      const rotation = { alpha: 0, beta: (pitchValue * Math.PI) / 180, gamma: (rollValue * Math.PI) / 180 };
      const accelIncGravity = { x: accelX, y: accelY, z: accelZ + GRAVITY_M_S2 };

      processSensorData(accelerometer, rotation, accelIncGravity);
    }, updateIntervalMs);

    return () => clearInterval(interval);
  }, [simulationMode, isSensorAvailable, updateIntervalMs, currentLocation]);

  // ─── Native Hardware Motion Sensors Setup ─────────────────────────────────
  useEffect(() => {
    if (simulationMode) return;

    let subscription: { remove: () => void } | null = null;

    const setupSensors = async () => {
      const isAvailable = await DeviceMotion.isAvailableAsync();
      setIsSensorAvailable(isAvailable);

      if (!isAvailable) {
        console.warn('[useTelemetry] DeviceMotion sensors are not available on this platform/simulator. Forcing simulationMode is recommended.');
        return;
      }

      const { status } = await DeviceMotion.requestPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        console.warn('[useTelemetry] DeviceMotion permissions denied.');
        return;
      }

      DeviceMotion.setUpdateInterval(updateIntervalMs);
      
      subscription = DeviceMotion.addListener((measurement: DeviceMotionMeasurement) => {
        // DeviceMotion exposes userAcceleration (without gravity), rotation rate, and euler rotation
        const accelerometer = measurement.acceleration || { x: 0, y: 0, z: 0 };
        const rotation = measurement.rotation || { alpha: 0, beta: 0, gamma: 0 };
        const accelIncGravity = measurement.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
        
        processSensorData(accelerometer, rotation, accelIncGravity);
      });
    };

    setupSensors();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [simulationMode, updateIntervalMs, currentLocation]);

  return {
    currentFrame,
    isSensorAvailable,
    hasPermission,
    isSyncing: syncMutation.isPending,
    bufferedCount: frameBufferRef.current.length,
    syncError: syncMutation.error,
  };
}
