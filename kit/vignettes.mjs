import { Plate } from './plate.mjs';
import { Shape, polygon, rect, ellipse } from './geometry.mjs';

// The vignette space is 720 x 320. Sky and ground are ruled and fade into the paper along an oval,
// the way bank note vignettes do; the subject sits on top with its own knockouts.
export const W = 720;
export const H = 320;
export const oval = { cx: 360, cy: 160, rx: 352, ry: 168, soft: 0.42 };
const deg = d => d * Math.PI / 180;

export function sky(p, { horizon = 236, tone = 0.3, near = 2.6, far = 9, night = false } = {}) {
  p.shape(rect(0, 0, W, horizon), { mode: 'ruling', from: 'bottom', near: night ? 3 : near + 0.6, far: night ? 8 : far + 3, tone: night ? 0.5 : tone, light: 'bottom', form: night ? 0.5 : 0.2, swell: [0.6, 1.0], highlight: 0.1, fade: oval, outline: false, cross: false });
}
export function ground(p, { horizon = 236, tone = 0.5, near = 2.3, far = 4.5 } = {}) {
  p.shape(rect(0, horizon, W, H - horizon), { mode: 'ruling', from: 'bottom', near: near + 0.8, far: far + 1.5, tone, light: 'top', form: 0.5, swell: [0.6, 1.4], highlight: 0.1, fade: oval, outline: false, wave: 0.4 });
  p.shape(rect(0, horizon + 14, W, H - horizon - 14), { tone: 0.42, angle: -24, spacing: 8, light: 'top', form: 0.55, threshold: 0.45, swell: [0.6, 1.1], fade: oval, outline: false, cross: false });
}
export function hills(p, d = 'M-10,236 Q90,190 210,226 Q300,196 380,230 Q470,186 560,224 Q640,196 730,236 L730,246 L-10,246 Z', tone = 0.28) {
  p.shape(new Shape().move(-10, 236).quadratic(90, 190, 210, 226).quadratic(300, 196, 380, 230).quadratic(470, 186, 560, 224).quadratic(640, 196, 730, 236).line(730, 246).line(-10, 246).close(), { tone, angle: 8, light: 'top', form: 0.6, swell: [0.6, 1.0], fade: oval, outline: 0.8, cross: false });
}
export function moon(p, cx = 600, cy = 56, r = 24) {
  p.shape(ellipse(cx, cy, r), { mode: 'contour', tone: 0.18, light: 'top-right', form: 0.5, edge: 0.3, edgeWidth: 10, highlight: 0.18, spacing: 2.6, outline: 0.9, cross: false });
  // crater marks
  p.oval(cx - 6, cy + 4, 3.5, 3).oval(cx + 7, cy - 7, 2.4, 2.4).oval(cx + 3, cy + 10, 2, 1.6);
}
export function stars(p, points) {
  for (const [x, y, r = 2.4] of points) p.line(x - r, y, x + r, y, { weight: 0.7 }).line(x, y - r, x, y + r, { weight: 0.7 });
}
export function water(p, { horizon = 196 } = {}) {
  p.shape(rect(0, horizon, W, H - horizon), { mode: 'ruling', from: 'bottom', near: 3, far: 6, tone: 0.5, light: 'top', form: 0.35, swell: [0.6, 1.3], highlight: 0.1, fade: oval, outline: false, wave: 1.6, cross: false });
}
const wheel = (p, x, y, r, spokes = 12, { tone = 0.55 } = {}) => {
  p.shape(ellipse(x, y, r), { mode: 'contour', tone, light: 'top-left', form: 0.7, edge: 0.35, edgeWidth: r * 0.3, spacing: 2.4, highlight: 0.1, outline: 1.3 });
  p.shape(ellipse(x, y, r - 4.5), { tone: 0, outline: 0.9 });
  for (let a = 0; a < spokes; a++) { const t = a / spokes * 2 * Math.PI; p.line(x + Math.cos(t) * 5, y + Math.sin(t) * 5, x + Math.cos(t) * (r - 6), y + Math.sin(t) * (r - 6), { weight: a % 2 ? 0.8 : 1.4 }); }
  p.shape(ellipse(x, y, 5), { mode: 'contour', tone: 0.6, spacing: 1.6, outline: 1.2 });
};
const rivets = (p, x1, y1, x2, y2, n) => { for (let i = 0; i <= n; i++) p.oval(x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n, 1.4, 1.4, { weight: 0.7 }); };

