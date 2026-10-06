import type { APIRoute } from 'astro';
import { touchIcon } from '../lib/logo';

export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await touchIcon()), {
    headers: { 'Content-Type': 'image/png' },
  });
