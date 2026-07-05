import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ViewStyle, TouchableOpacity } from 'react-native';
import Svg, { Path, LinearGradient, Stop, Circle, Defs } from 'react-native-svg';
import { RouteCoordinate } from '../lib/routingEngine';

// Safe require for `@rnmapbox/maps` to prevent crashes in unsupported platforms/Expo Go
let MapboxGL: any = null;
try {
  MapboxGL = require('@rnmapbox/maps').default;
  if (MapboxGL) {
    MapboxGL.setAccessToken(
      process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ||
      'pk.eyJ1IjoibWFub2praSIsImEiOiJjbTBoZDN3ZmgwMGNpMmxzYWU2Z25ydjRvIn0.fallback-token'
    );
  }
} catch (e) {
  console.warn('[TerrainMap] Mapbox GL Native is not supported on this device/environment. Loading fallback map.');
}

interface TerrainMapProps {
  route: RouteCoordinate[];
  currentLocation: RouteCoordinate & { speedKmh: number } | null;
  leanAngle: number;
  frictionCoefficient: number;
  energyWhKm: number;
  surfaceCondition: 'asphalt' | 'gravel' | 'dirt';
  style?: ViewStyle;
}

export default function TerrainMap({
  route,
  currentLocation,
  leanAngle,
  frictionCoefficient,
  energyWhKm,
  surfaceCondition,
  style,
}: TerrainMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [useFallback, setUseFallback] = useState(!MapboxGL);

  useEffect(() => {
    if (MapboxGL) {
      MapboxGL.setTelemetryEnabled(false);
    }
  }, []);

  // Compute elevation boundaries for the route
  const elevationStats = useMemo(() => {
    if (route.length === 0) return { min: 0, max: 100, range: 100 };
    const elevations = route.map((c) => c.elevation ?? 0);
    const min = Math.min(...elevations);
    const max = Math.max(...elevations);
    return {
      min,
      max,
      range: Math.max(10, max - min),
    };
  }, [route]);

  // Find index of the coordinate closest to the current vehicle location to draw tracking indicator
  const currentRouteIndex = useMemo(() => {
    if (!currentLocation || route.length === 0) return 0;
    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < route.length; i++) {
      const latDiff = route[i].latitude - currentLocation.latitude;
      const lngDiff = route[i].longitude - currentLocation.longitude;
      const d = latDiff * latDiff + lngDiff * lngDiff;
      if (d < minDistance) {
        minDistance = d;
        closestIndex = i;
      }
    }
    return closestIndex;
  }, [route, currentLocation]);

  // Renders the SVG elevation profile graph
  const renderElevationProfile = () => {
    if (route.length < 2) return null;

    const screenWidth = Dimensions.get('window').width - 48; // padding
    const height = 90;
    const padding = 10;
    const chartHeight = height - padding * 2;

    const points = route.map((coord, index) => {
      const x = (index / (route.length - 1)) * screenWidth;
      const elev = coord.elevation ?? 0;
      const y = height - padding - ((elev - elevationStats.min) / elevationStats.range) * chartHeight;
      return { x, y };
    });

    // Create line path
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x} ${points[i].y}`;
    }

    // Create area path closed at the bottom for gradient fill
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    // Active position coordinates
    const activePoint = points[currentRouteIndex] || points[0];
    const activeElev = route[currentRouteIndex]?.elevation ?? 0;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Altitude Profile</Text>
          <Text style={styles.chartValue}>
            {activeElev.toFixed(0)}m <Text style={styles.chartSubText}>({elevationStats.min.toFixed(0)}m - {elevationStats.max.toFixed(0)}m)</Text>
          </Text>
        </View>

        <Svg width={screenWidth} height={height} style={styles.svg}>
          <Defs>
            <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#fbbf24" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Area Fill */}
          <Path d={areaPath} fill="url(#gradient)" />

          {/* Line Path */}
          <Path d={linePath} fill="none" stroke="#fbbf24" strokeWidth="2.5" />

          {/* Active Vehicle Position Dot */}
          <Circle cx={activePoint.x} cy={activePoint.y} r="5" fill="#ffffff" />
          <Circle cx={activePoint.x} cy={activePoint.y} r="9" fill="none" stroke="#fbbf24" strokeWidth="2" />
        </Svg>
      </View>
    );
  };

  // GeoJSON data for the route line
  const routeGeoJSON = useMemo(() => {
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: route.map((c) => [c.longitude, c.latitude]),
      },
    };
  }, [route]);

  // Fallback 3D Grid Mock Map for emulator/web runs
  const renderFallbackMap = () => {
    const lat = currentLocation?.latitude ?? 12.275;
    const lng = currentLocation?.longitude ?? 76.668;
    const angleY = Math.max(-30, Math.min(30, leanAngle));

    return (
      <View style={[styles.fallbackContainer, style]}>
        {/* Dynamic visual flight grid replicating a 3D radar space */}
        <View style={styles.fallbackHeader}>
          <Text style={styles.fallbackTitle}>3D Radar Grid Simulation</Text>
          <Text style={styles.fallbackSub}>Mapbox GL Native not loaded on host. Simulation active.</Text>
        </View>

        <View style={styles.gridSpace}>
          {/* Animated Perspective Lines */}
          <View style={styles.horizonLine} />
          <View style={styles.verticalHorizonLine} />

          {/* Dynamic route drawing on SVG */}
          <Svg style={StyleSheet.absoluteFillObject}>
            {/* Draw a stylized perspective path for the route */}
            <Path
              d={`M 50 250 Q 150 120 180 80 T 320 50`}
              fill="none"
              stroke={surfaceCondition === 'asphalt' ? '#fbbf24' : surfaceCondition === 'gravel' ? '#38bdf8' : '#ec4899'}
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.8"
            />
          </Svg>

          {/* Vehicle position cursor with dynamic tilt */}
          <View
            style={[
              styles.vehicleCursor,
              {
                transform: [
                  { rotate: `${angleY}deg` },
                  { scale: 1.1 },
                ],
              },
            ]}
          >
            <Text style={styles.cursorArrow}>🛵</Text>
            <View style={[styles.telemetryTag, { backgroundColor: frictionCoefficient > 0.8 ? '#ef4444' : '#10b981' }]}>
              <Text style={styles.telemetryTagText}>{leanAngle.toFixed(1)}° Lean</Text>
            </View>
          </View>

          {/* Interactive Toggle for Development */}
          <TouchableOpacity style={styles.togglePlatformButton} onPress={() => setUseFallback(!useFallback)}>
            <Text style={styles.toggleButtonText}>Toggle Engine View</Text>
          </TouchableOpacity>
        </View>

        {renderElevationProfile()}
      </View>
    );
  };

  if (useFallback || !MapboxGL) {
    return renderFallbackMap();
  }

  // Centering coordinates
  const centerCoordinate = currentLocation
    ? [currentLocation.longitude, currentLocation.latitude]
    : route.length > 0
    ? [route[0].longitude, route[0].latitude]
    : [76.6394, 12.2958];

  return (
    <View style={[styles.container, style]}>
      <MapboxGL.MapView
        style={StyleSheet.absoluteFillObject}
        styleURL="mapbox://styles/mapbox/dark-v11"
        onDidFinishLoadingMap={() => setMapReady(true)}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapboxGL.Camera
          zoomLevel={15.2}
          centerCoordinate={centerCoordinate}
          pitch={58} // 3D Camera Pitch tilt
          heading={90 + (currentLocation?.speedKmh ?? 0) * 0.5} // heading shifts with vehicle motion
          animationDuration={800}
        />

        {/* ── 3D Terrain DEM Configuration ── */}
        <MapboxGL.RasterDemSource
          id="mapbox-dem"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
        >
          <MapboxGL.Terrain exaggeration={1.5} />
        </MapboxGL.RasterDemSource>

        {mapReady && (
          <>
            {/* ── Route Shape Source and Custom Path Layer ── */}
            <MapboxGL.ShapeSource id="route-source" shape={routeGeoJSON}>
              <MapboxGL.LineLayer
                id="route-layer"
                style={{
                  lineColor: surfaceCondition === 'asphalt' ? '#fbbf24' : surfaceCondition === 'gravel' ? '#38bdf8' : '#ec4899',
                  lineWidth: 5.5,
                  lineCap: 'round',
                  lineJoin: 'round',
                  lineOpacity: 0.85,
                }}
              />
            </MapboxGL.ShapeSource>

            {/* ── Dynamic Tilting Vehicle Marker ── */}
            {currentLocation && (
              <MapboxGL.PointAnnotation
                id="vehicle-location"
                coordinate={[currentLocation.longitude, currentLocation.latitude]}
              >
                <View
                  style={[
                    styles.mapboxVehicleMarker,
                    {
                      transform: [{ rotate: `${leanAngle}deg` }],
                    },
                  ]}
                >
                  <View style={styles.markerChassis}>
                    <Text style={{ fontSize: 22 }}>🛵</Text>
                  </View>
                  <View
                    style={[
                      styles.markerTractionPulse,
                      {
                        borderColor: frictionCoefficient > 0.8 ? '#ef4444' : '#fbbf24',
                      },
                    ]}
                  />
                </View>
              </MapboxGL.PointAnnotation>
            )}
          </>
        )}
      </MapboxGL.MapView>

      {/* Floating dynamic analytics widgets */}
      <View style={styles.floatingStats}>
        <View style={styles.statBubble}>
          <Text style={styles.statBubbleLabel}>Energy</Text>
          <Text style={styles.statBubbleValue}>{energyWhKm.toFixed(1)} Wh/km</Text>
        </View>
        <View style={styles.statBubble}>
          <Text style={styles.statBubbleLabel}>Friction (μ)</Text>
          <Text style={styles.statBubbleValue}>{frictionCoefficient.toFixed(2)}</Text>
        </View>
      </View>

      {/* Dynamic altitude profile overlay */}
      {renderElevationProfile()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2d2d2d',
    position: 'relative',
  },
  chartContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  chartTitle: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chartValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  chartSubText: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '500',
  },
  svg: {
    borderRadius: 8,
  },
  floatingStats: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBubble: {
    backgroundColor: 'rgba(17, 17, 17, 0.95)',
    borderWidth: 1,
    borderColor: '#2d2d2d',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statBubbleLabel: {
    color: '#6b7280',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statBubbleValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  // Mapbox Native custom marker styling
  mapboxVehicleMarker: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerChassis: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1c1c1c',
    borderWidth: 2,
    borderColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  markerTractionPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    opacity: 0.3,
  },
  // Fallback simulator layouts
  fallbackContainer: {
    flex: 1,
    backgroundColor: '#121212',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  fallbackHeader: {
    padding: 16,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#2b2b2b',
  },
  fallbackTitle: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  fallbackSub: {
    color: '#6b7280',
    fontSize: 10,
    marginTop: 2,
  },
  gridSpace: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  horizonLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#262626',
    top: '50%',
  },
  verticalHorizonLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: '#262626',
    left: '50%',
  },
  vehicleCursor: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cursorArrow: {
    fontSize: 40,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  telemetryTag: {
    position: 'absolute',
    top: 45,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  telemetryTagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  togglePlatformButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
});
