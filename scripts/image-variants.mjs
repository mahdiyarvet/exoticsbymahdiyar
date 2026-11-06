// Builds the lightweight WebP variants that sit next to each photo JPG:
//   public/images/photos/<name>.webp          full size (1200w), ~33% smaller than the JPG
//   public/images/photos/thumbs/<name>.webp   640w thumbnail for cards/lists, ~75% smaller
// The original JPGs are never touched (they stay as the <img> fallback and for social previews).
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import sharp from 'sharp';

export async function makeVariants(jpgPath, { force = false } = {}) {
  const name = basename(jpgPath).replace(/\.jpe?g$/i, '');
  const dir = dirname(jpgPath);
  const thumbDir = join(dir, 'thumbs');
  mkdirSync(thumbDir, { recursive: true });

  const jobs = [
    [join(dir, `${name}.webp`), (img) => img.webp({ quality: 76, effort: 5 })],
    [join(thumbDir, `${name}.webp`), (img) => img.resize({ width: 640, withoutEnlargement: true }).webp({ quality: 72, effort: 5 })],
  ];

  let written = 0;
  for (const [out, build] of jobs) {
    const fresh = existsSync(out) && statSync(out).mtimeMs >= statSync(jpgPath).mtimeMs;
    if (fresh && !force) continue;
    await build(sharp(jpgPath)).toFile(out);
    written++;
  }
  return written;
}
