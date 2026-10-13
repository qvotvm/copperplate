import test from 'node:test';
import assert from 'node:assert/strict';
import { Shape, rect, ellipse, inside } from '../kit/geometry.mjs';
import { parallel, cross, contour, stipple, ruling, shader, quantize, tint } from '../kit/hatch.mjs';
import { rosette, latheBand, scallop } from '../kit/guilloche.mjs';
import { words } from '../kit/type.mjs';
import { certificate } from '../kit/certificate.mjs';
import { fontCSS } from '../kit/export.mjs';

const points = d => [...d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(m => [Number(m[1]), Number(m[2])]);
const samples = run => { const p = points(run.d); return p.slice(1).flatMap((b, i) => [0.1, 0.5, 0.9].map(t => [p[i][0] + (b[0] - p[i][0]) * t, p[i][1] + (b[1] - p[i][1]) * t])); };

test('parallel hatching respects concavities and even-odd holes', () => {
  const s = rect(0, 0, 120, 100);
  s.move(30, 20).line(90, 20).line(90, 80).line(30, 80).close();
  for (const angle of [-75, -35, 0, 90, 130]) for (const run of parallel(s, { angle, spacing: 3, form: 0, highlight: 0 })) for (const p of samples(run)) assert.ok(inside(p, s));
});
test('curved boundaries contain crosshatching and density increases with tone', () => {
  const s = new Shape().move(0, 40).cubic(0, -20, 110, -20, 110, 40).quadratic(55, 130, 0, 40).close();
  for (const run of cross(s, { forced: true })) for (const p of samples(run)) assert.ok(inside(p, s));
  assert.ok(parallel(s, { tone: 0.9 }).length > parallel(s, { tone: 0.1 }).length);
});
test('contour hatching follows curved boundaries and remains inside holes', () => {
  const s = ellipse(60, 60, 55, 45), hole = ellipse(60, 60, 14, 12); s.rings.push(...hole.rings);
  const runs = contour(s, { resolution: 2, spacing: 4, cross: false }); assert.ok(runs.length > 5);
  for (const run of runs) for (const p of points(run.d)) assert.ok(inside(p, s));
});
test('line width swells with shade and never drops below the audit minimum', () => {
  const s = rect(0, 0, 200, 60), runs = parallel(s, { angle: 0, spacing: 4, light: 'left', form: 1, tone: 0.5 });
  const widths = new Set(runs.map(r => r.weight));
  assert.ok(widths.size >= 3, 'at least three weights across a lit form');
  for (const w of widths) assert.ok(w >= 0.6 && w <= 1.6);
  const left = runs.filter(r => points(r.d)[0][0] < 40).map(r => r.weight), right = runs.filter(r => points(r.d)[0][0] > 150).map(r => r.weight);
  assert.ok(Math.max(...right) > Math.max(...left), 'the side away from the light is heavier');
  assert.equal(quantize(0, [0.6, 1.6]), 0.6); assert.equal(quantize(1, [0.6, 1.6]), 1.6);
});
test('highlights drop out and the second family appears only in shade', () => {
  const s = rect(0, 0, 200, 60);
  const lit = parallel(s, { angle: 0, spacing: 4, light: 'left', form: 1, tone: 0.45, highlight: 0.3 });
  assert.ok(lit.every(r => points(r.d).every(p => p[0] > 20)), 'no lines inside the highlight');
  const runs = cross(s, { angle: 0, spacing: 4, light: 'left', form: 1, tone: 0.5 });
  const crossing = runs.filter(r => { const [a, b] = points(r.d); return Math.abs(b[1] - a[1]) > 1; });
  assert.ok(crossing.length > 0 && crossing.every(r => points(r.d).every(p => p[0] > 90)), 'crossing lines only on the dark side');
});
test('stipple is deterministic, inside the shape and denser in shade', () => {
  const s = ellipse(50, 50, 48, 40), a = stipple(s, { light: 'left', form: 1, tone: 0.5 }), b = stipple(s, { light: 'left', form: 1, tone: 0.5 });
  assert.deepEqual(a, b);
  for (const dot of a) assert.ok(inside(points(dot.d)[0], s));
  assert.ok(a.filter(d => points(d.d)[0][0] > 60).length > a.filter(d => points(d.d)[0][0] < 40).length);
});
test('ruling graduates its pitch and the fade removes everything outside the oval', () => {
  const s = rect(0, 0, 300, 120), runs = ruling(s, { near: 2, far: 8, from: 'bottom', tone: 0.5, fade: { cx: 150, cy: 60, rx: 120, ry: 50, soft: 0.3 } });
  const ys = [...new Set(runs.map(r => points(r.d)[0][1]))].sort((a, b) => b - a);
  assert.ok(ys[0] - ys[1] < ys.at(-2) - ys.at(-1), 'tighter near the bottom');
  for (const run of runs) for (const p of points(run.d)) assert.ok(((p[0] - 150) / 120) ** 2 + ((p[1] - 60) / 50) ** 2 <= 1.02);
  assert.equal(shader(s, { fade: { cx: 150, cy: 60, rx: 10, ry: 10 } })(0, 0), -1);
});
test('guilloche paths are deterministic and closed, tint is dense', () => {
  assert.deepEqual(rosette(40, 40, { amplitude2: 3, lobes2: 5 }), rosette(40, 40, { amplitude2: 3, lobes2: 5 }));
  for (const d of [...rosette(40, 40), ...latheBand(20, 20, 400, 200, 40).map(r => r.d), ...scallop(20, 20, 400, 200)]) assert.ok(d.endsWith('Z'));
  assert.equal(latheBand(20, 20, 400, 200, 40).length, 10 + 10 + 5);
  assert.ok(new Set(latheBand(20, 20, 400, 200, 40).map(r => r.weight)).size === 2, 'lozenge family heavier than the fine waves');
  assert.ok(tint(rect(0, 0, 50, 20)).length > 60);
});
test('share counts become words', () => {
  assert.equal(words(100), 'one hundred'); assert.equal(words(25), 'twenty five'); assert.equal(words(1250), 'one thousand two hundred fifty'); assert.equal(words(7), 'seven');
});
test('complete standalone SVG is byte deterministic, escapes user text and declares its inks', () => {
  const spec = { company: 'Owl & Lantern <Works>', subject: 'locomotive', year: 1923, ink: 'green', ink2: 'black' };
  const a = certificate(spec).svg(fontCSS()), b = certificate(spec).svg(fontCSS());
  assert.equal(a, b); assert.ok(a.includes('&amp;')); assert.ok(a.includes('&lt;WORKS&gt;')); assert.ok(a.includes('data:font/woff2;base64,'));
  assert.ok(a.includes('data-inks="#143225 #14120f"')); assert.ok(a.includes('font-family="PlateDisplay"')); assert.ok(a.includes('font-family="PlateScript"'));
  assert.ok(a.includes('<textPath'), 'microtext rides a path');
  const night = certificate({ company: 'Night Works', subject: 'rocket', paper: 'night' }).svg('');
  assert.ok(night.includes('fill="#1b242c"') && night.includes('stroke="#ece0c6"'));
  assert.throws(() => certificate({ company: 'Bad', subject: 'ship', ink: 'pink' }));
});
test('title shadow and inline are present and the title is the heaviest lettering', () => {
  const svg = certificate({ company: 'Meridian Iron Works', subject: 'factory' }).svg('');
  const shadows = svg.match(/<text[^>]*PlateDisplay[^>]*fill="#132636" stroke="none">MERIDIAN IRON WORKS/g);
  assert.ok(shadows && shadows.length >= 2, 'shadow copy and solid copy');
  const inline = svg.match(/<g clip-path="url\(#type-\d+\)">((?:(?!<\/g>).)*)<\/g>/s);
  assert.ok(inline && (inline[1].match(/data-paper="true" d="M0,[\d.]+L1600,[\d.]+" stroke="#f3ecd8"/g) ?? []).length > 10, 'paper hairlines clipped to the title');
});
