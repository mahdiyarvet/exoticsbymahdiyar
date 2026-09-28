/* =========================================================
   محصولات موجود در بازار ایران (ترب، دیجی‌کالا، بسلام و فروشگاه‌های تخصصی — مهر ۱۴۰۵)
   مقادیر uvi30 / heat30 / lux30 تخمینی‌اند؛ بر اساس نوع لامپ، وات و اندازه‌گیری‌های عمومی همان رده.
   iran: true یعنی در فروشگاه‌های ایرانی فهرست شده است.
   catalogOnly: true یعنی فقط در صفحهٔ محصولات نمایش داده می‌شود (مشخصات کافی برای شبیه‌سازی ندارد).
   use: کاربرد پیشنهادی برای نمایش در صفحهٔ محصولات
   ========================================================= */

const IRAN_LAMPS = [
  // ---------- UVB کم‌مصرف پیچی ----------
  { id: 'lh-uvb5-26',  role: 'uvb', kind: 'spot', cat: 'compact', brand: 'Lucky Herp', name: 'UVB 5.0 گرمسیری — ۲۶ وات', watts: 26, uvi30: 1.2, lux30: 4500, heat30: 10, beam: 50, use: 'خزندگان جنگلی و گرمسیری، قورباغه، لاک‌پشت آبی' },
  { id: 'lh-uvb10-26', role: 'uvb', kind: 'spot', cat: 'compact', brand: 'Lucky Herp', name: 'UVB 10.0 بیابانی — ۲۶ وات', watts: 26, uvi30: 2.3, lux30: 4500, heat30: 10, beam: 50, use: 'بیردد دراگون، لاک‌پشت خشکی، خزندگان بیابانی' },
  { id: 'lh-uvb15-26', role: 'uvb', kind: 'spot', cat: 'compact', brand: 'Lucky Herp', name: 'UVB 15.0 — ۲۶ وات', watts: 26, uvi30: 3.2, lux30: 4200, heat30: 10, beam: 50, use: 'ایگوانا و خزندگان بسیار آفتاب‌دوست' },
  { id: 'lh-uvb-13',   role: 'uvb', kind: 'spot', cat: 'compact', brand: 'Lucky Herp', name: 'UVB Reptile — ۱۳ وات', watts: 13, uvi30: 0.9, lux30: 2200, heat30: 6, beam: 50, use: 'تراریوم کوچک' },
  { id: 'lh-uvb3-50',  role: 'uvb', kind: 'spot', cat: 'compact', brand: 'Lucky Herp', name: 'UVB 3.0 — ۵۰ وات', watts: 50, uvi30: 1.3, lux30: 8000, heat30: 18, beam: 55, use: 'تراریوم بزرگ و مرتفع، گونه‌های کم‌نیاز' },
  { id: 'lh-bird-23',  role: 'uvb', kind: 'spot', cat: 'compact', brand: 'Lucky Herp', name: 'UV مدل پرندگان ۲٫۴٪ — ۲۳ وات', watts: 23, uvi30: 0.5, lux30: 4000, heat30: 9, beam: 50, use: 'پرنده؛ برای خزنده ضعیف است' },
  { id: 'lh-bird-20',  role: 'uvb', kind: 'spot', cat: 'compact', brand: 'Lucky Herp', name: 'UVB مدل پرندگان ۲٫۴٪ — ۲۰ وات', watts: 20, uvi30: 0.4, lux30: 3500, heat30: 8, beam: 50, use: 'پرندگان کوچک' },
  { id: 'rz-uvb5-26',  role: 'uvb', kind: 'spot', cat: 'compact', brand: 'Repti Zoo', name: 'UVB 5.0 — ۲۶ وات', watts: 26, uvi30: 1.2, lux30: 4500, heat30: 10, beam: 50, use: 'خزندگان گرمسیری' },
  { id: 'rz-uvb10-26', role: 'uvb', kind: 'spot', cat: 'compact', brand: 'Repti Zoo', name: 'UVB 10.0 — ۲۶ وات', watts: 26, uvi30: 2.3, lux30: 4500, heat30: 10, beam: 50, use: 'خزندگان بیابانی' },
  { id: 'rz-uvb15-26', role: 'uvb', kind: 'spot', cat: 'compact', brand: 'Repti Zoo', name: 'UVB 15.0 — ۲۶ وات', watts: 26, uvi30: 3.2, lux30: 4200, heat30: 10, beam: 50, use: 'خزندگان بسیار آفتاب‌دوست' },
  { id: 'et-uvb100-13',role: 'uvb', kind: 'spot', cat: 'compact', brand: 'Exo Terra', name: 'Reptile UVB100 — ۱۳ وات', watts: 13, uvi30: 1.0, lux30: 2200, heat30: 6, beam: 50, use: 'خزندگان گرمسیری، تراریوم کوچک' },
  { id: 'et-uvb100-25',role: 'uvb', kind: 'spot', cat: 'compact', brand: 'Exo Terra', name: 'Reptile UVB100 — ۲۵ وات', watts: 25, uvi30: 1.8, lux30: 4300, heat30: 10, beam: 50, use: 'خزندگان گرمسیری' },
  { id: 'et-uvb150-13',role: 'uvb', kind: 'spot', cat: 'compact', brand: 'Exo Terra', name: 'Reptile UVB150 — ۱۳ وات', watts: 13, uvi30: 1.5, lux30: 2100, heat30: 6, beam: 50, use: 'خزندگان بیابانی، تراریوم کوچک' },
  { id: 'et-uvb150-25',role: 'uvb', kind: 'spot', cat: 'compact', brand: 'Exo Terra', name: 'Reptile UVB150 — ۲۵ وات', watts: 25, uvi30: 2.8, lux30: 4200, heat30: 10, beam: 50, use: 'خزندگان بیابانی' },
  { id: 'nm-nd19-5',   role: 'uvb', kind: 'spot', cat: 'compact', brand: 'Nomoy Pet', name: 'ND-19 UVB 5.0 — ۲۶ وات', watts: 26, uvi30: 1.1, lux30: 4500, heat30: 10, beam: 50, use: 'تراریوم، گونه‌های گرمسیری' },
  { id: 'nm-nd19-10',  role: 'uvb', kind: 'spot', cat: 'compact', brand: 'Nomoy Pet', name: 'ND-19 UVB 10.0 — ۲۶ وات', watts: 26, uvi30: 2.1, lux30: 4500, heat30: 10, beam: 50, use: 'تراریوم، گونه‌های بیابانی' },
  { id: 'nm-nd11-3',   role: 'uvb', kind: 'spot', cat: 'compact', brand: 'Nomoy Pet', name: 'ND-11 UVB 3.0 — ۵۰ وات', watts: 50, uvi30: 1.2, lux30: 8000, heat30: 18, beam: 55, use: 'تراریوم بزرگ' },
  { id: 'mb-uvb10-26', role: 'uvb', kind: 'spot', cat: 'compact', brand: 'مصباح', name: 'UVB 10.0 — ۲۶ وات (ساخت ایران)', watts: 26, uvi30: 2.0, lux30: 4500, heat30: 10, beam: 50, use: 'خزندگان، پرندگان، تراریوم' },

  // ---------- UVB لوله‌ای ----------
  { id: 'lh-t5-5',     role: 'uvb', kind: 'tube', cat: 'tube', brand: 'Lucky Herp', name: 'UVB 5.0 T5 — ۶۰ سانتی (حدود ۲۴ وات)', len: 58, watts: 24, uvi30: 2.3, lux30: 7500, heat30: 8, n: 2, use: 'خزندگان جنگلی و نیمه‌سایه' },
  { id: 'lh-t5-10',    role: 'uvb', kind: 'tube', cat: 'tube', brand: 'Lucky Herp', name: 'UVB 10.0 T5 — ۶۰ سانتی (حدود ۲۴ وات)', len: 58, watts: 24, uvi30: 4.2, lux30: 7000, heat30: 8, n: 2, use: 'خزندگان بیابانی' },
  { id: 'rz-t8-5-15',  role: 'uvb', kind: 'tube', cat: 'tube', brand: 'Repti Zoo', name: 'UVB 5.0 فلورسنت — ۱۵ وات', len: 45, watts: 15, uvi30: 0.7, lux30: 3000, heat30: 5, n: 1, use: 'خزندگان گرمسیری' },
  { id: 'rz-t8-10-15', role: 'uvb', kind: 'tube', cat: 'tube', brand: 'Repti Zoo', name: 'UVB 10.0 فلورسنت — ۱۵ وات', len: 45, watts: 15, uvi30: 1.3, lux30: 2900, heat30: 5, n: 1, use: 'خزندگان گرمسیری و بیابانی' },
  { id: 'nv-18',       role: 'uvb', kind: 'tube', cat: 'tube', brand: 'Narva', name: 'لولهٔ UV خزنده و پرنده T8 — ۱۸ وات', len: 60, watts: 18, uvi30: 0.7, lux30: 3500, heat30: 5, n: 1, use: 'خزندگان و پرندگان کم‌نیاز' },
  { id: 'nv-36',       role: 'uvb', kind: 'tube', cat: 'tube', brand: 'Narva', name: 'لولهٔ UV خزنده و پرنده T8 — ۳۶ وات', len: 120, watts: 36, uvi30: 0.9, lux30: 5000, heat30: 7, n: 1, use: 'محفظه‌های بلند، گونه‌های کم‌نیاز' },

  // ---------- UVB از نوع LED ----------
  { id: 'rz-led-6',    role: 'uvb', kind: 'spot', cat: 'led-uvb', brand: 'Repti Zoo', name: 'UVB LED — ۶ وات', watts: 6, uvi30: 0.8, lux30: 3000, heat30: 3, beam: 30, use: 'تراریوم کوچک' },
  { id: 'zl-led',      role: 'uvb', kind: 'spot', cat: 'led-uvb', brand: 'Zetlight', name: 'LED UVA و UVB', watts: 10, uvi30: 1.0, lux30: 6000, heat30: 4, beam: 35, use: 'تراریوم' },

  // ---------- بخار جیوه ----------
  { id: 'lh-mvb-80',   role: 'uvb', kind: 'spot', cat: 'mvb', brand: 'Lucky Herp', name: 'HEAT-UVB بخار جیوه — ۸۰ وات', watts: 80, uvi30: 5.5, lux30: 20000, heat30: 210, beam: 28, use: 'آفتاب‌گیری همراه UVB، محفظهٔ متوسط' },
  { id: 'lh-mvb-160',  role: 'uvb', kind: 'spot', cat: 'mvb', brand: 'Lucky Herp', name: 'HEAT-UVB بخار جیوه — ۱۶۰ وات', watts: 160, uvi30: 10, lux30: 36000, heat30: 350, beam: 30, use: 'محفظهٔ بلند، لاک‌پشت خشکی' },
  { id: 'lh-aio-125',  role: 'uvb', kind: 'spot', cat: 'mvb', brand: 'Lucky Herp', name: 'All-in-One — ۱۲۵ وات', watts: 125, uvi30: 7, lux30: 28000, heat30: 280, beam: 30, use: 'نور، گرما و UV با هم' },
  { id: 'mby-100',     role: 'uvb', kind: 'spot', cat: 'mvb', brand: 'MBMYUKY', name: 'Heat Lamp UVB — ۱۰۰ وات', watts: 100, uvi30: 7, lux30: 25000, heat30: 250, beam: 28, use: 'آفتاب‌گیری همراه UVB' },
  { id: 'os-vitalux',  role: 'uvb', kind: 'spot', cat: 'mvb', brand: 'Osram', name: 'Ultra Vitalux — ۳۰۰ وات', watts: 300, uvi30: 45, lux30: 60000, heat30: 900, beam: 45, use: 'بسیار قوی؛ فقط فضای بزرگ و فاصلهٔ زیاد (بالای ۱ متر)' },

  // ---------- حرارتی روز ----------
  { id: 'lh-hal-25',   role: 'heat', kind: 'spot', cat: 'day', brand: 'Lucky Herp', name: 'Halogen Heat — ۲۵ وات', watts: 25, heat30: 75, lux30: 4500, beam: 22, use: 'تراریوم کوچک، گکو' },
  { id: 'lh-hal-50uv', role: 'heat', kind: 'spot', cat: 'day', brand: 'Lucky Herp', name: 'Halogen UVA/UVB — ۵۰ وات', watts: 50, heat30: 150, lux30: 9000, uvi30: 0.5, beam: 25, use: 'آفتاب‌گیری؛ UV آن کم است و جای لامپ UVB را نمی‌گیرد' },
  { id: 'lh-bsun-40',  role: 'heat', kind: 'spot', cat: 'day', brand: 'Lucky Herp', name: 'Basking Sun — ۴۰ وات', watts: 40, heat30: 90, lux30: 6000, beam: 30, use: 'آفتاب‌گیری تراریوم کوچک' },
  { id: 'lh-day-75',   role: 'heat', kind: 'spot', cat: 'day', brand: 'Lucky Herp', name: 'Day Heat (لامپ روز) — ۷۵ وات', watts: 75, heat30: 150, lux30: 9000, beam: 30, use: 'آفتاب‌گیری روزانه' },
  { id: 'lh-day-100',  role: 'heat', kind: 'spot', cat: 'day', brand: 'Lucky Herp', name: 'Day Heat (لامپ روز) — ۱۰۰ وات', watts: 100, heat30: 200, lux30: 12000, beam: 30, use: 'آفتاب‌گیری روزانه' },
  { id: 'lh-day-150',  role: 'heat', kind: 'spot', cat: 'day', brand: 'Lucky Herp', name: 'Day Heat (لامپ روز) — ۱۵۰ وات', watts: 150, heat30: 290, lux30: 17000, beam: 30, use: 'محفظهٔ بلند یا گونه‌های گرمادوست' },
  { id: 'lh-irb-50',   role: 'heat', kind: 'spot', cat: 'day', brand: 'Lucky Herp', name: 'Infrared Basking — ۵۰ وات', watts: 50, heat30: 110, lux30: 1500, beam: 30, use: 'گرمای آفتاب‌گیری با نور قرمز' },
  { id: 'lh-irb-100',  role: 'heat', kind: 'spot', cat: 'day', brand: 'Lucky Herp', name: 'Infrared Basking — ۱۰۰ وات', watts: 100, heat30: 210, lux30: 3000, beam: 30, use: 'گرمای آفتاب‌گیری با نور قرمز' },
  { id: 'sb-turtle-50',role: 'heat', kind: 'spot', cat: 'day', brand: 'Sobo', name: 'لامپ UVA-UVB لاک‌پشت — ۵۰ وات', watts: 50, heat30: 110, lux30: 6000, uvi30: 0.3, beam: 35, use: 'آفتاب‌گیری لاک‌پشت آبی' },
  { id: 'fl-day-100',  role: 'heat', kind: 'spot', cat: 'day', brand: 'Flamingo', name: 'Daylight Spot UVA — ۱۰۰ وات', watts: 100, heat30: 200, lux30: 14000, beam: 30, use: 'لامپ روز با UVA (بدون UVB)' },
  { id: 'ps-inc-100',  role: 'heat', kind: 'spot', cat: 'day', brand: 'پارس شهاب', name: 'لامپ رشته‌ای حرارتی — ۱۰۰ وات', watts: 100, heat30: 120, lux30: 5000, beam: 55, use: 'گرمای عمومی (پرتو پخش)' },
  { id: 'ac-50',       role: 'heat', kind: 'spot', cat: 'day', brand: 'Allicoo', name: 'Heat Lamp — ۵۰ وات', watts: 50, heat30: 100, lux30: 5000, beam: 35, use: 'آفتاب‌گیری تراریوم کوچک' },
  { id: 'io-50',       role: 'heat', kind: 'spot', cat: 'day', brand: 'IOOTSEA', name: 'Heating Lamp E27 — ۵۰ وات', watts: 50, heat30: 100, lux30: 5000, beam: 35, use: 'آفتاب‌گیری تراریوم کوچک' },
  { id: 'rh-50',       role: 'heat', kind: 'spot', cat: 'day', brand: 'REPTI HOME', name: 'Heat Lamp — ۵۰ وات', watts: 50, heat30: 100, lux30: 5000, beam: 35, use: 'آفتاب‌گیری تراریوم کوچک' },
  { id: 'fx-100',      role: 'heat', kind: 'spot', cat: 'day', brand: 'Fuxin', name: 'Heat Lamp — ۱۰۰ وات', watts: 100, heat30: 190, lux30: 10000, beam: 35, use: 'آفتاب‌گیری' },

  // ---------- گرمای شب ----------
  { id: 'lh-night-50', role: 'heat', kind: 'spot', cat: 'night', brand: 'Lucky Herp', name: 'Night Basking Spot — ۵۰ وات', watts: 50, heat30: 80, lux30: 400, beam: 35, use: 'گرمای شب با نور ملایم' },
  { id: 'lh-night-75', role: 'heat', kind: 'spot', cat: 'night', brand: 'Lucky Herp', name: 'Night Basking Spot — ۷۵ وات', watts: 75, heat30: 120, lux30: 500, beam: 35, use: 'گرمای شب با نور ملایم' },
  { id: 'lh-che-50',   role: 'heat', kind: 'spot', cat: 'night', brand: 'Lucky Herp', name: 'سرامیکی — ۵۰ وات (بدون نور)', watts: 50, heat30: 55, lux30: 0, beam: 60, use: 'گرمای شب' },
  { id: 'lh-che-100',  role: 'heat', kind: 'spot', cat: 'night', brand: 'Lucky Herp', name: 'سرامیکی — ۱۰۰ وات (بدون نور)', watts: 100, heat30: 110, lux30: 0, beam: 60, use: 'گرمای شب' },
  { id: 'lh-che-150',  role: 'heat', kind: 'spot', cat: 'night', brand: 'Lucky Herp', name: 'سرامیکی — ۱۵۰ وات (بدون نور)', watts: 150, heat30: 165, lux30: 0, beam: 60, use: 'گرمای شب، محفظهٔ بزرگ' },
  { id: 'kl-che-150',  role: 'heat', kind: 'spot', cat: 'night', brand: 'Klenn', name: 'سرامیکی — ۱۵۰ وات (بدون نور)', watts: 150, heat30: 165, lux30: 0, beam: 60, use: 'گرمای شب' },
  { id: 'dn-che-150',  role: 'heat', kind: 'spot', cat: 'night', brand: 'Dernord', name: 'سرامیکی E27 — ۱۵۰ وات (بدون نور)', watts: 150, heat30: 165, lux30: 0, beam: 60, use: 'گرمای شب' },
  { id: 'ym-che-100',  role: 'heat', kind: 'spot', cat: 'night', brand: 'Yumo', name: 'سرامیکی — ۱۰۰ وات (بدون نور)', watts: 100, heat30: 110, lux30: 0, beam: 60, use: 'گرمای شب' },
  { id: 'gn-che-200',  role: 'heat', kind: 'spot', cat: 'night', brand: 'بدون برند', name: 'سرامیکی — ۲۰۰ وات (بدون نور)', watts: 200, heat30: 220, lux30: 0, beam: 60, use: 'محفظهٔ خیلی بزرگ' },
  { id: 'gn-che-250',  role: 'heat', kind: 'spot', cat: 'night', brand: 'بدون برند', name: 'سرامیکی IR250 — ۲۵۰ وات (بدون نور)', watts: 250, heat30: 275, lux30: 0, beam: 60, use: 'برای تراریوم معمولی خیلی قوی است' },
  { id: 'ip-che-350',  role: 'heat', kind: 'spot', cat: 'night', brand: 'Infrapara', name: 'سرامیکی — ۳۵۰ وات (بدون نور)', watts: 350, heat30: 385, lux30: 0, beam: 60, use: 'دامداری؛ برای تراریوم مناسب نیست' },
  { id: 'ip-che-500',  role: 'heat', kind: 'spot', cat: 'night', brand: 'Infrapara', name: 'سرامیکی — ۵۰۰ وات (بدون نور)', watts: 500, heat30: 550, lux30: 0, beam: 60, use: 'دامداری؛ برای تراریوم مناسب نیست' },

  // ---------- مادون قرمز قرمزرنگ ----------
  { id: 'lh-ir-50',    role: 'heat', kind: 'spot', cat: 'ir', brand: 'Lucky Herp', name: 'Infrared E27 — ۵۰ وات', watts: 50, heat30: 110, lux30: 1500, beam: 30, use: 'گرمای موضعی' },
  { id: 'lh-ir-250',   role: 'heat', kind: 'spot', cat: 'ir', brand: 'Lucky Herp', name: 'Infrared — ۲۵۰ وات', watts: 250, heat30: 550, lux30: 4000, beam: 35, use: 'بسیار قوی؛ خطر سوختگی' },
  { id: 'ph-ir-25',    role: 'heat', kind: 'spot', cat: 'ir', brand: 'Philips', name: 'مادر مصنوعی — ۲۵ وات', watts: 25, heat30: 55, lux30: 800, beam: 35, use: 'گرمای ملایم' },
  { id: 'ph-ir-40',    role: 'heat', kind: 'spot', cat: 'ir', brand: 'Philips', name: 'مادر مصنوعی — ۴۰ وات', watts: 40, heat30: 90, lux30: 1200, beam: 35, use: 'گرمای ملایم' },
  { id: 'ph-ir-60',    role: 'heat', kind: 'spot', cat: 'ir', brand: 'Philips', name: 'مادر مصنوعی — ۶۰ وات', watts: 60, heat30: 130, lux30: 1800, beam: 35, use: 'گرمای موضعی' },
  { id: 'ph-ir-80',    role: 'heat', kind: 'spot', cat: 'ir', brand: 'Philips', name: 'مادر مصنوعی — ۸۰ وات', watts: 80, heat30: 170, lux30: 2400, beam: 35, use: 'گرمای موضعی' },
  { id: 'ph-ir-100',   role: 'heat', kind: 'spot', cat: 'ir', brand: 'Philips', name: 'R95 مادر مصنوعی — ۱۰۰ وات', watts: 100, heat30: 230, lux30: 2500, beam: 30, use: 'گرمای موضعی' },
  { id: 'ge-r95-100',  role: 'heat', kind: 'spot', cat: 'ir', brand: 'General Electric', name: 'R95 مادون قرمز — ۱۰۰ وات', watts: 100, heat30: 230, lux30: 2500, beam: 30, use: 'گرمای موضعی' },
  { id: 'ph-ir-150',   role: 'heat', kind: 'spot', cat: 'ir', brand: 'Philips', name: 'BR125 RED — ۱۵۰ وات', watts: 150, heat30: 330, lux30: 3000, beam: 35, use: 'قوی؛ خطر سوختگی' },
  { id: 'ph-ir-250',   role: 'heat', kind: 'spot', cat: 'ir', brand: 'Philips', name: 'BR125 RED — ۲۵۰ وات', watts: 250, heat30: 550, lux30: 4000, beam: 35, use: 'دامداری؛ خطر سوختگی' },
  { id: 'os-ir-40',    role: 'heat', kind: 'spot', cat: 'ir', brand: 'Osram', name: 'مادر مصنوعی رفلکتوردار — ۴۰ وات', watts: 40, heat30: 90, lux30: 1200, beam: 35, use: 'گرمای ملایم' },
  { id: 'ts-ir-40',    role: 'heat', kind: 'spot', cat: 'ir', brand: 'Tungsram', name: 'مادر مصنوعی — ۴۰ وات', watts: 40, heat30: 90, lux30: 1200, beam: 35, use: 'گرمای ملایم' },
  { id: 'mb-ir-250',   role: 'heat', kind: 'spot', cat: 'ir', brand: 'مصباح', name: 'R125 مادون قرمز — ۲۵۰ وات', watts: 250, heat30: 550, lux30: 4000, beam: 35, use: 'دامداری؛ خطر سوختگی' },
  { id: 'nr-ir-100',   role: 'heat', kind: 'spot', cat: 'ir', brand: 'لامپ نور', name: 'IR مادون قرمز — ۱۰۰ وات', watts: 100, heat30: 220, lux30: 2500, beam: 35, use: 'گرمای موضعی' },
  { id: 'nr-ir-250',   role: 'heat', kind: 'spot', cat: 'ir', brand: 'لامپ نور', name: 'IR / PRO مادون قرمز — ۲۵۰ وات', watts: 250, heat30: 550, lux30: 4000, beam: 35, use: 'دامداری؛ خطر سوختگی' },
  { id: 'nr-ir-275',   role: 'heat', kind: 'spot', cat: 'ir', brand: 'لامپ نور', name: 'NIR — ۲۷۵ وات', watts: 275, heat30: 600, lux30: 4200, beam: 35, use: 'دامداری' },
  { id: 'nr-ir-375',   role: 'heat', kind: 'spot', cat: 'ir', brand: 'لامپ نور', name: 'NIR — ۳۷۵ وات', watts: 375, heat30: 820, lux30: 5000, beam: 35, use: 'دامداری' },
  { id: 'al-ir-50',    role: 'heat', kind: 'spot', cat: 'ir', brand: 'Albertini', name: 'Infrared — ۵۰ وات', watts: 50, heat30: 110, lux30: 1500, beam: 35, use: 'گرمای موضعی' },
  { id: 'al-ir-250',   role: 'heat', kind: 'spot', cat: 'ir', brand: 'Albertini', name: 'Infrared — ۲۵۰ وات', watts: 250, heat30: 550, lux30: 4000, beam: 35, use: 'دامداری' },
  { id: 'nv-ir-250',   role: 'heat', kind: 'spot', cat: 'ir', brand: 'Narva', name: 'Infrared — ۲۵۰ وات', watts: 250, heat30: 550, lux30: 4000, beam: 35, use: 'دامداری' },
  { id: 'hp-ir-250',   role: 'heat', kind: 'spot', cat: 'ir', brand: 'Heat Plus / Porsa / Elecins', name: 'مادون قرمز — ۲۵۰ وات', watts: 250, heat30: 550, lux30: 4000, beam: 35, use: 'دامداری' },
];

