# Kit and exports

All modules are ES modules with zero third-party dependencies. Coordinates, stroke weights and font sizes are in certificate units. Default paper is `#f3ecd8`; default dimensions are 1600 x 1000.

| Module | Purpose |
|---|---|
| `geometry.mjs` | `Shape`, `polygon`, `rect`, `ellipse`, `inside`, `bounds`, `edgeDistance` |
| `hatch.mjs` | `shader`, `parallel`, `cross`, `contour`, `stipple`, `ruling`, `tint`, `hatch` |
| `guilloche.mjs` | `rosette`, `spirograph`, `band`, `latheBand`, `scallop` |
| `plate.mjs` | ordered plate recorder, two inks, paper grain, press filter, SVG serialization |
| `type.mjs` | `title`, `panel`, `reversed`, `caps`, `script`, `microtext`, `words`, `signature`, `ribbon` |
| `vignettes.mjs` | seven worked drawings plus `sky`, `ground`, `hills`, `water`, `moon`, `stars` |
| `certificate.mjs` | the sheet layout: band, corner panels, title, flanking panels, vignette, certifying lines, seal |
| `animation.mjs` | deterministic per-stroke schedule with category budgets, and seeking |
| `export.mjs` | font embedding, standalone SVG/HTML, four-plate demo |

## Shapes and shading

```js
const s = new Shape().move(100, 100).line(180, 100)
  .cubic(220, 100, 220, 200, 180, 200)
  .quadratic(100, 200, 100, 100).close();
p.shape(s, { mode: 'contour', tone: 0.5, light: 'top-left', form: 0.7, edge: 0.3, highlight: 0.12 });
```

`Shape` supports multiple closed rings: call `move` again after closing to add a hole. Curves are flattened at about two-unit intervals. The SVG keeps the original Bezier outline and clips every hatch run to it.

Every hatch helper returns `[{ d, weight }]` runs. A **shade field** decides the weight of each run and whether it exists at all:

- `tone` is the base darkness, 0 to 1. It sets line spacing: 6.2 units at 0, 2.0 at 1.
- `light` is where the light comes from: `top-left` (default), `top`, `left`, `right`, `bottom`, `none`, or a vector. `form` (default 0.5) is how much darker the far side gets.
- `edge` adds darkness near the outline on the shadow side, over `edgeWidth` units. This is what makes cylinders and domes turn.
- `highlight` (default 0.12): runs below this shade are not cut, so the lit side stays paper.
- `swell` is the width range, default `[0.6, 1.6]`, quantised to five steps. The audit refuses anything under 0.6.
- `shade(x, y, s)` lets a drawing bend the field: a furnace glow, an extra shadow.
- `fade` is an oval `{ cx, cy, rx, ry, soft }`; outside it nothing is cut, and inside the soft band the shade tapers so lines thin and then stop. This is the bank-note vignette edge.

Modes: `parallel` is one family; `cross` adds a second family only where shade passes 0.55 and a third above 0.85 (`forced: true` crosses everywhere, for windows and deep cavities); `contour` traces equal-distance insets of the outline and swells them, with a parallel family in the shade; `stipple` lays deterministic jittered dots sized and spaced by shade; `ruling` draws graduated straight lines (`near`, `far`, `from`, optional `wave`) for sky, water, boilers and hulls; `tint` is a fixed dense set of families for reversed panels.

`Plate.shape` paints a paper knockout first, so later shapes occlude earlier ones. Draw back to front. `outline` can be `true`, `false` or a weight.

## Guilloche

```js
rosette(100, 100, { radius: 40, amplitude: 8, lobes: 14, loops: 9, amplitude2: 3, lobes2: 5 });
latheBand(31, 31, 1538, 938, 64, { cycles: 72, loops: 13 });
scallop(26, 26, 1548, 948, { cycles: 56, depth: 6, lines: 3 });
band(100, 100, 300, { amplitude: 9, period: 42, loops: 8, vertical: true });
```

`latheBand` runs three wave families round a closed rectangular carrier: two fine families (0.6 units) with integer cycle counts four apart, so they beat against each other, and one heavier family (1.3 units) for the lozenges. It returns `{ d, weight }` runs. Measured on the references, the band fills 55 to 80 percent of its area; the sheet sits at 74. `scallop` draws the wavy outer edge. `rosette` sums two harmonics.

## Type

- `title(p, text, x, y, { size })`: Abril Fatface capitals, solid ink, a drop shadow at 5.5 percent of the size, a paper halo and paper hairlines clipped to the glyphs. It is the darkest thing on the sheet by construction.
- `panel(p, x, y, w, h)` and `reversed(p, text, x, y)`: a dark engine-turned ground with paper letters knocked out and a soft ink shadow.
- `caps`: letter-spaced roman capitals. `script`: Pinyon Script for the certifying phrases.
- `microtext(p, text, pathD, length, { size })`: repeating text on a `<textPath>`. The sheet carries one between the inner frames and one inside the seal.
- `words(n)`: share count in words for the reversed panel.

Fonts: EB Garamond 400/700, Abril Fatface, Pinyon Script, all OFL, latin subsets, embedded as WOFF2 data URLs. Licenses in `assets/fonts/OFL.txt`.

## Inks, paper, press

`spec.ink` picks the main ink (`navy`, `green`, `brown`, `oxblood`, `black`). `spec.ink2` optionally prints the band, panels and frames in a second ink, the way two-colour certificates put the lathe work in colour and the title and vignette in black: for that look use `ink: 'black', ink2: 'navy'`. `spec.paper: 'night'` reverses the sheet: dark paper, pale ink.

Every plate carries a faint deterministic paper grain (`feTurbulence`, fixed seed, alpha 0.05). A `press` filter (dilate 0.08 units, no blur) is available with `press: true` and off by default, because it softens previews at 1x. Both are SVG filters on vector geometry, not raster artwork; `grain: false` turns the grain off. The audit measures the plate without them.

## Animation

`installEngraving(svg, duration)` sorts strokes by category (frame, ornament, panel, vignette, lettering, signature, seal) and gives each category a fixed share of the duration (4, 14, 8, 50, 16, 4 and 4 percent), so the vignette is always the long middle act. Inside a category, time follows the square root of stroke length. Paths use measured length and `stroke-dashoffset`; text uses a measured reveal clip; knockouts appear when their shape starts. `seek(t)` rebuilds state from `t` alone, so backward seeks are exact.

## Export

```sh
node scripts/render.mjs examples/pelagic/certificate.html out/ship.png --scale 2
node scripts/render.mjs examples/pelagic/certificate.html out/ship-progress.png --time 7
node scripts/render.mjs examples/pelagic/certificate.html out/ship.mp4 --fps 30 --duration 15
```

Chrome gets an OS-temp profile and is closed after rendering. `CHROME_PATH` and `FFMPEG_PATH` override discovery; `CDP_TIMEOUT` (milliseconds) raises the per-command limit for very large captures. MP4 uses libx264, CRF 18, yuv420p, faststart, no audio.
