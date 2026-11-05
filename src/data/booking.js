// Shared configuration + helpers for the in-person appointment system (/book and /appointments-admin).
//
// IMPORTANT: clinics, working hours and prices below are MIRRORED in supabase/booking.sql, which is
// what the database actually enforces. If you change hours or prices here, change them there too
// (and re-run that SQL in the Supabase SQL editor).

export const SLOT_MINUTES = 30;       // every visit takes one 30-minute slot
export const BOOKING_DAYS = 30;       // how far ahead patients can book
export const MIN_LEAD_MINUTES = 60;   // a slot must start at least this long from now
const TZ = 'Asia/Tehran';

// weekday numbers follow JS getDay(): 0 = Sunday ... 6 = Saturday
export const CLINICS = [
  {
    id: 'miracle',
    name: 'کلینیک میراکل',
    address: 'تهرانپارس، خیابان زفرقندی، پلاک ۹۰، واحد ۱',
    hours: {
      6: [['17:00', '20:00']], // شنبه
      2: [['17:00', '20:00']], // سه‌شنبه
      4: [['17:00', '20:00']], // پنجشنبه
    },
  },
  {
    id: 'roma',
    name: 'کلینیک دامپزشکی روما',
    address: 'نیاوران، کاشانک، خیابان پورابتهاج، بن‌بست طائی، پلاک ۶، طبقه اول',
    hours: {
      0: [['13:00', '19:00']], // یکشنبه
      1: [['17:00', '20:00']], // دوشنبه
      3: [['13:00', '19:00']], // چهارشنبه
    },
  },
];

// prices in toman
export const CATEGORIES = [
  { id: 'bird', label: 'پرندگان', examples: 'انواع پرندگان زینتی و طوطی‌سانان', price: 900000 },
  { id: 'small_rodent', label: 'جوندگان کوچک', examples: 'خرگوش، همستر، خوکچه هندی', price: 900000 },
  { id: 'small_mammal', label: 'پستانداران اگزوتیک کوچک', examples: 'راکون، شوگر گلایدر، چینچیلا، فرت، سنجاب', price: 1000000 },
  { id: 'turtle', label: 'لاک‌پشت‌ها', examples: 'لاک‌پشت‌های آبی و خشکی‌زی', price: 1100000 },
  { id: 'reptile', label: 'سایر خزندگان', examples: 'مار، مارمولک، گکو، بردد دراگون و …', price: 1400000 },
];

export const VISIT_INCLUDES = [
  'چکاپ سلامتی کامل',
  'تست‌های حرکتی',
  'چکاپ زخم',
  'مشکلات پوستی',
  'چکاپ قلب و تنفس',
  'برنامه غذایی',
  'مشاوره محیط زندگی',
];

export const TARIFF_NOTE =
  'هر گونه تزریق، آزمایش، سرم‌تراپی و موارد مشابه متناسب با تعرفه‌ی خود کلینیک است. برای اطلاع از قیمت‌ها تماس تلفنی بگیرید یا هنگام مراجعه سؤال بفرمایید.';

export const STATUS_LABELS = {
  confirmed: 'ثبت‌شده',
  done: 'انجام شد',
  cancelled: 'لغو شده',
  no_show: 'عدم مراجعه',
  blocked: 'مسدود',
};

export const ERROR_MESSAGES = {
  slot_taken: 'این زمان همین الان توسط شخص دیگری رزرو شد. لطفاً زمان دیگری انتخاب کنید.',
  slot_unavailable: 'این زمان دیگر قابل رزرو نیست. لطفاً زمان دیگری انتخاب کنید.',
  too_many_active: 'با این شماره‌ی موبایل بیش از دو نوبت فعال ثبت شده است. برای نوبت جدید ابتدا یکی را لغو کنید یا پیام بدهید.',
  invalid_phone: 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.',
  invalid_name: 'نام و نام خانوادگی را وارد کنید.',
  invalid_category: 'نوع حیوان را انتخاب کنید.',
  invalid_clinic: 'کلینیک انتخاب‌شده معتبر نیست.',
};

export function errorMessage(error) {
  const text = String(error?.message ?? error ?? '');
  for (const key of Object.keys(ERROR_MESSAGES)) {
    if (text.includes(key)) return ERROR_MESSAGES[key];
  }
  return 'ارتباط با سرور برقرار نشد یا خطایی رخ داد. لطفاً دوباره تلاش کنید.';
}

// ---------- digits / phone / price ----------

export function faDigits(value) {
  return String(value).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

export function normalizePhone(value) {
  let x = String(value ?? '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '');
  if (x.length === 12 && x.startsWith('98')) x = '0' + x.slice(2);
  return x;
}

export function formatPrice(toman) {
  return `${new Intl.NumberFormat('fa-IR').format(toman)} تومان`;
}

export function formatTime(hhmm) {
  return faDigits(hhmm);
}

// ---------- dates (Tehran calendar, no DST since 2022) ----------

export function tehranNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

const utcMs = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export function addDays(iso, n) {
  return new Date(utcMs(iso) + n * 86400000).toISOString().slice(0, 10);
}

export function weekdayOf(iso) {
  return new Date(utcMs(iso)).getUTCDay();
}

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const toHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// all 30-minute slot start times a clinic offers on a given date
export function slotsFor(clinic, iso) {
  const out = [];
  for (const [start, end] of clinic.hours[weekdayOf(iso)] ?? []) {
    for (let t = toMin(start); t + SLOT_MINUTES <= toMin(end); t += SLOT_MINUTES) out.push(toHHMM(t));
  }
  return out;
}

export function isBookable(iso, hhmm, now) {
  const dayDiff = (utcMs(iso) - utcMs(now.date)) / 86400000;
  return dayDiff * 1440 + toMin(hhmm) >= now.minutes + MIN_LEAD_MINUTES;
}

// upcoming dates on which the clinic works and at least one slot is still in the future
export function openDays(clinic, now) {
  const days = [];
  for (let i = 0; i <= BOOKING_DAYS; i++) {
    const iso = addDays(now.date, i);
    if (slotsFor(clinic, iso).some((t) => isBookable(iso, t, now))) days.push(iso);
  }
  return days;
}

const persian = (opts) => new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'UTC', ...opts });

export function formatDayParts(iso) {
  const d = new Date(utcMs(iso));
  return {
    weekday: persian({ weekday: 'long' }).format(d),
    dayMonth: persian({ day: 'numeric', month: 'long' }).format(d),
  };
}

// built from parts so the word order is identical in every browser's ICU data: "شنبه ۱۶ آبان ۱۴۰۵"
export function formatDayLong(iso) {
  const parts = persian({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(new Date(utcMs(iso)));
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('weekday')} ${get('day')} ${get('month')} ${get('year')}`;
}

// ---------- working-hours summary for display ----------

const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];
const WEEKDAY_FA = { 6: 'شنبه', 0: 'یکشنبه', 1: 'دوشنبه', 2: 'سه‌شنبه', 3: 'چهارشنبه', 4: 'پنجشنبه', 5: 'جمعه' };

export function hoursSummary(clinic) {
  return WEEK_ORDER.filter((d) => clinic.hours[d]).map((d) => ({
    day: WEEKDAY_FA[d],
    text: clinic.hours[d].map(([s, e]) => `${formatTime(s)} تا ${formatTime(e)}`).join(' و '),
  }));
}
