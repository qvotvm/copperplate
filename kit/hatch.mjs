import { bounds, inside, edgeDistance, polyline, clamp, f } from './geometry.mjs';

// Tone is engraved four ways at once: spacing, line width, crossing families and dropout.
// Every helper returns [{ d, weight }] so a plate can give each run its own stroke width.
export const WIDTHS = [0.6, 0.8, 1.05, 1.35, 1.7];
export function hash(i, j, k = 0) {
  let h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(k | 0, 2246822519)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const lights = { 'top-left': [-0.7, -0.7], top: [0, -1], left: [-1, 0], right: [1, 0], 'top-right': [0.7, -0.7], bottom: [0, 1], 'bottom-left': [-0.7, 0.7], none: [0, 0] };

// A shade field: darkness 0..1 at a point, or -1 where nothing should be cut.
export function shader(shape, { tone = 0.5, light = 'top-left', form = 0.5, edge = 0, edgeWidth = 9, shade, fade } = {}) {
  const b = bounds(shape.points);
  const dir = Array.isArray(light) ? light : lights[light] ?? lights['top-left'];
  const len = Math.hypot(dir[0], dir[1]) || 1, u = [dir[0] / len, dir[1] / len];
  const corners = [[b.x, b.y], [b.right, b.y], [b.x, b.bottom], [b.right, b.bottom]].map(p => p[0] * u[0] + p[1] * u[1]);
  const lo = Math.min(...corners), span = Math.max(...corners) - lo || 1;
  return (x, y) => {
    const toward = (x * u[0] + y * u[1] - lo) / span;
    let s = tone + (form && len > 0 ? form * (0.5 - toward) : 0);
    if (edge) { const d = edgeDistance([x, y], shape); if (d < edgeWidth) s += edge * (1 - d / edgeWidth) * (toward < 0.5 ? 1 : -0.4); }
    if (shade) s = shade(x, y, s);
    if (fade) {
      // Lines thin toward the oval edge and stop where they fall under the highlight threshold: a taper, not a dashed dropout.
      const e = ((x - fade.cx) / fade.rx) ** 2 + ((y - fade.cy) / fade.ry) ** 2, soft = fade.soft ?? 0.4;
      if (e > 1) return -1;
      if (e > 1 - soft) s *= 1 - (e - (1 - soft)) / soft;
    }
    return clamp(s, 0, 1);
  };
}
export const quantize = (s, swell) => Number((swell[0] + (swell[1] - swell[0]) * Math.min(4, Math.floor(s * 5)) / 4).toFixed(2));

// Split a sampled polyline into runs of equal quantized width; drop highlight runs.
function runs(points, sh, { swell = [0.6, 1.6], highlight = 0.12, threshold = -1, weight = 1, lift = 0 } = {}) {
  const out = []; let current = null;
  const flush = () => { if (current && current.points.length > 1 && Math.hypot(current.points.at(-1)[0] - current.points[0][0], current.points.at(-1)[1] - current.points[0][1]) >= 0.4) out.push({ d: polyline(current.points), weight: current.weight }); current = null; };
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], s = sh((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    const keep = s >= 0 && s >= highlight && s >= threshold;
    const w = keep ? Number((quantize(clamp(s - lift, 0, 1), swell) * weight).toFixed(2)) : -1;
    if (!keep || (current && current.weight !== w)) flush();
    if (keep) { if (!current) current = { weight: w, points: [a] }; current.points.push(b); }
  }
  flush(); return out;
}
const resample = (a, b, step) => { const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); return Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); };

// Scanline intersection with even-odd parity: concavities and holes are respected.
export function scan(shape, angle, levels, { minLength = 0.8 } = {}) {
  const theta = angle * Math.PI / 180, u = [Math.cos(theta), Math.sin(theta)], v = [-u[1], u[0]], result = [];
  for (const level of levels) {
    const crossings = [];
    for (const ring of shape.rings) for (let i = 1; i < ring.length; i++) {
      const a = ring[i - 1], b = ring[i], av = a[0] * v[0] + a[1] * v[1], bv = b[0] * v[0] + b[1] * v[1];
      if ((av <= level && bv > level) || (bv <= level && av > level)) {
        const t = (level - av) / (bv - av), p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        crossings.push(p[0] * u[0] + p[1] * u[1]);
      }
    }
    crossings.sort((a, b) => a - b);
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const a = crossings[i], b = crossings[i + 1];
      if (b - a >= minLength) result.push([[a * u[0] + level * v[0], a * u[1] + level * v[1]], [b * u[0] + level * v[0], b * u[1] + level * v[1]]]);
    }
  }
  return result;
}
export function projection(shape, angle) {
  const theta = angle * Math.PI / 180, v = [-Math.sin(theta), Math.cos(theta)], p = shape.points.map(q => q[0] * v[0] + q[1] * v[1]);
  return { low: Math.min(...p), high: Math.max(...p) };
}
export const uniformLevels = (shape, angle, gap) => { const { low, high } = projection(shape, angle), out = []; for (let l = Math.ceil((low + 1e-7) / gap) * gap; l < high - 1e-7; l += gap) out.push(l); return out; };
export const gapFor = tone => 6.2 - clamp(tone, 0, 1) * 4.2;