/* محصولاتی که مشخصات کافی برای شبیه‌سازی ندارند؛ فقط در صفحهٔ محصولات */
const IRAN_CATALOG_ONLY = [
  { cat: 'compact', brand: 'Lucky Herp', name: 'UVAB', watts: null, use: 'تراریوم' },
  { cat: 'compact', brand: 'Nomoy Pet', name: 'ND-16 UVB — ۲۶ وات', watts: 26, use: 'تراریوم' },
  { cat: 'compact', brand: 'Trixie', name: 'UV-B 10.0 Terrarium', watts: null, use: 'تراریوم' },
  { cat: 'day', brand: 'Quanlong', name: 'QL-X8-2 چراغ آفتاب‌گیری', watts: null, use: 'لاک‌پشت آبی' },
  { cat: 'night', brand: 'Trixie', name: 'Lunar Heat Lamp (مهتابی)', watts: null, use: 'نور ملایم شب' },
  { cat: 'ir', brand: 'Medisana', name: 'IR 850 — ۳۰۰ وات', watts: 300, use: 'دستگاه درمانی؛ مخصوص خزنده نیست' },
  { cat: 'ir', brand: 'Beurer', name: 'IL11 و IL30', watts: null, use: 'دستگاه درمانی؛ مخصوص خزنده نیست' },
];

