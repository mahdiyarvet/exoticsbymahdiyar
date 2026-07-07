import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://exoticsbymahdiyar.ir',
  integrations: [sitemap()],
  markdown: { shikiConfig: { theme: 'github-light' } },
});
