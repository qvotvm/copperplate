import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { browser } from './browser.mjs';
const [file, output, box = '500,322,600,300', factor = '4'] = process.argv.slice(2);
if (!file || !output) { console.error('Usage: node scripts/inspect.mjs certificate.html closeup.png [x,y,width,height] [scale]'); process.exit(1); }
const [x, y, width, height] = box.split(',').map(Number), scale = Number(factor);
if (![x, y, width, height, scale].every(Number.isFinite) || width <= 0 || height <= 0 || scale <= 0) throw new Error('Invalid crop dimensions');
const b = await browser();
try {
  await b.open(file); await b.evaluate('window.__seek(1000)');
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, await b.screenshot({ captureBeyondViewport: true, clip: { x, y, width, height, scale } }));
  if (b.errors.length) throw new Error(b.errors.join('\n'));
  console.log(JSON.stringify({ output, width: width * scale, height: height * scale }));
} finally { await b.close(); }
