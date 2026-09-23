/**
 * Token motion — satu-satunya sumber durasi & easing di situs ini.
 * Dipakai oleh: CSS (lewat custom properties `--dur-*`, `--ease-*`, disuntikkan di BaseLayout),
 * GSAP (nama ease GSAP di `gsapEase`), dan animasi View Transitions Astro.
 *
 * Prinsip: lambat, halus, tanpa pantulan. Keluarga expo/power4 "out".
 */
export const duration = {
  /** micro-interaction: hover, fokus */
  micro: 240,
  /** garis glow menyala perlahan */
  glow: 700,
  /** reveal teks / elemen */
  reveal: 1100,
  /** perpindahan warna aksen antar-era */
  accent: 1400,
  /** transisi antarhalaman */
  page: 650,
  /** intro beranda (batas keras ≤ 3000 ms) */
  intro: 2600,
  /** counter angka waktu */
  counter: 1800,
} as const;

/** Kurva CSS (cubic-bezier) — padanan kurva GSAP di bawah. */
export const ease = {
  /** expo.out */
  expoOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** power4.out (quart out) */
  power4Out: 'cubic-bezier(0.25, 1, 0.5, 1)',
  /** power2.inOut untuk crossfade */
  inOut: 'cubic-bezier(0.45, 0, 0.55, 1)',
} as const;

export const gsapEase = {
  expoOut: 'expo.out',
  power4Out: 'power4.out',
  inOut: 'power2.inOut',
  linear: 'none',
} as const;

/** Parallax & stagger — dalam piksel / detik. */
export const layer = {
  parallax: 60,
  stagger: 0.12,
} as const;

/** Globe */
export const globe = {
  /** radian per detik */
  spin: 0.06,
  /** detik sebelum kembali berputar otomatis setelah di-drag */
  resumeAfter: 1.6,
} as const;

/** Custom properties untuk disuntikkan ke :root. */
export function motionCssVars(): string {
  const d = Object.entries(duration)
    .map(([k, v]) => `--dur-${k}:${v}ms;`)
    .join('');
  const e = Object.entries(ease)
    .map(([k, v]) => `--ease-${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${v};`)
    .join('');
  return `:root{${d}${e}}`;
}

/** Animasi View Transitions Astro, diambil dari token yang sama. */
export const pageTransition = {
  forwards: {
    old: { name: 've-out', duration: `${duration.page}ms`, easing: ease.inOut, fillMode: 'both' },
    new: { name: 've-in', duration: `${duration.page}ms`, easing: ease.expoOut, fillMode: 'both', delay: `${Math.round(duration.page * 0.35)}ms` },
  },
  backwards: {
    old: { name: 've-out', duration: `${duration.page}ms`, easing: ease.inOut, fillMode: 'both' },
    new: { name: 've-in', duration: `${duration.page}ms`, easing: ease.expoOut, fillMode: 'both', delay: `${Math.round(duration.page * 0.35)}ms` },
  },
};

export const sharedTransition = {
  forwards: {
    old: { name: 've-hold', duration: `${duration.page * 1.4}ms`, easing: ease.expoOut, fillMode: 'both' },
    new: { name: 've-hold', duration: `${duration.page * 1.4}ms`, easing: ease.expoOut, fillMode: 'both' },
  },
  backwards: {
    old: { name: 've-hold', duration: `${duration.page * 1.4}ms`, easing: ease.expoOut, fillMode: 'both' },
    new: { name: 've-hold', duration: `${duration.page * 1.4}ms`, easing: ease.expoOut, fillMode: 'both' },
  },
};
