import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getContentCategory } from '../contentCategories';
import { getNewsCover, normalizeContentTitle } from '../contentImages';

type SearchItem = {
  title: string;
  description: string;
  url: string;
  type: 'article' | 'news' | 'book' | 'page';
  typeLabel: string;
  category: string;
  image?: string;
  keywords: string[];
  timestamp: number;
};

export const GET = (async () => {
  const [articleEntries, newsEntries, bookEntries] = await Promise.all([
    getCollection('articles', ({ data }) => !data.draft),
    getCollection('news', ({ data }) => !data.draft),
    getCollection('books', ({ data }) => !data.draft),
  ]);

  const articles: SearchItem[] = articleEntries.map((entry) => {
    const category = getContentCategory(entry.data)?.label ?? entry.data.category;
    return {
      title: entry.data.title,
      description: entry.data.description,
      url: `/articles/${entry.id}`,
      type: 'article',
      typeLabel: 'مقاله',
      category,
      image: entry.data.cover,
      keywords: [...entry.data.tags, category, 'راهنما', 'دامپزشکی'],
      timestamp: entry.data.pubDate.getTime(),
    };
  });

  const seenNews = new Set<string>();
  const news: SearchItem[] = newsEntries
    .filter((entry) => {
      const key = normalizeContentTitle(entry.data.title);
      if (seenNews.has(key)) return false;
      seenNews.add(key);
      return true;
    })
    .map((entry) => {
      const category = getContentCategory(entry.data)?.label ?? entry.data.category ?? 'اخبار اگزوتیک';
      return {
        title: entry.data.title,
        description: entry.data.description,
        url: `/news/${entry.id}`,
        type: 'news',
        typeLabel: 'خبر',
        category,
        image: getNewsCover(entry),
        keywords: [category, entry.data.source ?? '', 'خبر', 'دانستنی'],
        timestamp: entry.data.pubDate.getTime(),
      };
    });

  const books: SearchItem[] = bookEntries.map((entry) => ({
    title: entry.data.title,
    description: entry.data.description,
    url: `/books/${entry.id}`,
    type: 'book',
    typeLabel: 'کتاب',
    category: 'کتابخانه',
    image: entry.data.cover,
    keywords: [...entry.data.tags, entry.data.author, entry.data.lang, 'کتاب', 'منبع'],
    timestamp: entry.data.year ? new Date(entry.data.year, 0, 1).getTime() : 0,
  }));

  const pages: SearchItem[] = [
    {
      title: 'ویزیت آنلاین حیوانات اگزوتیک',
      description: 'ارسال شرح حال، عکس و فیلم حیوان برای دریافت راهنمایی دامپزشکی.',
      url: '/visit', type: 'page', typeLabel: 'صفحه', category: 'خدمات',
      image: '/images/photos/macaw-1.jpg', keywords: ['مشاوره', 'دامپزشک', 'ویزیت'], timestamp: 0,
    },
    {
      title: 'درباره دکتر مهدیار رمزگویان',
      description: 'معرفی دامپزشک باغ پرندگان تهران و حوزه فعالیت در حیوانات اگزوتیک.',
      url: '/about', type: 'page', typeLabel: 'صفحه', category: 'درباره من',
      image: '/images/photos/macaw-1.jpg', keywords: ['دکتر مهدیار', 'دامپزشک'], timestamp: 0,
    },
    {
      title: 'سؤالات متداول',
      description: 'پاسخ پرسش‌های رایج درباره نگهداری و ویزیت حیوانات اگزوتیک.',
      url: '/faq', type: 'page', typeLabel: 'صفحه', category: 'راهنما',
      keywords: ['سوال', 'پرسش', 'پاسخ'], timestamp: 0,
    },
  ];

  const items = [...articles, ...news, ...books, ...pages]
    .sort((a, b) => b.timestamp - a.timestamp);

  return new Response(JSON.stringify(items), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}) satisfies APIRoute;