// A 4-4-0 at night, facing right. Tender, cab, boiler, domes, stack, pilot and headlamp.
export function locomotive(p) {
  sky(p, { horizon: 232, night: true, near: 2.2, far: 7 });
  stars(p, [[88, 48], [150, 92], [236, 36], [312, 70], [430, 30], [470, 96], [658, 110], [530, 58, 1.8], [200, 120, 1.6]]);
  moon(p, 618, 62, 26);
  hills(p);
  ground(p, { horizon: 236, tone: 0.5 });
  // Track: two rails on sleepers, the near rail heavier.
  for (let i = 0; i < 29; i++) p.shape(polygon([[30 + i * 23, 266], [48 + i * 23, 266], [54 + i * 23, 276], [36 + i * 23, 276]]), { tone: 0.55, angle: 0, spacing: 2.2, outline: 0.7, cross: false });
  p.line(10, 262, 712, 262, { weight: 1.2 }).line(10, 265, 712, 265, { weight: 2 });
  p.line(10, 280, 712, 280, { weight: 2.4 }).line(10, 284, 712, 284, { weight: 1 });
  // Tender
  p.shape(polygon([[54, 176], [196, 176], [196, 246], [54, 246]]), { tone: 0.55, angle: -8, light: 'top', form: 0.55, edge: 0.3, edgeWidth: 12, outline: 1.3 });
  p.shape(polygon([[58, 150], [192, 150], [192, 176], [58, 176]]), { mode: 'cross', tone: 0.72, angle: -30, outline: 1.1 });
  p.shape(polygon([[64, 150], [186, 150], [176, 134], [74, 134]]), { tone: 0.4, angle: 0, spacing: 3, outline: 1 });
  for (let x = 74; x < 180; x += 7) p.line(x, 134, x + 2, 150, { weight: 0.7 });
  rivets(p, 60, 180, 190, 180, 14); rivets(p, 60, 242, 190, 242, 14);
  p.rectangle(96, 194, 58, 20, { weight: 1 });
  for (const x of [84, 120, 164]) wheel(p, x, 256, 16, 8, { tone: 0.5 });
  p.shape(polygon([[196, 232], [214, 232], [214, 244], [196, 244]]), { tone: 0.8, mode: 'cross', outline: 1 });
  // Cab
  p.shape(polygon([[214, 108], [318, 108], [318, 246], [214, 246]]), { tone: 0.5, angle: 90, spacing: 3.4, light: 'left', form: 0.5, edge: 0.25, edgeWidth: 10, outline: 1.4 });
  p.shape(polygon([[206, 108], [326, 108], [330, 100], [202, 100]]), { tone: 0.78, mode: 'cross', outline: 1.2 });
  p.path('M202,100 Q266,88 330,100', { weight: 1.6 });
  p.shape(polygon([[226, 120], [262, 120], [262, 166], [226, 166]]), { mode: 'cross', tone: 0.95, angle: -40, forced: true, outline: 1.2 });
  p.shape(polygon([[274, 120], [306, 120], [306, 166], [274, 166]]), { mode: 'cross', tone: 0.9, angle: -40, forced: true, outline: 1.2 });
  p.line(244, 120, 244, 166, { weight: 1 }).line(290, 120, 290, 166, { weight: 1 });
  p.line(214, 182, 318, 182, { weight: 1 }); rivets(p, 220, 190, 312, 190, 11);
  // Running board, frame and cylinder
  p.shape(polygon([[318, 196], [596, 196], [596, 214], [318, 214]]), { tone: 0.6, angle: -12, light: 'top', form: 0.6, outline: 1.3 });
  p.shape(polygon([[318, 214], [600, 214], [600, 236], [318, 236]]), { mode: 'cross', tone: 0.75, angle: -30, outline: 1.2 });
  p.shape(new Shape().move(536, 212).line(536, 250).quadratic(560, 254, 586, 250).line(586, 212).close(), { mode: 'contour', tone: 0.5, light: 'top-left', form: 0.6, edge: 0.3, spacing: 2.6, outline: 1.3 });
  p.line(540, 222, 582, 222, { weight: 1 }).line(540, 240, 582, 240, { weight: 1 });
  // Boiler: a long cylinder, lit from the top left, dark underneath.
  const boiler = new Shape().move(318, 112).line(560, 112).cubic(586, 112, 592, 150, 592, 154).line(592, 196).line(318, 196).close();
  p.shape(boiler, { mode: 'ruling', from: 'top', near: 2.1, far: 4.6, angle: 0, tone: 0.45, light: 'top', form: 0.95, edge: 0.3, edgeWidth: 14, highlight: 0.16, swell: [0.6, 1.5], outline: 1.5 });
  for (const x of [380, 448, 516]) { p.line(x, 112, x, 196, { weight: 1.1 }); rivets(p, x - 6, 118, x - 6, 190, 8); }
  rivets(p, 326, 118, 560, 118, 26);
  // Smokebox front and door
  p.shape(new Shape().move(572, 112).cubic(600, 112, 604, 150, 604, 154).line(604, 198).line(588, 198).line(588, 154).cubic(588, 140, 582, 120, 572, 112).close(), { mode: 'contour', tone: 0.62, light: 'top-left', form: 0.5, edge: 0.3, spacing: 2.3, outline: 1.4 });
  p.oval(596, 160, 9, 11, { weight: 1.3 }).oval(596, 160, 3, 3, { weight: 1 });
  // Steam dome, sand dome, bell, safety valve
  p.shape(new Shape().move(392, 112).line(392, 92).cubic(392, 68, 436, 68, 436, 92).line(436, 112).close(), { mode: 'contour', tone: 0.5, light: 'top-left', form: 0.7, edge: 0.35, spacing: 2.4, highlight: 0.12, outline: 1.3 });
  p.shape(new Shape().move(474, 112).line(474, 96).cubic(474, 80, 506, 80, 506, 96).line(506, 112).close(), { mode: 'contour', tone: 0.5, light: 'top-left', form: 0.7, edge: 0.35, spacing: 2.3, highlight: 0.12, outline: 1.2 });
  p.path('M350,112 L350,84 M344,84 L356,84', { weight: 1.2 });
  p.shape(new Shape().move(342, 84).cubic(338, 70, 362, 70, 358, 84).close(), { mode: 'contour', tone: 0.5, spacing: 1.8, outline: 1.1 });
  p.path('M414,70 L414,60 L420,60', { weight: 1 });
  // Stack with flare, and smoke drifting back over the tender.
  p.shape(polygon([[536, 112], [562, 112], [566, 62], [532, 62]]), { tone: 0.55, angle: 90, spacing: 2.8, light: 'left', form: 0.6, edge: 0.3, outline: 1.3 });
  p.shape(new Shape().move(522, 62).line(576, 62).cubic(580, 50, 576, 40, 570, 36).line(528, 36).cubic(522, 40, 518, 50, 522, 62).close(), { mode: 'contour', tone: 0.55, light: 'top-left', form: 0.6, spacing: 2.2, outline: 1.3 });
  p.shape(new Shape().move(532, 36).cubic(520, 10, 470, 2, 440, 22).cubic(410, 38, 350, 20, 300, 34).cubic(250, 48, 200, 30, 160, 40).cubic(190, 18, 250, 6, 320, 10).cubic(390, 14, 420, -6, 470, -2).cubic(520, 2, 560, 14, 566, 36).close(), { mode: 'stipple', tone: 0.3, light: 'top', form: 0.7, spacing: 3, size: [0.6, 1.3], outline: false });
  p.path('M566,36 C560,14 520,2 470,-2 M160,40 C200,30 250,48 300,34', { weight: 0.7 });
  // Headlamp on the smokebox, pilot, pilot truck
  p.shape(polygon([[590, 92], [618, 92], [618, 114], [590, 114]]), { mode: 'cross', tone: 0.6, angle: -30, outline: 1.2 });
  p.shape(ellipse(604, 103, 8, 8), { tone: 0, outline: 1.3 }); p.oval(604, 103, 3.5, 3.5, { weight: 1 });
  p.path('M596,92 L612,92 L604,84 Z', { weight: 1 });
  p.shape(polygon([[600, 236], [604, 226], [668, 258], [672, 274], [630, 274]]), { mode: 'cross', tone: 0.62, angle: -55, outline: 1.3 });
  for (let i = 0; i < 7; i++) p.line(608 + i * 8, 230 + i * 4, 622 + i * 7, 274, { weight: 1.1 });
  // Wheels: two drivers, two pilot wheels, connecting rods over the hubs.
  wheel(p, 380, 240, 38, 14, { tone: 0.58 }); wheel(p, 476, 240, 38, 14, { tone: 0.58 });
  wheel(p, 560, 258, 17, 8, { tone: 0.5 }); wheel(p, 604, 258, 17, 8, { tone: 0.5 });
  p.shape(polygon([[372, 234], [484, 234], [484, 246], [372, 246]]), { tone: 0.5, angle: 0, spacing: 2.2, outline: 1.4 });
  p.shape(polygon([[476, 238], [548, 228], [548, 236], [476, 246]]), { tone: 0.5, angle: 0, spacing: 2.2, outline: 1.3 });
  p.oval(380, 240, 4, 4, { weight: 1.5 }).oval(476, 240, 4, 4, { weight: 1.5 });
  // Ground shadow under the engine and tender
  p.shape(polygon([[50, 286], [700, 286], [690, 300], [60, 300]]), { tone: 0.6, angle: 0, spacing: 2.4, light: 'top', form: 0.9, highlight: 0.2, fade: oval, outline: false, cross: false });
}

