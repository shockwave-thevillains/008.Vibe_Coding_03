// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages project site: https://<user>.github.io/<repo>/
export default defineConfig({
  site: 'https://shockwave-thevillains.github.io',
  base: '/008.Vibe_Coding_03',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'id', locales: { id: 'id-ID', en: 'en-US' } },
    }),
  ],
  i18n: {
    locales: ['id', 'en'],
    defaultLocale: 'id',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
});
