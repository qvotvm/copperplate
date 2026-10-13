// All geometry is in certificate units. Curves are flattened for hatch intersections.
export const f = n => Number(n.toFixed(3));
export const point = ([x, y]) => `${f(x)},${f(y)}`;
export const polyline = p => `M${p.map(point).join('L')}`;
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const bounds = points => ({ x: Math.min(...points.map(p => p[0])), y: Math.min(...points.map(p => p[1])), right: Math.max(...points.map(p => p[0])), bottom: Math.max(...points.map(p => p[1])) });
export function lengthOf(points) { return points.slice(1).reduce((s, p, i) => s + distance(p, points[i]), 0); }

export class Shape {
  constructor() { this.d = ''; this.rings = []; this.current = null; }
  move(x, y) { this.d += `M${f(x)},${f(y)}`; this.current = [[x, y]]; this.rings.push(this.current); return this; }
  line(x, y) { this.d += `L${f(x)},${f(y)}`; this.current.push([x, y]); return this; }
  cubic(a, b, c, d, x, y) {
    const start = this.current.at(-1);
    this.d += `C${f(a)},${f(b)} ${f(c)},${f(d)} ${f(x)},${f(y)}`;
    const steps = Math.max(12, Math.ceil((distance(start, [a, b]) + distance([a, b], [c, d]) + distance([c, d], [x, y])) / 2));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps, u = 1 - t;
      this.current.push([u ** 3 * start[0] + 3 * u * u * t * a + 3 * u * t * t * c + t ** 3 * x, u ** 3 * start[1] + 3 * u * u * t * b + 3 * u * t * t * d + t ** 3 * y]);
    }
    return this;
  }
  quadratic(a, b, x, y) {
    const [sx, sy] = this.current.at(-1);
    return this.cubic(sx + (a - sx) * 2 / 3, sy + (b - sy) * 2 / 3, x + (a - x) * 2 / 3, y + (b - y) * 2 / 3, x, y);
  }
  close() { this.d += 'Z'; if (distance(this.current[0], this.current.at(-1)) > 1e-8) this.current.push([...this.current[0]]); return this; }
  get points() { return this.rings.flat(); }
}
export function polygon(points) { const s = new Shape().move(...points[0]); points.slice(1).forEach(p => s.line(...p)); return s.close(); }
export function rect(x, y, w, h) { return polygon([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]); }
export function ellipse(cx, cy, rx, ry = rx) {
  const k = 0.5522847498;
  return new Shape().move(cx + rx, cy).cubic(cx + rx, cy + k * ry, cx + k * rx, cy + ry, cx, cy + ry).cubic(cx - k * rx, cy + ry, cx - rx, cy + k * ry, cx - rx, cy).cubic(cx - rx, cy - k * ry, cx - k * rx, cy - ry, cx, cy - ry).cubic(cx + k * rx, cy - ry, cx + rx, cy - k * ry, cx + rx, cy).close();
}
export function inside(p, shape) {
  let yes = false;
  for (const ring of shape.rings) for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) yes = !yes;
  }
  return yes;
}
export function edgeDistance(p, shape) {
  let nearest = Infinity;
  for (const ring of shape.rings) for (let i = 1; i < ring.length; i++) {
    const a = ring[i - 1], b = ring[i], dx = b[0] - a[0], dy = b[1] - a[1];
    const t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    nearest = Math.min(nearest, distance(p, [a[0] + t * dx, a[1] + t * dy]));
  }
  return nearest;
}
