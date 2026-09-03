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

## Layout

```
index.html    all markup, CSS and JS
serve.py      local static server with HTTP Range support
media/        hero video, poster, project stills, client logos
```
