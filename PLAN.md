# PLAN — Evolusi Dunia

Situs statis Astro 7 (TypeScript, CSS murni) tentang sejarah Bumi dan manusia, dari Trias
sampai era AI, dua bahasa (ID default, EN), dideploy ke GitHub Pages lewat `withastro/action`.

## Lingkungan & batasan yang diketahui
- Astro 7.3.x, Node ≥ 22.12 (lokal: Node 22). Dokumentasi resmi dibaca dari repo
  `withastro/docs` (docs.astro.build diblokir oleh network policy sesi ini).
- Astro 7: Rust compiler (HTML harus valid & tertutup), `compressHTML: 'jsx'` (spasi antar
  elemen inline harus eksplisit `{" "}`), Markdown dirender Sätteri.
- Wikimedia Commons & situs luar lain diblokir → gambar dibuat sendiri (SVG/render globe).
- Data waktu geologi: ICS International Chronostratigraphic Chart **v2026-06**
  (`i-c-stratigraphy/chart/chart.ttl`).
- Data paleogeografi: model Müller et al. (2019) dari repo resmi `GPlates/pygplates-tutorials`,
  direkonstruksi offline dengan `pygplates` → dipanggang ke JSON kecil untuk globe.

## Struktur folder
```
src/
  content.config.ts          # koleksi `eras` (glob loader + Zod)
  content/eras/{id,en}/<slug>.md
  i18n/ui.ts                 # semua string UI
  i18n/utils.ts              # t(), helper bahasa & path padanan
  lib/eras.ts                # query & format waktu (counter, label, lompatan)
  lib/url.ts                 # semua URL internal lewat import.meta.env.BASE_URL
  styles/motion.ts           # token motion (durasi, easing) — sumber tunggal
  styles/tokens.css          # warna, tipografi, spasi
  styles/global.css
  layouts/BaseLayout.astro   # <html lang>, hreflang, OG, ClientRouter, header/footer
  components/                # Header, LangSwitch, Breadcrumb, EraNav, KeyEvents, TimeRail, …
  scripts/                   # home.ts (GSAP), globe/*.ts (three.js), detail.ts
  data/globe/                # JSON benua per keadaan waktu (hasil scripts/globe/bake.py)
  assets/globe/              # render statis globe per era (fallback + gambar detail)
  pages/
    index.astro              # redirect / → /id/
    404.astro                # 404 dua bahasa
    [lang]/index.astro       # beranda storytelling
    [lang]/era/[slug].astro  # 30 halaman detail
    [lang]/eras.astro        # daftar semua era
scripts/
  globe/bake.py              # rekonstruksi paleogeografi → JSON
  render-globe.mjs           # Playwright: render PNG globe statis per era
  check-links.mjs            # link checker terhadap dist/
```

## Skema data (`eras`)
`title, order, startLabel, endLabel, startYearsAgo, endYearsAgo, summary,
keyEvents[{when,title,description}] (3–6), accentColor (#hex), image? {src,alt,credit,license,sourceUrl},
sources[{title,url}] (≥2), needsReview`.
ID entri = `<lang>/<slug>`; slug sama di kedua bahasa. `yearsAgo` dihitung terhadap tahun
acuan 2026 (konstanta `REFERENCE_YEAR`), sehingga era manusia bisa ditampilkan sebagai tahun kalender.

## Route
- `/` → `/id/` (i18n `redirectToDefaultLocale`)
- `/id/`, `/en/` — beranda
- `/id/era/<slug>/`, `/en/era/<slug>/` — 15 × 2 halaman detail
- `/id/era/`, `/en/era/` — daftar semua era (indeks)
- `/404.html` — dua bahasa dalam satu halaman
- `sitemap-index.xml` via `@astrojs/sitemap`

## Strategi animasi
- Token motion di `src/styles/motion.ts`, diekspor juga sebagai CSS custom properties.
- Beranda: GSAP + ScrollTrigger (scrub, mask reveal, parallax tipis, easing expo/power4 out).
  three.js + GSAP dimuat lewat dynamic `import()` hanya bila `[data-home]` ada.
- Intro ≤ 3 dtk, dibatalkan saat scroll/tombol/klik.
- Counter angka monospace saat section masuk layar; skala waktu logaritmik di rail + penanda lompatan.
- Warna glow: satu custom property `--accent` yang ditransisikan; latar tetap hitam.
- Transisi halaman: `<ClientRouter />`, judul era & aksen sebagai shared element
  (`transition:name`), latar html hitam agar tidak ada kedipan putih.
- `prefers-reduced-motion`: tanpa intro/scrub/counter/rotasi; globe statis (PNG) per era.

## Milestone
M1 init → M2 skema/i18n/token/layout/detail → M3 konten 15 era ×2 → M4 globe (commit sendiri),
beranda, rail, counter, transisi → M5 gambar/kredit/a11y/SEO/404 → M6 workflow & deploy.
