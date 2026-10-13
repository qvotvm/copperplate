---
name: copperplate
description: Create vintage engraved stock certificates from a one-line company description, using deterministic code, one or two inks, engine-turned guilloche borders, reversed panels, a fat-face shaded title, and a vignette hatched like a bank-note engraving. Export standalone HTML, SVG, PNG or a silent draw-on MP4. Use for fictional certificate art and security-printing illustrations, not real securities, logos or raster image generation.
license: MIT
metadata:
  compatibility: "Claude Code, Codex and Hermes. Node.js 22+, Chrome or Chromium for audits and PNG, ffmpeg for MP4. No npm dependencies or API keys."
---

# Copperplate

Describe a company in one line. Engrave the certificate in code.

The subject is the centre of the certificate and the vignette is the hard part. An overnight railway needs a boiler that turns, a cab with dark windows, wheels with spokes, smoke, a moon and rails that fade into the paper. A rosette alone is decoration. Read the closest worked example before drawing, and read `references/engraving-study/README.md` once: it says what a real plate looks like and what the numbers are.

## Make a certificate

1. Extract the company, era and physical subject from the line. Invent a company name when none is supplied. Treat shares, par value, serial and charter date as fictional design fields. Every output carries a specimen notice. Keep all examples fictional.
2. Choose one ink: `navy`, `green`, `brown`, `oxblood` or `black`. Optionally a second ink, `ink2`, for the band, panels and frames; two-colour sheets usually put the lathe work in colour and the title and vignette in black (`ink: 'black', ink2: 'navy'`). `paper: 'night'` prints pale ink on dark paper. Do not add gradients, coloured shadows, raster artwork or a third colour. Select era-appropriate parts and language: sailing ships for 1878, steam railways for 1926, a launch gantry for 1962. Do not present the result as historically authenticated.
3. List the subject's silhouette, structural parts, moving parts, small details and setting, and where the light comes from. Prefer recognisable physical construction to abstract symbols. Use [the vignette vocabulary](references/vignettes.md) and inspect the matching drawing in `kit/vignettes.mjs`. Build new subjects with those primitives rather than forcing an unrelated built-in.
4. Create a folder with `prompt.txt`, `spec.json` and, for a bespoke drawing, `design.mjs`. Use `company`, `subject`, `year`, `ink`, `ink2`, `paper`, `serial`, `shares`, `par`, `motto`, `ribbon`, `holder`, `date`, `jurisdiction` and `classOf`. The seven ready-to-build examples are listed in `examples/manifest.json`. `subject` accepts `locomotive`, `eagle`, `factory`, `ship`, `portrait`, `rocket` or `server`.
5. Draw in the 720 x 320 vignette space. `certificate(spec, draw)` places it at `(440, 316)` on a 1600 x 1000 plate. Start with `sky`, `ground` or `water` so the scene fades into the paper along the oval, then put distant parts first and foreground parts last; `Plate.shape` lays a paper knockout under every part. Give each part a mode and a light: `contour` or `ruling` for round forms, `parallel` for planes, forced `cross` for cavities, `stipple` for skin and vapour. Set `form`, `edge` and `highlight` so the lit side stays paper and the shadow side swells. Tone controls spacing, width, crossing and dropout, never opacity. Keep line weights at or above 0.6 units.
6. Build, audit and inspect at full size and at 4x over the subject. Fix geometry or text placement whenever an audit fails. Do not lower audit thresholds to make a failed certificate pass. Keep filenames relative to the working folder and keep fonts bundled. Follow [the API and export notes](references/kit.md) for helper details.

```sh
node scripts/build.mjs examples/night-railway/spec.json out/my-certificate
node scripts/audit.mjs out/my-certificate.html --out out/my-certificate.audit.json
node scripts/inspect.mjs out/my-certificate.html out/my-certificate-closeup.png 440,316,720,320 4
node scripts/render.mjs out/my-certificate.html out/my-certificate.png --scale 2
node scripts/render.mjs out/my-certificate.html out/my-certificate.mp4 --duration 15
```

