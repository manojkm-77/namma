'use client';

/**
 * RideMap.web.tsx — Mapbox GL JS implementation of the shared <RideMap> for web
 * (Next.js admin dashboard). Backed by `react-map-gl` (v7) + `mapbox-gl`.
 *
 * Requirements (admin-dashboard):
 *   - deps:  react-map-gl@^7, mapbox-gl@^3
 *   - env:   NEXT_PUBLIC_MAPBOX_TOKEN
 *   - next.config: transpilePackages must include '@namma/ui'
 *
 * Contract: implements RideMapProps from ./types identically to the native
 * wrapper. Never throws on a missing token — renders an inline fallback notice.
 */

import { useCallback, useMemo, useRef } from 'react';
import Map, {
  Marker,
  Source,
  Layer,
  NavigationControl,
  type MapRef,
  type LayerProps,
  type MarkerEvent,
} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import {
  DEFAULT_FIT_PADDING,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAP_STYLE_URL,
  MARKER_COLORS,
  MAX_FIT_ZOOM,
  ROUTE_LINE_COLOR,
  type LatLng,
  type MarkerSpec,
  type RideMapProps,
} from './types';

const MAPBOX_TOKEN =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_MAPBOX_TOKEN : undefined;

/** Paint/layout for the route polyline. Kept module-level so it isn't re-created per render. */
const ROUTE_LAYER: LayerProps = {
  id: 'ride-route-line',
  type: 'line',
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: { 'line-color': ROUTE_LINE_COLOR, 'line-width': 4, 'line-opacity': 0.9 },
};

/** react-map-gl marker rotation renders the WHOLE glyph; only the arrow should spin. */
function MarkerGlyph({ marker }: { marker: MarkerSpec }) {
  const color = MARKER_COLORS[marker.kind] ?? MARKER_COLORS.user;
  const isVehicle = marker.kind === 'vehicle';
  const size = marker.selected ? 20 : 16;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
          border: `2px solid #ffffff`,
          boxShadow: marker.selected
            ? `0 0 0 3px ${color}55, 0 2px 6px rgba(0,0,0,0.35)`
            : '0 2px 6px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Vehicle heading: rotate the inner arrow via transform below, not the container.
        }}
      >
        {isVehicle ? (
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '3px solid transparent',
              borderRight: '3px solid transparent',
              borderBottom: '6px solid #ffffff',
              transform: `rotate(${marker.heading ?? 0}deg)`,
            }}
          />
        ) : (
          <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#ffffff' }} />
        )}
      </div>
      {marker.label ? (
        <span
          style={{
            marginTop: 3,
            padding: '1px 6px',
            fontSize: 9,
            fontWeight: 700,
            lineHeight: 1.4,
            color: '#0f172a',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
            whiteSpace: 'nowrap',
          }}
        >
          {marker.label}
        </span>
      ) : null}
    </div>
  );
}

/** Inline notice shown when the Mapbox token is absent — production code never crashes on config gaps. */
function MissingTokenFallback({ style }: { style?: RideMapProps['style'] }) {
  return (
    <div
      role="alert"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 240,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        textAlign: 'center',
        padding: 24,
        color: '#64748b',
        backgroundColor: '#f8fafc',
        border: '1px dashed #cbd5e1',
        borderRadius: 12,
        ...(style as Record<string, string | number> | undefined),
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>Map unavailable</span>
      <span style={{ fontSize: 11, maxWidth: 260 }}>
        Set <code style={{ fontWeight: 700 }}>NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable the live map.
      </span>
    </div>
  );
}

export function RideMap({
  markers = [],
  route,
  camera,
  interactive = true,
  onReady,
  onMarkerPress,
  style,
  testID,
}: RideMapProps) {
  const mapRef = useRef<MapRef>(null);

  // GeoJSON LineString for the route, rebuilt only when the route points change.
  const routeGeoJSON = useMemo<GeoJSON.Feature<GeoJSON.LineString> | null>(() => {
    if (!route || route.length < 2) return null;
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: route.map((p) => [p.longitude, p.latitude]),
      },
    };
  }, [route]);

  // Initial camera only — subsequent changes are applied imperatively in `applyCamera`
  // so react-map-gl stays uncontrolled and user gestures aren't fought.
  const initialViewState = useMemo(() => {
    const center = camera?.center ?? markers[0]?.coord ?? route?.[0] ?? DEFAULT_MAP_CENTER;
    return {
      longitude: center.longitude,
      latitude: center.latitude,
      zoom: camera?.zoom ?? DEFAULT_MAP_ZOOM,
      pitch: camera?.pitch ?? 0,
      bearing: camera?.bearing ?? 0,
    };
  }, [camera, markers, route]);

  // Apply declarative camera intent: bounds win over center. Called on load and
  // whenever `camera` changes (via the effect below wired to onLoad + key deps).
  const applyCamera = useCallback(
    (target = camera) => {
      const map = mapRef.current;
      if (!map || !target) return;

      const boundPts: LatLng[] | undefined =
        target.bounds && target.bounds.length >= 2 ? target.bounds : undefined;

      if (boundPts) {
        const lngs = boundPts.map((c) => c.longitude);
        const lats = boundPts.map((c) => c.latitude);
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: target.padding ?? DEFAULT_FIT_PADDING, maxZoom: MAX_FIT_ZOOM, duration: 600 }
        );
        return;
      }

      if (target.center) {
        map.easeTo({
          center: [target.center.longitude, target.center.latitude],
          zoom: target.zoom ?? DEFAULT_MAP_ZOOM,
          pitch: target.pitch ?? 0,
          bearing: target.bearing ?? 0,
          duration: 600,
        });
      }
    },
    [camera]
  );

  const handleLoad = useCallback(() => {
    applyCamera();
    onReady?.();
  }, [applyCamera, onReady]);

  const handleMarkerClick = useCallback(
    (marker: MarkerSpec, event: MarkerEvent<MouseEvent>) => {
      // Prevent the click from falling through to the map (which would deselect/pan).
      event.originalEvent?.stopPropagation();
      onMarkerPress?.(marker);
    },
    [onMarkerPress]
  );

  const containerStyle = useMemo(
    () => ({
      position: 'relative' as const,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      ...(style as Record<string, string | number> | undefined),
    }),
    [style]
  );

  // Config gap, not a runtime error: render an inline notice instead of crashing the dashboard.
  if (!MAPBOX_TOKEN) {
    return (
      <div data-testid={testID} style={containerStyle}>
        <MissingTokenFallback style={style} />
      </div>
    );
  }

  return (
    <div data-testid={testID} style={containerStyle}>
      <Map
        ref={mapRef}
        reuseMaps
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAP_STYLE_URL}
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        interactive={interactive}
        dragPan={interactive}
        scrollZoom={interactive}
        doubleClickZoom={interactive}
        dragRotate={interactive}
        touchZoomRotate={interactive}
        attributionControl={false}
        onLoad={handleLoad}
      >
        {interactive ? <NavigationControl position="top-right" showCompass={false} /> : null}

        {routeGeoJSON ? (
          <Source id="ride-route" type="geojson" data={routeGeoJSON}>
            <Layer {...ROUTE_LAYER} />
          </Source>
        ) : null}

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            longitude={marker.coord.longitude}
            latitude={marker.coord.latitude}
            anchor="center"
            onClick={(event) => handleMarkerClick(marker, event)}
          >
            <MarkerGlyph marker={marker} />
          </Marker>
        ))}
      </Map>
    </div>
  );
}
