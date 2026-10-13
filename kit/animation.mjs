// Embedded verbatim into standalone pages. No timers affect explicit seeking.
// Each category gets a fixed share of the duration so the vignette is always the long middle act;
// inside a category, time is split by the square root of stroke length.
export function installEngraving(root, duration = 15) {
  const nodes = [...root.querySelectorAll('[data-engrave]')];
  const rank = { frame: 0, ornament: 1, panel: 2, vignette: 3, lettering: 4, signature: 5, seal: 6 };
  const share = { frame: 0.04, ornament: 0.14, panel: 0.08, vignette: 0.5, lettering: 0.16, signature: 0.04, seal: 0.04 };
  nodes.sort((a, b) => (rank[a.dataset.category] ?? 2) - (rank[b.dataset.category] ?? 2) || Number(a.dataset.engrave) - Number(b.dataset.engrave));
  const records = nodes.map(node => {
    const knockout = node.hasAttribute('data-knockout'), text = node.tagName.toLowerCase() === 'text';
    const length = knockout ? 0 : text ? node.getBBox().width : node.getTotalLength();
    return { node, knockout, text, length, category: node.dataset.category, cost: knockout ? 0 : Math.sqrt(Math.max(length, 1)), start: 0, end: 0 };
  });
  const present = Object.keys(share).filter(c => records.some(r => r.category === c && r.cost > 0));
  const total = present.reduce((s, c) => s + share[c], 0);
  const defs = root.querySelector('defs');
  let elapsed = 0;
  for (const category of present) {
    const group = records.filter(r => r.category === category), budget = share[category] / total * duration, cost = group.reduce((s, r) => s + r.cost, 0);
    for (const r of group) { r.start = elapsed; elapsed += r.cost / cost * budget; r.end = elapsed; }
  }
  records.forEach((r, i) => {
    if (r.category && !present.includes(r.category)) { r.start = r.end = duration; }
    if (r.text) {
      const b = r.node.getBBox(), clip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath'), box = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      clip.id = `letter-reveal-${root.dataset.plate ?? 'one'}-${i}`;
      box.setAttribute('x', b.x - 2); box.setAttribute('y', b.y - 2); box.setAttribute('height', b.height + 4); clip.append(box); defs.append(clip);
      r.box = box; r.width = b.width + 4; r.node.setAttribute('clip-path', `url(#${clip.id})`);
    } else if (!r.knockout) r.node.style.strokeDasharray = `${r.length} ${r.length}`;
  });
  let previous = NaN;
  const seek = seconds => {
    const t = Math.max(0, Math.min(duration, Number(seconds)));
    if (!Number.isFinite(t)) throw new Error('Seek time must be finite');
    for (const r of records) {
      // Skip complete or unstarted records if their state cannot have changed.
      if (Number.isFinite(previous) && (t > r.end && previous > r.end || t < r.start && previous < r.start)) continue;
      const progress = r.knockout ? Number(t >= r.start) : Math.max(0, Math.min(1, (t - r.start) / (r.end - r.start || 1)));
      r.node.style.opacity = progress > 0 ? '1' : '0';
      if (r.text) r.box.setAttribute('width', r.width * progress);
      else if (!r.knockout) r.node.style.strokeDashoffset = String(r.length * (1 - progress));
    }
    previous = t; return t;
  };
  seek(0);
  return { seek, duration, strokes: records.filter(r => !r.knockout).length, schedule: records.map(({ start, end, length, category }) => ({ start, end, length, category })) };
}
