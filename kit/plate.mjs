import { f, rect, ellipse, polyline } from './geometry.mjs';
import { hatch } from './hatch.mjs';
export const escapeXML = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const fonts = { serif: 'PlateSerif', display: 'PlateDisplay', script: 'PlateScript' };

// An ordered recorder of engraving strokes. Items are serialised in order; categories sort the animation.
export class Plate {
  constructor({ ink = '#132636', ink2, paper = '#f3ecd8', width = 1600, height = 1000, grain = true, press = false } = {}) {
    Object.assign(this, { ink, ink2, paper, width, height, grain, press });
    this.items = []; this.clips = []; this.defs = []; this.shapes = [];
  }
  path(d, { weight = 0.85, category = 'detail', clip, ...extra } = {}) {
    this.items.push({ kind: 'path', d, weight, category, clip, ...extra }); return this;
  }
  // Accepts strings or { d, weight } runs from the hatch helpers.
  paths(paths, options = {}) {
    for (const p of Array.isArray(paths) ? paths : [paths]) typeof p === 'string' ? this.path(p, options) : this.path(p.d, { ...options, weight: Number((p.weight * (options.weight ?? 1)).toFixed(2)) });
    return this;
  }
  line(x1, y1, x2, y2, options) { return this.path(polyline([[x1, y1], [x2, y2]]), options); }
  // Paper knockout, then hatch runs clipped to the outline, then the outline itself.
  shape(shape, { tone = 0.4, mode = 'parallel', outline = true, weight = 1, category = 'vignette', ink, ...options } = {}) {
    const id = `shape-${this.shapes.length}`;
    this.shapes.push(shape); this.clips.push({ id, d: shape.d });
    this.items.push({ kind: 'knockout', d: shape.d, category, ink });
    if (tone > 0 || mode === 'tint') this.paths(hatch(shape, { tone, mode, ...options }), { weight, category, clip: id, ink });
    if (outline) this.path(shape.d, { weight: outline === true ? 1.05 : outline, category, ink });
    return this;
  }
  rectangle(x, y, w, h, options) { return this.path(rect(x, y, w, h).d, options); }
  oval(x, y, rx, ry, options) { return this.path(ellipse(x, y, rx, ry).d, options); }
  def(d) { const id = `def-${this.defs.length}`; this.defs.push({ id, d }); return id; }
  clipText(item) { const id = `type-${this.clips.length}`; this.clips.push({ id, text: { anchor: 'middle', ...item } }); return id; }
  text(text, x, y, { size = 24, tracking = 0, bold = false, font = 'serif', fill = 'ink', stroke = 'none', strokeWidth = 0, anchor = 'middle', label = true, category = 'lettering', ...options } = {}) {
    this.items.push({ kind: 'text', text: String(text), x, y, size, tracking, bold, font, fill, stroke, strokeWidth, anchor, label, category, weight: strokeWidth, ...options });
    return this;
  }
  colour(name, ink) { return name === 'paper' ? this.paper : name === 'none' ? 'none' : ink === 2 && this.ink2 ? this.ink2 : this.ink; }
  svg(fontCSS = '', prefix = '') {
    const textAttributes = it => `${it.path ? '' : `x="${f(it.x)}" y="${f(it.y)}" `}font-size="${it.size}" letter-spacing="${it.tracking}" font-weight="${it.bold ? 700 : 400}" font-family="${fonts[it.font] ?? fonts.serif}" text-anchor="${it.anchor}"${it.textLength ? ` textLength="${it.textLength}" lengthAdjust="spacingAndGlyphs"` : ''}${it.rotate ? ` transform="rotate(${it.rotate} ${f(it.x)} ${f(it.y)})"` : ''}`;
    const textBody = it => it.path ? `<textPath href="#${prefix}${it.path}"${it.startOffset != null ? ` startOffset="${it.startOffset}"` : ''}>${escapeXML(it.text)}</textPath>` : escapeXML(it.text);
    const clips = this.clips.map(c => `<clipPath id="${prefix}${c.id}">${c.text ? `<text ${textAttributes(c.text)}>${textBody(c.text)}</text>` : `<path d="${c.d}" clip-rule="evenodd"/>`}</clipPath>`).join('');
    const defs = this.defs.map(d => `<path id="${prefix}${d.id}" d="${d.d}" fill="none"/>`).join('');
    const filters = `${this.grain ? `<filter id="${prefix}grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="11" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.32 0 0 0 0 0.26 0 0 0 0 0.17 0 0 0 0.05 0"/></filter>` : ''}${this.press ? `<filter id="${prefix}press" x="-1%" y="-1%" width="102%" height="102%"><feMorphology operator="dilate" radius="0.08"/></filter>` : ''}`;
    // Consecutive runs that share a clip and a translate are grouped under one clipped <g>:
    // one clip layer per shape instead of one per hatch line, which keeps 2x captures fast.
    const parts = []; let open = null;
    const groupKey = it => it.kind === 'path' && it.clip ? `${it.clip}|${it.translate?.join(',') ?? ''}` : null;
    this.items.forEach((it, index) => {
      const key = groupKey(it);
      if (open && key !== open) { parts.push('</g>'); open = null; }
      if (key && !open) { parts.push(`<g clip-path="url(#${prefix}${it.clip})"${it.translate ? ` transform="translate(${it.translate.join(' ')})"` : ''}>`); open = key; }
      const stroke = it.stroke ?? 'ink', paperish = it.stroke === 'paper' || it.fill === 'paper';
      const common = `data-engrave="${index}" data-category="${it.category}" stroke-width="${it.weight ?? 0}"${it.translate && !key ? ` transform="translate(${it.translate.join(' ')})"` : ''}${paperish ? ' data-paper="true"' : ''}`;
      if (it.kind === 'knockout') parts.push(`<path ${common} data-knockout="true" d="${it.d}" fill="${this.paper}" stroke="none" fill-rule="evenodd"/>`);
      else if (it.kind === 'path') parts.push(`<path ${common} d="${it.d}"${stroke !== 'ink' || it.ink === 2 ? ` stroke="${this.colour(stroke, it.ink)}"` : ''}${it.frame ? ' data-frame="true"' : ''}/>`);
      else parts.push(`<text ${common}${it.label ? ' data-label="true"' : ''} ${textAttributes(it)} fill="${this.colour(it.fill, it.ink)}" stroke="${this.colour(it.stroke, it.ink)}"${it.clip ? ` clip-path="url(#${prefix}${it.clip})"` : ''}>${textBody(it)}</text>`);
    });
    if (open) parts.push('</g>');
    const items = parts.join('\n');
    const inks = [this.ink, this.ink2].filter(Boolean).join(' ');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}" role="img" aria-label="${escapeXML(this.title ?? 'Fictional engraved stock certificate')}" data-inks="${inks}" data-paper-colour="${this.paper}"><style>${fontCSS}\nsvg{font-family:PlateSerif,serif}</style><defs>${defs}${clips}${filters}</defs><rect width="100%" height="100%" fill="${this.paper}"/>${this.grain ? `<rect width="100%" height="100%" fill="${this.paper}" filter="url(#${prefix}grain)" data-grain="true"/>` : ''}<g fill="none" stroke="${this.ink}" stroke-linecap="round" stroke-linejoin="round"${this.press ? ` filter="url(#${prefix}press)"` : ''}>${items}</g></svg>`;
  }
}
