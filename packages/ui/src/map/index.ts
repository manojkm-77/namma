/**
 * @namma/ui/map — public entry point for the shared map primitive.
 *
 * Consumers import from here and never touch a vendor SDK directly:
 *
 *   import { RideMap, type MarkerSpec } from '@namma/ui/map';
 *
 * `./RideMap` is a platform-resolved module: the web bundler (Next.js) picks
 * `RideMap.web.tsx`, Metro (Expo) picks `RideMap.native.tsx`. Both files export
 * a `RideMap` component with the identical `RideMapProps` surface, so callers
 * write one JSX tree that runs everywhere.
 *
 * This barrel is deliberately separate from the root `@namma/ui` barrel
 * (`../index.ts`) so that web-only (`mapbox-gl`) and native-only
 * (`@rnmapbox/maps`) dependencies are never pulled into the wrong bundle.
 */

export * from './types';
export { RideMap } from './RideMap';
export { useLiveDrivers } from './hooks/useLiveDrivers';
