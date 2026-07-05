/**
 * Type shim for the platform-resolved `./RideMap` module.
 *
 * `RideMap` has two concrete implementations selected at bundle time:
 *   - RideMap.web.tsx    (Next.js / webpack — Mapbox GL JS)
 *   - RideMap.native.tsx (Expo / Metro — @rnmapbox/maps)
 *
 * Neither filename matches the bare `./RideMap` specifier under plain `tsc`,
 * which does not perform `.web`/`.native` suffix resolution. This declaration
 * gives `tsc --noEmit` a resolvable module with the shared signature, so the
 * `export { RideMap } from './RideMap'` in index.ts typechecks in isolation.
 * Bundlers ignore `.d.ts` files and always pick the matching platform source.
 */

import type { ReactElement } from 'react';
import type { RideMapProps } from './types';

export declare function RideMap(props: RideMapProps): ReactElement | null;
