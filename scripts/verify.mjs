import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { audit } from './audit.mjs';
import { browser } from './browser.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'examples/manifest.json')));
const start = performance.now(), results = [];
for (const spec of manifest) results.push({ id: spec.id, ...await audit(resolve(root, 'examples', spec.id, 'certificate.html'), { out: resolve(root, 'out', `${spec.id}.audit.json`) }) });
const b = await browser();
try {
  await b.open(resolve(root, 'examples/night-railway/certificate.html'));
  const state = async t => b.evaluate(`(()=>{window.__seek(${t});return [...document.querySelectorAll('[data-engrave]')].map(n=>[n.style.opacity,n.style.strokeDashoffset,n.getAttribute('clip-path')?document.getElementById(n.getAttribute('clip-path').slice(5,-1))?.firstChild.getAttribute('width'):null])})()`);
  const before = await state(6.125); await state(15); await state(2); assert.deepEqual(await state(6.125), before, 'Seeking backwards must reproduce the same state');
  const timing = await b.evaluate('(()=>{const t=performance.now();for(let i=0;i<10;i++)window.__seek(i*1.3);return (performance.now()-t)/10})()');
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await b.evaluate('document.getElementById("play").click()');
  assert.equal(await b.evaluate('Number(document.getElementById("time").value)'), 15, 'Reduced motion must show the settled plate');
  await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 800, deviceScaleFactor: 1, mobile: true });
  assert.equal(await b.evaluate('document.documentElement.scrollWidth<=390'), true, 'Standalone certificate must fit a phone');
  writeFileSync(resolve(root, 'out/mobile.png'), await b.screenshot());
  results.seekMs = Number(timing.toFixed(1));
} finally { await b.close(); }
const demo = await browser({ width: 1920, height: 1080 });
try {
  await demo.open(resolve(root, 'out/demo.html'));
  assert.deepEqual(await demo.evaluate('(()=>{const ids=[...document.querySelectorAll("[id]")].map(n=>n.id);return ids.filter((v,i)=>ids.indexOf(v)!==i)})()'), []);
  const hash = data => createHash('sha256').update(data).digest('hex');
  await demo.evaluate('window.__frame(0)'); const first = await demo.screenshot(); writeFileSync(resolve(root, 'out/demo-first.png'), first);
  assert.equal(await demo.evaluate('[...document.querySelectorAll("#plate-0 path[data-engrave]")].some(n=>n.style.opacity==="1"&&Number(n.style.strokeDashoffset)>0)'), true, 'First frame must already be drawing');
  await demo.evaluate('window.__frame(1)'); assert.notEqual(hash(await demo.screenshot()), hash(first), 'Motion must be visible from the first frame');
  assert.equal(await demo.evaluate('document.querySelectorAll("body > :not(.plate):not(script):not(style)").length'), 0, 'No captions or counters in the demo frame');
  for (const [t, i] of [[14, 0], [19.5, 1], [23.5, 2], [27.5, 3]]) {
    await demo.evaluate(`window.__seek(${t})`); assert.equal(await demo.evaluate(`document.getElementById('plate-${i}').style.display`), 'block');
    writeFileSync(resolve(root, 'out', `demo-${i + 1}.png`), await demo.screenshot());
  }
  if (demo.errors.length) throw new Error(demo.errors.join('\n'));
} finally { await demo.close(); }
mkdirSync(resolve(root, 'out'), { recursive: true });
writeFileSync(resolve(root, 'out/verification.json'), JSON.stringify({ pass: results.every(r => r.pass), seconds: +((performance.now() - start) / 1000).toFixed(2), seekSafe: true, reducedMotion: true, mobile: true, demoFirstFrameMoving: true, demoHasNoCounters: true, seekMs: results.seekMs, results: results.map(({ boxes, ...rest }) => rest) }, null, 2));
if (!results.every(r => r.pass)) process.exitCode = 1;
