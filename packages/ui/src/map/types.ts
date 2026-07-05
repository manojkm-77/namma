/**
 * @namma/ui/map — shared, platform-agnostic map contract.
 *
 * This module contains NO platform imports (no react-native, no mapbox-gl).
 * It is the single source of truth that both `RideMap.web.tsx` (Mapbox GL JS,
 * consumed by the Next.js admin dashboard) and `RideMap.native.tsx`
 * (@rnmapbox/maps, consumed by the Expo rider/driver apps) implement.
 *
 * Coordinate convention across the whole platform is { latitude, longitude }.
 * Vendor SDKs that expect [longitude, latitude] tuples MUST convert at their
 * own boundary — never leak tuple ordering into shared code.
 */

/** A geographic point. Latitude/longitude in decimal degrees (WGS84). */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * Semantic role of a marker. Drives glyph + color; keeps callers from having
 * to know vendor styling. Add new kinds here and both wrappers must handle them.
 */
export type MarkerKind = 'vehicle' | 'pickup' | 'drop' | 'user';

/** A single renderable marker. `id` must be stable across re-renders for React keys and animation. */
export interface MarkerSpec {
  /** Stable unique id (e.g. driver id, `pickup`, `drop`). Used as React key. */
  id: string;
  /** Position of the marker. */
  coord: LatLng;
  /** Semantic role — controls color and glyph. */
  kind: MarkerKind;
  /**
   * Compass heading in degrees clockwise from north (0–360).
   * Only honored for `kind: 'vehicle'`; rotates the glyph to face travel direction.
   */
  heading?: number;
  /** Optional short label rendered beside the marker (e.g. license plate). */
  label?: string;
  /** Visually emphasize this marker (e.g. selected in a list). */
  selected?: boolean;
}

/**
 * Declarative camera intent. Precedence when multiple fields are set:
 *   1. `bounds` (>= 2 points)  -> fit all points into the viewport with `padding`.
 *   2. `center`                -> ease to center at `zoom`/`pitch`/`bearing`.
 * If neither is set, the map keeps its current/initial camera.
 */
export interface CameraTarget {
  /** Ease the camera to this point. Ignored when `bounds` has >= 2 points. */
  center?: LatLng;
  /** Fit these points into view (e.g. [pickup, drop, ...drivers]). */
  bounds?: LatLng[];
  /** Zoom level (Mapbox scale, ~0–22). Applied with `center`. */
  zoom?: number;
  /** Camera tilt in degrees (0 = top-down). Applied with `center`. */
  pitch?: number;
  /** Camera rotation in degrees clockwise from north. Applied with `center`. */
  bearing?: number;
  /** Inset in pixels kept between fitted `bounds` and the viewport edges. */
  padding?: number;
}

/**
 * Cross-platform container style. Intentionally the narrow intersection that is
 * valid for both a DOM style object and a React Native style object, so a single
 * `style` prop threads through both wrappers. Each wrapper casts to its native
 * style type at its own boundary.
 */
export type MapContainerStyle = Record<string, string | number>;

/** Props implemented identically by `RideMap.web.tsx` and `RideMap.native.tsx`. */
export interface RideMapProps {
  /** Markers to render. Defaults to `[]`. */
  markers?: MarkerSpec[];
  /** Ordered points forming a route polyline. Rendered when length >= 2. */
  route?: LatLng[];
  /** Declarative camera intent. See {@link CameraTarget}. */
  camera?: CameraTarget;
  /** When false, disables pan/zoom/rotate gestures (display-only map). Defaults to true. */
  interactive?: boolean;
  /**
   * Show the device's live location puck. Native-only hint (@rnmapbox);
   * ignored by the web wrapper, which has no device location.
   */
  showUserLocation?: boolean;
  /** Fired once the underlying map has finished loading. */
  onReady?: () => void;
  /** Fired when a marker is tapped/clicked, with the originating {@link MarkerSpec}. */
  onMarkerPress?: (marker: MarkerSpec) => void;
  /** Container style (size, radius, etc.). */
  style?: MapContainerStyle;
  /** Optional test id forwarded to the outer container. */
  testID?: string;
}

/* ------------------------------------------------------------------------- *
 * Shared constants — plain values, safe on every platform.
 * ------------------------------------------------------------------------- */

/** Default map center: Mysuru city center (primary launch region). */
export const DEFAULT_MAP_CENTER: LatLng = { latitude: 12.2958, longitude: 76.6394 };

/** Default zoom used when no camera zoom is supplied. */
export const DEFAULT_MAP_ZOOM = 12;

/** Maximum zoom applied when auto-fitting bounds, so two close points don't over-zoom. */
export const MAX_FIT_ZOOM = 16;

/** Default pixel inset kept around fitted bounds. */
export const DEFAULT_FIT_PADDING = 60;

/** Shared Mapbox style URL used by every surface for visual consistency. */
export const MAP_STYLE_URL = 'mapbox://styles/mapbox/light-v11';

/** Canonical marker colors by kind. Both wrappers must source colors from here. */
export const MARKER_COLORS: Record<MarkerKind, string> = {
  vehicle: '#f59e0b', // amber  — moving driver
  pickup: '#10b981', // emerald — origin
  drop: '#ef4444', // red     — destination
  user: '#3b82f6', // blue    — rider/self
};

/** Color of the route polyline (indigo), shared across platforms. */
export const ROUTE_LINE_COLOR = '#6366f1';
