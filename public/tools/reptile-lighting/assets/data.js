/* =========================================================
   داده‌های پایه: گونه‌ها، لامپ‌ها، برندهای محفظه و الگوهای آماده
   مقادیر شبیه‌سازی تقریبی هستند و برای مقایسه و برنامه‌ریزی ساخته شده‌اند.
   uvi30  : شاخص UV در ۳۰ سانتی‌متری زیر مرکز لامپ (بدون توری، با رفلکتور)
   heat30 : چگالی توان تابشی (W/m²) در ۳۰ سانتی‌متری زیر مرکز
   lux30  : شدت روشنایی (لوکس) در ۳۰ سانتی‌متری زیر مرکز
   ========================================================= */

const CATEGORIES = [
  { id: 'lizard',    fa: 'مارمولک‌ها و آگاماها' },
  { id: 'gecko',     fa: 'گکوها' },
  { id: 'chameleon', fa: 'کامیلیون‌ها (آفتاب‌پرست)' },
  { id: 'snake',     fa: 'مارها' },
  { id: 'chelonian', fa: 'لاک‌پشت‌ها' },
  { id: 'amphibian', fa: 'دوزیستان' },
  { id: 'custom',    fa: 'سفارشی' },
];

/* =========================================================
   گونه‌ها
   منبع اصلی: Baines F. و همکاران (۲۰۱۶) «How much UVB does my reptile need? The UV-Tool»،
   Journal of Zoo and Aquarium Research 4(1): 42–63 — جدول ۱ (مناطق فرگوسن) و پیوست (منطقه و دمای سطح آفتاب‌گیری هر گونه).
   src: 'uvtool' = مستقیم از پیوست مقاله | 'rel' = از نزدیک‌ترین گونهٔ خویشاوند در مقاله | 'est' = در مقاله نیست؛ تخمین از منابع نگهداری
   zone: منطقهٔ فرگوسن (مثل '3-4' یعنی منطقهٔ ۳ تا ۴)
   bask: دمای سطح نقطهٔ آفتاب‌گیری (°C) از پیوست مقاله
   ========================================================= */

/* هدف UVI در نزدیک‌ترین نقطه به لامپ — از ستون «Maximum UVI» جدول ۱ مقاله؛
   برای منطقهٔ ۴ طبق توصیهٔ مقاله حداکثر زیر نور مصنوعی ۷ در نظر گرفته شده است. */
const ZONE_UVI = { '1': [0.6, 1.4], '1-2': [0.8, 2.0], '2': [1.1, 3.0], '2-3': [2.0, 4.0], '3': [2.9, 5.0], '3-4': [3.5, 7.0], '4': [4.5, 7.0] };
/* روشنایی پیشنهادی بر اساس رفتار آفتاب‌گیری (راهنمای عمومی، نه از مقاله) */
const ZONE_LUX = { 1: [2000, 15000], 2: [5000, 25000], 3: [10000, 50000], 4: [20000, 80000] };

/* چگالی توان هدف (W/m²) از دمای سطح آفتاب‌گیری تخمین زده می‌شود:
   تقریب خطی ≈ ۱۸ × (دمای سطح − ۲۲) — مقاله عدد W/m² ارائه نمی‌کند، پس این مقدار تخمینی است. */
const heatFromBask = t => Math.max(60, Math.min(650, Math.round(18 * (t - 22) / 10) * 10));
const faNum = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

function makeSpecies(id, cat, fa, en, zone, bask, len, back, encl, shape, src) {
  const zTop = +String(zone).split('-').pop();
  return {
    id, cat, fa, en, zoneLabel: String(zone), zone: zTop,
    uvi: [...ZONE_UVI[zone]],
    heat: bask ? [heatFromBask(bask[0]), heatFromBask(bask[1])] : [0, 60],
    lux: [...ZONE_LUX[zTop]],
    len, back, encl, shape, src,
    bask: bask ? (bask[0] === bask[1] ? faNum(bask[0]) : faNum(bask[0]) + ' تا ' + faNum(bask[1])) : 'بدون نقطهٔ گرم',
  };
}

