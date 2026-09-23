import type { Lang } from '../i18n/ui';

/**
 * Semua URL internal WAJIB lewat helper ini supaya tetap benar di GitHub Pages
 * yang memakai subpath (`base`). BASE_URL diawali "/" dan (dengan trailingSlash
 * "always") diakhiri "/" — kita normalkan agar aman di kedua kasus.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');

/** Path relatif situs, mis. "id/era/trias/" → "/008.Vibe_Coding_03/id/era/trias/". */
export function withBase(path = ''): string {
  const clean = path.replace(/^\/+/, '');
  return BASE + clean;
}

export function homeUrl(lang: Lang, hash?: string): string {
  return withBase(`${lang}/`) + (hash ? `#${hash}` : '');
}

export function eraUrl(lang: Lang, slug: string): string {
  return withBase(`${lang}/era/${slug}/`);
}

export function erasIndexUrl(lang: Lang): string {
  return withBase(`${lang}/era/`);
}

/** Ganti segmen bahasa pada path (tanpa base) untuk mendapat halaman padanan. */
export function swapLang(pathname: string, to: Lang): string {
  const rel = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname.replace(/^\//, '');
  const parts = rel.split('/');
  parts[0] = to;
  return withBase(parts.join('/'));
}

export function absoluteUrl(path: string, site: URL | undefined): string {
  return site ? new URL(path, site).toString() : path;
}
