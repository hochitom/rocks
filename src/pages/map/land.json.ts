import type { APIRoute } from 'astro';
import { landDots } from '../../lib/land-dots';

/** The globe's land dots, written once at build time as `/map/land.json`. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(landDots()), { headers: { 'Content-Type': 'application/json' } });
