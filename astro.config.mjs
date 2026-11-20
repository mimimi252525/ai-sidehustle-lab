import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const site = process.env.SITE_URL || env.SITE_URL || undefined;

if (site) {
  const url = new URL(site);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error('SITE_URL には HTTPS のサイトオリジンを指定してください。');
  }
}

export default defineConfig({
  site,
  output: 'static',
  integrations: site ? [sitemap()] : [],
});