const IRAN_CATS = [
  { id: 'compact', fa: 'لامپ UVB کم‌مصرف پیچی (سرپیچ E27)', icon: '💡' },
  { id: 'tube',    fa: 'لامپ UVB لوله‌ای (T5 و T8)', icon: '📏' },
  { id: 'led-uvb', fa: 'لامپ UVB از نوع LED', icon: '🔆' },
  { id: 'mvb',     fa: 'بخار جیوه (UVB و گرما با هم)', icon: '☀️' },
  { id: 'day',     fa: 'لامپ حرارتی روز (هالوژن و رشته‌ای)', icon: '🔥' },
  { id: 'night',   fa: 'گرمای شب و سرامیکی (بدون نور سفید)', icon: '🌙' },
  { id: 'ir',      fa: 'مادون قرمز قرمزرنگ (عمومی و دامپروری)', icon: '🟥' },
];

/* ادغام با فهرست اصلی */
(() => {
  // لامپ‌های عمومی قبلی که در بازار ایران هم پیدا می‌شوند
  const alsoIran = ['hal-50', 'hal-75', 'hal-100', 'hal-flood-100', 'hal-150', 'par30-75', 'par38-100', 'inc-60', 'inc-100', 'che-100', 'che-60', 'gen-t8-10', 'gen-coil', 'gen-led-20', 'gen-led-40', 'gen-ledspot-10', 'grow-50'];
  LAMPS.forEach(l => { l.iran = alsoIran.includes(l.id); });
  // لامپ عمومی T5 «بازار ایران» با مدل واقعی لاکی هرپ جایگزین شد
  const i = LAMPS.findIndex(l => l.id === 'gen-t5-10');
  if (i >= 0) LAMPS.splice(i, 1);
  IRAN_LAMPS.forEach(l => { l.iran = true; LAMPS.push(l); });
})();
