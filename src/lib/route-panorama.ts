/**
 * The whole tour as one line across a flat world, for the footer: the land, a lifted arc from each stop
 * to the next (they read as flights) and a dot per cafe. Drawn at build time as SVG, so it needs no script.
 */
import { geoEquirectangular, geoPath } from 'd3-geo';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { feature } from 'topojson-client';
import land from 'world-atlas/land-110m.json';

type Place = { lat: number; lng: number };

export interface RoutePanorama {
  width: number;
  height: number;
  land: string;
  /** One quadratic arc per leg, in visit order. */
  arcs: string[];
  pins: { x: number; y: number }[];
  /** Cafes I left without a pin. */
  missing: { x: number; y: number }[];
}

const world = land as unknown as Topology<{ land: GeometryCollection }>;
const WIDTH = 1440;
const HEIGHT = 300;
// The far north and south are cut off: no cafe is there, and the band stays wide and low.
const projection = geoEquirectangular().fitExtent([[0, -40], [WIDTH, HEIGHT + 90]], { type: 'Sphere' });
const landPath = geoPath(projection).digits(1)(feature(world, world.objects.land)) ?? '';

const round = (n: number) => Math.round(n * 10) / 10;
const point = ({ lat, lng }: Place) => {
  const [x, y] = projection([lng, lat])!;
  return { x: round(x), y: round(y) };
};

/** `route`: the stops in visit order; `pins` and `missing`: the cafes to mark. */
export function routePanorama(route: Place[], pins: Place[], missing: Place[]): RoutePanorama {
  const arcs = route.slice(1).map((stop, i) => {
    const a = point(route[i]);
    const b = point(stop);
    const lift = Math.min(90, Math.hypot(b.x - a.x, b.y - a.y) * 0.22);
    return `M${a.x} ${a.y}Q${round((a.x + b.x) / 2)} ${round((a.y + b.y) / 2 - lift)} ${b.x} ${b.y}`;
  });
  return { width: WIDTH, height: HEIGHT, land: landPath, arcs, pins: pins.map(point), missing: missing.map(point) };
}
