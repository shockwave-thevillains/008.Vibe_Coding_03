// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages: https://<user>.github.io/<repo>/
export default defineConfig({
  site: 'https://shockwave-thevillains.github.io',
  base: '/008.Vibe_Coding_03',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
