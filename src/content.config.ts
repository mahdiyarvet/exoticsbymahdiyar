import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    cover: z.string().optional(),
    category: z.string().default('عمومی'),
    tags: z.array(z.string()).default([]),
    author: z.string().default('دکتر مهدیار رمزگویان'),
    draft: z.boolean().default(false),
    sources: z.array(z.object({ label: z.string(), url: z.string().optional() })).default([]),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    cover: z.string().optional(),
    source: z.string().optional(),
    sourceUrl: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    description: z.string(),
    cover: z.string().optional(),
    lang: z.string().default('en'),
    year: z.number().optional(),
    pages: z.number().optional(),
    downloadUrl: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    role: z.string().optional(),
    specialties: z.array(z.string()).default([]),
    education: z.array(z.string()).default([]),
  }),
});

export const collections = { articles, news, books, pages };
