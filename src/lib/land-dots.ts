/**
 * The continents of the globe as dots, computed at build time from Natural Earth's land
 * (`world-atlas` `land-110m`), so the browser needs no map data or service of its own.
 */
import { geoBounds, geoContains } from 'd3-geo';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import land from 'world-atlas/land-110m.json';

/** Grid spacing in degrees; along each latitude the dots are spread evenly around its circumference. */
const STEP = 1.25;
/** Beyond this latitude the dots would crowd together at the poles. */
const MAX_LAT = 84;

/** Land dots as a flat list `[lat, lng, lat, lng, …]`, rounded to 0.01°. */
export function landDots(): number[] {
  const topology = land as unknown as Topology<{ land: GeometryCollection }>;
  const { features } = feature(topology, topology.objects.land);
  // One feature per land mass, each with its bounding box, so a dot is only tested against nearby shapes.
  const masses = features.flatMap((f) => splitPolygons(f.geometry as Polygon | MultiPolygon)).map((mass) => ({
    mass,
    bounds: geoBounds(mass),
  }));

  const dots: number[] = [];
  for (let row = Math.ceil(-MAX_LAT / STEP); row <= Math.floor(MAX_LAT / STEP); row++) {
    const lat = row * STEP;
    const count = Math.max(1, Math.round((360 * Math.cos((lat * Math.PI) / 180)) / STEP));
    // Every other row shifted by half a step, so the dots don't line up in columns.
    const shift = Math.abs(row) % 2 === 0 ? 0 : 0.5;
    for (let i = 0; i < count; i++) {
      const lng = -180 + ((i + shift) * 360) / count;
      const onLand = masses.some(({ mass, bounds }) => within(bounds, lat, lng) && geoContains(mass, [lng, lat]));
      if (onLand) dots.push(round(lat), round(lng));
    }
  }
  return dots;
}

function splitPolygons(geometry: Polygon | MultiPolygon): Feature<Polygon>[] {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return polygons.map((coordinates) => ({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates } }));
}

/** Whether a point lies in a d3 bounding box, which crosses the antimeridian when west > east. */
function within([[west, south], [east, north]]: [[number, number], [number, number]], lat: number, lng: number) {
  if (lat < south || lat > north) return false;
  return west <= east ? lng >= west && lng <= east : lng >= west || lng <= east;
}

const round = (value: number) => Math.round(value * 100) / 100;
