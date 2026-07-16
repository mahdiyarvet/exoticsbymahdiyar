import type { CollectionEntry } from 'astro:content';

type NewsEntry = CollectionEntry<'news'>;

type ImageRule = {
  key: string;
  test: RegExp;
  images: string[];
};

const imageRules: ImageRule[] = [
  { key: 'iguana', test: /ایگوانا/i, images: ['/images/photos/iguana-1.jpg', '/images/photos/iguana-2.jpg', '/images/photos/iguana-3.jpg'] },
  { key: 'chameleon', test: /آفتاب[‌\s-]?پرست|chameleon/i, images: ['/images/photos/chameleon-1.jpg', '/images/photos/chameleon-2.jpg', '/images/photos/chameleon-3.jpg'] },
  { key: 'gecko', test: /گکو|gecko/i, images: ['/images/photos/crested-gecko-1.jpg', '/images/photos/leopard-gecko-2.jpg', '/images/photos/crested-gecko-3.jpg'] },
  { key: 'lizard', test: /مارمولک/i, images: ['/images/photos/green-anole-1.jpg', '/images/photos/green-anole-2.jpg', '/images/photos/blue-tongued-skink-3.jpg'] },
  { key: 'turtle', test: /لاک[‌\s-]?پشت|tortoise|turtle/i, images: ['/images/photos/red-eared-slider-1.jpg', '/images/photos/russian-tortoise-2.jpg', '/images/photos/red-eared-slider-3.jpg'] },
  { key: 'rabbit', test: /خرگوش|rabbit/i, images: ['/images/photos/rabbit-1.jpg', '/images/photos/rabbit-2.jpg', '/images/photos/rabbit-3.jpg'] },
  { key: 'frog', test: /قورباغه|frog/i, images: ['/images/photos/dart-frog-1.jpg', '/images/photos/dart-frog-2.jpg', '/images/photos/dart-frog-3.jpg'] },
  { key: 'dragon', test: /اژدها|بردد|dragon/i, images: ['/images/photos/bearded-dragon-1.jpg', '/images/photos/bearded-dragon-2.jpg', '/images/photos/bearded-dragon-3.jpg'] },
  { key: 'snake', test: /مار|پایتون|کبرا|snake|python|cobra/i, images: ['/images/photos/corn-snake-2.jpg', '/images/photos/ball-python-3.jpg', '/images/photos/king-snake-2.jpg'] },
  { key: 'bird', test: /طوطی|پرنده|کاسکو|ماکائو|bird|parrot/i, images: ['/images/photos/macaw-1.jpg', '/images/photos/african-grey-2.jpg', '/images/photos/cockatiel-1.jpg'] },
  { key: 'axolotl', test: /آکسولوتل|سمندر|axolotl/i, images: ['/images/photos/axolotl-1.jpg', '/images/photos/axolotl-2.jpg', '/images/photos/axolotl-3.jpg'] },
  { key: 'reptile', test: /خزنده|سوسمار|reptile/i, images: ['/images/photos/monitor-lizard-1.jpg', '/images/photos/uromastyx-2.jpg', '/images/photos/blue-tongued-skink-2.jpg'] },
];

const fallbackImages = [
  '/images/photos/bearded-dragon-2.jpg',
  '/images/photos/dart-frog-2.jpg',
  '/images/photos/macaw-2.jpg',
  '/images/photos/ferret-1.jpg',
  '/images/photos/axolotl-3.jpg',
  '/images/photos/hognose-snake-3.jpg',
  '/images/photos/guinea-pig-3.jpg',
];

const stableHash = (value: string) =>
  Array.from(value).reduce((total, character) => ((total * 31) + (character.codePointAt(0) ?? 0)) >>> 0, 7);

export const normalizeContentTitle = (value: string) =>
  value.normalize('NFKC').toLocaleLowerCase('fa').replace(/[^\p{L}\p{N}]+/gu, '');

export const isPhotographicCover = (cover?: string): cover is string =>
  Boolean(cover?.startsWith('/images/photos/') && /\.jpe?g$/i.test(cover));

export const getContentTopic = (title: string, cover?: string) => {
  const matchingRule = imageRules.find((rule) => rule.test.test(title));
  if (matchingRule) return matchingRule.key;

  if (isPhotographicCover(cover)) {
    return cover.split('/').pop()?.replace(/-\d+\.jpe?g$/i, '') ?? 'photo';
  }

  return 'general';
};

export const getNewsCover = (item: NewsEntry, usedCovers?: Set<string>) => {
  const rule = imageRules.find((candidate) => candidate.test.test(item.data.title));
  const candidates = rule?.images
    ?? (isPhotographicCover(item.data.cover) ? [item.data.cover] : fallbackImages);
  const start = stableHash(item.id) % candidates.length;
  const ordered = [...candidates.slice(start), ...candidates.slice(0, start)];
  const selected = ordered.find((cover) => !usedCovers?.has(cover)) ?? ordered[0];
  usedCovers?.add(selected);
  return selected;
};
