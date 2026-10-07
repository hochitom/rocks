import type { APIRoute } from 'astro';
import countries from 'world-atlas/countries-50m.json';

/** The map's country shapes (Natural Earth, TopoJSON), served from this site as `/map/countries.json`. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(countries), { headers: { 'Content-Type': 'application/json' } });
