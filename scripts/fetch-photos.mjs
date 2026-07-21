import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import sharp from 'sharp';

const OUT_DIR = 'public/images/photos';
const CREDITS_PATH = `${OUT_DIR}/CREDITS.json`;
const CREDITS = existsSync(CREDITS_PATH) ? JSON.parse(readFileSync(CREDITS_PATH, 'utf8')) : {};
mkdirSync(OUT_DIR, { recursive: true });

// species: [slug, search query on Commons]
const SPECIES = [
  ['finch', 'zebra finch Taeniopygia guttata'],
];

const GOOD_LICENSE = /^(cc0|public domain|pd|cc by( |-)?\d|cc by-sa( |-)?\d)/i;
const BAD_NAME = /logo|map|distribution|skull|skeleton|diagram|icon|taxonom|locations?\b|range\b|drawing|illustration|clipart|flag|coat of arms|stamp|mating|\bcuy\b|prepara|bloeme|manuscript|codex|miniature|engraving|woodcut|etching|painting|artwork|\bmeal\b|\bdish\b|dinner|cuisine|recipe|slaughter|butcher|\bskin(ned|ning)?\b/i;
const UA = 'exoticsbymahdiyar.ir photo-fetch/1.0 (https://exoticsbymahdiyar.ir; m.ramzgooyan@gmail.com)';
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function api(params) {
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ format: 'json', origin: '*', ...params });
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  return r.json();
}

async function searchCandidates(query) {
  const j = await api({
    action: 'query',
    generator: 'search',
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: '25',
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '1400',
  });
  const pages = j?.query?.pages;
  if (!pages) return [];
  return Object.values(pages)
    .map((p) => {
      const info = p.imageinfo?.[0];
      if (!info) return null;
      const meta = info.extmetadata || {};
      const license = meta.LicenseShortName?.value || '';
      const artist = (meta.Artist?.value || '').replace(/<[^>]+>/g, '').trim();
      return {
        title: p.title,
        url: info.thumburl || info.url,
        width: info.thumbwidth || info.width,
        height: info.thumbheight || info.height,
        mime: info.mime,
        license,
        artist,
      };
    })
    .filter(Boolean)
    .filter((c) => /^image\/(jpeg|png)$/i.test(c.mime))
    .filter((c) => GOOD_LICENSE.test(c.license))
    .filter((c) => !BAD_NAME.test(c.title))
    .filter((c) => c.width >= 500 && c.height >= 350)
    // prefer landscape-ish images for cover use
    .sort((a, b) => Math.abs(a.width / a.height - 1.5) - Math.abs(b.width / b.height - 1.5));
}

async function main() {
  for (const [slug, query] of SPECIES) {
    process.stdout.write(`\n=== ${slug} (${query}) ===\n`);
    let candidates = [];
    try {
      candidates = await searchCandidates(query);
    } catch (e) {
      console.log('  search error:', e.message);
      continue;
    }
    if (!candidates.length) { console.log('  NO CANDIDATES FOUND'); continue; }

    const picked = [];
    for (const c of candidates) {
      if (picked.length >= 3) break;
      // diversity: skip if title too similar to an already-picked one
      if (picked.some((p) => p.title.slice(0, 15) === c.title.slice(0, 15))) continue;
      picked.push(c);
    }

    for (let i = 0; i < picked.length; i++) {
      const c = picked[i];
      const outPath = `${OUT_DIR}/${slug}-${i + 1}.jpg`;
      let ok = false;
      for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
        try {
          const r = await fetch(c.url, { headers: { 'User-Agent': UA } });
          const ct = r.headers.get('content-type') || '';
          if (!r.ok || !/^image\//.test(ct)) throw new Error(`bad response ${r.status} ${ct}`);
          const buf = Buffer.from(await r.arrayBuffer());
          await sharp(buf).resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(outPath);
          CREDITS[`${slug}-${i + 1}.jpg`] = { title: c.title, license: c.license, artist: c.artist || 'Wikimedia Commons contributor' };
          console.log(`  saved ${outPath}  [${c.license}] ${c.title}`);
          ok = true;
        } catch (e) {
          if (attempt === 2) console.log(`  FAILED ${c.title}:`, e.message);
          else await sleep(1500);
        }
      }
      await sleep(500);
    }
    await sleep(600);
  }
  writeFileSync(CREDITS_PATH, JSON.stringify(CREDITS, null, 2), 'utf8');
  console.log('\ndone. credits written to CREDITS.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
