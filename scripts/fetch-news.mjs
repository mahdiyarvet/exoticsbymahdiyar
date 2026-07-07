// Auto reptile-news fetcher: Google News RSS -> Persian (MyMemory) -> markdown news posts.
// Runs in GitHub Actions on a schedule. Free, no API keys.
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';

const NEWS_DIR = 'src/content/news';
const MAX_NEW = 3;                 // max new posts per run
const TRANSLATE_EMAIL = 'm.ramzgooyan@gmail.com'; // raises MyMemory free quota
const COVERS = ['/images/snake.svg', '/images/turtle.svg', '/images/uvb.svg', '/images/terrarium.svg', '/images/vet-check.svg'];
const FEED = 'https://news.google.com/rss/search?q=(reptile%20OR%20herpetology%20OR%20snake%20OR%20lizard%20OR%20tortoise)%20when:7d&hl=en-US&gl=US&ceid=US:en';

const decode = (s) => s
  .replace(/<!\[CDATA\[|\]\]>/g, '')
  .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .trim();

const field = (block, tag) => {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return m ? decode(m[1]) : '';
};

const yaml = (s) => '"' + String(s).replace(/"/g, '“').replace(/[\r\n]+/g, ' ').trim() + '"';

async function translate(text) {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fa&de=${TRANSLATE_EMAIL}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'exoticsbymahdiyar-newsbot' } });
    const j = await r.json();
    const t = j?.responseData?.translatedText;
    if (!t || /MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID|AUTH/i.test(t)) return null;
    return decode(t);
  } catch { return null; }
}

async function main() {
  if (!existsSync(NEWS_DIR)) mkdirSync(NEWS_DIR, { recursive: true });
  const res = await fetch(FEED, { headers: { 'User-Agent': 'Mozilla/5.0 exoticsbymahdiyar-newsbot' } });
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);

  let added = 0;
  for (const block of items) {
    if (added >= MAX_NEW) break;
    let title = field(block, 'title');
    const link = field(block, 'link');
    const source = field(block, 'source') || 'منبع خارجی';
    const pub = field(block, 'pubDate');
    if (!title || !link) continue;

    // strip trailing " - Publisher" that Google News appends
    title = title.replace(/\s+-\s+[^-]+$/, '').trim();

    const id = createHash('md5').update(link).digest('hex').slice(0, 10);
    const file = `${NEWS_DIR}/auto-${id}.md`;
    if (existsSync(file)) continue; // already posted -> dedupe

    const faTitle = await translate(title);
    if (!faTitle) continue; // skip if translation unavailable (keep quality)

    const date = pub ? new Date(pub) : new Date();
    const iso = isNaN(date) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
    const cover = COVERS[parseInt(id, 16) % COVERS.length];
    const desc = faTitle.length > 150 ? faTitle.slice(0, 147) + '…' : faTitle;

    const md = `---
title: ${yaml(faTitle)}
description: ${yaml(desc)}
pubDate: ${iso}
cover: "${cover}"
source: ${yaml(source)}
sourceUrl: "${link}"
---

${faTitle}

این خبر به‌صورت خودکار از منابع خبری بین‌المللی درباره‌ی خزندگان گردآوری و به فارسی ترجمه شده است. برای مطالعه‌ی متن کامل و اصلی، به منبع مراجعه کنید:

> منبع: [${source}](${link})

*ترجمه‌ی ماشینی خودکار — ممکن است دقیق نباشد.*
`;
    writeFileSync(file, md, 'utf8');
    console.log('added:', file, '=>', faTitle);
    added++;
  }
  console.log(`done. added ${added} news item(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
