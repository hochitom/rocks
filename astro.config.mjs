// @ts-check
import { resolve } from 'node:path';
import { defineConfig } from 'astro/config';
import { PINS_DIR } from './src/pins-dir.mjs';

export default defineConfig({
  site: 'https://hochitom.rocks',
  // Tests build into their own directories so parallel builds don't share a cache.
  cacheDir: process.env.HOCHITOM_CACHE_DIR ?? './node_modules/.astro',
  vite: {
    // Lets the Katalog import each pin's assets, wherever the pins live.
    resolve: { alias: { '@pins': resolve(PINS_DIR) } },
  },
});
