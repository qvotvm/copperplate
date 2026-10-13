import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { certificate } from '../kit/certificate.mjs';
import { writeCertificate } from '../kit/export.mjs';
export async function build(source, output) {
  let spec, draw;
  if (source.endsWith('.json')) spec = JSON.parse(readFileSync(source, 'utf8'));
  else ({ spec, draw } = await import(pathToFileURL(resolve(source)).href));
  const result = writeCertificate(certificate(spec, draw), output ?? resolve(dirname(source), 'certificate'), { prompt: spec.prompt });
  console.log(JSON.stringify(result)); return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv[2]) { console.error('Usage: node scripts/build.mjs spec.json|design.mjs [output/base]'); process.exit(1); }
  await build(process.argv[2], process.argv[3]);
}
