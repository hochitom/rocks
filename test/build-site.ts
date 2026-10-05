import { execFile } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { parse, type HTMLElement } from 'node-html-parser';

const run = promisify(execFile);
const root = resolve(import.meta.dirname, '..');

export interface BuiltSite {
  /** Parsed HTML of a page, by URL path (e.g. `/pins/hamburg-2019/`). */
  page(path: string): Promise<HTMLElement>;
  /** Raw content of any built file, by URL path (e.g. `/_astro/outline.1a2b3c.json`). */
  file(path: string): Promise<string>;
}

/**
 * Builds the site with the pins from `test/fixtures/<fixture>` instead of the real collection.
 * `env` sets extra environment variables for the build; the analytics token is never inherited from the shell.
 */
export async function buildSite(fixture: string, env: Record<string, string> = {}): Promise<BuiltSite> {
  const work = await mkdtemp(join(tmpdir(), 'hochitom-build-'));
  const outDir = join(work, 'dist');
  await run('npx', ['astro', 'build', '--outDir', outDir], {
    cwd: root,
    env: {
      ...process.env,
      // Vitest sets NODE_ENV=test and copies Vite's env (MODE, DEV, PROD, …) into process.env;
      // inherited by the build, they would turn it into a non-production build.
      NODE_ENV: 'production',
      MODE: undefined,
      DEV: undefined,
      PROD: undefined,
      SSR: undefined,
      BASE_URL: undefined,
      CLOUDFLARE_ANALYTICS_TOKEN: undefined,
      ...env,
      HOCHITOM_PINS_DIR: resolve(import.meta.dirname, 'fixtures', fixture),
      HOCHITOM_CACHE_DIR: join(work, 'cache'),
    },
  });
  return {
    async page(path) {
      const file = join(outDir, path, path.endsWith('/') ? 'index.html' : '');
      return parse(await readFile(file, 'utf8'));
    },
    async file(path) {
      return readFile(join(outDir, path), 'utf8');
    },
  };
}

/** Builds the site and returns the build's error output; fails if the build succeeds. */
export async function buildSiteExpectingFailure(fixture: string): Promise<string> {
  try {
    await buildSite(fixture);
  } catch (error) {
    const { stdout = '', stderr = '' } = error as { stdout?: string; stderr?: string };
    return stdout + stderr;
  }
  throw new Error(`Build with fixture "${fixture}" succeeded, but should have failed`);
}

/** Visible text of an element with whitespace collapsed. */
export const text = (el: HTMLElement | null | undefined) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
