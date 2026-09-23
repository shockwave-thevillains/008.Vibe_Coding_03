# Kredit & Lisensi

## Gambar

Situs ini **tidak memakai gambar eksternal**. Semua gambar adalah render globe buatan sendiri
(`src/assets/globe/*.jpg`, `public/og.jpg`) dari data paleogeografi di bawah, sehingga mewarisi
atribusi dan lisensinya.

| Berkas | Isi | Kredit | Lisensi | Sumber |
| --- | --- | --- | --- | --- |
| `src/assets/globe/trias.jpg` | Rekonstruksi ±230 juta tahun lalu | Render Evolusi Dunia; model lempeng Müller dkk. (2019), EarthByte/GPlates | CC BY-SA 4.0 | [pygplates-tutorials/data](https://github.com/GPlates/pygplates-tutorials/tree/master/data/Muller_etal_2019_PlateMotionModel_v2.0_Tectonics) |
| `src/assets/globe/jura.jpg` | Rekonstruksi ±170 juta tahun lalu | idem | CC BY-SA 4.0 | idem |
| `src/assets/globe/kapur.jpg` | Rekonstruksi ±100 juta tahun lalu | idem | CC BY-SA 4.0 | idem |
| `src/assets/globe/paleogen.jpg` | Rekonstruksi ±50 juta tahun lalu | idem | CC BY-SA 4.0 | idem |
| `src/assets/globe/neogen.jpg` | Rekonstruksi ±15 juta tahun lalu | idem | CC BY-SA 4.0 | idem |
| `src/assets/globe/{pleistosen, neolitik, peradaban-awal, klasik, abad-pertengahan, renaisans, revolusi-industri, abad-20, era-digital, era-ai}.jpg` | Garis pantai modern (0 Ma) | Render Evolusi Dunia; garis pantai dari data Müller dkk. (2019) | CC BY-SA 4.0 | idem |
| `public/og.jpg` | Gambar Open Graph (globe Trias + judul) | Render Evolusi Dunia; data Müller dkk. (2019) | CC BY-SA 4.0 | idem |

Kredit, lisensi, dan tautan sumber setiap gambar juga tercantum di frontmatter era (`image`) dan
ditampilkan di bawah gambar pada halaman detail.

## Data

- **Paleogeografi globe** — `src/data/globe/paleo.json` dihasilkan oleh `scripts/globe/bake.py` dari:
  - Model rotasi `Global_250-0Ma_Rotations_2019_v2.rot` dan garis pantai
    `Global_coastlines_2019_v1_low_res` — Müller, R. D., Zahirovic, S., Williams, S. E., dkk. (2019).
    *A global plate model including lithospheric deformation along major rifts and orogens since the Triassic.*
    Tectonics, 38. https://doi.org/10.1029/2018TC005462 — EarthByte Group, University of Sydney.
  - Diambil dari repositori resmi [GPlates/pygplates-tutorials](https://github.com/GPlates/pygplates-tutorials)
    (dirilis di bawah **CC BY 3.0**). Rilis data Müller dkk. (2019) di EarthByte dilaporkan memakai
    **CC BY-SA 4.0**; untuk amannya, data turunan dan render di situs ini dilisensikan **CC BY-SA 4.0**.
  - Rekonstruksi dihitung dengan [pyGPlates](https://www.gplates.org/) 1.0 (rotasi lempeng kaku atas
    poligon garis pantai statis), lalu disederhanakan (shapely).
- **Waktu geologi** — International Commission on Stratigraphy, *International Chronostratigraphic Chart*
  v2026/06 ([stratigraphy.org/chart](https://stratigraphy.org/chart); data:
  [i-c-stratigraphy/chart](https://github.com/i-c-stratigraphy/chart)).
- **Koordinat kota** (lampu kota di globe) — pembulatan koordinat umum, bersifat dekoratif.
- **Sumber konten** — setiap era mencantumkan minimal dua sumber pada frontmatter `sources`
  dan di bagian "Sumber" halaman detail.

## Font (self-hosted via Fontsource)

| Font | Peran | Lisensi |
| --- | --- | --- |
| Bodoni Moda (The Bodoni Moda Project Authors) | Judul / display | SIL Open Font License 1.1 |
| IBM Plex Sans (IBM Corp.) | Teks isi | SIL Open Font License 1.1 |
| IBM Plex Mono (IBM Corp.) | Angka & label waktu | SIL Open Font License 1.1 |

## Pustaka

| Pustaka | Lisensi |
| --- | --- |
| [Astro](https://astro.build) 7 + `@astrojs/sitemap` | MIT |
| [three.js](https://threejs.org) 0.186 | MIT |
| [GSAP](https://gsap.com) 3.15 + ScrollTrigger | GSAP Standard "No Charge" License (gratis, termasuk penggunaan komersial, sejak 2025) |
| Playwright (dev, render gambar) | Apache-2.0 |
| pyGPlates, shapely, numpy (skrip bake, tidak ikut dikirim) | pyGPlates: GPL-2.0; shapely: BSD-3-Clause; numpy: BSD-3-Clause |