Paths in these commands are relative to the skill root. Use absolute paths to the scripts when working from another folder. `CHROME_PATH` and `FFMPEG_PATH` override executable discovery. Browser scripts write temporary profiles to the OS temp folder. If the environment blocks Chrome, request only the permission needed to run the local audit/render command, keeping the built HTML and SVG available.

## Write a new vignette

Export `spec` and `draw` from `design.mjs`. Import the kit by its actual local path. This starter is a fictional balloon mail company; deepen it with basket weave, suspension ropes, envelope gores and a landscape.

```js
import { ellipse, rect, Shape } from '../../kit/geometry.mjs';
import { sky, ground, hills, oval } from '../../kit/vignettes.mjs';

export const spec = {
  company: 'Aerial Post Society', year: 1903, ink: 'green',
  motto: 'Letters delivered above the weather',
  ribbon: 'By charter of the open sky',
  prompt: 'A fictional 1903 company delivering letters by balloon.'
};
export function draw(p) {
  sky(p, { horizon: 240 }); hills(p); ground(p, { horizon: 240 });
  p.shape(ellipse(360, 110, 92, 98), { mode: 'contour', tone: 0.4, light: 'top-left', form: 0.8, edge: 0.3, highlight: 0.16 });
  for (let k = -3; k <= 3; k++) p.path(`M${360 + k * 26},14 Q${360 + k * 30},110 ${360 + k * 14},206`, { weight: 0.8 });
  p.shape(new Shape().move(312, 160).quadratic(360, 226, 408, 160).line(384, 244).line(336, 244).close(), { tone: 0.25, angle: 80, light: 'top' });
  p.line(312, 160, 336, 244).line(408, 160, 384, 244);
  p.shape(rect(334, 244, 52, 34), { mode: 'cross', tone: 0.7, light: 'top-left' });
  for (let x = 340; x < 386; x += 6) p.line(x, 248, x, 274);
}
```

Save as `examples/aerial-post/design.mjs`, then:

```sh
node scripts/build.mjs examples/aerial-post/design.mjs examples/aerial-post/certificate
node scripts/audit.mjs examples/aerial-post/certificate.html
```

Do not claim arbitrary natural-language parsing happens inside the JS kit. The agent interprets the prompt and writes the spec and drawing; the kit deterministically engraves them.

## Animation and validation

The HTML opens with the finished plate. Engrave replays it, Seek works in both directions, and reduced motion holds the finished plate. `window.__ready` resolves after fonts load. `window.__seek(seconds)` reconstructs state directly; `window.__frame(n)` seeks at 30 fps. Every path uses its measured length and stroke-dashoffset; lettering uses a measured left-to-right clip. Categories get fixed shares of the duration, so the vignette is always the long middle act. No noise, clock or random seed affects output.

`scripts/audit.mjs` measures actual browser text boxes, line weights, invalid paths, closed and bounded frames, duplicate IDs, bundled font availability, declared inks, raster ink coverage, and four tone checks: the title must be at least 30 percent ink, the border at least 35, the vignette between 12 and 60, the body under 35, and vignette strokes must use at least three widths. It writes JSON and a PNG. It does not judge anatomy, period accuracy or beauty. Read the PNG, including a 4x close-up of the vignette.

```sh
node --test scripts/geometry.test.mjs
node scripts/build-examples.mjs
node scripts/verify.mjs
```

Verification checks all seven examples, backward seek equality, reduced motion, phone fit at 390 px, unique demo IDs, movement in the first two frames and the absence of captions or counters in the demo frame.

## Local handoff

Deliver source, prompt, standalone HTML/SVG, preview PNGs and requested video. State what passed and any limits. Publishing, pushing and deployment are outside this skill's scripts. Never infer permission to send an artifact to a remote service.