// An eagle with raised wings on a rocky crag, a branch in its talons, head turned left.
// Each wing is one silhouette with a scalloped trailing edge; feathers are shafts and shade, not separate shapes.
const scalloped = (shape, points, depth) => { for (let i = 1; i < points.length; i++) { const a = points[i - 1], b = points[i], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1; shape.quadratic(mx - dy / len * depth, my + dx / len * depth, b[0], b[1]); } return shape; };
export function eagle(p) {
  sky(p, { horizon: 250, tone: 0.28, near: 2.6, far: 10 });
  hills(p, undefined, 0.26);
  ground(p, { horizon: 246, tone: 0.45 });
  p.shape(polygon([[236, 300], [262, 246], [312, 230], [372, 236], [424, 226], [478, 250], [506, 300]]), { mode: 'cross', tone: 0.6, angle: -20, light: 'top-left', form: 0.8, edge: 0.3, highlight: 0.15, outline: 1.3 });
  p.path('M280,252 L326,258 L350,246 M398,240 L442,258 L470,264 M300,276 L340,270 M420,276 L460,270', { weight: 1 });
  // Tail fan
  const tail = scalloped(new Shape().move(338, 190), [[322, 232], [336, 246], [352, 252], [368, 252], [384, 246], [398, 232], [382, 190]], -5).close();
  p.shape(tail, { tone: 0.55, angle: 80, light: 'top', form: 0.5, edge: 0.3, spacing: 2.3, outline: 1.1, cross: false });
  for (let i = 0; i < 6; i++) p.path(`M360,196 L${326 + i * 13.6},${236 + (i === 0 || i === 5 ? 0 : 8)}`, { weight: 0.9 });
  for (const side of [-1, 1]) {
    const X = x => 360 + side * x;
    // Wing silhouette: leading edge up to the tip, primaries scalloped back to the body.
    const tips = [[214, 34], [222, 62], [218, 92], [206, 120], [188, 144], [164, 164], [136, 178], [104, 186], [72, 186], [44, 178]];
    const wing = new Shape().move(X(20), 118).cubic(X(44), 86, X(110), 44, X(214), 34);
    scalloped(wing, tips.map(([x, y]) => [X(x), y]), -side * 7).close();
    p.shape(wing, { tone: 0.5, angle: side * -38, light: 'top', form: 0.55, edge: 0.4, edgeWidth: 10, highlight: 0.12, spacing: 2.5, swell: [0.6, 1.35], outline: 1.2, cross: 'auto', shade: (x, y, s) => s + 0.22 * Math.max(0, 1 - Math.abs(x - X(90)) / 150) * Math.max(0, (y - 60) / 120) });
    // Shafts from the wrist to every primary tip, and separations between secondaries.
    const wrist = [X(112), 60];
    for (const [x, y] of tips) p.path(`M${wrist[0]},${wrist[1]} Q${(wrist[0] + X(x)) / 2 + side * 6},${(wrist[1] + y) / 2 + 10} ${X(x)},${y}`, { weight: 1.1 });
    for (let i = 0; i < 6; i++) p.path(`M${X(36 + i * 14)},${106 - i * 8} Q${X(52 + i * 16)},${150 - i * 4} ${X(44 + i * 20)},${182 - i * 2}`, { weight: 0.8 });
    // Coverts: darker band along the arm with scallop rows.
    const arm = new Shape().move(X(22), 118).cubic(X(44), 86, X(110), 44, X(200), 40).cubic(X(150), 62, X(96), 92, X(56), 136).close();
    p.shape(arm, { mode: 'cross', tone: 0.62, angle: side * -30, light: 'top', form: 0.6, edge: 0.3, highlight: 0.1, outline: 1 });
    for (let row = 0; row < 4; row++) for (let i = 0; i < 7 - row; i++) {
      const cx = X(40 + i * 14 + row * 6), cy = 112 - i * 8 + row * 10;
      p.path(`M${cx - 5},${cy} q5,-8 10,0`, { weight: 0.9 });
    }
  }
  // Body and chest feathers
  p.shape(new Shape().move(328, 112).cubic(310, 150, 318, 204, 360, 214).cubic(402, 204, 410, 150, 392, 112).cubic(382, 98, 338, 98, 328, 112).close(), { mode: 'contour', tone: 0.6, light: 'top-left', form: 0.7, edge: 0.4, edgeWidth: 12, highlight: 0.12, spacing: 2.6, outline: 1.3 });
  for (let r = 0; r < 6; r++) for (let i = 0; i < 5; i++) p.path(`M${334 + i * 11 + (r % 2) * 5},${124 + r * 14} q5,-8 10,0`, { weight: 0.8 });
  // Legs, feathered thighs, talons on the branch
  p.shape(new Shape().move(336, 194).cubic(326, 210, 330, 226, 342, 236).line(354, 232).cubic(352, 220, 356, 208, 362, 200).close(), { mode: 'contour', tone: 0.45, spacing: 2.2, outline: 1 });
  p.shape(new Shape().move(384, 194).cubic(394, 210, 390, 226, 378, 236).line(366, 232).cubic(368, 220, 364, 208, 358, 200).close(), { mode: 'contour', tone: 0.5, spacing: 2.2, outline: 1 });
  p.path('M342,236 L334,250 L316,254 M334,250 L338,262 M378,236 L386,250 L404,254 M386,250 L382,262', { weight: 2.2 });
  p.path('M268,252 Q360,236 452,254 M276,256 Q360,244 442,258', { weight: 1.5 });
  for (const [x, y, s] of [[292, 250, -1], [322, 244, 1], [398, 244, -1], [428, 250, 1]]) p.shape(new Shape().move(x, y).cubic(x + 6 * s, y - 12, x + 22 * s, y - 10, x + 24 * s, y + 2).cubic(x + 12 * s, y + 6, x + 4 * s, y + 4, x, y).close(), { tone: 0.45, angle: 60 * s, spacing: 2.3, outline: 0.9 });
  // Head turned left: flat crown, brow ridge, a long hooked beak that drops below the gape.
  const head = new Shape().move(398, 104).cubic(400, 84, 386, 64, 362, 62).cubic(348, 60, 338, 66, 334, 76).line(326, 98).cubic(336, 112, 362, 120, 380, 120).cubic(392, 118, 398, 112, 398, 104).close();
  p.shape(head, { mode: 'stipple', tone: 0.22, light: 'top-left', form: 0.7, edge: 0.3, edgeWidth: 10, spacing: 2.1, size: [0.6, 1.2], outline: 1.2 });
  const beak = new Shape().move(334, 76).cubic(322, 68, 306, 72, 300, 82).cubic(294, 92, 296, 106, 300, 114).cubic(304, 106, 310, 100, 318, 100).line(326, 98).cubic(330, 90, 332, 82, 334, 76).close();
  p.shape(beak, { mode: 'contour', tone: 0.6, light: 'top-left', form: 0.6, edge: 0.4, edgeWidth: 6, highlight: 0.14, spacing: 1.8, outline: 1.3, cross: false });
  p.path('M326,98 L312,102 M312,80 q4,-2 8,2', { weight: 1.1 });
  p.oval(350, 84, 3.4, 3.4, { weight: 1.6 }); p.oval(349, 84, 1.4, 1.4, { weight: 1.3 });
  p.path('M336,76 Q350,68 368,78', { weight: 1.6 });
  p.path('M398,104 Q390,112 380,120', { weight: 1 });
}

