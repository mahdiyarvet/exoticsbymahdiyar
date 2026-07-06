# اگزوتیک با مهدیار — سایت شخصی دامپزشکی حیوانات اگزوتیک

سایت با **Astro** ساخته شده؛ سریع، سبک، عالی برای SEO و کاملاً RTL فارسی. هاست و دامنه **صفر هزینه**.

## اجرای محلی
```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # خروجی در dist/
```
نیاز به Node.js نسخه ۱۸ به بالا (رایگان از nodejs.org).

## دیپلوی رایگان روی Cloudflare Pages
1. کد را روی یک ریپوی GitHub رایگان بگذار.
2. dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git.
3. تنظیمات build: Framework=Astro، Build command=`npm run build`، Output=`dist`.
4. Save and Deploy → سایت روی آدرس *.pages.dev بالا می‌آید.

### وصل کردن دامنه exoticsbymahdiyar.ir
1. پروژه Pages → Custom domains → Set up a domain → دامنه‌ات را وارد کن.
2. رکوردهای DNS که Cloudflare می‌دهد را در پنل رجیسترار .ir ثبت کن.
3. تا چند ساعت دامنه + SSL رایگان فعال می‌شود. اگر CNAME روی روت مجاز نبود، از رکورد A استفاده کن.

## افزودن محتوا (بدون کد)
هر مطلب یک فایل Markdown است.

مقاله: `src/content/articles/name.md`
```markdown
---
title: "عنوان"
description: "توضیح ۱۵۰ کاراکتری برای گوگل"
pubDate: 2026-07-06
category: "خزندگان"
tags: ["برچسب"]
cover: "/images/pic.jpg"
sources:
  - label: "منبع علمی"
    url: "https://..."
---
متن... با ## تیتر و > نقل‌قول.
```
خبر: `src/content/news/` — فیلدهای source و sourceUrl.
کتاب: `src/content/books/` — فیلدهای author، lang، year، pages، downloadUrl.
عکس‌ها در `public/images/` با مسیر `/images/name.jpg`.

## SEO
- sitemap، robots.txt، Open Graph، JSON-LD و RSS خودکار ساخته می‌شوند.
- سایت را در Google Search Console ثبت و `http://exoticsbymahdiyar.ir/sitemap-index.xml` را سابمیت کن.
- برای هر مقاله یک کلیدواژه long-tail هدف بگیر و در پاراگراف اول جوابش را بده.

نگارش و توسعه: دکتر مهدیار رمزگویان.
