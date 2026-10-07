// Smoke test in the browser (spec, Testing Decisions): home with its globe, a detail page, the map and
// a continent load without JavaScript errors and respond; without WebGL the fallbacks show (photo instead
// of the 3D pin, the hero without its globe), without JavaScript the map's list of cafes. Runs against a
// production build of the example pins (see playwright.config.ts).
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
  test('the home page loads without errors and turns the globe to the newest pin', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/');
    await expect(page.locator('.hero')).toHaveClass(/\bis-live\b/);
    await expect(page.locator('.hero .globe-stage canvas')).toBeVisible(MODEL_TIMEOUT);
    // Six cafes and side finds' places with pins, four missing pins as rings.
    await expect(page.locator('.hero .globe-marker')).toHaveCount(10);
    await expect(page.locator('.hero .globe-marker.missing')).toHaveCount(4);
    await expect(page.locator('.hero .globe-marker.is-current')).toHaveAccessibleName('Hamburg, 1 pin');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('Older and Newer travel from pin to pin, and so do the arrow keys', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/');
    const hero = page.locator('.hero');
    await expect(hero.locator('.hero-steps')).toBeVisible();
    await hero.getByRole('button', { name: /^Older/ }).click();
    await expect(hero.locator('.hero-title')).toHaveText('Hard Rock Cafe Vienna');
    await expect(hero.locator('.hero-city')).toHaveText('Vienna');
    await expect(hero.locator('.step-count')).toHaveText('2 / 7');
    await expect(hero.locator('.globe-marker.is-current')).toHaveAccessibleName('Vienna, 1 pin');
    await hero.getByRole('button', { name: /^Older/ }).press('ArrowLeft');
    await expect(hero.locator('.step-count')).toHaveText('1 / 7');
    await expect(hero.getByRole('button', { name: /^Newer/ })).toBeDisabled();
    // A thumbnail in the strip jumps straight to its pin.
    await hero.getByRole('link', { name: 'Tokyo, March 2009' }).click();
    await expect(hero.locator('.hero-title')).toHaveText('Hard Rock Cafe Tokyo');
    await expect(hero.getByRole('button', { name: /^Older/ })).toBeDisabled();
    expect(page.url()).toMatch(/\/$/);
    expect(errors).toEqual([]);
  });

  test('the globe leaves scrolling to the page: no zooming, no dragging, on screen or on touch', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('.hero .globe-stage canvas');
    await expect(canvas).toBeVisible(MODEL_TIMEOUT);
    expect(await canvas.evaluate((el) => getComputedStyle(el).touchAction)).toBe('auto');
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 400);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });

  test('a detail page loads without errors and shows the 3D pin', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(detail);
    await expect(page.locator('main pin-viewer')).toHaveAttribute('data-state', '3d', MODEL_TIMEOUT);
    await expect(page.locator('main pin-viewer canvas')).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('the map', () => {
  test('loads without errors and marks every cafe on the countries', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/map/');
    await expect(page.locator('.pin-map')).toHaveClass(/\bis-live\b/);
    await expect(page.locator('.map-marker')).toHaveCount(10);
    await expect(page.locator('.map-marker.missing')).toHaveCount(4);
    await expect(page.locator('.cafe-list')).toBeHidden();
    // Countries and states arrive by fetch after the start.
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.leaflet-shapes-pane path').first()).toBeAttached();
    expect(errors).toEqual([]);
  });

  test('shows a cafe’s pins in a card, and Older steps to the next cafe', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/map/');
    await page.getByRole('button', { name: 'Orlando, 2 pins' }).click();
    const card = page.locator('.map-card');
    await expect(card).toBeVisible();
    await expect(card.locator('.card-title strong')).toHaveText('Orlando');
    await expect(card.getByRole('link')).toHaveCount(2);
    expect(page.url()).toContain('?pin=orlando-2012-2');
    await expect(card.locator('.step-count')).toHaveText('5 / 6');
    await card.getByRole('button', { name: 'Older' }).click();
    await expect(card.locator('.card-title strong')).toHaveText('Tokyo');
    await expect(card.getByRole('button', { name: 'Older' })).toBeDisabled();
    expect(errors).toEqual([]);
  });

  test('a missing pin says there is no pin yet and points to unfinished business', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/map/');
    // At world zoom Praha lies under München: the keyboard reaches every marker anyway.
    const praha = page.getByRole('button', { name: 'Praha, no pin yet' });
    await praha.focus();
    await praha.press('Enter');
    const card = page.locator('.map-card');
    await expect(card).toContainText('Visited 2008, no pin yet.');
    await expect(card.getByRole('link', { name: 'Unfinished business' })).toHaveAttribute('href', '/#unfinished-business');
    expect(errors).toEqual([]);
  });

  test('a detail page’s link opens the map at its cafe', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/map/?pin=tokyo-2009');
    await expect(page.locator('.map-card .card-title strong')).toHaveText('Tokyo');
    expect(errors).toEqual([]);
  });

  test('a continent page marks a pin’s cafe while the pin is pointed at', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/map/europe/');
    await expect(page.locator('.map-marker:not(.missing)')).toHaveCount(4);
    await page.getByRole('link', { name: /Vienna/ }).hover();
    await expect(page.locator('.map-marker.is-pointed')).toHaveAccessibleName('Vienna, 1 pin');
    expect(errors).toEqual([]);
  });

  test('without JavaScript, lists the cafes instead', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/map/');
    await expect(page.locator('.cafe-list')).toBeVisible();
    await expect(page.locator('.cafe-list > li')).toHaveCount(10);
    await context.close();
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

    test('the hero goes on without the globe: card, strip and Older/Newer still work, from the first paint', async ({ page }) => {
      const errors = watchErrors(page);
      // Whether the globe can run is decided before the first paint, so the layout must never jump.
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.hero')).not.toHaveClass(/\bis-live\b/);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.hero')).not.toHaveClass(/\bis-live\b/);
      await expect(page.locator('.hero .globe-stage canvas')).toHaveCount(0);
      await page.locator('.hero').getByRole('button', { name: /^Older/ }).click();
      await expect(page.locator('.hero .hero-title')).toHaveText('Hard Rock Cafe Vienna');
      expect(errors).toEqual([]);
    });
  });
}

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const path of ['/', '/map/', '/map/europe/', detail, '/tour/']) {
    test(`${path} fits the screen, without scrolling sideways`, async ({ page }) => {
      await page.goto(path);
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width).toBeLessThanOrEqual(375);
    });
  }

  test('the home page shows all pins two to a row', async ({ page }) => {
    await page.goto('/');
    const columns = await page.locator('ul[aria-label="All pins"]').evaluate((list) => getComputedStyle(list).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(2);
  });
});