// A riverside iron foundry: chimneys, sawtooth roofs, a brick wall, furnace door glowing dark.
export function factory(p) {
  sky(p, { horizon: 222, tone: 0.3, near: 2.6, far: 9 });
  hills(p, undefined, 0.24);
  water(p, { horizon: 262 });
  // Chimneys behind the roofline, smoke leaning left and staying inside the plate.
  for (const [x, y, h, w] of [[200, 58, 168, 20], [296, 44, 182, 24], [470, 68, 158, 20]]) {
    p.shape(polygon([[x, y], [x + w, y], [x + w + 8, y + h], [x - 8, y + h]]), { mode: 'contour', tone: 0.55, light: 'top-left', form: 0.8, edge: 0.3, spacing: 2.4, highlight: 0.1, outline: 1.2, cross: false });
    for (let i = 10; i < h; i += 9) p.line(x - 8 * i / h, y + i, x + w + 8 * i / h, y + i, { weight: 0.6 });
    p.shape(polygon([[x - 4, y - 8], [x + w + 4, y - 8], [x + w + 4, y], [x - 4, y]]), { tone: 0.65, angle: 0, spacing: 2, outline: 1.1 });
    p.shape(new Shape().move(x + 2, y - 8).cubic(x - 24, y - 26, x - 70, y - 20, x - 100, y - 34).cubic(x - 64, y - 44, x - 16, y - 50, x + w, y - 8).close(), { mode: 'stipple', tone: 0.3, light: 'top', form: 0.8, spacing: 3.2, size: [0.6, 1.2], outline: false });
  }
  // Sawtooth roof and main wall
  const roof = polygon([[96, 150], [176, 112], [176, 150], [256, 112], [256, 150], [336, 112], [336, 150], [416, 112], [416, 150], [496, 112], [496, 150], [576, 112], [576, 150], [640, 150], [640, 160], [96, 160]]);
  p.shape(roof, { tone: 0.5, angle: 90, light: 'top-left', form: 0.6, spacing: 3, outline: 1.3, cross: false });
  for (let i = 0; i < 6; i++) p.shape(polygon([[96 + i * 80, 150], [176 + i * 80, 112], [176 + i * 80, 150]]), { mode: 'cross', tone: 0.85, angle: 25, forced: true, outline: 1.1 });
  const wall = polygon([[96, 160], [640, 160], [640, 262], [96, 262]]);
  p.shape(wall, { tone: 0.42, angle: 0, spacing: 4.4, light: 'top-left', form: 0.5, edge: 0.25, edgeWidth: 14, outline: 1.3, cross: false });
  for (let y = 164; y < 260; y += 8) for (let x = 100 + (y % 16 ? 9 : 0); x < 636; x += 18) p.line(x, y, x, y + 7, { weight: 0.6 });
  p.line(96, 200, 640, 200, { weight: 1.2 }).line(96, 204, 640, 204, { weight: 0.7 });
  // Windows: arched, dense crosshatch, mullions
  for (let x = 116; x < 630; x += 64) {
    if (x > 330 && x < 400) continue;
    p.shape(new Shape().move(x, 250).line(x, 182).cubic(x, 166, x + 32, 166, x + 32, 182).line(x + 32, 250).close(), { mode: 'cross', tone: 0.92, angle: -40, forced: true, outline: 1.2 });
    p.line(x + 16, 174, x + 16, 250, { weight: 1 }).line(x, 196, x + 32, 196, { weight: 1 }).line(x, 222, x + 32, 222, { weight: 1 });
  }
  // Loading door and the furnace glow inside: lighter centre, black frame.
  p.shape(new Shape().move(334, 262).line(334, 190).cubic(334, 164, 404, 164, 404, 190).line(404, 262).close(), { mode: 'contour', tone: 0.85, light: 'none', form: 0, edge: 0.4, edgeWidth: 18, highlight: 0.08, spacing: 2.2, outline: 1.4, shade: (x, y, s) => Math.max(0, s - 0.8 * Math.max(0, 1 - Math.hypot(x - 369, y - 236) / 28)) });
  p.path('M369,176 L369,262', { weight: 1.1 });
  // Quay, bollards, river bank
  p.shape(polygon([[70, 262], [670, 262], [670, 272], [70, 272]]), { tone: 0.65, angle: 0, spacing: 2, outline: 1.2, fade: oval, cross: false });
  for (const x of [120, 300, 480, 620]) p.shape(polygon([[x, 252], [x + 8, 252], [x + 8, 264], [x, 264]]), { mode: 'cross', tone: 0.8, outline: 1 });
  // Reflection broken by the wave ruling: a dark stipple band under the building
  p.shape(polygon([[110, 274], [630, 274], [610, 300], [130, 300]]), { mode: 'stipple', tone: 0.35, light: 'bottom', form: 0.9, spacing: 3, fade: oval, outline: false });
}

