/* Drift wall settings — the DriftWall component's props, one place to tune.
   Edit and reload index.html. Or open wall-test.html and tweak them live,
   then copy the JSON it shows into this file. */
window.WALL = {
  overlay: '#060010',       // colour laid over resting tiles
  overlayOpacity: 0.24,     // how much of it (0–1); hover drops it to 0
  columns: 3,
  tileWidth: 476,           // px
  tileHeight: 256,          // px
  gap: 17,                  // px
  radius: 14,               // px
  direction: 'up',          // 'up' | 'down' | 'alternate'
  speed: 37,                // px per second of idle drift (after 2s without scrolling)
  variance: 0.45,           // per-column speed spread (0 = all equal)
  tilt: 20,                 // rotateX, degrees
  turn: -9,                 // rotateY, degrees
  roll: 0,                  // rotateZ, degrees
  perspective: 1260,        // px
  depth: 230,               // px the plane sits behind the screen (negative = in front)
  parallax: 0.6,            // how much the mouse sways the plane (degrees at the edge ≈ 4.8 × this)
  lift: 54,                 // px a hovered tile rises
  fade: 0,                  // edge fade of the wall (0 = hard edge, 1 = full vignette)
  dim: 1,                   // resting tile opacity (1 = solid)
  pauseOnHover: true,       // stop the hovered column while the pointer is on it
  grayscale: false,         // resting tiles in grayscale, colour on hover
};
