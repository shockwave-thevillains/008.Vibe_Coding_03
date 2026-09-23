# Evolusi Dunia

Situs statis tentang perjalanan Bumi dan manusia dalam 15 bab — dari Trias, saat dinosaurus
pertama muncul, sampai era kecerdasan buatan. Dua bahasa (Indonesia default, Inggris), tema
gelap bercahaya, globe 3D yang mengikuti paleogeografi tiap era.

- **Stack:** Astro 7 (TypeScript, CSS murni), three.js (globe), GSAP + ScrollTrigger (animasi scroll)
- **Deploy:** GitHub Actions (`withastro/action`) → GitHub Pages
- **URL (setelah Pages aktif):** https://shockwave-thevillains.github.io/008.Vibe_Coding_03/

## Menjalankan secara lokal

Butuh Node.js **≥ 22.12** (lihat `engines` di `package.json`).

```sh
npm install
npm run dev            # http://localhost:4321/008.Vibe_Coding_03/  (root "/" dialihkan ke /id/)
npm run build          # hasil ke dist/
npm run preview        # sajikan dist/ secara lokal
npm run check:links    # periksa semua tautan & aset internal di dist/ (jalankan setelah build)
npm run check          # astro check (tipe TypeScript & .astro)
```

Perintah aset (hanya perlu dijalankan bila data/era berubah):

```sh
npm run bake:globe     # python3: rekonstruksi paleogeografi → src/data/globe/paleo.json
                       # butuh: pip install pygplates shapely
npm run render:globe   # Playwright: render gambar globe statis → src/assets/globe/<slug>.jpg
                       # opsional: PLAYWRIGHT_CHROMIUM=/path/ke/chrome, BASE_URL=http://localhost:4321/008.Vibe_Coding_03
```

## Struktur

```
src/
  content.config.ts            skema koleksi `eras` (Zod)
  content/eras/{id,en}/*.md    satu file per era per bahasa (slug sama)
  i18n/ui.ts                   semua string antarmuka
  styles/motion.ts             token durasi & easing (satu sumber)
  styles/tokens.css            warna, tipografi, ruang
  layouts/BaseLayout.astro     <html lang>, hreflang, OG, ClientRouter
  pages/[lang]/index.astro     beranda storytelling
  pages/[lang]/era/[slug].astro  halaman detail (30 halaman)
  pages/[lang]/era/index.astro   daftar semua era
  pages/404.astro              404 dua bahasa
  scripts/home.ts              GSAP, counter, rail, intro (dimuat dinamis di beranda)
  scripts/globe/               three.js globe + dekoder data
  data/globe/paleo.json        data paleogeografi hasil bake
  assets/globe/*.jpg           gambar globe statis per era
scripts/
  globe/bake.py                rekonstruksi paleogeografi (pygplates)
  render-globe.mjs             render gambar globe statis
  check-links.mjs              link checker untuk dist/
```

## Menambah era baru

1. Pilih slug (huruf kecil, tanda hubung), mis. `era-kuantum`.
2. Buat **dua** file: `src/content/eras/id/era-kuantum.md` dan `src/content/eras/en/era-kuantum.md`.
   Salin frontmatter dari era lain lalu isi:
   - `order` — posisi kronologis (geser `order` era lain bila menyisip di tengah).
   - `startYearsAgo` / `endYearsAgo` — tahun lalu relatif terhadap **2026** (`REFERENCE_YEAR` di `src/lib/time.ts`).
     Di bawah 10.000 tahun, beranda menampilkan tahun kalender (SM/M).
   - `startLabel` / `endLabel`, `summary` (≤ 320 karakter), `keyEvents` (3–6), `accentColor` (#RRGGBB, kontras ≥ 4.5:1 di atas hitam).
   - `sources` — minimal 2 sumber kredibel; `needsReview: true` bila ada klaim yang belum terverifikasi penuh.
3. Globe: bila era membutuhkan keadaan paleogeografi baru, tambahkan umurnya (juta tahun lalu) ke
   `TIMES` di `scripts/globe/bake.py` **dan** `GLOBE_TIMES` di `src/scripts/globe/states.ts`, lalu petakan slug
   di `globeStateBySlug` (`src/lib/eras.ts`). Tanpa entri, era memakai garis pantai modern.
   Atur sudut gambar statis di `stillRotationBySlug`; lampu kota lewat `citiesEras`.
4. Jalankan `npm run render:globe`, lalu tambahkan blok `image` (src, alt, credit, license, sourceUrl) ke kedua file.
5. `npm run build && npm run check:links`.

## Deploy

Workflow `.github/workflows/deploy.yml` membangun situs dengan `withastro/action@v6` (Node 22), memeriksa
tautan, lalu men-deploy ke GitHub Pages pada setiap push ke `main` (atau manual lewat *Run workflow*).
Pull request ke `main` hanya dibangun dan diperiksa, tanpa deploy.

Sekali saja, aktifkan Pages: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Bila nama repo berubah, perbarui `base` di `astro.config.mjs` (dan `Sitemap:` di `public/robots.txt`).

## Lisensi & kredit

Lihat [`CREDITS.md`](CREDITS.md) untuk font, pustaka, data, dan gambar.