const SPECIES = [
  // ---------- مارمولک‌ها ----------
  ['bearded',     'lizard', 'بیردد دراگون', 'Pogona vitticeps', '3-4', [40, 45], 45, 6, [120, 60, 60], 'lizard', 'uvtool'],
  ['uromastyx',   'lizard', 'یوروماستیکس', 'Uromastyx spp.', '4', [45, 50], 40, 7, [120, 60, 60], 'lizard', 'uvtool'],
  ['ackie',       'lizard', 'آکی مانیتور', 'Varanus acanthurus', '3-4', [55, 65], 65, 7, [150, 75, 90], 'lizard', 'rel'],
  ['savannah',    'lizard', 'ساوانا مانیتور', 'Varanus exanthematicus', '3-4', [55, 65], 100, 10, [240, 120, 120], 'lizard', 'uvtool'],
  ['tegu',        'lizard', 'آرژانتین تگو', 'Salvator merianae', '3', [35, 40], 120, 12, [240, 120, 120], 'lizard', 'uvtool'],
  ['bluetongue',  'lizard', 'بلوتانگ اسکینک', 'Tiliqua scincoides', '2-3', [35, 45], 50, 6, [120, 60, 60], 'lizard', 'uvtool'],
  ['shingleback', 'lizard', 'شینگل‌بک اسکینک', 'Tiliqua rugosa', '2-3', [35, 40], 35, 7, [120, 60, 60], 'lizard', 'uvtool'],
  ['waterdragon', 'lizard', 'چاینیز واتر دراگون', 'Physignathus cocincinus', '2-3', [30, 40], 80, 8, [150, 60, 150], 'lizard', 'uvtool'],
  ['iguana',      'lizard', 'گرین ایگوانا', 'Iguana iguana', '3-4', [40, 45], 150, 14, [240, 120, 180], 'lizard', 'rel'],
  ['rhinoiguana', 'lizard', 'راینو ایگوانا', 'Cyclura cornuta', '4', [40, 50], 110, 12, [240, 120, 120], 'lizard', 'uvtool'],
  ['frilled',     'lizard', 'فریلد دراگون', 'Chlamydosaurus kingii', '3', [38, 42], 70, 8, [150, 75, 150], 'lizard', 'uvtool'],
  ['collared',    'lizard', 'کالرد لیزارد', 'Crotaphytus collaris', '3-4', [40, 48], 30, 5, [120, 60, 60], 'lizard', 'uvtool'],
  ['chuckwalla',  'lizard', 'چاکوالا', 'Sauromalus ater', '4', [45, 50], 40, 7, [120, 60, 60], 'lizard', 'uvtool'],
  ['desertiguana','lizard', 'دزرت ایگوانا', 'Dipsosaurus dorsalis', '3', [45, 50], 35, 5, [120, 60, 60], 'lizard', 'uvtool'],
  ['curlytail',   'lizard', 'کرلی‌تیل لیزارد', 'Leiocephalus carinatus', '3', [40, 50], 25, 4, [90, 45, 45], 'lizard', 'uvtool'],
  ['platedlizard','lizard', 'سودان پلیتد لیزارد', 'Gerrhosaurus major', '3', [35, 40], 50, 6, [120, 60, 60], 'lizard', 'uvtool'],
  ['berber',      'lizard', 'بربر اسکینک (بومی ایران)', 'Eumeces schneideri', '3', [38, 42], 40, 5, [120, 60, 60], 'lizard', 'uvtool'],
  ['agamid',      'lizard', 'کاکیژن آگاما (آگامای قفقازی، بومی ایران)', 'Paralaudakia caucasia', '3-4', [35, 42], 30, 5, [120, 60, 60], 'lizard', 'rel'],
  ['spinytail',   'lizard', 'دزرت مانیتور (بزمجه، بومی ایران)', 'Varanus griseus', '3-4', [45, 55], 110, 10, [240, 120, 90], 'lizard', 'rel'],
  ['gila',        'lizard', 'گیلا مانستر', 'Heloderma suspectum', '2-3', [34, 37], 45, 7, [120, 60, 60], 'lizard', 'uvtool'],
  ['anole',       'lizard', 'گرین آنول', 'Anolis carolinensis', '2', [30, 35], 18, 2, [45, 45, 60], 'lizard', 'uvtool'],
  ['basilisk',    'lizard', 'پلومد بازیلیسک', 'Basiliscus plumifrons', '2', [30, 35], 70, 7, [120, 60, 150], 'lizard', 'uvtool'],

  // ---------- گکوها ----------
  ['leopard',     'gecko', 'لئوپارد گکو', 'Eublepharis macularius', '1', [30, 34], 22, 3, [90, 45, 45], 'gecko', 'uvtool'],
  ['crested',     'gecko', 'کرستد گکو', 'Correlophus ciliatus', '1', [26, 28], 20, 3, [45, 45, 90], 'gecko', 'uvtool'],
  ['gargoyle',    'gecko', 'گارگویل گکو', 'Rhacodactylus auriculatus', '2', [27, 29], 22, 3, [45, 45, 90], 'gecko', 'uvtool'],
  ['daygecko',    'gecko', 'جاینت دی گکو', 'Phelsuma grandis', '3', [30, 35], 25, 3, [45, 45, 90], 'gecko', 'uvtool'],
  ['electricblue','gecko', 'الکتریک بلو دی گکو', 'Lygodactylus williamsi', '2-3', [30, 32], 8, 1.5, [45, 45, 60], 'gecko', 'uvtool'],
  ['tokay',       'gecko', 'توکای گکو', 'Gekko gecko', '1', [30, 32], 30, 4, [60, 45, 90], 'gecko', 'est'],
  ['fattail',     'gecko', 'آفریکن فت‌تیل گکو', 'Hemitheconyx caudicinctus', '1', [30, 33], 20, 3, [90, 45, 45], 'gecko', 'est'],
  ['wonder',      'gecko', 'واندر گکو (بومی ایران)', 'Teratoscincus scincus', '2', [33, 35], 15, 3, [90, 45, 45], 'gecko', 'uvtool'],
  ['moorish',     'gecko', 'موریش گکو', 'Tarentola mauritanica', '2', [30, 32], 15, 2, [60, 45, 60], 'gecko', 'uvtool'],
  ['leaftail',    'gecko', 'لیف‌تیل گکو', 'Uroplatus henkeli', '1-2', [25, 28], 25, 3, [45, 45, 90], 'gecko', 'uvtool'],

  // ---------- کامیلیون‌ها ----------
  ['veiled',      'chameleon', 'ویلد کامیلیون', 'Chamaeleo calyptratus', '3', [35, 40], 45, 8, [60, 60, 120], 'chameleon', 'uvtool'],
  ['panther',     'chameleon', 'پنتر کامیلیون', 'Furcifer pardalis', '3', [35, 40], 40, 8, [60, 60, 120], 'chameleon', 'uvtool'],
  ['jackson',     'chameleon', 'جکسون کامیلیون', 'Trioceros jacksonii', '2-3', [32, 36], 30, 7, [60, 60, 120], 'chameleon', 'uvtool'],
  ['meller',      'chameleon', 'ملرز کامیلیون', 'Trioceros melleri', '2', [29, 32], 55, 10, [90, 60, 150], 'chameleon', 'uvtool'],

  // ---------- مارها ----------
  ['ballpython',  'snake', 'بال پایتون', 'Python regius', '2', [35, 40], 120, 8, [120, 60, 60], 'snake', 'uvtool'],
  ['corn',        'snake', 'کورن اسنیک', 'Pantherophis guttatus', '1-2', [29, 32], 120, 5, [120, 60, 60], 'snake', 'uvtool'],
  ['kingsnake',   'snake', 'کینگ اسنیک', 'Lampropeltis getula', '1', [28, 32], 110, 5, [120, 60, 60], 'snake', 'rel'],
  ['milksnake',   'snake', 'میلک اسنیک', 'Lampropeltis triangulum', '1', [28, 32], 100, 5, [120, 60, 60], 'snake', 'uvtool'],
  ['hognose',     'snake', 'وسترن هاگنوز', 'Heterodon nasicus', '2', [28, 32], 60, 5, [90, 45, 45], 'snake', 'uvtool'],
  ['garter',      'snake', 'گارتر اسنیک', 'Thamnophis sirtalis', '2', [28, 32], 70, 4, [90, 45, 45], 'snake', 'uvtool'],
  ['boa',         'snake', 'بوآ کانستریکتور', 'Boa constrictor', '2', [28, 32], 180, 10, [180, 60, 60], 'snake', 'uvtool'],
  ['sandboa',     'snake', 'سند بوآ (بوآی شنی، بومی ایران)', 'Eryx jaculus', '1', [30, 34], 50, 4, [90, 45, 45], 'snake', 'est'],
  ['carpet',      'snake', 'کارپت پایتون', 'Morelia spilota', '2', [30, 32], 200, 10, [180, 60, 120], 'snake', 'uvtool'],
  ['childrens',   'snake', 'چیلدرنز پایتون', 'Antaresia childreni', '1-2', [35, 42], 90, 6, [120, 60, 60], 'snake', 'uvtool'],
  ['woma',        'snake', 'وما پایتون', 'Aspidites ramsayi', '1-2', [30, 34], 150, 8, [150, 60, 60], 'snake', 'uvtool'],
  ['burmese',     'snake', 'برمیز پایتون', 'Python bivittatus', '1', [28, 32], 400, 20, [300, 120, 120], 'snake', 'uvtool'],
  ['retic',       'snake', 'رتیکولیتد پایتون', 'Malayopython reticulatus', '1', [28, 32], 450, 20, [300, 120, 120], 'snake', 'uvtool'],
  ['gtp',         'snake', 'گرین تری پایتون', 'Morelia viridis', '1', [26, 30], 150, 8, [90, 60, 90], 'snake', 'uvtool'],
  ['etb',         'snake', 'امرالد تری بوآ', 'Corallus caninus', '1', [26, 30], 150, 8, [90, 60, 90], 'snake', 'uvtool'],

  // ---------- لاک‌پشت‌ها ----------
  ['hermann',     'chelonian', 'هرمان تورتویز', 'Testudo hermanni', '3', [33, 37], 18, 9, [150, 75, 60], 'tortoise', 'uvtool'],
  ['horsfield',   'chelonian', 'هورسفیلد تورتویز (رشن تورتویز، بومی ایران)', 'Testudo horsfieldii', '3', [33, 37], 18, 9, [150, 75, 60], 'tortoise', 'rel'],
  ['greek',       'chelonian', 'گریک تورتویز (لاک‌پشت مهمیزدار، بومی ایران)', 'Testudo graeca', '3', [33, 37], 20, 10, [150, 75, 60], 'tortoise', 'uvtool'],
  ['marginated',  'chelonian', 'مارجینیتد تورتویز', 'Testudo marginata', '4', [33, 37], 25, 11, [180, 90, 60], 'tortoise', 'uvtool'],
  ['egyptian',    'chelonian', 'ایجیپشن تورتویز', 'Testudo kleinmanni', '3', [30, 35], 12, 6, [120, 60, 60], 'tortoise', 'uvtool'],
  ['sulcata',     'chelonian', 'سولکاتا تورتویز', 'Centrochelys sulcata', '3-4', [45, 50], 40, 20, [240, 120, 60], 'tortoise', 'uvtool'],
  ['leopardtort', 'chelonian', 'لئوپارد تورتویز', 'Stigmochelys pardalis', '3', [40, 50], 40, 20, [240, 120, 60], 'tortoise', 'uvtool'],
  ['star',        'chelonian', 'ایندین استار تورتویز', 'Geochelone elegans', '3', [28, 32], 25, 12, [180, 90, 60], 'tortoise', 'uvtool'],
  ['radiated',    'chelonian', 'رادیاتد تورتویز', 'Astrochelys radiata', '3', [35, 45], 35, 16, [240, 120, 60], 'tortoise', 'uvtool'],
  ['pancake',     'chelonian', 'پنکیک تورتویز', 'Malacochersus tornieri', '2-3', [30, 32], 15, 4, [120, 60, 60], 'tortoise', 'uvtool'],
  ['redfoot',     'chelonian', 'ردفوت تورتویز', 'Chelonoidis carbonarius', '1-2', [30, 35], 30, 14, [180, 90, 60], 'tortoise', 'uvtool'],
  ['yellowfoot',  'chelonian', 'یلوفوت تورتویز', 'Chelonoidis denticulatus', '2', [28, 32], 40, 18, [240, 120, 60], 'tortoise', 'uvtool'],
  ['redeared',    'chelonian', 'رد ایرد اسلایدر', 'Trachemys scripta elegans', '3-4', [33, 37], 25, 8, [120, 45, 60], 'tortoise', 'uvtool'],
  ['yellowbelly', 'chelonian', 'یلوبلی اسلایدر', 'Trachemys scripta scripta', '3-4', [33, 37], 25, 8, [120, 45, 60], 'tortoise', 'uvtool'],
  ['mapturtle',   'chelonian', 'مپ تورتل', 'Graptemys spp.', '3-4', [33, 37], 20, 7, [120, 45, 60], 'tortoise', 'uvtool'],
  ['musk',        'chelonian', 'ماسک تورتل', 'Sternotherus odoratus', '2-3', [33, 37], 12, 5, [90, 45, 45], 'tortoise', 'uvtool'],
  ['snapper',     'chelonian', 'کامن اسنپینگ تورتل', 'Chelydra serpentina', '2-3', [33, 37], 40, 14, [180, 60, 60], 'tortoise', 'uvtool'],
  ['pondturtle',  'chelonian', 'یوروپین پاند تورتل (لاک‌پشت برکه‌ای، بومی ایران)', 'Emys orbicularis', '3', [33, 37], 18, 7, [120, 45, 60], 'tortoise', 'uvtool'],
  ['caspian',     'chelonian', 'کاسپین تورتل (لاک‌پشت خزری، بومی ایران)', 'Mauremys caspica', '3', [33, 37], 22, 7, [120, 45, 60], 'tortoise', 'rel'],

  // ---------- دوزیستان ----------
  ['whitetree',   'amphibian', 'وایت تری فراگ', 'Litoria caerulea', '1-2', [28, 30], 10, 4, [45, 45, 60], 'frog', 'est'],
  ['redeyed',     'amphibian', 'رد آی تری فراگ', 'Agalychnis callidryas', '1-2', [28, 30], 6, 2, [45, 45, 60], 'frog', 'uvtool'],
  ['dartfrog',    'amphibian', 'دارت فراگ', 'Dendrobates spp.', '1-2', [24, 28], 4, 2, [45, 45, 60], 'frog', 'uvtool'],
  ['firebelly',   'amphibian', 'فایربلی تود', 'Bombina orientalis', '1-2', [25, 28], 5, 2, [60, 30, 30], 'frog', 'uvtool'],
  ['tomato',      'amphibian', 'تومیتو فراگ', 'Dyscophus guineti', '1', [24, 28], 9, 4, [60, 30, 30], 'frog', 'uvtool'],
  ['mossy',       'amphibian', 'ماسی فراگ', 'Theloderma corticale', '1', [22, 26], 7, 3, [45, 45, 60], 'frog', 'uvtool'],
  ['pacman',      'amphibian', 'پک‌من فراگ', 'Ceratophrys cranwelli', '1', [26, 28], 12, 5, [45, 30, 30], 'frog', 'est'],
  ['firesala',    'amphibian', 'فایر سالامندر', 'Salamandra salamandra', '1', null, 18, 2, [60, 45, 30], 'lizard', 'uvtool'],

  // ---------- سفارشی ----------
  ['c-lizard',    'custom', 'مارمولک سفارشی', 'Custom lizard', '3', [38, 42], 40, 6, [120, 60, 60], 'lizard', 'custom'],
  ['c-gecko',     'custom', 'گکوی سفارشی', 'Custom gecko', '1', [30, 32], 20, 3, [90, 45, 45], 'gecko', 'custom'],
  ['c-cham',      'custom', 'کامیلیون سفارشی', 'Custom chameleon', '3', [33, 37], 40, 8, [60, 60, 120], 'chameleon', 'custom'],
  ['c-snake',     'custom', 'مار سفارشی', 'Custom snake', '2', [30, 33], 120, 6, [120, 60, 60], 'snake', 'custom'],
  ['c-tortoise',  'custom', 'لاک‌پشت سفارشی', 'Custom tortoise', '3', [33, 37], 20, 10, [150, 75, 60], 'tortoise', 'custom'],
  ['c-amph',      'custom', 'دوزیست سفارشی', 'Custom amphibian', '1', [24, 28], 8, 3, [45, 45, 60], 'frog', 'custom'],
].map(a => { const s = makeSpecies(...a); if (s.src === 'custom') s.custom = true; return s; });

