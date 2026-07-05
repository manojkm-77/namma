/**
 * RideMap.native.tsx — @rnmapbox/maps implementation of the shared <RideMap>
 * for the Expo rider/driver apps. Metro resolves this file for the bare
 * `./RideMap` specifier on native platforms.
 *
 * Requirements (rider + driver apps):
 *   - deps: @rnmapbox/maps@^10
 *   - env:  EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
 *   - app.json: @rnmapbox/maps config plugin (dev build / EAS; not Expo Go)
 *
 * Contract: implements RideMapProps from ./types identically to RideMap.web.tsx.
 * Coordinate flip to Mapbox's [lng, lat] ordering is contained entirely in this
 * file. Never crashes on a missing token — renders an inline fallback view.
 */

import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Mapbox, {
  Camera,
  LineLayer,
  MapView,
  PointAnnotation,
  ShapeSource,
  UserLocation,
} from '@rnmapbox/maps';

import {
  DEFAULT_FIT_PADDING,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAP_STYLE_URL,
  MARKER_COLORS,
  ROUTE_LINE_COLOR,
  type LatLng,
  type MarkerSpec,
  type RideMapProps,
} from './types';

/** Shared contract point -> Mapbox tuple. Single conversion boundary for native. */
const toLngLat = (p: LatLng): [number, number] => [p.longitude, p.latitude];

/**
 * Configure the SDK token exactly once at module load. Wrapped in try/catch so a
 * missing/invalid token (or an environment where the native module is degraded)
 * degrades to the fallback view instead of throwing during render.
 */
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
let tokenReady = false;
try {
  if (MAPBOX_TOKEN) {
    Mapbox.setAccessToken(MAPBOX_TOKEN);
    Mapbox.setTelemetryEnabled(false);
    tokenReady = true;
  }
} catch {
  tokenReady = false;
}

/** Route GeoJSON feature (module-typed to keep ShapeSource happy). */
type RouteFeature = {
  type: 'Feature';
  properties: Record<string, never>;
  geometry: { type: 'LineString'; coordinates: [number, number][] };
};

export function RideMap({
  markers = [],
  route,
  camera,
  interactive = true,
  showUserLocation = false,
  onReady,
  onMarkerPress,
  style,
  testID,
}: RideMapProps) {
  // Resolve declarative camera intent into Mapbox <Camera> props.
  // Precedence matches the web wrapper: bounds (>= 2 pts) win over center.
  const cameraProps = useMemo(() => {
    const boundPts: LatLng[] | undefined =
      camera?.bounds && camera.bounds.length >= 2 ? camera.bounds : undefined;

    if (boundPts) {
      const lngs = boundPts.map((c) => c.longitude);
      const lats = boundPts.map((c) => c.latitude);
      const pad = camera?.padding ?? DEFAULT_FIT_PADDING;
      return {
        bounds: {
          ne: [Math.max(...lngs), Math.max(...lats)] as [number, number],
          sw: [Math.min(...lngs), Math.min(...lats)] as [number, number],
          paddingTop: pad,
          paddingBottom: pad,
          paddingLeft: pad,
          paddingRight: pad,
        },
        animationDuration: 600,
      };
    }

    const center = camera?.center ?? markers[0]?.coord ?? route?.[0] ?? DEFAULT_MAP_CENTER;
    return {
      centerCoordinate: toLngLat(center),
      zoomLevel: camera?.zoom ?? DEFAULT_MAP_ZOOM,
      pitch: camera?.pitch ?? 0,
      heading: camera?.bearing ?? 0,
      animationDuration: 600,
    };
  }, [camera, markers, route]);

  const routeShape = useMemo<RouteFeature | null>(() => {
    if (!route || route.length < 2) return null;
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: route.map(toLngLat) },
    };
  }, [route]);

  const handleMapReady = useCallback(() => {
    onReady?.();
  }, [onReady]);

  const containerStyle = useMemo(
    () => [styles.container, style as unknown as ViewStyle],
    [style]
  );

  // Config gap, not a runtime error: render an inline notice instead of crashing.
  if (!tokenReady) {
    return (
      <View testID={testID} style={[containerStyle, styles.fallback]}>
        <Text style={styles.fallbackTitle}>Map unavailable</Text>
        <Text style={styles.fallbackBody}>
          Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to enable the live map.
        </Text>
      </View>
    );
  }

  return (
    <View testID={testID} style={containerStyle}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        styleURL={MAP_STYLE_URL}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        logoEnabled={false}
        attributionEnabled={false}
        onDidFinishLoadingMap={handleMapReady}
      >
        <Camera {...cameraProps} />

        {showUserLocation ? <UserLocation visible /> : null}

        {routeShape ? (
          <ShapeSource id="ride-route" shape={routeShape}>
            <LineLayer
              id="ride-route-line"
              style={{
                lineColor: ROUTE_LINE_COLOR,
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
                lineOpacity: 0.9,
              }}
            />
          </ShapeSource>
        ) : null}

        {markers.map((marker) => (
          <PointAnnotation
            key={marker.id}
            id={marker.id}
            coordinate={toLngLat(marker.coord)}
            onSelected={() => onMarkerPress?.(marker)}
          >
            <MarkerGlyph marker={marker} />
          </PointAnnotation>
        ))}
      </MapView>
    </View>
  );
}

/** Native marker glyph. Vehicle rotates an inner arrow to its heading; others show a dot. */
function MarkerGlyph({ marker }: { marker: MarkerSpec }) {
  const color = MARKER_COLORS[marker.kind] ?? MARKER_COLORS.user;
  const isVehicle = marker.kind === 'vehicle';
  const size = marker.selected ? 20 : 16;

  return (
    <View style={styles.markerWrap}>
      <View
        style={[
          styles.markerDot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          marker.selected ? { shadowColor: color, shadowOpacity: 0.5, shadowRadius: 4 } : null,
        ]}
      >
        {isVehicle ? (
          <View style={[styles.arrow, { transform: [{ rotate: `${marker.heading ?? 0}deg` }] }]} />
        ) : (
          <View style={styles.innerDot} />
        )}
      </View>
      {marker.label ? (
        <View style={styles.labelChip}>
          <Text style={styles.labelText} numberOfLines={1}>
            {marker.label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  fallbackTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 4,
  },
  fallbackBody: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 260,
  },
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ffffff',
  },
  innerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ffffff',
  },
  labelChip: {
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
  },
  labelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0f172a',
  },
});
