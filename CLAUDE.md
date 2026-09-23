# CLAUDE.md — Evolusi Dunia

Panduan ringkas untuk sesi berikutnya. Baca juga `README.md` (cara menjalankan, menambah era) dan `PLAN.md`.

## Perintah penting

```sh
npm run dev             # dev server — http://localhost:4321/008.Vibe_Coding_03/
npm run build           # WAJIB lolos tanpa error sebelum commit
npm run check:links     # link checker atas dist/ (jalankan setelah build)
npm run check           # astro check
npm run bake:globe      # python3 scripts/globe/bake.py (pip install pygplates shapely)
npm run render:globe    # render src/assets/globe/*.jpg via Playwright (menyalakan astro dev sendiri)
```

## Arsitektur

- **Astro 7.3**, output statis, `trailingSlash: 'always'`, `base: '/008.Vibe_Coding_03'`.
  Astro 7: compiler Rust (HTML harus valid/tertutup), `compressHTML: 'jsx'` — spasi antar elemen
  inline harus eksplisit `{' '}`.
- **i18n bawaan Astro**: `locales: ['id','en']`, `prefixDefaultLocale: true`, `redirectToDefaultLocale: false`.
  Root `/` = `src/pages/index.astro` (redirect meta instan berlatar hitam; redirect bawaan menampilkan
  halaman putih 2 dtk). Route: `/[lang]/`, `/[lang]/era/`, `/[lang]/era/[slug]/`, `/404.html`.
- **Konten**: koleksi `eras` (`src/content.config.ts`, glob loader). ID entri `"<lang>/<slug>"`;
  helper di `src/lib/eras.ts` (`getEras(lang)`, `eraSlug`). Skema divalidasi Zod — build gagal bila salah.
- **URL internal**: selalu lewat `src/lib/url.ts` (`withBase`, `homeUrl`, `eraUrl`, `erasIndexUrl`, `swapLang`).
  Jangan menulis `href="/..."` langsung.
- **String UI**: hanya di `src/i18n/ui.ts` (`useTranslations(lang)`). Tidak ada teks UI hardcode di komponen.
- **Motion**: semua durasi/easing di `src/styles/motion.ts` → CSS vars `--dur-*`/`--ease-*` (disuntik di
  BaseLayout), ease GSAP (`gsapEase`), dan animasi View Transitions (`pageTransition`, `sharedTransition`).
- **Transisi halaman**: `<ClientRouter />` (astro:transitions). Judul era = shared element
  `transition:name="era-title-<slug>"` di beranda, daftar era, dan detail. `--accent` terdaftar via
  `@property` (tokens.css) sehingga warna glow berpindah halus; latar `html`/`::view-transition` hitam.
- **Skrip per halaman**: BaseLayout mendengarkan `astro:page-load`; bila ada `[data-home]` →
  `import('../scripts/home')` (GSAP, ScrollTrigger, three.js dimuat dinamis hanya di beranda).
  `initHome` mengembalikan cleanup yang dipanggil di `astro:before-swap`.
- **Globe** (`src/scripts/globe/`): `Globe.ts` (three.js: titik Fibonacci darat/laut, garis pantai,
  graticule, atmosfer fresnel, bloom tipis, lampu kota + busur, titik cahaya outro, drag + inersia,
  DPR ≤ 2, berhenti saat tab tersembunyi/outro selesai, versi `lite` tanpa bloom di mobile).
  Data: `src/data/globe/paleo.json` (6 keadaan: 230/170/100/50/15/0 Ma — urutan sama dengan
  `GLOBE_TIMES` di `states.ts` dan `TIMES` di `bake.py`).
- **Fallback**: reduced-motion atau tanpa WebGL → `html.globe-static`, gambar `src/assets/globe/<slug>.jpg`
  tampil per section; tanpa intro/scrub/counter/rotasi. Tanpa JS → `<noscript>` menampilkan gambar statis.
- Halaman `src/pages/dev/**` hanya ada di mode dev (getStaticPaths kosong di produksi) — dipakai
  `render-globe.mjs` dan untuk memotret `public/og.jpg`.

## Konvensi konten

- Satu file per era per bahasa, slug sama. EN ditulis natural (ejaan British), bukan terjemahan harfiah.
- Angka waktu geologi mengikuti **ICS chart v2026/06** (dasar Kapur 143,1 Ma — bukan 145).
- `startYearsAgo`/`endYearsAgo` relatif terhadap `REFERENCE_YEAR = 2026` (`src/lib/time.ts`);
  < 10.000 tahun → tampil sebagai tahun kalender SM/M.
- Minimal 2 sumber kredibel per era; klaim yang belum pasti ditulis umum dan `needsReview: true`.
  Saat ini `needsReview: true`: neogen, pleistosen, neolitik, era-ai.
- Era AI: faktual, netral, tanpa prediksi.
- Gambar eksternal hanya CC0/CC BY/CC BY-SA/PD, diunduh ke repo (bukan hotlink), dengan `image`
  {src, alt, credit, license, sourceUrl} + entri di `CREDITS.md`.

## Desain (jangan dilanggar)

Latar selalu hitam; satu warna glow aktif per layar (`accentColor`); glow hanya untuk judul, angka,
garis, rail, globe. Dilarang: gradien ungu-biru/blob/mesh, glassmorphism, grid kartu rounded seragam,
hero terpusat + 3 kartu + CTA pil, emoji-ikon, Inter/Roboto untuk display, copy klise, animasi memantul,
custom cursor, preloader lama. Font: Bodoni Moda (display), IBM Plex Sans (isi), IBM Plex Mono (angka).

## Lingkungan sesi cloud (catatan)

docs.astro.build, stratigraphy.org, gsap.com, Wikimedia diblokir egress; dokumentasi Astro dibaca dari
`raw.githubusercontent.com/withastro/docs/main/src/content/docs/en/...`. Chromium Playwright ada di
`/opt/pw-browsers`; set `PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
