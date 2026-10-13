import { Shape, rect, f } from './geometry.mjs';
import { tint } from './hatch.mjs';

// Number to words for the share count, 0..999999.
const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
export function words(n) {
  n = Math.floor(Math.abs(Number(n))); if (!Number.isFinite(n)) throw new Error('Share count must be a number');
  if (n === 0) return 'zero';
  const below = k => k < 20 ? ones[k] : tens[Math.floor(k / 10)] + (k % 10 ? ' ' + ones[k % 10] : '');
  const hundreds = k => (k >= 100 ? ones[Math.floor(k / 100)] + ' hundred' + (k % 100 ? ' ' : '') : '') + (k % 100 ? below(k % 100) : '');
  return (n >= 1000 ? hundreds(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' : '') : '') + (n % 1000 ? hundreds(n % 1000) : '');
}

// Letter-spaced roman capitals, the certifying voice.
export function caps(plate, text, x, y, { size = 14, tracking = 2, ...options } = {}) {
  return plate.text(String(text).toUpperCase(), x, y, { size, tracking, ...options });
}
// Engraved copperplate script for the legal phrases.
export function script(plate, text, x, y, { size = 36, ...options } = {}) {
  return plate.text(text, x, y, { size, font: 'script', ...options });
}
// The title: fat-face capitals, solid ink, a hard drop shadow, a paper halo and hairline inlines.
// It must read as the darkest element on the sheet.
export function title(plate, text, x, y, { size = 84, tracking = 2, width, shadow = 0.055, category = 'lettering', ink } = {}) {
  const t = String(text).toUpperCase(), s = Number((size * shadow).toFixed(2));
  const base = { size, font: 'display', tracking, textLength: width, category, ink };
  plate.text(t, x + s, y + s, { ...base, fill: 'ink', label: false, role: 'shadow' });
  plate.text(t, x, y, { ...base, fill: 'none', stroke: 'paper', strokeWidth: Number((size * 0.04).toFixed(2)), label: false });
  plate.text(t, x, y, { ...base, fill: 'ink' });
  const clip = plate.clipText({ text: t, x, y, ...base });
  const pitch = Math.max(2.6, size / 26);
  for (let row = y - size * 0.76; row < y + size * 0.04; row += pitch) plate.line(x - plate.width / 2, row, x + plate.width / 2, row, { weight: 0.6, stroke: 'paper', clip, category, ink });
  return plate;
}
// Dark engine-turned ground with paper letters knocked out of it.
export function panel(plate, x, y, w, h, { category = 'panel', gap = 1.7, angles = [90, 0, 45], ink, corner = 0 } = {}) {
  const s = corner ? new Shape().move(x + corner, y).line(x + w - corner, y).quadratic(x + w, y, x + w, y + corner).line(x + w, y + h - corner).quadratic(x + w, y + h, x + w - corner, y + h).line(x + corner, y + h).quadratic(x, y + h, x, y + h - corner).line(x, y + corner).quadratic(x, y, x + corner, y).close() : rect(x, y, w, h);
  plate.shape(s, { tone: 0, outline: 1.3, category, ink });
  plate.paths(tint(s, { gap, angles }), { category, clip: `shape-${plate.shapes.length - 1}`, ink });
  plate.path(s.d, { weight: 0.7, category, ink, translate: [1.6, 1.6] });
  return s;
}
export function reversed(plate, text, x, y, { size = 20, font = 'serif', bold = true, tracking = 2, category = 'panel', ink, textLength, label = true } = {}) {
  const base = { size, font, bold, tracking, category, ink, textLength };
  plate.text(text, x + size * 0.07, y + size * 0.07, { ...base, fill: 'ink', label: false, role: 'shadow' });
  plate.text(text, x, y, { ...base, fill: 'paper', stroke: 'paper', strokeWidth: Number((size * 0.035).toFixed(2)), label });
  return plate;
}
// Repeating microtext along a path. Length is the path length in units.
export function microtext(plate, text, d, length, { size = 5, tracking = 0.6, category = 'ornament', separator = ' • ', ink, fill = 'ink' } = {}) {
  const id = plate.def(d), unit = (String(text).length + separator.length) * (size * 0.6 + tracking);
  const count = Math.max(1, Math.floor(length / unit));
  plate.text(Array.from({ length: count }, () => text).join(separator), 0, 0, { size, tracking, path: id, anchor: 'start', label: false, category, ink, fill });
  return id;
}
export function ribbon(plate, text, x, y, w = 330, { category = 'ornament' } = {}) {
  const left = x - w / 2, right = x + w / 2;
  plate.shape(new Shape().move(left, y - 19).quadratic(x, y - 35, right, y - 19).line(right, y + 15).quadratic(x, y, left, y + 15).close(), { tone: 0, category });
  plate.path(`M${left},${y - 14} L${left - 28},${y - 8} L${left - 18},${y + 9} L${left - 30},${y + 29} L${left},${y + 15} M${right},${y - 14} L${right + 28},${y - 8} L${right + 18},${y + 9} L${right + 30},${y + 29} L${right},${y + 15}`, { weight: 1.2, category });
  caps(plate, text, x, y + 1, { size: 18, tracking: 2, bold: true });
}
// Two fictional hands. Engraved signatures swell on the down strokes, so each is three weights.
export function signature(plate, x, y, variant = 0) {
  const paths = variant % 2 ? [
    ['M0,0 C24,-64 26,30 4,12 C-9,1 15,-9 43,-8', 1.7], ['M43,-8 C21,6 28,9 40,1 C50,-17 53,-6 49,1 C62,-15 65,-8 63,0 C77,-17 78,-5 72,2 C88,-11 95,-10 101,-5', 1.2],
    ['M93,2 C109,-19 116,-20 106,1 C121,-10 126,-10 124,0 C139,-16 144,-10 137,3 C153,-7 164,-8 181,-14', 1.2], ['M-5,17 Q90,-3 192,5', 0.8]
  ] : [
    ['M0,4 C28,-66 44,-33 15,-3 C-3,19 29,19 43,-16', 1.7], ['M43,-16 C24,-4 27,10 39,5 C51,-17 57,-10 51,2 C68,-17 73,-8 66,4 C83,-15 88,-7 81,3 C104,-5 107,-9 114,-11', 1.2],
    ['M105,4 C139,-58 149,-25 120,-2 C109,15 131,7 144,-6', 1.6], ['M144,-6 C150,-16 157,-8 149,1 C163,-15 172,-7 164,4 C183,-5 189,-9 195,-12', 1.1], ['M3,19 Q108,-2 207,10', 0.8]
  ];
  paths.forEach(([d, weight]) => plate.path(d, { weight, category: 'signature', translate: [x, y] }));
}
export const engravedCaps = (plate, text, x, y, options = {}) => title(plate, text, x, y, options);
export { f };
