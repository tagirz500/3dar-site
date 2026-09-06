# Brief: five radically different versions of the STUDIO 3DAR website

You are a senior creative developer and motion designer of Awwwards Site-of-the-Year calibre. Your job is to take the existing 3DAR studio website and produce **five completely different variations** of it. You have total freedom: layout, structure, typography, colour, navigation, page count, interaction model, animation stack. The only things that are fixed are the client, the content and the assets listed below. Everything else may be thrown away.

Work like a professional: read the whole repo first, plan each variation before writing code, keep every variation self-contained, verify each one in a real browser at 1440×900 and 390×844, and commit as you go.

---

## 1. The client

**STUDIO 3DAR** (studio3dar.ru) is a Russian architectural-visualisation studio. They produce photorealistic 3D renders, 3D animation and short films, VR tours, and brand solutions for real-estate developers. All site copy is **in Russian** and must stay in Russian. Tone: premium, cinematic, confident, technical mastery in service of selling architecture before it is built.

Site sections and copy that must survive in every variation (the wording may be reused verbatim from `index.html`):

| Section | Content |
|---|---|
| Hero | The studio name and a cinematic entrance. Current site uses a scroll-scrubbed drone clip through clouds → city → facade (`media/hero.mp4`, 10 s). |
| Statement | «Ваше желание, наше исполнение» + one paragraph. |
| Services (4) | 3D визуализации · 3D анимация · VR туры · Brand решения, each with a short paragraph. |
| Portfolio | «Наши работы», 35+ projects. 7 real projects with gallery images (see assets). |
| Why us | «Почему выбирают нас», 4 points. |
| Trust | «Нам доверяют», 5 client logos. |
| FAQ | «Частые вопросы», several Q&A. |
| Contact / CTA | «То, что нельзя показать, невозможно продать» + contact form/links. |
| Secondary pages | `renders.html` (renders gallery), `animation.html` (films, Kinescope video embeds). |

---

## 2. GitHub — where the code lives and how to deliver

Repository: **https://github.com/tagirz500/3dar-site** (branch `main`).

```bash
git clone https://github.com/tagirz500/3dar-site.git
cd 3dar-site
python serve.py 5412        # http://localhost:5412  (serve.py adds Range + no-store headers; any static host works too)
```

Repo layout:

```
index.html          main page: hero clip, statement, services, drift wall, reel gallery, about, FAQ, contact (≈1700 lines, CSS+JS inline)
home2.html          generated variant of index.html with a marquee loader instead of the clip — do not hand-edit
renders.html        renders gallery page
animation.html      animation/films page
site.js             shared: stairs menu, lightbox, Kinescope facade, particle backdrop mount, SVG-stroke page transition, on-scroll per-character typography
site.css            shared palette tokens, nav, menu, transitions, typography effect
particles.js        the cursor-reactive particle backdrop
wall-settings.js    tunables for the drift wall (columns, speed, parallax, lift)
wall-test.html      live tuning panel for the wall (iframe + ?wall=<json>)
serve.py            dev server
media/              all assets (see §3)
```

Delivery rules:

1. Create **one branch per variation**: `var/01-<slug>` … `var/05-<slug>`. Each branch is a complete, working site rooted at `index.html` so it can be previewed on GitHub Pages / Netlify / Vercel with zero build config. If you use a bundler (Vite etc.), commit the built `dist/` at the branch root **as well as** the source, and document `npm i && npm run dev`.
2. Each branch gets a `VARIATION.md` at the root: concept in three sentences, the animation stack used, a section-by-section description of every motion, browser/perf notes, and what you would do next with more time.
3. Commit early and often with descriptive messages. Do not force-push over `main`. Do not delete `main`'s files on `main`.
4. Keep every branch under 100 MB. Reuse `media/` by reference; do not duplicate the 48 MB of images per branch. Do not commit `node_modules`.
5. Push all five branches and, at the end, open one Pull Request per variation against `main` with a screenshot or short screen recording of the hero and one inner section in the PR body.

---

## 3. Assets — what you have to work with

All assets are in `media/` (≈48 MB). Nothing else is licensed; do not invent client logos or fake projects. Placeholder illustrations, generative canvases, shaders, typography and procedural 3D are all fine.

| Path | What it is | Use |
|---|---|---|
| `media/hero.mp4` | 10 s drone flight: clouds → city → building facade, 1.5× speed, keyframe every 12 frames so it can be scroll-scrubbed. `media/poster.jpg` is its first frame. | Hero / loader / background texture. May be cut, masked, colour-graded, or dropped. |
| `media/wall/<project>/*.jpg` | 7 real projects, web-sized renders: `alleyi`, `centropark` (17), `centropark2` (7), `hutorskaya` (5), `innograd` (6), `miriady` (8), `ozerny` (7). | Portfolio, galleries, hover reveals, image trails. |
| `media/wall/posters/01–15.jpg` | 15 poster-format renders. | Reel / marquee / grid / cards. |
| `media/gal/<project>/*.jpg` | Same 7 projects at gallery resolution. | Lightbox / fullscreen viewers. |
| `media/anim/01–15.jpg` + `index.json` | Stills from the studio's films, with a JSON index (title, Kinescope video id). | Animation page. Embed Kinescope players lazily (see the facade in `site.js`). |
| `media/logo-*.svg` | Client logos: Евродом, Горем, Комосстрой, Талан, Железно. | Trust section. Monochrome only, do not recolour brand marks. |

Project names for captions: Аллеи, Центропарк, Центропарк 2, Хуторская, Инноград, Мириады, Озёрный.

