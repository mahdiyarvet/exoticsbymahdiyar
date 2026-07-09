import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://exoticsbymahdiyar.ir',
  integrations: [
    sitemap({
      // auto-translated news items are noindexed (thin content) -> keep them out of the sitemap too
      filter: (page) => !/\/news\/auto-/.test(page),
    }),
  ],
  markdown: { shikiConfig: { theme: 'github-light' } },
});
