// @ts-check
import { defineConfig } from 'astro/config';

// SITE_BASE: "/" on dreamward.life, "/dreamward-site" on the GitHub Pages preview URL.
const base = process.env.SITE_BASE || '/';

export default defineConfig({
  site: process.env.SITE_URL || 'https://dreamward.life',
  base,
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Everything external: the CSP allows only same-origin scripts and styles.
    inlineStylesheets: 'never',
  },
  vite: { build: { assetsInlineLimit: 0 } },
});
