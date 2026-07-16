export type CategorySlug = 'reptiles' | 'birds' | 'mammals' | 'amphibians';

export type ContentCategory = {
  slug: CategorySlug;
  label: string;
  shortLabel: string;
  symbol: string;
  cover: string;
  description: string;
};

export const contentCategories: ContentCategory[] = [
  {
    slug: 'reptiles',
    label: 'خزندگان',
    shortLabel: 'خزندگان',
    symbol: '◉',
    cover: '/images/photos/bearded-dragon-2.jpg',
    description: 'راهنمای نگهداری، سلامت و تازه‌ترین خبرهای مارها، مارمولک‌ها، لاک‌پشت‌ها و دیگر خزندگان اگزوتیک.',
  },
  {
    slug: 'birds',
    label: 'پرندگان',
    shortLabel: 'پرندگان',
    symbol: '◌',
    cover: '/images/photos/macaw-2.jpg',
    description: 'مقاله‌ها و خبرهای مربوط به طوطی‌سانان، پرندگان زینتی، تغذیه، رفتار و مراقبت دامپزشکی آن‌ها.',
  },
  {
    slug: 'mammals',
    label: 'پستانداران کوچک',
    shortLabel: 'پستانداران',
    symbol: '◈',
    cover: '/images/photos/ferret-1.jpg',
    description: 'راهنمای خرگوش، همستر، خوکچه هندی، فرت و دیگر پستانداران کوچک و خاص خانگی.',
  },
  {
    slug: 'amphibians',
    label: 'دوزیستان',
    shortLabel: 'دوزیستان',
    symbol: '⌁',
    cover: '/images/photos/dart-frog-2.jpg',
    description: 'دانستنی‌ها و اصول نگهداری قورباغه‌ها، سمندرها، آکسولوتل و زیستگاه‌های مرطوب دوزیستان.',
  },
];

type CategorizedContent = {
  title: string;
  description?: string;
  cover?: string;
  category?: string;
  tags?: readonly string[];
};

const speciesRules: Array<{ slug: CategorySlug; test: RegExp }> = [
  {
    slug: 'amphibians',
    test: /دوزیست|قورباغه|سمندر|آکسولوتل|دارت[‌\s-]?فراگ|amphibian|frog|toad|salamander|newt|axolotl/i,
  },
  {
    slug: 'birds',
    test: /پرند|طوطی|ماکائو|کاسکو|قناری|کاکاتیل|کاکادو|مرغ[‌\s-]?عشق|لاوبرد|avian|bird|parrot|macaw|cockatiel|cockatoo|canary|budg/i,
  },
  {
    slug: 'mammals',
    test: /پستاندار|خرگوش|همستر|خوکچه|فرت|فنک|شوگر[‌\s-]?گلایدر|rabbit|hamster|guinea[\s-]?pig|ferret|fennec|sugar[\s-]?glider|mammal/i,
  },
  {
    slug: 'reptiles',
    test: /خزنده|مارمولک|لاک[‌\s-]?پشت|آفتاب[‌\s-]?پرست|ایگوانا|گکو|سوسمار|یوروماستیکس|اسکینک|آنول|اژدها|بردد|پایتون|کبرا|تراریوم|\bUVB\b|(?:^|[\s،:؛])مار(?:[\s،:؛]|$)|reptile|lizard|snake|python|boa|turtle|tortoise|chameleon|iguana|gecko|monitor[\s-]?lizard|bearded[\s-]?dragon|terrarium/i,
  },
];

const categoryAliases: Record<string, CategorySlug> = {
  خزندگان: 'reptiles',
  پرندگان: 'birds',
  پستانداران: 'mammals',
  'پستانداران کوچک': 'mammals',
  دوزیستان: 'amphibians',
};

export const getContentCategorySlug = (content: CategorizedContent): CategorySlug | 'general' => {
  const searchable = [
    content.title,
    content.description ?? '',
    content.cover ?? '',
    ...(content.tags ?? []),
  ].join(' ');
  const speciesMatch = speciesRules.find((rule) => rule.test.test(searchable));
  if (speciesMatch) return speciesMatch.slug;
  return categoryAliases[content.category ?? ''] ?? 'general';
};

export const getCategoryBySlug = (slug: string) =>
  contentCategories.find((category) => category.slug === slug);

export const getCategoryByLabel = (label: string) =>
  contentCategories.find((category) => category.label === label || category.shortLabel === label);

export const getContentCategory = (content: CategorizedContent) => {
  const slug = getContentCategorySlug(content);
  return slug === 'general' ? undefined : getCategoryBySlug(slug);
};
