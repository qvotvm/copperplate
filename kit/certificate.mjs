import { Plate } from './plate.mjs';
import { rect, ellipse } from './geometry.mjs';
import { rosette, latheBand, scallop, band, spirograph } from './guilloche.mjs';
import { title, caps, script, panel, reversed, microtext, signature, words } from './type.mjs';
import { vignette } from './vignettes.mjs';

export const inks = { navy: '#132636', green: '#143225', brown: '#36241a', oxblood: '#471b20', black: '#14120f' };
export const papers = { cream: '#f3ecd8', white: '#f7f4ea', night: '#1b242c' };
const bullet = ' • ';

// One sheet, 1600 x 1000. Proportions follow the American Bank Note certificates in references/engraving-study.
export function certificate(spec, draw) {
  if (!spec.company || !spec.subject && !draw) throw new Error('Specify company and a subject or custom draw function');
  if (/\u2014/.test(JSON.stringify(spec))) throw new Error('Use commas, periods or colons instead of an em dash');
  const dark = spec.paper === 'night';
  const ink = dark ? '#ece0c6' : inks[spec.ink ?? 'navy'], paper = papers[spec.paper ?? 'cream'] ?? papers.cream;
  if (!ink) throw new Error('Ink must be navy, green, brown, oxblood or black');
  const ink2 = !dark && spec.ink2 ? inks[spec.ink2] : undefined;
  if (spec.ink2 && !dark && !ink2) throw new Error('Second ink must be navy, green, brown, oxblood or black');
  const p = new Plate({ ink, ink2, paper, grain: spec.grain ?? true, press: spec.press ?? false });
  p.title = `${spec.company}, fictional ${spec.year ?? 1926} stock certificate`;
  const year = spec.year ?? 1926, shares = spec.shares ?? 100, par = spec.par ?? "$100", serial = spec.serial ?? "004817", name = spec.company;
  const frame = { category: 'frame', ink: 2 }, ornament = { weight: 0.62, category: 'ornament', ink: 2 }, pan = { ink: 2 };

  // Four closed frames, a scalloped edge and the wide engine-turned band.
  for (const margin of [20, 26, 96, 101]) p.rectangle(margin, margin, 1600 - margin * 2, 1000 - margin * 2, { ...frame, weight: margin === 20 || margin === 101 ? 1.5 : 0.7, frame: true });
  p.paths(scallop(26, 26, 1548, 948, { cycles: 56, depth: 6, lines: 3, gap: 1.6 }), ornament);
  // Microtext security line between the two inner frames; later panels knock it out where they sit.
  microtext(p, `${name.toUpperCase()}${bullet}FICTIONAL SPECIMEN${bullet}NO FINANCIAL VALUE`, 'M98.5,100.2 L1501.5,100.2 L1501.5,901.5 L98.5,901.5 Z', 2 * (1403 + 801.3), { size: 4.6, tracking: 0.4, category: 'ornament', ink: 2 });
  p.paths(latheBand(31, 31, 1538, 938, 64, { cycles: 72, loops: 10 }), { category: 'ornament', ink: 2 });
  // Corner panels with the share count knocked out of a dark ground.
  for (const [x, y] of [[36, 36], [1436, 36], [36, 836], [1436, 836]]) {
    panel(p, x, y, 128, 128, { ...pan, corner: 10 });
    reversed(p, String(shares), x + 64, y + 76, { size: 60, font: 'display', bold: false, tracking: 1, ...pan });
    reversed(p, 'SHARES', x + 64, y + 108, { size: 13, tracking: 3, ...pan });
  }
  // Side medallions in the vertical band.
  for (const x of [63, 1537]) {
    p.paths(rosette(x, 500, { radius: 34, amplitude: 6, lobes: 16, loops: 10, amplitude2: 3, lobes2: 5 }), ornament);
    p.shape(ellipse(x, 500, 23, 23), { tone: 0, outline: 1.2, category: 'ornament', ink: 2 });
    p.paths(spirograph(x, 500, { outer: 22, inner: 7, pen: 6 }), ornament);
  }
  // Top centre class panel in the band.
  panel(p, 630, 40, 340, 46, { ...pan, corner: 8 });
  reversed(p, spec.classOf ?? 'COMMON STOCK', 800, 71, { size: 22, tracking: 4, ...pan });
  panel(p, 630, 914, 340, 46, { ...pan, corner: 8 });
  reversed(p, `SHARES ${par} EACH`, 800, 945, { size: 20, tracking: 3, ...pan });

  caps(p, spec.jurisdiction ?? `Incorporated under the laws of the Commonwealth of Imagination`, 800, 130, { size: 13, tracking: 2.6 });
  caps(p, `Fictional specimen${bullet}No financial value${bullet}Engraved in code`, 800, 149, { size: 8.5, tracking: 2.4 });

  // The title is the darkest element on the sheet. Abril capitals average 0.72 em per glyph.
  const lines = name.length > 28 ? splitTitle(name) : [name];
  const size = Math.min(lines.length > 1 ? 60 : 92, Math.floor(1180 / (Math.max(...lines.map(l => l.length)) * 0.74)));
  lines.forEach((line, i) => title(p, line, 800, (lines.length > 1 ? 212 : 242) + i * (size + 8), { size, tracking: size * 0.02 }));
  caps(p, spec.motto ?? 'Industry in the service of possibility', 800, lines.length > 1 ? 318 : 296, { size: 15, tracking: 3 });

  // Number and shares panels flank the vignette, as on the Pennsylvania Railroad sheet.
  caps(p, 'Number', 262, 418, { size: 12, tracking: 3 });
  panel(p, 182, 428, 160, 40, { ...pan, corner: 4 });
  reversed(p, serial, 262, 457, { size: 24, tracking: 3, ...pan });
  caps(p, 'Shares', 1338, 418, { size: 12, tracking: 3 });
  panel(p, 1258, 428, 160, 40, { ...pan, corner: 4 });
  reversed(p, String(shares), 1338, 459, { size: 30, font: 'display', bold: false, tracking: 2, ...pan });

  // Vignette: a 720 x 320 drawing space placed at (440, 316), fading into the paper without a frame.
  const v = draw ? new Plate({ ink, paper }) : vignette(spec.subject, { ink, paper }); if (draw) draw(v);
  const offset = p.items.length;
  for (const it of v.items) p.items.push({ ...it, clip: it.clip ? `vignette-${it.clip}` : undefined, translate: [440 + (it.translate?.[0] ?? 0), 316 + (it.translate?.[1] ?? 0)], category: 'vignette', ink: undefined });
  p.clips.push(...v.clips.map(c => ({ ...c, id: `vignette-${c.id}` }))); p.shapes.push(...v.shapes);
  if (p.items.length === offset) throw new Error('The vignette drew nothing');

  // Certifying lines: script, roman and a reversed panel for the share count in words.
  script(p, 'This Certifies that', 236, 664, { size: 48, anchor: 'start' });
  caps(p, spec.holder ?? 'The Bearer of Uncommon Ambition', 925, 661, { size: 27, tracking: 3, bold: true });
  p.line(560, 672, 1316, 672, { weight: 0.8, category: 'lettering' });
  script(p, 'is the owner of', 236, 718, { size: 40, anchor: 'start' });
  const count = `${words(shares)} shares`.toUpperCase(), panelWidth = Math.ceil(count.length * (25 * 0.62 + 3) + 44);
  panel(p, 800 - panelWidth / 2, 690, panelWidth, 40, { ...pan, corner: 3 });
  reversed(p, count, 800, 720, { size: 25, tracking: 3, ...pan });
  script(p, 'fully paid and non-assessable', 1364, 718, { size: 30, anchor: 'end' });
  p.text(`of the Capital Stock of ${name}, transferable only on the books of the Company by the holder hereof`, 800, 758, { size: 23 });
  p.text(`in person or by Attorney upon surrender of this Certificate properly endorsed. ${spec.ribbon ?? 'A charter for the improbable.'}`, 800, 790, { size: 23 });
  script(p, 'In Witness Whereof,', 236, 832, { size: 36, anchor: 'start' });
  p.text(`this Certificate is signed by its duly authorised officers this ${spec.date ?? 'seventeenth day of October'}, ${year}.`, 520, 828, { size: 22, anchor: 'start' });
  signature(p, 330, 868); signature(p, 1030, 868, 1);
  p.line(300, 886, 575, 886, { weight: 0.8, category: 'signature' }).line(1000, 886, 1280, 886, { weight: 0.8, category: 'signature' });
  caps(p, 'Secretary', 437, 897, { size: 10, tracking: 3 });
  caps(p, 'President', 1140, 897, { size: 10, tracking: 3 });

  // Seal: two-harmonic rosette, rings, a microtext ring and the year.
  const seal = { weight: 0.7, category: 'seal' }, sy = 872;
  p.paths(rosette(800, sy, { radius: 30, amplitude: 4.5, lobes: 22, loops: 9, amplitude2: 2, lobes2: 7 }), seal);
  p.oval(800, sy, 24, 24, { weight: 1.2, category: 'seal' }).oval(800, sy, 17, 17, { weight: 0.9, category: 'seal' });
  microtext(p, `${name.toUpperCase()}${bullet}CORPORATE SEAL`, `M${800 - 20.4},${sy} a20.4,20.4 0 1,1 40.8,0 a20.4,20.4 0 1,1 -40.8,0`, 2 * Math.PI * 20.4, { size: 4.2, tracking: 0.3, category: 'seal' });
  p.text(String(year), 800, sy + 4.5, { size: 13, font: 'display', category: 'seal' });
  return p;
}
function splitTitle(name) {
  const parts = name.split(' '); let best = null;
  for (let i = 1; i < parts.length; i++) {
    const a = parts.slice(0, i).join(' '), b = parts.slice(i).join(' '), score = Math.abs(a.length - b.length);
    if (!best || score < best.score) best = { score, lines: [a, b] };
  }
  return best ? best.lines : [name];
}
