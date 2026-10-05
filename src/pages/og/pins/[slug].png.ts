import type { APIRoute, GetStaticPaths } from 'astro';
import { getCatalog, type CatalogPin } from '../../../lib/catalog';
import { pinPreview } from '../../../lib/preview-image';

export const getStaticPaths = (async () => {
  const { pins } = await getCatalog();
  return pins.map((pin) => ({ params: { slug: pin.slug }, props: { pin } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) =>
  new Response(new Uint8Array(await pinPreview((props as { pin: CatalogPin }).pin)), {
    headers: { 'Content-Type': 'image/png' },
  });
