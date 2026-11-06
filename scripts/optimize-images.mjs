// Usage: node scripts/optimize-images.mjs [--force]
// Generates WebP + thumbnail variants for every JPG in public/images/photos (see image-variants.mjs).
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { makeVariants } from './image-variants.mjs';

const DIR = 'public/images/photos';
const force = process.argv.includes('--force');
const files = readdirSync(DIR).filter((f) => /\.jpe?g$/i.test(f));

let written = 0;
for (const f of files) written += await makeVariants(join(DIR, f), { force });
console.log(`${files.length} photos checked, ${written} variant files written`);