// A full-rigged ship under sail, bow to the right, on long ruled swells.
export function ship(p) {
  sky(p, { horizon: 206, tone: 0.3, near: 2.5, far: 10 });
  water(p, { horizon: 206 });
  for (const [x, y] of [[120, 54], [540, 70], [600, 112]]) p.path(`M${x - 10},${y} q10,-9 20,0 q10,-9 20,0`, { weight: 0.9 });
  // Hull with sheer, planking and ports; stern at left.
  const hull = new Shape().move(110, 196).cubic(180, 206, 480, 212, 586, 194).cubic(574, 222, 540, 250, 500, 254).line(180, 258).cubic(150, 252, 122, 226, 110, 196).close();
  p.shape(hull, { mode: 'ruling', from: 'top', angle: 4, near: 2.6, far: 4.4, tone: 0.55, light: 'top', form: 0.8, edge: 0.3, edgeWidth: 12, highlight: 0.12, swell: [0.6, 1.5], outline: 1.5 });
  p.path('M126,214 Q350,236 574,210 M140,232 Q350,252 556,228', { weight: 1.1 });
  for (let x = 170; x < 540; x += 26) p.shape(rect(x, 218, 8, 7), { mode: 'cross', tone: 0.9, forced: true, outline: 0.9 });
  p.path('M586,194 L664,170', { weight: 2 }); p.path('M580,200 L650,180', { weight: 1 });
  // Bulwark rail and deck line
  p.path('M104,190 C180,200 480,206 592,188', { weight: 2.2 });
  // Masts, yards, sails: foremast right, mainmast centre, mizzen left.
  for (const [x, top, lean] of [[480, 24, 6], [360, 14, 5], [240, 40, 4]]) {
    const foot = 196 + (x - 350) * 0.03;
    p.shape(polygon([[x - 3, top], [x + 3 + lean, top], [x + 3 + lean * 0.2, foot], [x - 3, foot]]), { tone: 0.7, angle: 88, spacing: 2, outline: 1.2, cross: false });
    const tiers = x === 240 ? [[top + 16, 70, 44], [top + 72, 86, 50]] : [[top + 12, 60, 38], [top + 58, 84, 46], [top + 112, 104, 52]];
    for (const [y, w, h] of tiers) {
      p.line(x - w / 2 - 8, y, x + w / 2 + 8, y, { weight: 1.6 });
      const sail = new Shape().move(x - w / 2, y + 2).quadratic(x, y + 10, x + w / 2, y + 2).quadratic(x + w / 2 + 14, y + h / 2, x + w / 2 + 4, y + h).quadratic(x, y + h + 12, x - w / 2 - 4, y + h).quadratic(x - w / 2 - 14, y + h / 2, x - w / 2, y + 2).close();
      p.shape(sail, { mode: 'contour', tone: 0.3, light: 'top-left', form: 0.55, edge: 0.4, edgeWidth: 12, highlight: 0.16, spacing: 3, swell: [0.6, 1.1], outline: 1.1, cross: false });
      for (let k = 1; k < 4; k++) p.path(`M${x - w / 2 + k * w / 4},${y + 4} Q${x - w / 2 + k * w / 4 + 4},${y + h / 2} ${x - w / 2 + k * w / 4},${y + h}`, { weight: 0.6 });
    }
    p.path(`M${x},${top} q14,-8 28,0 q-12,10 -28,6`, { weight: 1 });
  }
  // Rigging: shrouds and stays to the rail, forestays to the bowsprit.
  for (const [x, top] of [[480, 24], [360, 14], [240, 40]]) for (let k = -2; k <= 2; k++) p.line(x, top + 20, x + k * 22, 192, { weight: 0.6 });
  p.path('M480,24 L664,170 M480,60 L640,176 M360,14 L480,30 M240,40 L360,22 M120,186 L240,56', { weight: 0.7 });
  // Bow wave and wake
  p.path('M600,236 q-20,-16 -40,-4 M160,254 q-30,10 -60,2', { weight: 1.3 });
  p.shape(polygon([[120, 262], [600, 262], [580, 290], [140, 290]]), { mode: 'stipple', tone: 0.3, light: 'bottom', form: 0.9, spacing: 3.2, fade: oval, outline: false });
}

