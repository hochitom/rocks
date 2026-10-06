// Browser smoke test (spec, Testing Decisions): a production build of the example pins, served by
// `astro preview`, opened in headless Chromium. Run with `npm run test:browser`; the first time,
// install the browser with `npx playwright install chromium`.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4329;
const OUT_DIR = 'node_modules/.cache/browser-test/dist';
const env = {
  HOCHITOM_PINS_DIR: 'test/fixtures/pins',
  // Four missing pins (Praha, Amsterdam, München, Roma), so the globe shows hollow markers too.
  HOCHITOM_MISSING_DIR: 'test/fixtures/missing-pins/missing',
  // Its own cache, so it never shares Astro's temp files with a build of the real collection.
  HOCHITOM_CACHE_DIR: 'node_modules/.cache/browser-test/astro',
};

export default defineConfig({
  testDir: 'test/browser',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Software WebGL, so the 3D pin and the globe also run headless and without a GPU.
        launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
      },
    },
  ],
  webServer: {
    command: `npx astro build --outDir ${OUT_DIR} && npx astro preview --ignore-lock --outDir ${OUT_DIR} --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    env,
    timeout: 180_000,
    reuseExistingServer: false,
  },
});
