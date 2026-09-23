# PLAN — Evolusi Dunia

Situs statis dua bahasa (ID/EN) tentang sejarah Bumi dari Trias sampai era AI.
Astro 7 (static output) · TypeScript strict · CSS murni · three.js · GSAP + ScrollTrigger.

## Struktur folder

```
.
├── .github/workflows/deploy.yml     # withastro/action@v6 → GitHub Pages
├── astro.config.mjs                 # site, base, i18n, sitemap
├── data-src/                        # data mentah Natural Earth (domain publik)
├── scripts/
│   ├── build-globe-data.mjs         # geojson → titik & garis pantai terkompresi (dijalankan manual)
│   └── check-links.mjs              # link checker terhadap dist/
├── public/                          # favicon, og image, globe statis (fallback)
└── src/
    ├── content.config.ts            # koleksi `eras` + skema Zod
    ├── content/eras/{id,en}/<slug>.md
    ├── data/globe.json              # hasil build-globe-data (titik benua, kota)
    ├── i18n/ui.ts                   # semua string UI + helper t(), path helper
    ├── lib/                         # eras.ts (query/sort), format.ts (angka), url.ts (BASE_URL)
    ├── styles/
    │   ├── tokens.css               # warna, tipografi, spasi
    │   ├── motion.css               # durasi & easing (CSS custom properties)
    │   ├── motion.ts                # token yang sama untuk JS (GSAP, three.js)
    │   └── global.css
    ├── layouts/BaseLayout.astro     # <html lang>, hreflang, OG, ClientRouter, skip link
    ├── components/                  # Header, LangSwitch, Globe, TimeRail, EraSection, Timeline, …
    ├── scripts/                     # home.ts (GSAP), globe.ts (three.js), counter.ts
    └── pages/
        ├── index.astro              # redirect → /id/
        ├── 404.astro                # 404 dua bahasa
        └── [lang]/
            ├── index.astro          # beranda storytelling
            ├── era/index.astro      # daftar semua era
            └── era/[slug].astro     # halaman detail
```

## Skema data (Zod, `src/content.config.ts`)

Koleksi `eras`, loader `glob({ base: './src/content/eras', pattern: '**/*.md' })`.
`entry.id` = `id/trias`, `en/trias`. Bahasa & slug diturunkan dari id.

| field | tipe |
|---|---|
| title | string |
| order | number (1–15) |
| startLabel / endLabel | string |
| startYearsAgo / endYearsAgo | number |
| summary | string |
| keyEvents | `{ when, title, description }[]` (3–6) |
| accentColor | hex `#rrggbb` |
| image? | `{ src (image()), alt, credit, license, sourceUrl }` |
| sources | `{ title, url }[]` (min 2) |
| needsReview | boolean |

## Route

| route | isi |
|---|---|
| `/` | redirect ke `/id/` (meta refresh + link) |
| `/[lang]/` | beranda storytelling (15 section) |
| `/[lang]/era/` | daftar semua era |
| `/[lang]/era/[slug]/` | 30 halaman detail |
| `/404.html` | 404 dua bahasa |

i18n: `locales: ['id','en']`, `defaultLocale: 'id'`, `prefixDefaultLocale: true`.
Semua href internal dibangun lewat helper `url()` yang memakai `import.meta.env.BASE_URL`.

## Strategi animasi

- Token motion tunggal: `styles/motion.css` (CSS vars) + `styles/motion.ts` (nilai sama untuk GSAP/three).
  Easing: expo.out / power4.out. Tanpa bounce/elastic.
- **Intro** (≤ 3 dtk): globe fade-in dari hitam, judul reveal per baris (mask). Scroll/wheel/touch/key → `timeline.progress(1)`.
- **Section era**: ScrollTrigger `scrub` — mask reveal (clip-path) untuk judul, parallax tipis untuk lapisan.
  Counter angka tahun `startYearsAgo → endYearsAgo` di-scrub progress section.
- **Warna glow**: satu CSS var `--glow` di `<html>`; ScrollTrigger `onToggle` mengubahnya (transisi CSS). Globe membaca warna yang sama.
- **Rail waktu**: skala logaritmik (log10 tahun lalu) + label lompatan "↓ 50 juta tahun kemudian" antar section.
- **Globe**: three.js, titik-titik benua (Natural Earth, domain publik) + atmosfer fresnel + bloom tipis (UnrealBloomPass). Diputar pelan, bisa di-drag, pause saat tidak terlihat / tab hidden. Era 14–15: titik kota + busur koneksi. Penutup: globe menjauh jadi satu titik.
- **Transisi halaman**: `<ClientRouter />`; `transition:name` pada judul era (`era-title-<slug>`) dan garis glow. Latar `html` hitam agar tanpa kedipan putih. Script diinisialisasi di `astro:page-load` dan dibersihkan di `astro:before-swap`.
- **Reduced motion**: tanpa intro, tanpa scrub/counter/rotasi, globe → gambar statis SVG.
- three.js & GSAP hanya di-import oleh script beranda (dynamic import), bukan di layout.

## Milestone

M1 scaffold → M2 skema/i18n/token/layout/detail → M3 konten 15×2 → M4 globe, lalu beranda → M5 a11y/SEO/404/gambar → M6 deploy.