// A portrait bust of an invented astronomer, three-quarter view, in stipple and line.
export function portrait(p) {
  // Oval background tint, darker behind the head, fading out.
  p.shape(ellipse(360, 160, 230, 150), { mode: 'ruling', from: 'top', angle: 0, near: 2.6, far: 5, tone: 0.42, light: 'none', form: 0, fade: { cx: 360, cy: 150, rx: 230, ry: 150, soft: 0.55 }, outline: false, cross: false, shade: (x, y, s) => s + 0.35 * Math.max(0, 1 - Math.hypot(x - 360, y - 120) / 150) - 0.5 * Math.max(0, 1 - Math.hypot(x - 352, y - 120) / 60) });
  // Shoulders and jacket
  p.shape(new Shape().move(176, 320).cubic(180, 250, 270, 226, 318, 214).line(318, 192).line(402, 192).line(402, 214).cubic(450, 226, 540, 250, 544, 320).close(), { mode: 'cross', tone: 0.66, angle: -35, light: 'top-left', form: 0.55, edge: 0.3, edgeWidth: 16, highlight: 0.1, outline: 1.3 });
  p.path('M318,214 C300,250 300,290 290,320 M402,214 C420,250 420,290 430,320', { weight: 1.2 });
  // Collar, shirt front, tie
  p.shape(polygon([[324, 214], [360, 246], [398, 214], [412, 232], [372, 274], [348, 274], [308, 232]]), { mode: 'stipple', tone: 0.14, light: 'top-left', spacing: 2.4, outline: 1 });
  p.shape(polygon([[352, 240], [368, 240], [374, 254], [366, 300], [354, 300], [346, 254]]), { mode: 'cross', tone: 0.8, angle: -40, outline: 1.1 });
  p.path('M336,214 L352,240 M384,214 L368,240', { weight: 1 });
  // Neck
  p.shape(polygon([[334, 160], [386, 160], [398, 214], [322, 214]]), { mode: 'contour', tone: 0.45, light: 'top-left', form: 0.7, edge: 0.3, spacing: 2.4, highlight: 0.1, outline: 1 });
  // Head: stipple for the skin, contour only at the shadow side.
  const head = new Shape().move(312, 126).cubic(306, 92, 318, 48, 356, 40).cubic(400, 32, 422, 70, 420, 110).cubic(418, 150, 404, 176, 380, 186).cubic(352, 196, 320, 170, 312, 126).close();
  p.shape(head, { mode: 'stipple', tone: 0.3, light: 'top-left', form: 0.75, edge: 0.3, edgeWidth: 18, spacing: 2.1, size: [0.6, 1.4], outline: 1.1 });
  p.shape(new Shape().move(400, 70).cubic(424, 90, 424, 150, 388, 184).cubic(406, 160, 414, 110, 400, 70).close(), { mode: 'contour', tone: 0.6, light: 'left', form: 0.3, spacing: 2.3, outline: false, cross: false });
  // Hair cap with locks, parted left
  p.shape(new Shape().move(306, 118).cubic(296, 66, 330, 28, 372, 26).cubic(416, 24, 436, 58, 428, 92).cubic(416, 78, 404, 68, 392, 62).cubic(372, 70, 350, 66, 332, 80).cubic(322, 92, 316, 104, 306, 118).close(), { mode: 'cross', tone: 0.68, angle: -60, light: 'top-left', form: 0.6, edge: 0.3, highlight: 0.1, outline: 1.2 });
  for (let i = 0; i < 16; i++) p.path(`M${316 + i * 7},${74 - Math.sin(i / 16 * Math.PI) * 28} q-6,-18 8,-20 q12,2 6,14`, { weight: 0.8 });
  // Features
  p.path('M330,106 q16,-10 32,0 M378,102 q14,-9 28,0', { weight: 1.3 });
  p.path('M334,118 q14,6 26,0 M380,116 q12,5 22,0', { weight: 1 });
  p.oval(347, 116, 2.6, 2.6, { weight: 1.5 }); p.oval(391, 114, 2.6, 2.6, { weight: 1.5 });
  p.path('M366,110 L362,146 Q372,156 384,146', { weight: 1.1 });
  p.path('M344,162 Q366,156 390,160 M352,168 Q368,176 384,166', { weight: 1.1 });
  p.path('M330,140 Q334,150 342,154 M404,134 Q400,146 392,154', { weight: 0.8 });
  // Ear
  p.path('M312,120 q-10,-8 -6,10 q4,10 10,6', { weight: 1 });
  // Small telescope and star in the lower corners as attributes
  p.path('M560,250 L620,214 M566,246 L612,220 M616,212 l6,-4 l6,10 l-6,4 Z', { weight: 1.4 });
  p.path('M110,230 l0,-24 M98,218 l24,0 M102,208 l16,20 M102,228 l16,-20', { weight: 0.9 });
}

