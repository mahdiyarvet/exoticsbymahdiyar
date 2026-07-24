import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Sitemap needs a real lastmod per URL (not one build-time stamp) so Google can tell which
// pages actually changed. Content collections aren't queryable from plain Node here, so we
// read pubDate/updatedDate straight out of each markdown file's frontmatter.
const lastmodBySlug = new Map();
const contentDir = fileURLToPath(new URL('./src/content/', import.meta.url));
for (const [folder, urlPrefix] of [['articles', '/articles/'], ['news', '/news/']]) {
  for (const file of readdirSync(contentDir + folder)) {
    if (!file.endsWith('.md')) continue;
    const raw = readFileSync(contentDir + folder + '/' + file, 'utf8');
    const updated = raw.match(/^updatedDate:\s*(\S+)/m)?.[1];
    const published = raw.match(/^pubDate:\s*(\S+)/m)?.[1];
    const date = updated ?? published;
    if (date) lastmodBySlug.set(urlPrefix + file.replace(/\.md$/, ''), new Date(date));
  }
}

export default defineConfig({
  site: 'https://exoticsbymahdiyar.ir',
  integrations: [
    sitemap({
      // auto-translated news items are noindexed (thin content) -> keep them out of the sitemap too
      filter: (page) => !/\/news\/auto-/.test(page),
      serialize: (item) => {
        const path = new URL(item.url).pathname.replace(/\/$/, '');
        const lastmod = lastmodBySlug.get(path);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  markdown: { shikiConfig: { theme: 'github-light' } },
});
