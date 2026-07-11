// Auto reptile-news fetcher: Google News RSS -> Persian (MyMemory) -> markdown news posts.
// Runs in GitHub Actions on a schedule. Free, no API keys.
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';

const NEWS_DIR = 'src/content/news';
const MAX_NEW = 3;                 // max new posts per run
const TRANSLATE_EMAIL = 'm.ramzgooyan@gmail.com'; // raises MyMemory free quota

// real, free-license photos (see public/images/photos/CREDITS.json) mapped by keyword,
// checked in order -- first keyword match in the (translated) title wins.
const PHOTO_MAP = [
  [/mar|snake|python|corn snake|ball python/i, ['/images/photos/corn-snake-1.jpg', '/images/photos/corn-snake-2.jpg', '/images/photos/ball-python-1.jpg', '/images/photos/ball-python-2.jpg', '/images/photos/ball-python-3.jpg']],
  [/لاک‌پشت|turtle|tortoise/i, ['/images/photos/red-eared-slider-1.jpg', '/images/photos/red-eared-slider-2.jpg', '/images/photos/red-eared-slider-3.jpg']],
  [/بردد|بیرد|dragon/i, ['/images/photos/bearded-dragon-1.jpg', '/images/photos/bearded-dragon-2.jpg', '/images/photos/bearded-dragon-3.jpg']],
  [/گکو|gecko/i, ['/images/photos/leopard-gecko-1.jpg', '/images/photos/leopard-gecko-2.jpg', '/images/photos/crested-gecko-1.jpg', '/images/photos/crested-gecko-2.jpg']],
  [/آفتاب‌پرست|chameleon/i, ['/images/photos/chameleon-1.jpg', '/images/photos/chameleon-2.jpg', '/images/photos/chameleon-3.jpg']],
  [/ایگوانا|iguana/i, ['/images/photos/iguana-1.jpg', '/images/photos/iguana-2.jpg', '/images/photos/iguana-3.jpg']],
  [/مانیتور|monitor lizard|varanus/i, ['/images/photos/monitor-lizard-1.jpg']],
  [/طوطی|ماکائو|macaw|parrot/i, ['/images/photos/macaw-1.jpg', '/images/photos/macaw-2.jpg', '/images/photos/macaw-3.jpg']],
  [/مرغ عشق|budg/i, ['/images/photos/budgerigar-1.jpg', '/images/photos/budgerigar-2.jpg', '/images/photos/budgerigar-3.jpg']],
  [/کاکاتیل|cockatiel/i, ['/images/photos/cockatiel-1.jpg', '/images/photos/cockatiel-2.jpg', '/images/photos/cockatiel-3.jpg']],
  [/لاوبرد|lovebird/i, ['/images/photos/lovebird-1.jpg', '/images/photos/lovebird-2.jpg', '/images/photos/lovebird-3.jpg']],
  [/فرت|ferret/i, ['/images/photos/ferret-1.jpg', '/images/photos/ferret-2.jpg']],
  [/همستر|hamster/i, ['/images/photos/hamster-1.jpg', '/images/photos/hamster-2.jpg', '/images/photos/hamster-3.jpg']],
  [/خرگوش|rabbit/i, ['/images/photos/rabbit-1.jpg', '/images/photos/rabbit-2.jpg', '/images/photos/rabbit-3.jpg']],
  [/خوکچه|guinea pig/i, ['/images/photos/guinea-pig-1.jpg', '/images/photos/guinea-pig-2.jpg', '/images/photos/guinea-pig-3.jpg']],
];
// fallback rotation for stories that don't match a specific species
const COVERS = ['/images/photos/corn-snake-3.jpg', '/images/photos/red-eared-slider-1.jpg', '/images/photos/bearded-dragon-1.jpg', '/images/terrarium.svg', '/images/vet-check.svg'];

function pickCover(title, id) {
  for (const [re, pool] of PHOTO_MAP) {
    if (re.test(title)) return pool[parseInt(id, 16) % pool.length];
  }
  return COVERS[parseInt(id, 16) % COVERS.length];
}
const QUERY = '(reptile OR herpetology OR tortoise OR "bearded dragon" OR chameleon OR iguana OR gecko OR "exotic pet") (care OR health OR species OR conservation OR veterinary OR discovered OR study OR rescue OR habitat) when:14d';
const FEED = `https://news.google.com/rss/search?q=${encodeURIComponent(QUERY)}&hl=en-US&gl=US&ceid=US:en`;
// only keep genuinely animal/reptile stories; drop political/sports/tech uses of "snake"/"python"
const ANIMAL_RE = /reptile|lizard|snake|python|boa|gecko|tortoise|turtle|chameleon|iguana|herpetolog|amphibian|salamander|crocodile|alligator|bearded dragon|monitor lizard|terrarium|exotic pet|frog|newt/i;
const NOISE_RE = /\b(python (programming|code|coder|developer|script|django|flask|library)|monty python|nfl|nba|mlb|premier league|la liga|world cup|senate|congress|parliament|election|stock|shares|crypto|bitcoin|box office|trailer|xbox|playstation|smartphone)\b/i;

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

// collapse immediate repeated words (a common machine-translation glitch)
const tidy = (t) => decode(t).replace(/(\S+)(\s+\1)+/gu, '$1').replace(/\s{2,}/g, ' ').trim();

async function gTranslate(text) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fa&dt=t&q=${encodeURIComponent(text)}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return null;
    const j = await r.json();
    const t = (j?.[0] || []).map((s) => (s && s[0]) || '').join('');
    return t ? tidy(t) : null;
  } catch { return null; }
}

async function myMemory(text) {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fa&de=${TRANSLATE_EMAIL}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'exoticsbymahdiyar-newsbot' } });
    const j = await r.json();
    const t = j?.responseData?.translatedText;
    if (!t || /MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID|AUTH/i.test(t)) return null;
    return tidy(t);
  } catch { return null; }
}

// Google (better quality) first, MyMemory as fallback
async function translate(text) {
  return (await gTranslate(text)) || (await myMemory(text));
}

// NOTE: fetching a fuller summary from the source was tried and reverted.
// Google News RSS <link> URLs resolve to a Google-hosted redirect page, not
// the publisher's article -- so its meta description is just Google's own
// generic boilerplate, identical on every item. Publishing that would create
// near-duplicate thin content across all news posts (the opposite of the
// goal), so we keep this to translated-headline + source + link only.

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

    // relevance filter: must be about a real animal/reptile, not a metaphor
    if (!ANIMAL_RE.test(title) || NOISE_RE.test(title)) continue;

    const id = createHash('md5').update(link).digest('hex').slice(0, 10);
    const file = `${NEWS_DIR}/auto-${id}.md`;
    if (existsSync(file)) continue; // already posted -> dedupe

    const faTitle = await translate(title);
    if (!faTitle) continue; // skip if translation unavailable (keep quality)

    const date = pub ? new Date(pub) : new Date();
    const iso = isNaN(date) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
    const cover = pickCover(`${title} ${faTitle}`, id);
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

برای مطالعه‌ی متن کامل، به منبع اصلی خبر مراجعه کنید:

> منبع: [${source}](${link})
`;
    writeFileSync(file, md, 'utf8');
    console.log('added:', file, '=>', faTitle);
    added++;
  }
  console.log(`done. added ${added} news item(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
