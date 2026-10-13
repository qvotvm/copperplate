import { polyline as fine } from './geometry.mjs';
const polyline = p => 'M' + p.map(([x, y]) => `${Math.round(x * 20) / 20},${Math.round(y * 20) / 20}`).join('L');
const tau = 2 * Math.PI;

// Rosette with two harmonics: the second term gives the interference that reads as lathe work.
export function rosette(cx, cy, { radius = 40, amplitude = 8, lobes = 14, loops = 9, phase = 0, amplitude2 = 0, lobes2 = 0, samples = 720 } = {}) {
  return Array.from({ length: loops }, (_, k) => {
    const p = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples * tau, r = radius + amplitude * Math.sin(lobes * t + k * tau / loops + phase) + amplitude2 * Math.sin(lobes2 * t - 2 * k * tau / loops);
      p.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
    }
    return polyline(p) + 'Z';
  });
}
export function spirograph(cx, cy, { outer = 54, inner = 18, pen = 10, turns = 1, samples = 1200 } = {}) {
  const p = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples * tau * turns, q = (outer - inner) / inner;
    p.push([cx + (outer - inner) * Math.cos(t) + pen * Math.cos(q * t), cy + (outer - inner) * Math.sin(t) - pen * Math.sin(q * t)]);
  }
  return polyline(p);
}
// Straight band of crossing waves, horizontal or vertical.
export function band(x, y, length, { amplitude = 9, period = 42, loops = 8, vertical = false, families = 2 } = {}) {
  const out = [];
  for (let fam = 0; fam < families; fam++) for (let k = 0; k < loops; k++) {
    const p = [], samples = Math.ceil(length * 1.2), sign = fam % 2 ? -1 : 1, per = period * (fam ? 1.12 : 1);
    for (let i = 0; i <= samples; i++) {
      const along = i / samples * length;
      const across = sign * amplitude * Math.sin(along / per * tau + k * tau / loops) + 2 * Math.sin(along / (per / 2) * tau - k * tau / loops);
      p.push(vertical ? [x + across, y + along] : [x + along, y + across]);
    }
    out.push(polyline(p));
  }
  return out;
}
// Point on a closed rectangular carrier at perimeter position s, moved inward by offset.
function carrier(x, y, w, h, s, offset) {
  if (s <= w) return [x + s, y + offset];
  if (s <= w + h) return [x + w - offset, y + s - w];
  if (s <= 2 * w + h) return [x + w - (s - w - h), y + h - offset];
  return [x + offset, y + h - (s - 2 * w - h)];
}
// Wide engine-turned border: two wave families of different integer cycle counts cross and beat
// against each other (moiré), a coarse family draws the large lozenges. Outer rect is (x, y, w, h).
export function latheBand(x, y, w, h, band, { cycles = 64, loops = 10, samples = 2000, families } = {}) {
  const perimeter = 2 * (w + h), half = band / 2, out = [];
  const list = families ?? [
    { cycles, loops, amplitude: half - 1.5, sign: 1, weight: 0.6 },
    { cycles: cycles + 4, loops, amplitude: half - 1.5, sign: -1, weight: 0.6 },
    { cycles: Math.round(cycles / 4), loops: Math.max(4, Math.round(loops / 2)), amplitude: half - 3, sign: 1, weight: 1.3 }
  ];
  for (const fam of list) for (let k = 0; k < fam.loops; k++) {
    const p = [];
    for (let i = 0; i <= samples; i++) {
      const s = i / samples * perimeter;
      p.push(carrier(x, y, w, h, s, half + fam.sign * fam.amplitude * Math.sin(s / perimeter * tau * fam.cycles + k * tau / fam.loops)));
    }
    out.push({ d: polyline(p) + 'Z', weight: fam.weight ?? 1 });
  }
  return out;
}
// Scalloped edge: repeated arcs along the carrier, several parallel lines deep.
export function scallop(x, y, w, h, { cycles = 48, depth = 7, lines = 3, gap = 1.8, samples = 1600 } = {}) {
  const perimeter = 2 * (w + h), out = [];
  for (let k = 0; k < lines; k++) {
    const p = [];
    for (let i = 0; i <= samples; i++) {
      const s = i / samples * perimeter, arc = Math.abs(Math.sin(s / perimeter * Math.PI * cycles));
      p.push(carrier(x, y, w, h, s, k * gap + depth * (1 - arc)));
    }
    out.push(polyline(p) + 'Z');
  }
  return out;
}
export const latheBorder = (x, y, w, h, options = {}) => latheBand(x, y, w, h, (options.amplitude ?? 8) * 2 + 3, options);
