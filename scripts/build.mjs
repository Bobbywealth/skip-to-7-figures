/**
 * Build the static site into ./dist and VERIFY it before deploy.
 *
 * A missing asset, a broken internal link, an inline script (the CSP has no
 * 'unsafe-inline' for scripts) or a syntax error in a shipped .js file are all
 * silent production failures - so the build fails loudly instead.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const PAGES = ['index.html', 'privacy.html', 'terms.html', 'delete.html', '404.html'];
const STATIC_FILES = [
  ...PAGES,
  'app.js', 'delete.js',
  'favicon.png', 'apple-touch-icon.png', 'og.jpg', 'robots.txt', 'sitemap.xml', '_headers', '_redirects',
  'hero-poster.webp',
  'header-logo.webp', 'founder.webp', 'founder-before-after.webp',
  'hero.mp4', 'hero-mobile.mp4', 'hero-poster.jpg',
];
for (let i = 1; i <= 7; i++) STATIC_FILES.push(`testimonial-${i}.png`, `testimonial-${i}.webp`);

const problems = [];

// ---- clean -----------------------------------------------------------------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// ---- copy ------------------------------------------------------------------
for (const f of STATIC_FILES) {
  const src = path.join(ROOT, f);
  if (!fs.existsSync(src)) { problems.push(`missing source file: ${f}`); continue; }
  fs.copyFileSync(src, path.join(DIST, f));
}
if (problems.length) {
  console.error('BUILD FAILED\n  ' + problems.join('\n  '));
  process.exit(1);
}

// ---- every local reference in EVERY page must resolve -----------------------
let refCount = 0;
for (const page of PAGES) {
  const html = fs.readFileSync(path.join(DIST, page), 'utf8');
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const raw = m[1];
    if (/^(https?:|mailto:|tel:|data:|\/\/|#|javascript:)/i.test(raw)) continue;
    const clean = raw.split('#')[0].split('?')[0];
    if (!clean) continue;
    refCount++;
    const candidates = clean.startsWith('/')
      ? [path.join(DIST, clean), path.join(DIST, clean + '.html'), path.join(DIST, clean, 'index.html')]
      : [path.join(DIST, clean)];
    if (!candidates.some((c) => fs.existsSync(c))) {
      problems.push(`${page} references a file that does not exist: ${raw}`);
    }
  }
}

// ---- no inline scripts and no inline event handlers --------------------------
for (const page of PAGES) {
  const html = fs.readFileSync(path.join(DIST, page), 'utf8');
  const inline = (html.match(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>/g) || []).length;
  if (inline > 0) {
    problems.push(`${page} has ${inline} inline executable script block(s) - the CSP has no 'unsafe-inline' for scripts, so they will NOT run`);
  }
  const handlers = html.match(/\son[a-z]+\s*=\s*["']/gi) || [];
  if (handlers.length) problems.push(`${page} has ${handlers.length} inline event handler(s) - move them into the page script`);
  if (/href\s*=\s*["']javascript:/i.test(html)) problems.push(`${page} has a javascript: URL`);
}

// ---- every shipped .js file must parse -------------------------------------
for (const f of STATIC_FILES.filter((x) => x.endsWith('.js'))) {
  const tmp = path.join(DIST, '.check-' + f + '.js');
  fs.writeFileSync(tmp, fs.readFileSync(path.join(DIST, f)));
  try {
    execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
  } catch (e) {
    problems.push(`${f} does not parse:\n${(e.stderr || '').toString().split('\n').slice(0, 4).join('\n')}`);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

// ---- every page needs a viewport, a title and a lang -------------------------
for (const page of PAGES) {
  const html = fs.readFileSync(path.join(DIST, page), 'utf8');
  if (!/<meta name="viewport"/i.test(html)) problems.push(`${page} has no viewport meta`);
  if (!/<title>/i.test(html)) problems.push(`${page} has no title`);
  if (!/<html[^>]+lang=/i.test(html)) problems.push(`${page} has no lang attribute`);
}

if (problems.length) {
  console.error('BUILD FAILED');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

const total = STATIC_FILES.reduce((n, f) => n + fs.statSync(path.join(DIST, f)).size, 0);
console.log(`BUILD OK - ${STATIC_FILES.length} files, ${(total / 1024 / 1024).toFixed(1)} MB`);
console.log(`  verified ${PAGES.length} pages, ${refCount} local references, ${STATIC_FILES.filter((x) => x.endsWith('.js')).length} scripts parsed, 0 inline scripts, 0 inline handlers`);