Fonts: currently Oswald (display) + a system sans. You may change them; use Google Fonts or self-hosted open-licence fonts only, with Cyrillic coverage.

---

## 4. The actual website — what exists today, so you know what you are replacing

Current stack is vanilla HTML/CSS/JS, no build step, no GSAP. Notable pieces you may keep, remix, or discard:

- **Scroll-scrubbed video hero**: three scroll gestures each play one camera move; page locks until the clip is spent, then hands off to the site with a block-wipe.
- **Cursor-reactive particle backdrop** (`particles.js`) running under the whole page.
- **Per-character on-scroll typography** on every heading and paragraph (Codrops OnScrollTypography style, scrubbed by scroll position).
- **TextRepetition trail** on the four service titles.
- **Drift wall**: 4 auto-scrolling parallax columns of renders, pause + lift on hover, pinned for 300vh; clicking a project opens a **reel**: a dolly-through of the project's images, then a gallery with wheel zoom, pan and fullscreen.
- **Stairs menu** and an **SVG-stroke page transition** between pages.

Known weaknesses to fix in every variation: too many competing effects on one page, mobile is an afterthought, no reduced-motion alternative, performance on integrated GPUs is not measured.

Palette today is deep navy (#030615) with electric blue accents (#6ea8ff). You may keep or completely change it.

---

## 5. Research before designing — use these references

Study these before you sketch anything, and cite in each `VARIATION.md` which references inspired what:

- **Awwwards — Sites of the Year** (awwwards.com/websites/sites_of_the_year) for the bar to hit: pacing, restraint, one hero idea per site.
- **Animmaster Lib** (300 pro-level animated components) for polished, production-ready interaction patterns.
- **Originkit** (free animated component library) for drop-in motion components you can adapt.
- **GetLayers** (AI-native template library) for layout systems and section rhythm.
- **Refero / DESIGN.md examples** for real-product UI details, typography scale and spacing.
- **React Bits — Image Trail** (and the rest of React Bits) for cursor-driven image effects, ideal for the portfolio.
- **Sketchfab** for how real-time 3D is presented on the web; the client is a 3D studio, so real-time 3D is on-brand.
- **Codrops demos** (tympanus.net/codrops) for scroll typography, grid-to-fullscreen, WebGL image transitions.

Only borrow ideas and code with a licence that allows it; credit in `VARIATION.md`.

---

## 6. The five variations — each must feel like a different studio built it

Each variation has **one signature animation idea** that drives the whole site. Do not blend them. Deliver these five:

### Variation 1 — «Кинозал» (Cinematic)
Full-bleed film language. The hero clip is the whole first screen with a letterbox mask that opens as you scroll; sections cut like a film edit (hard cuts, black frames, titles typed in). Portfolio is a horizontal filmstrip with a scrub bar. Typography: huge condensed display, credits-style lists. Stack: scroll-driven WAAPI or GSAP ScrollTrigger, `<video>` scrubbing.

### Variation 2 — «Объём» (Real-time 3D)
A WebGL scene is the site. Three.js (or R3F) hero: an abstract architectural volume built from the renders as textured planes or a particle city that forms and dissolves as you scroll, camera flying through sections. Portfolio images live on 3D planes in the scene with depth-of-field on hover. Stack: three.js + postprocessing, a 2D DOM fallback for low-end devices.

### Variation 3 — «Свет» (Editorial light)
A bright, quiet, magazine-grade site: white or warm paper background, giant serif Cyrillic headlines, generous whitespace, thin rules. Motion is restrained and precise: reveal-on-scroll with clip-path wipes, image-trail cursor effect in the portfolio (React Bits style), smooth-scroll parallax with Lenis. Proves the studio can be elegant, not just dark and dramatic.

### Variation 4 — «Сетка» (Kinetic grid)
The portfolio is the home page. An infinite, draggable, momentum-scrolling grid of all 60+ renders that zooms from a distant mosaic to single fullscreen images (grid-to-fullscreen transitions, FLIP animations). Text sections slide in as overlays over the grid. Cursor is a custom magnetic element. Stack: vanilla or GSAP Flip, `IntersectionObserver`, CSS scroll-driven animations.

### Variation 5 — «Шейдер» (Generative / shader)
A single continuous GLSL canvas under everything: liquid displacement, noise-driven colour fields in deep blues, and image reveals through shader transitions (ripple, dissolve, pixel-sort). Headlines distort and settle as you scroll (kinetic typography via canvas or SVG filters). Stack: raw WebGL or OGL/three.js shaders, one draw call per frame, throttled on mobile.

For every variation, also deliver: a loader/entrance that sets the tone in under 2.5 s (skippable), a distinct menu open/close animation, a page transition to `renders.html` and `animation.html`, hover states on every interactive element, and a `prefers-reduced-motion` mode that keeps the site fully usable.

---

## 7. Quality bar and verification

Before you call any variation done:

- Lighthouse Performance ≥ 80 desktop, ≥ 60 mobile; LCP < 2.5 s on the hero; no layout shift after load.
- Steady 60 fps on scroll on a mid-range laptop; measure with the Performance panel and note the result.
- Test at 1440×900, 1920×1080 and 390×844. Every animation must be visible and complete in the viewport, not snap in or finish off-screen.
- No console errors. All images have `alt`, all interactive elements are keyboard reachable, focus is visible.
- Hard-refresh with cache disabled before judging; version your asset URLs.
- Take a screenshot mid-animation of the hero and of the portfolio for each variation and put them in the PR.

Finish all five. If something is impossible in the time you have, ship the other four in full and write exactly what is missing in that branch's `VARIATION.md` instead of silently shrinking the scope.
