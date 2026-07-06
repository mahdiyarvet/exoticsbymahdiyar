import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  const news = await getCollection('news', ({ data }) => !data.draft);
  const items = [
    ...articles.map((a) => ({ ...a.data, link: `/articles/${a.id}` })),
    ...news.map((n) => ({ ...n.data, link: `/news/${n.id}` })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'اگزوتیک با مهدیار',
    description: 'مقالات و اخبار دامپزشکی حیوانات اگزوتیک',
    site: context.site,
    items: items.map((i) => ({ title: i.title, description: i.description, pubDate: i.pubDate, link: i.link })),
    customData: `<language>fa-IR</language>`,
  });
}
