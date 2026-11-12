# Skip to 7 Figures — Landing Funnel

Single-page marketing funnel for **Skip to 7 Figures LLC** (Keenan Williams), e-commerce brand building.

- `index.html` — the entire site: inline CSS + inline JS (multi-step application form, preview mode only)
- `header-logo.webp`, `founder.webp`, `founder-before-after.webp` — brand + founder imagery
- `testimonial-1.png` … `testimonial-7.png` — client-shared result screenshots
- `favicon.png` — 512x512 brand crest (browser tab / iOS home screen)
- `og.jpg` — 1200x630 social preview card (link preview on WhatsApp, Instagram, Slack, X)
- `og-preview.html`, `favicon-preview.html` — generators for the two images above (not part of the site)

No build step, no database, no dependencies. The application form runs in preview mode (answers are not sent).

## Deploy

Deployed on Render as a **static site** (`srv-dbr2vc8u01pc738o97kg`).

- Repo: `Bobbywealth/skip-to-7-figures` (public) → https://github.com/Bobbywealth/skip-to-7-figures
- Branch: `main` · Publish directory: `./` · Build command: *(empty)* · Auto-deploy: on

**To change the site:** edit the files, commit, push to `main`. Render rebuilds and redeploys automatically.

```bash
cd /Users/bobbyc/repos/skip-to-7-figures
git add -A && git commit -m "..." && git push origin main
```

## Regenerating the social card

`og-preview.html` renders the card at exactly 1200x630 using the site's own logo and founder photo:

```bash
cd /Users/bobbyc/repos/skip-to-7-figures
python3 -m http.server 8899 --bind 127.0.0.1 &
# open http://127.0.0.1:8899/og-preview.html at a 1200x630 viewport, screenshot,
# then: sips -s format jpeg -s formatOptions 82 --resampleWidth 1200 og.png --out og.jpg
```

`favicon-preview.html` does the same at 256x256 for `favicon.png`.

> Note: the `og:image` / `twitter:image` tags in `index.html` use the absolute URL
> `https://skip-to-7-figures.onrender.com/og.jpg` — **update those if the site ever moves to a custom domain.**
