#!/usr/bin/env node
/**
 * Render gambar globe statis per era → src/assets/globe/<slug>.jpg
 * Dipakai sebagai fallback (tanpa WebGL / reduced-motion) dan gambar halaman detail.
 *
 *   npm run render:globe            # menjalankan astro dev sendiri
 *   BASE_URL=http://localhost:4321/008.Vibe_Coding_03 npm run render:globe   # pakai server yang sudah jalan
 *
 * Butuh Chromium untuk Playwright (PLAYWRIGHT_CHROMIUM atau browser bawaan Playwright).
 */
import { spawn } from 'node:child_process';
import { readdirSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const root = new URL('..', import.meta.url);
const slugs = readdirSync(new URL('src/content/eras/id/', root)).map((f) => f.replace(/\.md$/, ''));
const outDir = new URL('src/assets/globe/', root);
mkdirSync(outDir, { recursive: true });

let server;
let base = process.env.BASE_URL;
if (!base) {
  const port = 4411;
  server = spawn('npx', ['astro', 'dev', '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((resolve) => server.stdout.on('data', (d) => /running|localhost/i.test(String(d)) && resolve()));
  base = `http://localhost:${port}/008.Vibe_Coding_03`;
}

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
try {
  for (const slug of slugs) {
    await page.goto(`${base}/dev/globe/${slug}/`, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: 'canvas#c{width:1000px!important;height:1000px!important}' });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForSelector('body[data-ready="1"]', { timeout: 60_000 });
    await page.waitForTimeout(250);
    const path = new URL(`${slug}.jpg`, outDir).pathname;
    await page.locator('canvas#c').screenshot({ path, type: 'jpeg', quality: 90 });
    console.log('✓', slug);
  }
} finally {
  await browser.close();
  server?.kill();
}
