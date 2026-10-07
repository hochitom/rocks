/**
 * Small drawn maps for cards and the pin page: the countries in view, those I have been to a shade
 * lighter, a dot per cafe, optionally the US states and a route. Drawn at build time as SVG paths
 * (Natural Earth via `world-atlas` `countries-110m`, US states via `us-atlas`), so they need no script.
 */
import { geoMercator, geoPath } from 'd3-geo';
import type { Feature, Geometry, LineString, MultiPoint } from 'geojson';
import { feature, mesh } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import states from 'us-atlas/states-10m.json';
import countries from 'world-atlas/countries-110m.json';

const world = countries as unknown as Topology<{ countries: GeometryCollection }>;
const shapes = feature(world, world.objects.countries).features as Feature<Geometry>[];
const us = states as unknown as Topology<{ states: GeometryCollection }>;
const stateBorders = mesh(us, us.objects.states, (a, b) => a !== b);

type Place = { lat: number; lng: number };

export interface OutlineMap {
  width: number;
  height: number;
  /** All land in view. */
  land: string;
  /** The countries I have been to. */
  visited: string;
  /** Borders between US states, if asked for. */
  states: string;
  /** The route through the places given as `route`, if any. */
  route: string;
  /** The cafes in view, as points in the drawing; `focus` marks the one the map is about. */
  cafes: { x: number; y: number; focus: boolean }[];
}

interface Options {
  /** Map ids of the countries I have been to. */
  visited: string[];
  /** Places the map must show; it is fitted to them. */
  frame: Place[];
  /** Cafes to mark; those outside the frame are left out. */
  cafes?: Place[];
  /** The cafe the map is about, marked in its own way. */
  focus?: Place;
  /** Places joined by a dashed line, in this order. */
  route?: Place[];
  /** Never closer than this many degrees across, so a single cafe still shows its land. */
  minSpan?: number;
  withStates?: boolean;
  width?: number;
  height?: number;
}

export function outlineMap({
  visited,
  frame,
  cafes = frame,
  focus,
  route = [],
  minSpan = 36,
  withStates = false,
  width = 400,
  height = 220,
}: Options): OutlineMap {
  const lats = frame.map((place) => place.lat);
  const lngs = frame.map((place) => place.lng);
  const centre = [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
  const halfLng = Math.max(minSpan, Math.max(...lngs) - Math.min(...lngs)) / 2;
  const halfLat = Math.max(minSpan / 2, Math.max(...lats) - Math.min(...lats)) / 2;
  const box: MultiPoint = {
    type: 'MultiPoint',
    coordinates: [
      [centre[0] - halfLng, centre[1] - halfLat],
      [centre[0] + halfLng, centre[1] + halfLat],
    ],
  };
  const projection = geoMercator().fitExtent([[24, 20], [width - 24, height - 20]], box);
  projection.clipExtent([[0, 0], [width, height]]);
  const path = geoPath(projection).digits(1);
  const visitedIds = new Set(visited);
  const line: LineString = { type: 'LineString', coordinates: route.map(({ lat, lng }) => [lng, lat]) };
  const round = (value: number) => Math.round(value * 10) / 10;
  const same = (a: Place, b?: Place) => !!b && a.lat === b.lat && a.lng === b.lng;
  return {
    width,
    height,
    land: shapes.map((shape) => path(shape) ?? '').join(''),
    visited: shapes.filter((shape) => visitedIds.has(String(shape.id))).map((shape) => path(shape) ?? '').join(''),
    states: withStates ? path(stateBorders) ?? '' : '',
    route: route.length > 1 ? path(line) ?? '' : '',
    cafes: cafes
      .map((place) => {
        const [x, y] = projection([place.lng, place.lat])!;
        return { x: round(x), y: round(y), focus: same(place, focus) };
      })
      .filter(({ x, y }) => x >= 0 && x <= width && y >= 0 && y <= height),
  };
}
