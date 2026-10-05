// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://hochitom.rocks',
  // Tests build into their own directories so parallel builds don't share a cache.
  cacheDir: process.env.HOCHITOM_CACHE_DIR ?? './node_modules/.astro',
});