/* لامپ‌ها
   kind: 'tube' (منبع خطی) | 'spot' (منبع نقطه‌ای با زاویهٔ پرتو)
   role: 'uvb' | 'heat' | 'led'
   beam: نیم‌زاویهٔ پرتو (درجه) برای لامپ‌های نقطه‌ای — n: توان تمرکز رفلکتور برای لوله‌ها */
const LAMPS = [
  // ---------- UVB ----------
  { id: 'arc12-24', role: 'uvb', kind: 'tube', brand: 'Arcadia', name: 'ProT5 کویری ۱۲٪ — ۲۴ وات', len: 55, watts: 24, uvi30: 6.0, lux30: 7500, heat30: 8,  n: 2 },
  { id: 'arc12-39', role: 'uvb', kind: 'tube', brand: 'Arcadia', name: 'ProT5 کویری ۱۲٪ — ۳۹ وات', len: 85, watts: 39, uvi30: 6.8, lux30: 9000, heat30: 10, n: 2 },
  { id: 'arc12-54', role: 'uvb', kind: 'tube', brand: 'Arcadia', name: 'ProT5 کویری ۱۲٪ — ۵۴ وات', len: 115, watts: 54, uvi30: 7.3, lux30: 10500, heat30: 12, n: 2 },
  { id: 'arc14-24', role: 'uvb', kind: 'tube', brand: 'Arcadia', name: 'ProT5 کویری ۱۴٪ — ۲۴ وات', len: 55, watts: 24, uvi30: 7.6, lux30: 7200, heat30: 8,  n: 2 },
  { id: 'arc14-54', role: 'uvb', kind: 'tube', brand: 'Arcadia', name: 'ProT5 کویری ۱۴٪ — ۵۴ وات', len: 115, watts: 54, uvi30: 8.8, lux30: 10000, heat30: 12, n: 2 },
  { id: 'arc6-24',  role: 'uvb', kind: 'tube', brand: 'Arcadia', name: 'ProT5 جنگلی ۶٪ — ۲۴ وات', len: 55, watts: 24, uvi30: 3.1, lux30: 8000, heat30: 8,  n: 2 },
  { id: 'arc6-39',  role: 'uvb', kind: 'tube', brand: 'Arcadia', name: 'ProT5 جنگلی ۶٪ — ۳۹ وات', len: 85, watts: 39, uvi30: 3.5, lux30: 9500, heat30: 10, n: 2 },
  { id: 'arc6-54',  role: 'uvb', kind: 'tube', brand: 'Arcadia', name: 'ProT5 جنگلی ۶٪ — ۵۴ وات', len: 115, watts: 54, uvi30: 3.8, lux30: 11000, heat30: 12, n: 2 },
  { id: 'arcShade', role: 'uvb', kind: 'tube', brand: 'Arcadia', name: 'ShadeDweller ۷٪ — ۱۱ وات', len: 30, watts: 11, uvi30: 1.3, lux30: 3000, heat30: 4, n: 2 },
  { id: 'zm10-24',  role: 'uvb', kind: 'tube', brand: 'Zoo Med', name: 'ReptiSun 10.0 T5 HO — ۲۴ وات', len: 55, watts: 24, uvi30: 5.1, lux30: 7000, heat30: 8,  n: 2 },
  { id: 'zm10-39',  role: 'uvb', kind: 'tube', brand: 'Zoo Med', name: 'ReptiSun 10.0 T5 HO — ۳۹ وات', len: 85, watts: 39, uvi30: 5.7, lux30: 8500, heat30: 10, n: 2 },
  { id: 'zm5-24',   role: 'uvb', kind: 'tube', brand: 'Zoo Med', name: 'ReptiSun 5.0 T5 HO — ۲۴ وات', len: 55, watts: 24, uvi30: 2.6, lux30: 7500, heat30: 8,  n: 2 },
  { id: 'et150-24', role: 'uvb', kind: 'tube', brand: 'Exo Terra', name: 'Reptile UVB150 T5 — ۲۴ وات', len: 55, watts: 24, uvi30: 4.3, lux30: 6800, heat30: 8,  n: 2 },
  { id: 'et100-24', role: 'uvb', kind: 'tube', brand: 'Exo Terra', name: 'Reptile UVB100 T5 — ۲۴ وات', len: 55, watts: 24, uvi30: 2.2, lux30: 7000, heat30: 8,  n: 2 },
  { id: 'gen-t8-10',role: 'uvb', kind: 'tube', brand: 'عمومی',   name: 'لولهٔ T8 ده درصد — ۱۸ وات (بدون رفلکتور)', len: 60, watts: 18, uvi30: 1.4, lux30: 3500, heat30: 5, n: 1 },
  { id: 'gen-t5-10',role: 'uvb', kind: 'tube', brand: 'عمومی',   name: 'لولهٔ T5 ده درصد (بازار ایران) — ۲۴ وات', len: 55, watts: 24, uvi30: 4.0, lux30: 6500, heat30: 8, n: 2 },
  { id: 'gen-coil', role: 'uvb', kind: 'spot', brand: 'عمومی',   name: 'لامپ کم‌مصرف UVB ده درصد — ۲۶ وات', watts: 26, uvi30: 2.2, lux30: 5000, heat30: 10, beam: 45 },
  { id: 'mvb-100',  role: 'uvb', kind: 'spot', brand: 'بخار جیوه', name: 'لامپ بخار جیوه (MVB) — ۱۰۰ وات', watts: 100, uvi30: 7.5, lux30: 26000, heat30: 260, beam: 28 },
  { id: 'mvb-160',  role: 'uvb', kind: 'spot', brand: 'بخار جیوه', name: 'لامپ بخار جیوه (MVB) — ۱۶۰ وات', watts: 160, uvi30: 10.5, lux30: 38000, heat30: 360, beam: 30 },

  // ---------- گرما ----------
  { id: 'hal-50',   role: 'heat', kind: 'spot', brand: 'هالوژن',    name: 'هالوژن نقطه‌ای ۵۰ وات', watts: 50,  heat30: 150, lux30: 9000,  beam: 22 },
  { id: 'hal-75',   role: 'heat', kind: 'spot', brand: 'هالوژن',    name: 'هالوژن نقطه‌ای ۷۵ وات', watts: 75,  heat30: 220, lux30: 13000, beam: 22 },
  { id: 'hal-100',  role: 'heat', kind: 'spot', brand: 'هالوژن',    name: 'هالوژن نقطه‌ای ۱۰۰ وات', watts: 100, heat30: 290, lux30: 17000, beam: 22 },
  { id: 'hal-flood-100', role: 'heat', kind: 'spot', brand: 'هالوژن', name: 'هالوژن پخش (فلاد) ۱۰۰ وات', watts: 100, heat30: 190, lux30: 12000, beam: 38 },
  { id: 'hal-150',  role: 'heat', kind: 'spot', brand: 'هالوژن',    name: 'هالوژن پخش (فلاد) ۱۵۰ وات', watts: 150, heat30: 290, lux30: 18000, beam: 38 },
  { id: 'par30-75', role: 'heat', kind: 'spot', brand: 'بازار ایران', name: 'هالوژن PAR30 معمولی ۷۵ وات', watts: 75, heat30: 200, lux30: 12500, beam: 25 },
  { id: 'par38-100',role: 'heat', kind: 'spot', brand: 'بازار ایران', name: 'هالوژن PAR38 معمولی ۱۰۰ وات', watts: 100, heat30: 250, lux30: 15000, beam: 28 },
  { id: 'inc-60',   role: 'heat', kind: 'spot', brand: 'رشته‌ای',    name: 'لامپ رشته‌ای آفتاب‌گیری ۶۰ وات', watts: 60, heat30: 105, lux30: 5000, beam: 45 },
  { id: 'inc-100',  role: 'heat', kind: 'spot', brand: 'رشته‌ای',    name: 'لامپ رشته‌ای آفتاب‌گیری ۱۰۰ وات', watts: 100, heat30: 170, lux30: 8000, beam: 45 },
  { id: 'et-int-100', role: 'heat', kind: 'spot', brand: 'Exo Terra', name: 'Intense Basking Spot — ۱۰۰ وات', watts: 100, heat30: 300, lux30: 15000, beam: 20 },
  { id: 'zm-rd-100', role: 'heat', kind: 'spot', brand: 'Zoo Med',   name: 'Repti Halogen — ۱۰۰ وات', watts: 100, heat30: 280, lux30: 16000, beam: 24 },
  { id: 'arc-hal-75', role: 'heat', kind: 'spot', brand: 'Arcadia',  name: 'Halogen Heat Lamp — ۷۵ وات', watts: 75, heat30: 230, lux30: 14000, beam: 20 },
  { id: 'dhp-80',   role: 'heat', kind: 'spot', brand: 'Arcadia',   name: 'Deep Heat Projector — ۸۰ وات (بدون نور)', watts: 80, heat30: 180, lux30: 0, beam: 35 },
  { id: 'che-100',  role: 'heat', kind: 'spot', brand: 'سرامیکی',   name: 'لامپ سرامیکی (CHE) — ۱۰۰ وات (بدون نور)', watts: 100, heat30: 110, lux30: 0, beam: 60 },
  { id: 'che-60',   role: 'heat', kind: 'spot', brand: 'سرامیکی',   name: 'لامپ سرامیکی (CHE) — ۶۰ وات (بدون نور)', watts: 60, heat30: 65, lux30: 0, beam: 60 },

  // ---------- LED ----------
  { id: 'arc-jd-30', role: 'led', kind: 'tube', brand: 'Arcadia', name: 'Jungle Dawn LED Bar — ۳۰ وات', len: 55, watts: 30, lux30: 22000, heat30: 6, n: 2 },
  { id: 'arc-jd-15', role: 'led', kind: 'tube', brand: 'Arcadia', name: 'Jungle Dawn LED Bar — ۱۵ وات', len: 30, watts: 15, lux30: 12000, heat30: 3, n: 2 },
  { id: 'gen-led-20', role: 'led', kind: 'tube', brand: 'عمومی', name: 'لولهٔ LED ۶۵۰۰ کلوین — ۲۰ وات', len: 60, watts: 20, lux30: 11000, heat30: 4, n: 1.5 },
  { id: 'gen-led-40', role: 'led', kind: 'tube', brand: 'عمومی', name: 'لولهٔ LED ۶۵۰۰ کلوین — ۴۰ وات', len: 120, watts: 40, lux30: 16000, heat30: 7, n: 1.5 },
  { id: 'gen-ledspot-10', role: 'led', kind: 'spot', brand: 'عمومی', name: 'اسپات LED ۶۵۰۰ کلوین — ۱۰ وات', watts: 10, lux30: 14000, heat30: 4, beam: 20 },
  { id: 'grow-50',  role: 'led', kind: 'spot', brand: 'عمومی', name: 'پنل رشد گیاه LED — ۵۰ وات', watts: 50, lux30: 30000, heat30: 12, beam: 50 },
];

