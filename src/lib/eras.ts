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
