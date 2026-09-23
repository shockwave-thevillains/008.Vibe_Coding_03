#!/usr/bin/env node
/**
 * Link checker untuk hasil build (dist/). Memeriksa semua href/src/srcset internal
 * — termasuk anchor #id — terhadap berkas yang benar-benar ada, dengan memperhitungkan `base`.
 *   npm run build && npm run check:links
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const config = readFileSync(new URL('../astro.config.mjs', import.meta.url), 'utf8');
const BASE = (config.match(/base:\s*'([^']*)'/)?.[1] ?? '').replace(/\/$/, '');
const SITE = config.match(/site:\s*'([^']*)'/)?.[1] ?? '';

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));
const idsCache = new Map();
function idsOf(file) {
  if (!idsCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    idsCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idsCache.get(file);
}

function pageUrl(file) {
  let rel = relative(DIST, file).split(sep).join('/');
  rel = rel.replace(/index\.html$/, '');
  return `${BASE}/${rel}`;
}

function resolveTarget(pathname) {
  if (!pathname.startsWith(BASE + '/') && pathname !== BASE) return { ok: false, why: `di luar base ${BASE}` };
  let p = decodeURIComponent(pathname.slice(BASE.length)).replace(/^\//, '');
  const candidates = [join(DIST, p), join(DIST, p, 'index.html')];
  for (const c of candidates) if (existsSync(c) && statSync(c).isFile()) return { ok: true, file: c };
  return { ok: false, why: 'berkas tidak ada' };
}

let checked = 0;
const failures = [];
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const from = pageUrl(file);
  const refs = [];
  for (const m of html.matchAll(/\s(?:href|src|poster)="([^"]*)"/g)) refs.push(m[1]);
  for (const m of html.matchAll(/\ssrcset="([^"]*)"/g)) for (const part of m[1].split(',')) refs.push(part.trim().split(/\s+/)[0]);
  for (const m of html.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) refs.push(m[2]);
  for (let ref of refs) {
    if (!ref || /^(mailto:|tel:|data:|javascript:)/.test(ref)) continue;
    if (SITE && ref.startsWith(SITE)) ref = ref.slice(SITE.length);
    if (/^[a-z]+:\/\//i.test(ref) || ref.startsWith('//')) continue; // eksternal
    const u = new URL(ref, 'http://x' + from);
    checked++;
    const target = u.pathname === from && ref.startsWith('#') ? { ok: true, file } : resolveTarget(u.pathname);
    if (!target.ok) {
      failures.push(`${relative(DIST, file)} → ${ref} (${target.why})`);
      continue;
    }
    if (u.hash && target.file.endsWith('.html')) {
      const id = decodeURIComponent(u.hash.slice(1));
      if (id && !idsOf(target.file).has(id)) failures.push(`${relative(DIST, file)} → ${ref} (anchor #${id} tidak ada)`);
    }
  }
}

console.log(`${htmlFiles.length} halaman, ${checked} tautan internal diperiksa.`);
if (failures.length) {
  console.error(`✗ ${failures.length} tautan rusak:\n` + [...new Set(failures)].map((f) => '  ' + f).join('\n'));
  process.exit(1);
}
console.log('✓ Semua tautan internal valid.');
