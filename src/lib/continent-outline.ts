/**
 * A small drawn map of a continent for its card: the countries around its cafes, those I have been to
 * a shade lighter, and a dot per cafe. Drawn at build time as SVG paths (Natural Earth, `countries-110m`).
 */
import { geoMercator, geoPath } from 'd3-geo';
import type { Feature, Geometry, MultiPoint } from 'geojson';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import countries from 'world-atlas/countries-110m.json';

const topology = countries as unknown as Topology<{ countries: GeometryCollection }>;
const shapes = feature(topology, topology.objects.countries).features as Feature<Geometry>[];

/** Never closer than this many degrees across, so a continent with one cafe still shows its land. */
const MIN_SPAN = 36;

export interface ContinentOutline {
  width: number;
  height: number;
  /** All land in view. */
  land: string;
  /** The countries I have been to. */
  visited: string;
  /** The cafes, as points in the drawing. */
  cafes: { x: number; y: number }[];
}

export function continentOutline(
  places: { lat: number; lng: number }[],
  visitedIds: string[],
  width = 400,
  height = 220,
): ContinentOutline {
  const lats = places.map((place) => place.lat);
  const lngs = places.map((place) => place.lng);
  const centre = [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
  const halfLng = Math.max(MIN_SPAN, Math.max(...lngs) - Math.min(...lngs)) / 2;
  const halfLat = Math.max(MIN_SPAN / 2, Math.max(...lats) - Math.min(...lats)) / 2;
  const frame: MultiPoint = {
    type: 'MultiPoint',
    coordinates: [
      [centre[0] - halfLng, centre[1] - halfLat],
      [centre[0] + halfLng, centre[1] + halfLat],
    ],
  };
  const projection = geoMercator().fitExtent([[24, 20], [width - 24, height - 20]], frame);
  projection.clipExtent([[0, 0], [width, height]]);
  const path = geoPath(projection).digits(1);
  const visited = new Set(visitedIds);
  return {
    width,
    height,
    land: shapes.map((shape) => path(shape) ?? '').join(''),
    visited: shapes.filter((shape) => visited.has(String(shape.id))).map((shape) => path(shape) ?? '').join(''),
    cafes: places.map(({ lat, lng }) => {
      const [x, y] = projection([lng, lat])!;
      return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    }),
  };
}
