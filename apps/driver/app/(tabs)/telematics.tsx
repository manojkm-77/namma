import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTelemetry } from '../../src/hooks/useTelemetry';
import TerrainMap from '../../src/components/TerrainMap';
import {
  calculateAdjustedRoute,
  generateMockElevationRoute,
} from '../../src/lib/routingEngine';

export default function TelematicsDashboard() {
  // Generate the Chamundi Hill spiral route profile around Mysuru
  const mockRoute = useMemo(() => generateMockElevationRoute(), []);

  // Controls for simulation and surface settings
  const [surfaceCondition, setSurfaceCondition] = useState<'asphalt' | 'gravel' | 'dirt'>('asphalt');
  const [simulationActive, setSimulationActive] = useState(true);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);

  // Run the physics-based routing engine for the chosen road surface condition
  const routingAnalysis = useMemo(() => {
    // base vehicle velocity set to 42 km/h
    return calculateAdjustedRoute(mockRoute, surfaceCondition, 42);
  }, [mockRoute, surfaceCondition]);

  // Handle vehicle route tracking step
  useEffect(() => {
    if (!simulationActive) return;

    const interval = setInterval(() => {
      setCurrentPointIndex((prevIndex) => {
        // Loop when reaching the end of the route coordinates
        if (prevIndex >= mockRoute.length - 1) return 0;
        return prevIndex + 1;
      });
    }, 1000); // Progress along the path every second

    return () => clearInterval(interval);
  }, [simulationActive, mockRoute]);

  // Extract the active vehicle coordinate on the elevation profile
  const activeCoordinate = useMemo(() => {
    return mockRoute[currentPointIndex] || mockRoute[0];
  }, [mockRoute, currentPointIndex]);

  // Current vehicle speed depends on surface friction limits & motor power solver
  const simulatedSpeed = useMemo(() => {
    const currentSegment = routingAnalysis.segments[currentPointIndex];
    return currentSegment ? currentSegment.adjustedSpeedKmh : 42;
  }, [routingAnalysis, currentPointIndex]);

  // Input location parameters to stream telemetry processing
  const currentLocationPayload = useMemo(() => {
    return {
      latitude: activeCoordinate.latitude,
      longitude: activeCoordinate.longitude,
      speedKmh: simulatedSpeed,
      elevation: activeCoordinate.elevation,
    };
  }, [activeCoordinate, simulatedSpeed]);

  // Activate IMU sensor streaming and physics calculations
  const { currentFrame, isSensorAvailable } = useTelemetry(currentLocationPayload, {
    simulationMode: simulationActive,
    updateIntervalMs: 200, // sample sensors at 5Hz rate
  });

  // Calculate visual gauges variables
  const telemetry = currentFrame || {
    leanAngleDegrees: 0,
    rollDegrees: 0,
    pitchDegrees: 0,
    verticalGForce: 1.0,
    frictionCoefficient: 0.0,
    powerWatts: 0,
    energyWhKm: 0,
    inclinePct: 0,
  };

  const delaySeconds = routingAnalysis.adjustedDurationSeconds - routingAnalysis.originalDurationSeconds;
  const delayMinutes = Math.max(0, delaySeconds / 60);

  return (
    <View style={styles.outerContainer}>
      {/* ── Title Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>VEHICLE TELEMATICS CORE</Text>
          <Text style={styles.headerTitle}>Gravity & 3D Routing</Text>
        </View>
        <View style={styles.sensorStatusBadge}>
          <View
            style={[
              styles.statusIndicatorDot,
              { backgroundColor: isSensorAvailable || simulationActive ? '#10b981' : '#f59e0b' },
            ]}
          />
          <Text style={styles.sensorStatusText}>
            {simulationActive ? 'SIMULATION' : isSensorAvailable ? 'IMU SENSORS' : 'NO IMU'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── 3D Terrain Map wrapper ── */}
        <View style={styles.mapCard}>
          <TerrainMap
            route={mockRoute}
            currentLocation={{
              latitude: activeCoordinate.latitude,
              longitude: activeCoordinate.longitude,
              elevation: activeCoordinate.elevation,
              speedKmh: simulatedSpeed,
            }}
            leanAngle={telemetry.rollDegrees}
            frictionCoefficient={telemetry.frictionCoefficient}
            energyWhKm={telemetry.energyWhKm}
            surfaceCondition={surfaceCondition}
            style={styles.mapView}
          />
        </View>

        {/* ── Controls Segment ── */}
        <View style={styles.panel}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Enable Telematics Simulation</Text>
              <Text style={styles.switchSubText}>Simulate sensor polling & path motion</Text>
            </View>
            <Switch
              value={simulationActive}
              onValueChange={setSimulationActive}
              trackColor={{ false: '#374151', true: '#10b981' }}
              thumbColor="#ffffff"
            />
          </View>

          <Text style={styles.sectionHeading}>Road Surface Conditions</Text>
          <View style={styles.surfaceButtonGroup}>
            {(['asphalt', 'gravel', 'dirt'] as const).map((type) => {
              const active = surfaceCondition === type;
              const colorMap = { asphalt: '#fbbf24', gravel: '#38bdf8', dirt: '#ec4899' };
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSurfaceCondition(type)}
                  style={[
                    styles.surfaceButton,
                    active && {
                      backgroundColor: 'rgba(251, 191, 36, 0.1)',
                      borderColor: colorMap[type],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.surfaceButtonText,
                      active && { color: colorMap[type], fontWeight: '900' },
                    ]}
                  >
                    {type.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Primary Telemetry Gauges ── */}
        <View style={styles.gaugesContainer}>
          {/* Lean Angle Gauge */}
          <View style={styles.gaugeCard}>
            <Text style={styles.gaugeLabel}>Lean Angle</Text>
            <View style={styles.leanDialContainer}>
              <View
                style={[
                  styles.leanDialPointer,
                  { transform: [{ rotate: `${telemetry.rollDegrees}deg` }] },
                ]}
              />
              <Text style={styles.gaugeValue}>{telemetry.leanAngleDegrees.toFixed(1)}°</Text>
            </View>
            <Text style={styles.gaugeSubText}>
              Pitch: {telemetry.pitchDegrees.toFixed(0)}° ({telemetry.inclinePct.toFixed(1)}% slope)
            </Text>
          </View>

          {/* Dynamic G-Force Gauge */}
          <View style={styles.gaugeCard}>
            <Text style={styles.gaugeLabel}>Vertical Load</Text>
            <Text
              style={[
                styles.gForceValue,
                { color: Math.abs(telemetry.verticalGForce - 1) > 0.15 ? '#f59e0b' : '#ffffff' },
              ]}
            >
              {telemetry.verticalGForce.toFixed(2)} G
            </Text>
            <View style={styles.gForceBarContainer}>
              <View
                style={[
                  styles.gForceBarFill,
                  { width: `${Math.min(100, (telemetry.verticalGForce / 2) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.gaugeSubText}>Target Load: 1.00 G</Text>
          </View>
        </View>

        {/* ── Secondary Diagnostics Row ── */}
        <View style={styles.gaugesContainer}>
          {/* Dynamic Utilized Friction */}
          <View style={styles.gaugeCard}>
            <Text style={styles.gaugeLabel}>Traction Coefficient</Text>
            <Text
              style={[
                styles.gaugeValueLarge,
                { color: telemetry.frictionCoefficient > 0.8 ? '#ef4444' : '#10b981' },
              ]}
            >
              {telemetry.frictionCoefficient.toFixed(2)} μ
            </Text>
            <Text style={styles.gaugeSubText}>
              {telemetry.frictionCoefficient > 0.85
                ? '⚠️ TRACTION SLIP HAZARD'
                : telemetry.frictionCoefficient > 0.5
                ? 'Moderate Lateral Slip'
                : 'Optimal Friction Profile'}
            </Text>
          </View>

          {/* Energy Consumption Wh/km */}
          <View style={styles.gaugeCard}>
            <Text style={styles.gaugeLabel}>Energy Demand</Text>
            <Text
              style={[
                styles.gaugeValueLarge,
                { color: telemetry.energyWhKm < 0 ? '#10b981' : '#fbbf24' },
              ]}
            >
              {telemetry.energyWhKm.toFixed(1)} <Text style={styles.unitText}>Wh/km</Text>
            </Text>
            <Text style={styles.gaugeSubText}>
              {telemetry.energyWhKm < 0 ? '🔋 REGENERATING POWER' : `Power Draw: ${telemetry.powerWatts.toFixed(0)}W`}
            </Text>
          </View>
        </View>

        {/* ── Dynamic Routing Analytics comparison ── */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Terrain-Aware Routing Statistics</Text>

          <View style={styles.routingComparisonRow}>
            <View style={styles.routingStatBlock}>
              <Text style={styles.routingStatLabel}>Standard Routing</Text>
              <Text style={styles.routingStatValue}>
                {(routingAnalysis.originalDurationSeconds / 60).toFixed(1)}m
              </Text>
              <Text style={styles.routingStatSub}>Base flat-terrain calculation</Text>
            </View>

            <View style={styles.routingStatDivider} />

            <View style={styles.routingStatBlock}>
              <Text style={styles.routingStatLabel}>Gravity Engine ETA</Text>
              <Text style={[styles.routingStatValue, { color: '#fbbf24' }]}>
                {(routingAnalysis.adjustedDurationSeconds / 60).toFixed(1)}m
              </Text>
              <Text style={styles.routingStatSub}>
                {delayMinutes > 0.1 ? `+${delayMinutes.toFixed(1)}m elevation drag` : 'Zero grade penalty'}
              </Text>
            </View>
          </View>

          {/* Route profile summary specs */}
          <View style={styles.routeSpecGrid}>
            <View style={styles.routeSpecCell}>
              <Text style={styles.specLabel}>Total Distance</Text>
              <Text style={styles.specValue}>
                {(routingAnalysis.totalDistanceMeters / 1000).toFixed(2)} km
              </Text>
            </View>
            <View style={styles.routeSpecCell}>
              <Text style={styles.specLabel}>Cum. Elevation Gain</Text>
              <Text style={[styles.specValue, { color: '#ef4444' }]}>
                +{routingAnalysis.totalElevationGainMeters.toFixed(0)}m
              </Text>
            </View>
            <View style={styles.routeSpecCell}>
              <Text style={styles.specLabel}>Cum. Elevation Loss</Text>
              <Text style={[styles.specValue, { color: '#10b981' }]}>
                -{routingAnalysis.totalElevationLossMeters.toFixed(0)}m
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#111111',
    paddingTop: 54,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerSubtitle: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  sensorStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2d2d2d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  sensorStatusText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  mapCard: {
    height: 310,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mapView: {
    flex: 1,
  },
  panel: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2d2d2d',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d2d',
    marginBottom: 12,
  },
  switchLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  switchSubText: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeading: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  surfaceButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  surfaceButton: {
    flex: 1,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2d2d2d',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  surfaceButtonText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
  },
  gaugesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gaugeCard: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2d2d2d',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  leanDialContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#333333',
    borderTopColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  leanDialPointer: {
    position: 'absolute',
    width: 4,
    height: 36,
    backgroundColor: '#fbbf24',
    top: 0,
    borderRadius: 2,
  },
  gaugeValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    zIndex: 2,
    backgroundColor: '#1e1e1e',
    paddingHorizontal: 4,
  },
  gaugeValueLarge: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 4,
  },
  unitText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
  },
  gaugeSubText: {
    color: '#6b7280',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  gForceValue: {
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 4,
  },
  gForceBarContainer: {
    width: '80%',
    height: 5,
    backgroundColor: '#333333',
    borderRadius: 3,
    marginTop: 8,
  },
  gForceBarFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 3,
  },
  panelTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 16,
  },
  routingComparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d2d',
    marginBottom: 16,
  },
  routingStatBlock: {
    flex: 1,
    alignItems: 'center',
  },
  routingStatLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  routingStatValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
  },
  routingStatSub: {
    color: '#9ca3af',
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },
  routingStatDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#2d2d2d',
  },
  routeSpecGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routeSpecCell: {
    flex: 1,
    alignItems: 'center',
  },
  specLabel: {
    color: '#6b7280',
    fontSize: 9,
    fontWeight: '700',
  },
  specValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
});
