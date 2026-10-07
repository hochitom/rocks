import type { APIRoute } from 'astro';
import states from 'us-atlas/states-10m.json';

/** The borders of the US states (TopoJSON), served from this site as `/map/states.json`. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify({ ...states, objects: { states: states.objects.states } }), {
    headers: { 'Content-Type': 'application/json' },
  });