// A rocket on its pad at dawn, service tower to the left, exhaust and steam.
export function rocket(p) {
  sky(p, { horizon: 250, tone: 0.42, near: 2.2, far: 6.5 });
  stars(p, [[120, 60], [200, 30], [600, 44], [660, 100], [500, 24, 1.8]]);
  hills(p, undefined, 0.3);
  ground(p, { horizon: 250, tone: 0.5 });
  // Pad and flame trench
  p.shape(polygon([[200, 250], [560, 250], [580, 268], [180, 268]]), { tone: 0.6, angle: 0, spacing: 2.4, light: 'top', form: 0.6, outline: 1.3, cross: false });
  p.shape(polygon([[330, 268], [450, 268], [470, 290], [310, 290]]), { mode: 'cross', tone: 0.85, angle: -30, forced: true, outline: 1.1 });
  // Service tower: lattice of braces, lit from the left
  p.shape(polygon([[236, 30], [292, 30], [292, 250], [236, 250]]), { tone: 0.3, angle: 90, spacing: 3.4, light: 'left', form: 0.6, outline: 1.3, cross: false });
  for (let y = 34; y < 246; y += 24) p.path(`M238,${y} L290,${y + 22} M290,${y} L238,${y + 22} M236,${y} L292,${y}`, { weight: 0.9 });
  p.line(228, 30, 300, 30, { weight: 1.6 });
  for (const y of [82, 134, 186]) { p.shape(polygon([[292, y], [364, y], [364, y + 6], [292, y + 6]]), { tone: 0.6, angle: 0, spacing: 2, outline: 1 }); p.line(292, y + 6, 330, y + 30, { weight: 0.8 }); }
  // Rocket: body, nose, fins, engines
  const body = new Shape().move(368, 232).line(368, 90).cubic(368, 62, 384, 36, 400, 18).cubic(416, 36, 432, 62, 432, 90).line(432, 232).close();
  p.shape(body, { mode: 'contour', tone: 0.45, light: 'left', form: 0.95, edge: 0.3, edgeWidth: 12, highlight: 0.14, spacing: 2.4, swell: [0.6, 1.5], outline: 1.4 });
  for (let y = 100; y < 230; y += 22) p.path(`M369,${y} Q400,${y + 5} 431,${y}`, { weight: 0.8 });
  p.shape(polygon([[368, 180], [340, 240], [368, 232]]), { tone: 0.55, angle: -70, light: 'left', form: 0.5, outline: 1.2 });
  p.shape(polygon([[432, 180], [460, 240], [432, 232]]), { mode: 'cross', tone: 0.7, angle: -70, light: 'left', form: 0.5, outline: 1.2 });
  p.shape(polygon([[394, 184], [406, 184], [410, 234], [390, 234]]), { mode: 'cross', tone: 0.75, angle: 60, outline: 1 });
  p.shape(polygon([[368, 232], [360, 250], [440, 250], [432, 232]]), { mode: 'cross', tone: 0.82, angle: -30, forced: true, outline: 1.2 });
  for (const x of [376, 400, 424]) p.shape(new Shape().move(x - 8, 250).line(x - 6, 240).line(x + 6, 240).line(x + 8, 250).close(), { mode: 'contour', tone: 0.7, spacing: 1.8, outline: 1.1 });
  p.oval(400, 76, 5, 6, { weight: 1.2 }); p.rectangle(394, 124, 12, 30, { weight: 1 });
  p.path('M400,18 L400,6 M396,10 L404,10', { weight: 1.2 });
  // Exhaust and steam clouds: stipple, lighter outward
  p.shape(new Shape().move(330, 252).cubic(300, 240, 250, 262, 240, 290).cubic(260, 316, 340, 320, 400, 310).cubic(460, 320, 540, 316, 560, 290).cubic(550, 262, 500, 240, 470, 252).cubic(450, 262, 350, 262, 330, 252).close(), { mode: 'stipple', tone: 0.26, light: 'top', form: 0.6, spacing: 3.2, size: [0.6, 1.3], outline: false, fade: oval, shade: (x, y, s) => s + 0.5 * Math.max(0, 1 - Math.hypot(x - 400, y - 262) / 70) });
  for (let i = 0; i < 9; i++) p.path(`M${382 + i * 4},252 Q${370 + i * 7},280 ${376 + i * 6},${300 + (i % 3) * 4}`, { weight: 0.8 });
}

