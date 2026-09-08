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
| 1 | 0 – 3.40s | through the complete cloud layer, stopping on the overhead building view |
| 2 | 3.40 – 6.40s | descent and tilt down to street level |
| 3 | 6.40 – 10.00s | lateral glide along the facade |

The hero now uses `media/hero-2k60.mp4`: 2560×1440, motion-interpolated 60fps,
encoded from the saved 1080p source with Lanczos scaling. The separate
`media/hero-2k60-reverse.mp4` plays backward segments through native playback,
avoiding repeated seeks. Both use a keyframe every 12 frames. Original files
remain available. The video fills the viewport edge to edge.

## Post-video flow

The original block-and-logo wipe now hands directly from the video to the
single-page statement and a four-card service deck. The cards begin as a
dimensional overlapping stack; one downward wheel gesture unfolds all four,
and one upward gesture restacks them. The same state change is available by
button, keyboard, and touch, with a reduced-motion mode.

The deck contains 3D visualisation, 3D animation, VR tours, and Brand Solution,
all using the original copy. A slowly drifting navy aurora remains behind the
card interaction.

An earlier background was the unmodified React Bits JS-CSS Lightfall component from
https://reactbits.dev/r/Lightfall-JS-CSS.json in `components/Lightfall.jsx` and
`components/Lightfall.css`. `components/lightfall-entry.jsx` mounts this isolated
React component into the otherwise plain HTML/JavaScript site with the requested
colors and settings. OGL and React are bundled locally; no CDN runtime is needed.
The canvas is unmounted when the intro ends; a CSS fallback remains if WebGL fails.

After changing the component, run `npm ci` then `npm run build`. Generated files
in `media/bundles/` are served directly by the existing static server.

## Pages

| File | What it is |
|---|---|
| `index.html` | home — scroll hero, services, drift wall, about, FAQ, contacts |
| `renders.html` | Full-screen falling-card library — 7 project covers; click opens the drift-wall-style viewer with all 55 renders |
| `animation.html` | 3D ролики — 15 films, click a poster to load its Kinescope player |

Project order, names and counts on both gallery pages are taken verbatim from the
live site's `/3drender` and `/3danimation`, so the two stay in step.

The project library uses `project-library.css` and `project-library.js` for the
scroll-driven cascade from the supplied reference video. `library-reel.js` and
`library-reel.css` reuse the homepage image-trail and depth-viewer implementation
without altering the homepage. Each cover is its project's `01.jpg`. Wheel,
touch, arrow keys, arrow buttons and the vertical range control navigate all
seven projects; closing the viewer returns to the selected library card.
The library is framed in a responsive square. Seven clickable progress dots
replace the range input; the violet rail fills continuously with scroll travel.
Cards rotate down onto a perspective floor while the next card advances from
the stack. The last cover occupies the floor at the beginning of the sequence.

The home-page wall presents all 55 render images from the seven render projects,
without repeats. Opening any wall image starts the project reel on that exact
image.

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
