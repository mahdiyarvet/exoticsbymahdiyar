// Usage: node scripts/make-pdf.mjs <input.html> <output.pdf>
// Renders a local HTML file (Persian/RTL, Vazirmatn via @font-face) to an A4 PDF using the installed Chrome/Edge.
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error('Usage: node scripts/make-pdf.mjs <input.html> <output.pdf>');
  process.exit(1);
}

const candidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];
const executablePath = candidates.find((p) => existsSync(p));
if (!executablePath) {
  console.error('No Chrome/Edge found.');
  process.exit(1);
}

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage();
await page.goto(pathToFileURL(path.resolve(input)).href);
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: path.resolve(output), format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log('PDF written:', output);
