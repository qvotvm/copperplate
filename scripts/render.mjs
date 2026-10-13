import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { browser } from './browser.mjs';
export async function render(file, output, { duration, fps = 30, width = 1600, height = 1000, scale = 1, time, snapshot = false } = {}) {
  const start = performance.now(); mkdirSync(dirname(output), { recursive: true });
  if (!Number.isInteger(fps) || fps < 1 || !(width > 0 && height > 0 && scale > 0)) throw new Error('Invalid render dimensions or fps');
  if (output.endsWith('.mp4') && (width * scale % 2 || height * scale % 2)) throw new Error('MP4 dimensions must be even');
  const b = await browser({ width, height, scale }); let encoder;
  try {
    await b.open(file);
    if (output.endsWith('.png')) {
      if (!snapshot) await b.evaluate(`window.__seek(${time ?? 1000})`);
      writeFileSync(output, await b.screenshot());
    } else if (output.endsWith('.mp4')) {
      const seconds = duration ?? await b.evaluate('window.__duration ?? window.__engraving.duration');
      if (!(seconds > 0 && Number.isFinite(seconds))) throw new Error('Duration must be positive and finite');
      const count = Math.round(seconds * fps);
      encoder = spawn(process.env.FFMPEG_PATH ?? 'ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-vcodec', 'png', '-framerate', String(fps), '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output], { stdio: ['pipe', 'ignore', 'pipe'] });
      let ffErrors = ''; encoder.stderr.on('data', chunk => { ffErrors += chunk; });
      encoder.stdin.on('error', () => {});
      const done = new Promise((resolve, reject) => { encoder.once('error', reject); encoder.once('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg failed (${code}): ${ffErrors}`))); });
      // Attach a handler immediately; a missing ffmpeg must never hang a frame loop.
      done.catch(() => {});
      for (let i = 0; i < count; i++) {
        if (encoder.exitCode !== null || encoder.stdin.destroyed) { await done; throw new Error('ffmpeg stopped accepting frames'); }
        await b.evaluate(`window.__seek(${i / fps + 0.015})`);
        const png = await b.screenshot();
        if (!encoder.stdin.write(png)) await Promise.race([once(encoder.stdin, 'drain'), done.then(() => { throw new Error('ffmpeg exited early'); })]);
        if (i % fps === 0) console.log(`frame ${i}/${count}`);
      }
      encoder.stdin.end(); await done;
    } else throw new Error('Render output must be .png or .mp4');
    if (b.errors.length) throw new Error(b.errors.join('\n'));
    const result = { output, seconds: +((performance.now() - start) / 1000).toFixed(2) }; console.log(JSON.stringify(result)); return result;
  } finally { if (encoder && encoder.exitCode === null) encoder.kill(); await b.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [file, output, ...args] = process.argv.slice(2), options = {};
  if (!file || !output) { console.error('Usage: node scripts/render.mjs page.html output.png|output.mp4 [--width 1920 --height 1080 --scale 2 --fps 30 --duration 28 --time 4]'); process.exit(1); }
  for (let i = 0; i < args.length; i++) {
    if (!['--width', '--height', '--scale', '--fps', '--duration', '--time'].includes(args[i])) throw new Error(`Unknown option ${args[i]}`);
    const key = args[i].slice(2); options[key] = Number(args[++i]);
    if (!Number.isFinite(options[key])) throw new Error(`Invalid ${key}`);
  }
  await render(file, output, options);
}