/* برندهای محفظه و درصد انسداد توری */
const ENCLOSURE_BRANDS = [
  { id: 'none',   fa: 'بدون توری / ساخت داخلی باز', mesh: 0 },
  { id: 'fine',   fa: 'توری ریز فلزی (معمول بازار ایران)', mesh: 40 },
  { id: 'std',    fa: 'توری استاندارد فلزی', mesh: 30 },
  { id: 'coarse', fa: 'توری درشت / پانچ‌شده', mesh: 20 },
  { id: 'exo',    fa: 'Exo Terra', mesh: 40 },
  { id: 'zoomed', fa: 'Zoo Med', mesh: 35 },
  { id: 'glass',  fa: 'درپوش شیشه‌ای (UVB عبور نمی‌کند!)', mesh: 100 },
  { id: 'custom', fa: 'سفارشی', mesh: null },
];

/* باندهای رنگی نقشهٔ حرارتی */
const BANDS = {
  uvb: {
    unit: 'UVI', label: 'شاخص UV',
    stops: [0, 0.02, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    labels: ['۰', '۰٫۰۲–۰٫۹', '۱–۱٫۹', '۲–۲٫۹', '۳–۳٫۹', '۴–۴٫۹', '۵–۵٫۹', '۶–۶٫۹', '۷–۷٫۹', '۸–۸٫۹', '۹–۹٫۹', '۱۰–۱۰٫۹', '+۱۱'],
    colors: ['#ffffff', '#eef6e6', '#d6ecc4', '#badf9f', '#f2eea6', '#f8d68e', '#f7bd9b', '#f3a2a0', '#ea8c9a', '#db93cc', '#c092df', '#a487e3', '#8a72d6'],
  },
  heat: {
    unit: 'W/m²', label: 'چگالی توان',
    stops: [0, 50, 150, 225, 300, 375, 450],
    labels: ['۰–۴۹', '۵۰–۱۴۹', '۱۵۰–۲۲۴', '۲۲۵–۲۹۹', '۳۰۰–۳۷۴', '۳۷۵–۴۴۹', '+۴۵۰'],
    colors: ['#fffdf3', '#fff4c4', '#ffe28a', '#ffc94d', '#ffa630', '#ff7a1f', '#ef4418'],
  },
  led: {
    unit: 'لوکس', label: 'روشنایی',
    stops: [0, 1000, 5000, 10000, 20000, 40000, 70000],
    labels: ['۰–۱هزار', '۱–۵هزار', '۵–۱۰هزار', '۱۰–۲۰هزار', '۲۰–۴۰هزار', '۴۰–۷۰هزار', '+۷۰هزار'],
    colors: ['#fbfbfd', '#eef2fb', '#dbe6fb', '#c0d6fb', '#9fc0fa', '#7ea6f5', '#5b86ea'],
  },
};

const ZONE_TEXT = {
  1: 'منطقهٔ ۱ فرگوسن — سایه‌زی یا شب‌زی؛ فقط نورِ ملایم و پراکنده',
  2: 'منطقهٔ ۲ فرگوسن — آفتاب‌گیری جزئی و گاه‌به‌گاه',
  3: 'منطقهٔ ۳ فرگوسن — آفتاب‌گیری باز یا نیمه‌سایه',
  4: 'منطقهٔ ۴ فرگوسن — آفتاب‌گیرِ کامل در نور مستقیم ظهر',
};
