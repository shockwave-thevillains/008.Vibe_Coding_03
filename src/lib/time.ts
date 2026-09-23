import { locales, type Lang } from '../i18n/ui';
import { useTranslations } from '../i18n/utils';

/**
 * Tahun acuan untuk nilai `startYearsAgo`/`endYearsAgo` pada era manusia.
 * Untuk era geologi, selisih beberapa tahun tidak berpengaruh.
 */
export const REFERENCE_YEAR = 2026;

/** Di bawah ambang ini, rentang waktu ditampilkan sebagai tahun kalender (SM/M). */
export const CALENDAR_THRESHOLD = 10_000;

export type TimeMode = 'ago' | 'calendar';

export function timeMode(startYearsAgo: number): TimeMode {
  return startYearsAgo >= CALENDAR_THRESHOLD ? 'ago' : 'calendar';
}

export function formatNumber(n: number, lang: Lang): string {
  return new Intl.NumberFormat(locales[lang], { maximumFractionDigits: 0 }).format(Math.round(n));
}

/** Angka besar untuk counter: "251.902.000" atau tahun kalender "3.200". */
export function counterValue(yearsAgo: number, mode: TimeMode): number {
  return mode === 'ago' ? yearsAgo : REFERENCE_YEAR - yearsAgo;
}

/** Satuan di samping counter: "tahun lalu" / "SM" / "M" / "kini". */
export function counterUnit(value: number, mode: TimeMode, lang: Lang, isNow = false): string {
  const t = useTranslations(lang);
  if (isNow) return t('time.now');
  if (mode === 'ago') return t('time.yearsAgo');
  return value <= 0 ? t('time.bce') : t('time.ce');
}

/** Tampilan counter (angka saja). Tahun SM ditampilkan positif. */
export function counterText(value: number, mode: TimeMode, lang: Lang): string {
  if (mode === 'calendar') {
    // Tahun kalender tanpa pemisah ribuan. Nilai ≤ 0 berarti SM (mis. -800 → 800 SM);
    // selisih satu tahun karena tidak adanya tahun 0 diabaikan, semua angka ini perkiraan.
    return String(Math.abs(Math.round(value)));
  }
  return formatNumber(value, lang);
}

/** Durasi manusiawi: 50 juta tahun, 11,7 ribu tahun, 75 tahun. */
export function humanSpan(years: number, lang: Lang): string {
  const t = useTranslations(lang);
  const fmt = (n: number, digits: number) =>
    new Intl.NumberFormat(locales[lang], { maximumFractionDigits: digits }).format(n);
  if (years >= 1_000_000) {
    const m = years / 1_000_000;
    return `${fmt(m, m < 10 ? 1 : 0)} ${t('time.million')} ${t('time.years')}`;
  }
  if (years >= 10_000) {
    const k = years / 1000;
    return `${fmt(k, k < 100 ? 1 : 0)} ${t('time.thousand')} ${t('time.years')}`;
  }
  return `${fmt(Math.round(years), 0)} ${t('time.years')}`;
}

/** Posisi 0..1 pada skala logaritmik (0 = tertua di atas, 1 = kini). */
export const LOG_MAX = Math.log10(260_000_000);
export function logPosition(yearsAgo: number): number {
  const v = Math.log10(Math.max(yearsAgo, 1));
  return 1 - v / LOG_MAX;
}
