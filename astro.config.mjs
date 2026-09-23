// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages (project site): https://<user>.github.io/<repo>/
// Bila repo bernama <user>.github.io, hapus `base`.
export default defineConfig({
  site: 'https://shockwave-thevillains.github.io',
  base: '/008.Vibe_Coding_03',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  i18n: {
    locales: ['id', 'en'],
    defaultLocale: 'id',
    routing: {
      prefixDefaultLocale: true,
      // Root "/" ditangani src/pages/index.astro (redirect instan, latar hitam);
      // redirect bawaan menampilkan halaman putih dengan jeda 2 detik.
      redirectToDefaultLocale: false,
    },
  },
  vite: {
    // three.js (~570 KB, ~145 KB gzip) sengaja satu chunk dan hanya dimuat di beranda.
    build: { chunkSizeWarningLimit: 700 },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'id',
        locales: { id: 'id-ID', en: 'en-US' },
      },
      filter: (page) => !page.endsWith('/404/') && !page.endsWith('/008.Vibe_Coding_03/'),
    }),
  ],
});
