/**
 * Build the static site into ./dist and VERIFY it before deploy.
 *
 * A missing asset (a typo in a src, a video that was never committed) is the
 * classic silent production failure, so the build fails loudly instead.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* resolve the repo root from this file, not from process.cwd() - wrangler runs
   the build command from a different working directory than the project root */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const STATIC_FILES = [
  'index.html', 'app.js', 'delete.js', '404.html', 'privacy.html', 'terms.html', 'delete.html',
  'favicon.png', 'og.jpg', 'robots.txt', 'sitemap.xml', '_headers', '_redirects',
  'header-logo.webp', 'founder.webp', 'founder-before-after.webp',
  'hero.mp4', 'hero-mobile.mp4', 'hero-poster.jpg',
];
for (let i = 1; i <= 7; i++) {
  STATIC_FILES.push(`testimonial-${i}.png`, `testimonial-${i}.webp`);
}

// ---- clean -----------------------------------------------------------------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// ---- copy ------------------------------------------------------------------
const missing = [];
for (const f of STATIC_FILES) {
  const src = path.join(ROOT, f);
  if (!fs.existsSync(src)) { missing.push(f); continue; }
  fs.copyFileSync(src, path.join(DIST, f));
}
if (missing.length) {
  console.error('BUILD FAILED - missing source files:\n  ' + missing.join('\n  '));
  process.exit(1);
}

// ---- verify every local reference in the HTML actually shipped --------------
const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const refs = new Set();
for (const m of html.matchAll(/(?:src|href)="([^"#?]+)"/g)) {
  const r = m[1];
  if (/^(https?:|mailto:|tel:|data:|\/\/)/i.test(r)) continue;
  refs.add(r);
}
const broken = [];
for (const r of refs) {
  if (!fs.existsSync(path.join(DIST, r))) broken.push(r);
}
if (broken.length) {
  console.error('BUILD FAILED - index.html references files that do not exist:\n  ' + broken.join('\n  '));
  process.exit(1);
}

// ---- no page may carry an inline script (the CSP has no unsafe-inline) ----
for (const page of ['index.html', 'privacy.html', 'terms.html', 'delete.html', '404.html']) {
  const body = fs.readFileSync(path.join(DIST, page), 'utf8');
  const inline = (body.match(/<script(?![^>]*src=)(?![^>]*application\/ld\+json)[^>]*>/g) || []).length;
  if (inline > 0) {
    console.error('BUILD FAILED - ' + page + ' has ' + inline + ' inline executable script block(s).');
    console.error('The Content-Security-Policy has no unsafe-inline for scripts, so inline scripts will NOT run.');
    console.error('Move the script into an external .js file and reference it with <script src="..." defer></script>.');
    process.exit(1);
  }
}

// ---- every page needs the same security basics -----------------------------
for (const page of ['index.html', 'privacy.html', 'terms.html', 'delete.html', '404.html']) {
  const body = fs.readFileSync(path.join(DIST, page), 'utf8');
  if (!/<meta name="viewport"/i.test(body)) { console.error('BUILD FAILED - ' + page + ' has no viewport meta.'); process.exit(1); }
  if (!/<title>/i.test(body)) { console.error('BUILD FAILED - ' + page + ' has no title.'); process.exit(1); }
}

const total = STATIC_FILES.reduce((n, f) => n + fs.statSync(path.join(DIST, f)).size, 0);
console.log(`BUILD OK - ${STATIC_FILES.length} files, ${(total / 1024 / 1024).toFixed(1)} MB, ${refs.size} local references verified, 0 inline scripts`);
