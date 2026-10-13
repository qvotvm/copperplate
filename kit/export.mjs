import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { installEngraving } from './animation.mjs';
import { escapeXML } from './plate.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const faces = [['PlateSerif', 400, 'EBGaramond-400'], ['PlateSerif', 700, 'EBGaramond-700'], ['PlateDisplay', 400, 'AbrilFatface-400'], ['PlateScript', 400, 'PinyonScript-400']];
export function fontCSS() {
  return faces.map(([family, weight, file]) => `@font-face{font-family:${family};font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${readFileSync(resolve(root, `assets/fonts/${file}.woff2`)).toString('base64')}) format('woff2')}`).join('\n');
}
export const fontLoads = `await document.fonts.ready;for(const f of ['400 24px PlateSerif','700 24px PlateSerif','400 24px PlateDisplay','400 24px PlateScript'])await document.fonts.load(f);`;
export function standaloneHTML(plate, { duration = 15, prompt = '', autoplay = false } = {}) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeXML(plate.title)}</title><style>html,body{margin:0;background:${plate.paper};color:${plate.ink};scrollbar-width:none}::-webkit-scrollbar{display:none}main{width:100%;max-width:1600px;margin:auto}svg{display:block;width:100%;height:auto}footer{font:16px PlateSerif,serif;display:flex;align-items:center;gap:16px;padding:12px 3%;}button,input{accent-color:${plate.ink}}button{font:inherit;border:1px solid currentColor;background:transparent;color:inherit;padding:5px 16px;cursor:pointer}input{flex:1;min-width:0} @media(prefers-reduced-motion:reduce){button{transition:none}}</style><main>${plate.svg(fontCSS())}</main><footer><button id="play" type="button">Engrave</button><label for="time">Seek</label><input id="time" type="range" min="0" max="${duration}" value="${duration}" step="0.01"><output id="readout">${duration.toFixed(2)} s</output></footer><script>
const installEngraving=${installEngraving.toString()};
window.__ready=(async()=>{${fontLoads}const art=installEngraving(document.querySelector('svg'),${duration});window.__engraving=art;let raf=0;const slider=document.getElementById('time'),readout=document.getElementById('readout');window.__seek=t=>{cancelAnimationFrame(raf);const value=art.seek(t);slider.value=value;readout.value=value.toFixed(2)+' s';return value};window.__frame=n=>window.__seek(n/30);window.__seek(${duration});slider.addEventListener('input',()=>window.__seek(Number(slider.value)));function play(){cancelAnimationFrame(raf);if(matchMedia('(prefers-reduced-motion:reduce)').matches){window.__seek(art.duration);return}const start=performance.now();function frame(now){const t=Math.min(art.duration,(now-start)/1000);art.seek(t);slider.value=t;readout.value=t.toFixed(2)+' s';if(t<art.duration)raf=requestAnimationFrame(frame)}art.seek(0);raf=requestAnimationFrame(frame)}document.getElementById('play').addEventListener('click',play);${autoplay ? 'play();' : ''}return true})();
</script><!-- Prompt: ${escapeXML(prompt).replace(/--/g, '')} --></html>`;
}
export function writeCertificate(plate, destination, options = {}) {
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(`${destination}.svg`, plate.svg(fontCSS()));
  writeFileSync(`${destination}.html`, standaloneHTML(plate, options));
  return { svg: `${destination}.svg`, html: `${destination}.html`, strokes: plate.items.filter(i => i.kind !== 'knockout').length };
}
// Four plates in sequence, no counters or captions in frame.
export function demoHTML(plates) {
  const segments = [{ start: 0, length: 16, draw: 13.5 }, { start: 16, length: 4, draw: 2.9 }, { start: 20, length: 4, draw: 2.9 }, { start: 24, length: 4, draw: 2.9 }];
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>Copperplate: four plates</title><style>${fontCSS()}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:#e9e1cb}.plate{position:absolute;left:192px;top:60px;width:1536px;height:960px}.plate svg{width:100%;height:100%}</style>${plates.map((p, i) => `<div class="plate" id="plate-${i}">${p.svg('', 'demo-' + i + '-')}</div>`).join('')}<script>const installEngraving=${installEngraving.toString()};const segments=${JSON.stringify(segments)};window.__ready=(async()=>{${fontLoads}const arts=[...document.querySelectorAll('svg')].map((root,i)=>{root.dataset.plate=i;return installEngraving(root,segments[i].draw)});window.__duration=28;window.__seek=seconds=>{const t=Math.max(0,Math.min(28,seconds));let active=segments.findLastIndex(s=>t>=s.start);for(let i=0;i<arts.length;i++){document.getElementById('plate-'+i).style.display=i===active?'block':'none';if(i===active)arts[i].seek(Math.min(segments[i].draw,t-segments[i].start+0.045));}};window.__frame=n=>window.__seek(n/30);window.__frame(0);return true})();</script></html>`;
}
