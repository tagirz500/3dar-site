# STUDIO 3DAR — landing page

Scroll-driven video hero for an architectural-visualisation studio.
One self-contained `index.html`; no build step, no dependencies.

## Run it

```bash
python serve.py 5412
```

Then open http://localhost:5412

`serve.py` exists because Python's `http.server` sends no `Accept-Ranges`, and
Chrome refuses to seek a video without it — the hero silently plays past every cut.
Any normal host (nginx, Vercel, Netlify, GitHub Pages) serves ranges already.

## The hero

Three scroll gestures, one camera move each. The page stays locked until all three
are spent, then releases to the rest of the document; scrolling up at the top plays
the segments in reverse.

| Scroll | Clip time | Motion |
|---|---|---|
| 1 | 0 – 3.60s | through the cloud layer, the complex appears below |
| 2 | 3.60 – 6.40s | descent and tilt down to street level |
| 3 | 6.40 – 10.04s | lateral glide along the facade |

`media/hero.mp4` is encoded at 1.5x with a keyframe every 12 frames — the dense
keyframes are what make the reverse scrub smooth.

## Pages

| File | What it is |
|---|---|
| `index.html` | home — scroll hero, services, drift wall, about, FAQ, contacts |
| `renders.html` | 3D визуализация — 55 renders across 7 projects, click to open a lightbox |
| `animation.html` | 3D ролики — 15 films, click a poster to load its Kinescope player |

Project order, names and counts on both gallery pages are taken verbatim from the
live site's `/3drender` and `/3danimation`, so the two stay in step.

## The menu

`site.js` injects a sliding-stairs menu into every page, so the labels and hrefs
live in one place and cannot drift. The burger is fixed top-right on all three
pages — the live site has no nav at all on its subpages and a broken one on mobile.

Opening runs a 1.4s score (five bars curtain down rightmost-first, scrim, then the
links flip in); closing runs 0.7s. It is plain CSS transitions with per-element
delays — the original used GSAP, but nothing here needs a 25 KB dependency.
Hovering a row wipes a marquee band across it, from whichever edge the cursor
entered. Clicking a link holds the bars down over the page transition.

## Layout

```
index.html      home
renders.html    render galleries        animation.html   film galleries
site.css        shared chrome: tokens, menu, gallery pages
site.js         menu, lightbox, Kinescope facade
serve.py        local static server with HTTP Range support
media/          hero video, poster, client logos
media/wall/     drift-wall tiles, 640px (224px tiles)
media/gal/      gallery + lightbox renders, 1400px
media/anim/     the 15 film posters, pulled per Kinescope video id so each frame
                is paired with its own project rather than guessed
```