// One family of straight lines; width follows the shade field, highlights drop out.
export function parallel(shape, options = {}) {
  const { tone = 0.5, angle = -35, spacing, step = 3 } = options, gap = spacing ?? gapFor(tone);
  if (!(gap > 0)) throw new Error('Hatch spacing must be positive');
  const sh = options.shader ?? shader(shape, options), out = [];
  for (const [a, b] of scan(shape, angle, uniformLevels(shape, angle, gap))) out.push(...runs(resample(a, b, step), sh, options));
  return out;
}
// Two or three families: the second only where shade passes a threshold unless forced.
export function cross(shape, options = {}) {
  const { angle = -35, tone = 0.5, forced = false } = options, sh = options.shader ?? shader(shape, options);
  const first = parallel(shape, { ...options, shader: sh });
  const second = parallel(shape, { ...options, shader: sh, angle: angle + 72, spacing: (options.spacing ?? gapFor(tone)) * 1.15, threshold: forced ? -1 : 0.55, lift: 0.15 });
  const third = forced ? [] : parallel(shape, { ...options, shader: sh, angle: angle - 48, spacing: (options.spacing ?? gapFor(tone)) * 1.3, threshold: 0.85, lift: 0.3 });
  return [...first, ...second, ...third];
}
// Graduated ruling for sky, water and ground: pitch grows from the near edge to the far edge.
export function ruling(shape, options = {}) {
  const { angle = 0, near = 2.2, far = 7.5, from = 'bottom', step = 3, wave = 0 } = options;
  const { low, high } = projection(shape, angle), levels = [];
  for (let l = 0, gap = near; l < high - low; l += gap) { levels.push(from === 'bottom' ? high - l : low + l); gap = near + (far - near) * Math.min(1, l / (high - low)); }
  const sh = options.shader ?? shader(shape, { form: 0, ...options }), out = [];
  for (const [a, b] of scan(shape, angle, levels)) {
    const pts = resample(a, b, step);
    if (wave) for (const p of pts) p[1] += wave * Math.sin(p[0] / 23 + p[1] / 7);
    out.push(...runs(pts, sh, options));
  }
  return out;
}
// Contours of the interior distance field: lines that go around the form. Width swells with shade.
export function contour(shape, options = {}) {
  const { tone = 0.5, spacing, resolution = 2.5 } = options, gap = spacing ?? gapFor(tone), b = bounds(shape.points);
  if (!(gap > 0 && resolution > 0)) throw new Error('Contour spacing and resolution must be positive');
  const nx = Math.ceil((b.right - b.x) / resolution) + 1, ny = Math.ceil((b.bottom - b.y) / resolution) + 1, field = new Float64Array(nx * ny);
  let max = 0;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const p = [b.x + i * resolution, b.y + j * resolution], d = (inside(p, shape) ? 1 : -1) * edgeDistance(p, shape);
    field[j * nx + i] = d; max = Math.max(max, d);
  }
  const sh = options.shader ?? shader(shape, options), out = [], key = p => `${p[0].toFixed(4)},${p[1].toFixed(4)}`;
  for (let level = gap * 0.6; level < max; level += gap) {
    const segments = [];
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const corners = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], hits = [];
      for (let k = 0; k < 4; k++) {
        const a = corners[k], c = corners[(k + 1) % 4], va = field[a[1] * nx + a[0]], vc = field[c[1] * nx + c[0]];
        if ((va >= level) !== (vc >= level)) { const t = (level - va) / (vc - va); hits.push([b.x + (a[0] + t * (c[0] - a[0])) * resolution, b.y + (a[1] + t * (c[1] - a[1])) * resolution]); }
      }
      for (let k = 0; k + 1 < hits.length; k += 2) segments.push([hits[k], hits[k + 1]]);
    }
    const connections = new Map();
    segments.forEach((s, index) => s.forEach(p => { const k = key(p); if (!connections.has(k)) connections.set(k, []); connections.get(k).push(index); }));
    const used = new Set();
    for (let i = 0; i < segments.length; i++) {
      if (used.has(i)) continue;
      used.add(i); const chain = [...segments[i]];
      for (const end of [1, 0]) while (true) {
        const p = end ? chain.at(-1) : chain[0], next = connections.get(key(p))?.find(n => !used.has(n));
        if (next === undefined) break;
        used.add(next); const s = segments[next], q = key(s[0]) === key(p) ? s[1] : s[0];
        if (end) chain.push(q); else chain.unshift(q);
      }
      out.push(...runs(chain, sh, options));
    }
  }
  if (options.cross !== false) out.push(...parallel(shape, { ...options, shader: sh, angle: options.angle ?? -35, spacing: gap * 1.2, threshold: 0.62, lift: 0.2 }));
  return out;
}
// Deterministic jittered dots. Density and dot size both follow shade.
export function stipple(shape, options = {}) {
  const { spacing = 2.6, size = [0.6, 1.5] } = options, b = bounds(shape.points), sh = options.shader ?? shader(shape, options), out = [];
  for (let j = 0, y = b.y; y <= b.bottom; j++, y += spacing) for (let i = 0, x = b.x; x <= b.right; i++, x += spacing) {
    const px = x + (hash(i, j, 1) - 0.5) * spacing * 0.9, py = y + (hash(i, j, 2) - 0.5) * spacing * 0.9;
    if (!inside([px, py], shape)) continue;
    const s = sh(px, py); if (s < 0 || hash(i, j, 3) > s * 1.15) continue;
    out.push({ d: `M${f(px)},${f(py)}l0.2,0`, weight: Number((size[0] + (size[1] - size[0]) * s).toFixed(2)) });
  }
  return out;
}
// Fixed dense families for reversed panels and dark grounds.
export function tint(shape, { gap = 1.7, weight = 0.7, angles = [90, 0, 45] } = {}) {
  const out = [];
  for (const angle of angles) for (const [a, b] of scan(shape, angle, uniformLevels(shape, angle, gap))) out.push({ d: polyline([a, b]), weight });
  return out;
}
export function hatch(shape, { mode = 'parallel', ...options } = {}) {
  const fn = { parallel, cross, contour, stipple, ruling, tint }[mode];
  if (!fn) throw new Error(`Unknown hatch mode: ${mode}`);
  return fn(shape, options);
}
