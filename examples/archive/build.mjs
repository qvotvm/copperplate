import { build } from '../../scripts/build.mjs';
import { fileURLToPath } from 'node:url';
await build(fileURLToPath(new URL('./spec.json', import.meta.url)));
