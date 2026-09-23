import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type Era = CollectionEntry<'eras'>;

/** "id/trias" → "trias" */
export function eraSlug(entry: Era): string {
  return entry.id.split('/').slice(1).join('/');
}

export function eraLang(entry: Era): Lang {
  return entry.id.split('/')[0] as Lang;
}

/** Semua era untuk satu bahasa, urut kronologis (field `order`). */
export async function getEras(lang: Lang): Promise<Era[]> {
  const all = await getCollection('eras', (e) => e.id.startsWith(`${lang}/`));
  return all.sort((a, b) => a.data.order - b.data.order);
}

/**
 * Tempat penyimpanan keadaan globe per era: umur rekonstruksi paleogeografi (juta tahun lalu)
 * yang dipakai globe. Era manusia memakai garis pantai modern (0 Ma).
 */
export const globeStateBySlug: Record<string, number> = {
  trias: 230,
  jura: 170,
  kapur: 100,
  paleogen: 50,
  neogen: 15,
};
export function globeStateFor(slug: string): number {
  return globeStateBySlug[slug] ?? 0;
}

/** Sudut rotasi globe (radian) untuk gambar statis tiap era — memperlihatkan wilayah yang relevan. */
export const stillRotationBySlug: Record<string, number> = {
  trias: 4.5,
  jura: 4.5,
  kapur: 4.4,
  paleogen: 3.4,
  neogen: 4.2,
  pleistosen: 2.6,
  neolitik: 3.7,
  'peradaban-awal': 4.0,
  klasik: 3.9,
  'abad-pertengahan': 2.9,
  renaisans: 4.5,
  'revolusi-industri': 4.6,
  'abad-20': 5.3,
  'era-digital': 2.7,
  'era-ai': 4.3,
};

/** Era yang menampilkan lampu kota & busur koneksi di globe. */
export const citiesEras = new Set(['era-digital', 'era-ai']);