// Three server cabinets in a vault, orbit rings behind: the memory archive.
export function server(p) {
  p.shape(ellipse(360, 150, 300, 130), { mode: 'ruling', from: 'top', near: 3, far: 6, tone: 0.36, light: 'none', form: 0, fade: { cx: 360, cy: 150, rx: 300, ry: 130, soft: 0.5 }, outline: false, cross: false });
  for (let i = 0; i < 5; i++) p.path(`M${90 + i * 14},${74 + i * 8} Q360,${-10 + i * 26} ${630 - i * 14},${74 + i * 8}`, { weight: 1 - i * 0.08 });
  p.shape(polygon([[20, 262], [700, 262], [720, 320], [0, 320]]), { tone: 0.55, angle: 0, spacing: 2.6, light: 'top', form: 0.7, fade: oval, outline: false, cross: false });
  for (const [x, y] of [[170, 96], [310, 74], [450, 96]]) {
    const w = 90, h = 262 - y;
    p.shape(polygon([[x, y], [x + w, y], [x + w + 26, y - 18], [x + 26, y - 18]]), { tone: 0.22, angle: 0, spacing: 3.6, light: 'top', form: 0.3, outline: 1.2, cross: false });
    p.shape(polygon([[x + w, y], [x + w + 26, y - 18], [x + w + 26, 262 - 18], [x + w, 262]]), { mode: 'cross', tone: 0.72, angle: -62, light: 'left', form: 0.4, edge: 0.3, outline: 1.2 });
    p.shape(rect(x, y, w, h), { tone: 0.38, angle: 90, spacing: 3.2, light: 'left', form: 0.5, edge: 0.2, edgeWidth: 10, outline: 1.3, cross: false });
    for (let row = y + 10; row < 252; row += 26) {
      p.shape(rect(x + 8, row, w - 16, 19), { tone: 0.5, angle: 0, spacing: 2.4, light: 'top', form: 0.6, outline: 0.9, cross: false });
      for (let j = 0; j < 7; j++) p.line(x + 14 + j * 6, row + 4, x + 14 + j * 6, row + 15, { weight: 0.7 });
      p.oval(x + 66, row + 9.5, 2.2, 2.2, { weight: 1 }).oval(x + 74, row + 9.5, 1.3, 1.3, { weight: 1 });
    }
    p.shape(rect(x + 4, 262, 14, 8), { mode: 'cross', tone: 0.8, outline: 1 }); p.shape(rect(x + w - 18, 262, 14, 8), { mode: 'cross', tone: 0.8, outline: 1 });
  }
  for (let i = 0; i < 7; i++) p.path(`M${212 + i * 3},270 C${190 + i * 7},${306 - i * 3} ${440 + i * 4},${292 - i * 2} ${486 + i * 3},270`, { weight: 1.1 - i * 0.06 });
  p.shape(polygon([[120, 272], [600, 272], [580, 300], [140, 300]]), { mode: 'stipple', tone: 0.35, light: 'bottom', form: 0.9, spacing: 3, fade: oval, outline: false });
}

export const subjects = { locomotive, eagle, factory, ship, portrait, rocket, server };
export function vignette(subject, options = {}) {
  const draw = subjects[subject];
  if (!draw) throw new Error(`Unknown subject '${subject}'. Write a draw(plate) function for a new subject.`);
  const p = new Plate(options); draw(p); return p;
}
