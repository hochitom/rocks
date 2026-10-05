import type { APIRoute } from 'astro';
import { getCatalog } from '../../lib/catalog';
import { sitePreview } from '../../lib/preview-image';

export const GET: APIRoute = async () => {
  const { pins, stats } = await getCatalog();
  return new Response(new Uint8Array(await sitePreview(pins, stats)), {
    headers: { 'Content-Type': 'image/png' },
  });
};
