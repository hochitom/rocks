// Smoke test in the browser (spec, Testing Decisions): home, a detail page and the globe load without
// JavaScript errors; without WebGL the fallbacks show (photo instead of the 3D pin, cafe list instead
// of the globe). Runs against a production build of the example pins (see playwright.config.ts).
import { expect, test, type Page } from '@playwright/test';

/** Collects console errors and uncaught exceptions of the page. */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  return errors;
}

/** Makes the browser report no WebGL at all, or no WebGL 2 (WebGL 1 still works). */
async function withoutWebGL(page: Page, contexts: Array<'webgl' | 'webgl2'>) {
  await page.addInitScript((blocked: string[]) => {
    const getContext = HTMLCanvasElement.prototype.getContext as (this: HTMLCanvasElement, ...args: unknown[]) => unknown;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        return blocked.includes(type) ? null : getContext.call(this, type, ...rest);
      },
    });
  }, contexts);
}

const detail = '/pins/hamburg-2019/';
/** Software WebGL is slow: building the model can take a few seconds. */
const MODEL_TIMEOUT = { timeout: 30_000 };

test.describe('with WebGL', () => {
  test('the home page loads without errors and puts a pin in the case', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/');
    await expect(page.locator('.hero pin-viewer')).toHaveAttribute('data-state', '3d', MODEL_TIMEOUT);
    await expect(page.locator('.banner .filters')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('a detail page loads without errors and shows the 3D pin', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(detail);
    await expect(page.locator('main pin-viewer')).toHaveAttribute('data-state', '3d', MODEL_TIMEOUT);
    await expect(page.locator('main pin-viewer canvas')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('the map loads without errors and shows the globe with its markers', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/map/');
    await expect(page.locator('.globe-view')).toHaveClass(/\bis-live\b/);
    await expect(page.locator('.globe-stage canvas')).toBeVisible();
    await expect(page.locator('.globe-marker')).toHaveCount(10);
    await expect(page.locator('.globe-marker.missing')).toHaveCount(4);
    await expect(page.locator('.cafe-list')).toBeHidden();
    // Land dots arrive by fetch after the start; give a failure there a moment to show.
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('a missing pin on the globe says there is no pin yet and points to unfinished business', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/map/');
    const praha = page.getByRole('button', { name: 'Praha, no pin yet' });
    // It may be on the back of the globe, where it can't be clicked by pointer: click it directly.
    await praha.evaluate((marker: HTMLElement) => marker.click());
    const card = page.locator('#cafe-card');
    await expect(card).toBeVisible();
    await expect(card).toContainText('Hard Rock Cafe Praha · visited 2008 · no pin yet');
    await expect(card.getByRole('link', { name: 'Unfinished business' })).toHaveAttribute('href', '/#unfinished-business');
    expect(errors).toEqual([]);
  });
});

for (const [name, blocked] of [
  ['without WebGL', ['webgl', 'webgl2']],
  ['with WebGL 1 only (Three.js needs WebGL 2)', ['webgl2']],
] as const) {
  test.describe(name, () => {
    test.beforeEach(({ page }) => withoutWebGL(page, [...blocked]));

    test('the detail page shows the cut-out photo instead of the 3D pin', async ({ page }) => {
      const errors = watchErrors(page);
      await page.goto(detail);
      const viewer = page.locator('main pin-viewer');
      await expect(viewer).toHaveAttribute('data-state', 'photo');
      await expect(viewer.getByRole('img', { name: 'Hard Rock Cafe Hamburg pin' })).toBeVisible();
      await expect(viewer.locator('canvas')).toHaveCount(0);
      expect(errors).toEqual([]);
    });

    test('the map shows the list of cafes instead of the globe, from the first paint', async ({ page }) => {
      const errors = watchErrors(page);
      // Whether the globe can run is decided before the first paint, so the list must never be swapped out.
      await page.goto('/map/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.globe-view')).not.toHaveClass(/\bis-live\b/);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.globe-view')).not.toHaveClass(/\bis-live\b/);
      await expect(page.locator('.cafe-list')).toBeVisible();
      await expect(page.locator('.cafe-list > li')).toHaveCount(10);
      await expect(page.locator('.globe-stage canvas')).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  });
}
