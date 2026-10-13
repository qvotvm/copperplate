import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { certificate } from '../kit/certificate.mjs';
import { writeCertificate, demoHTML } from '../kit/export.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'examples/manifest.json')));
const start = performance.now();
for (const spec of manifest) {
  const dir = resolve(root, 'examples', spec.id); mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'spec.json'), JSON.stringify(spec, null, 2) + '\n');
  writeFileSync(resolve(dir, 'prompt.txt'), spec.prompt + '\n');
  writeFileSync(resolve(dir, 'build.mjs'), `import { build } from '../../scripts/build.mjs';\nimport { fileURLToPath } from 'node:url';\nawait build(fileURLToPath(new URL('./spec.json', import.meta.url)));\n`);
  console.log(spec.id, writeCertificate(certificate(spec), resolve(dir, 'certificate'), { prompt: spec.prompt }));
}
mkdirSync(resolve(root, 'out'), { recursive: true });
writeFileSync(resolve(root, 'out/demo.html'), demoHTML([0, 3, 5, 6].map(i => certificate(manifest[i]))));
console.log('build seconds', ((performance.now() - start) / 1000).toFixed(2));
