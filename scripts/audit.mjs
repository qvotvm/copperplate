import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { browser } from './browser.mjs';

// Measures the finished plate in a real browser: text boxes, weights, frames, inks, coverage and tone.
export async function audit(file, { out } = {}) {
  const b = await browser();
  try {
    await b.open(file); await b.evaluate('window.__seek(1000)');
    const report = await b.evaluate(`(async()=>{
      const svg=document.querySelector('svg'),labels=[...svg.querySelectorAll('[data-label]')];
      const boxes=labels.map(el=>({text:el.textContent,...(()=>{const r=el.getBBox();return{x:r.x,y:r.y,w:r.width,h:r.height}})()}));
      const overlaps=[];
      for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],c=boxes[j];if(Math.min(a.x+a.w,c.x+c.w)-Math.max(a.x,c.x)>0.5&&Math.min(a.y+a.h,c.y+c.h)-Math.max(a.y,c.y)>0.5)overlaps.push([a.text,c.text]);}
      const textOutside=boxes.filter(b=>b.x<28||b.y<28||b.x+b.w>1572||b.y+b.h>972).map(b=>b.text);
      const lines=[...svg.querySelectorAll('[data-engrave]:not([data-knockout]):not(text)')];
      const thin=lines.filter(el=>Number(el.getAttribute('stroke-width'))<0.6).length;
      const invalid=lines.filter(el=>!Number.isFinite(el.getTotalLength())||el.getTotalLength()<0.1||/NaN|Infinity/.test(el.getAttribute('d'))).length;
      const frames=[...svg.querySelectorAll('[data-frame]')],openFrames=frames.filter(el=>!el.getAttribute('d').trim().endsWith('Z')).length;
      const frameBounds=frames.map(el=>{const b=el.getBBox();return[b.x,b.y,b.width,b.height]});
      const duplicateIds=[...document.querySelectorAll('[id]')].map(n=>n.id).filter((id,i,all)=>all.indexOf(id)!==i);
      const inks=(svg.dataset.inks||svg.querySelector('g').getAttribute('stroke')).split(' ');
      const paper=svg.querySelector(':scope > rect').getAttribute('fill');
      const allowed=new Set([...inks,paper,'none',null]);
      const otherInk=[...svg.querySelectorAll('[data-engrave]')].filter(el=>!allowed.has(el.getAttribute('stroke'))||!allowed.has(el.getAttribute('fill'))).length;
      const widths=new Set([...svg.querySelectorAll('[data-category="vignette"]:not([data-knockout]):not(text)')].map(el=>el.getAttribute('stroke-width')));
      const fontsLoaded=['400 24px PlateSerif','700 24px PlateSerif','400 24px PlateDisplay','400 24px PlateScript'].every(f=>document.fonts.check(f));
      const copy=svg.cloneNode(true);copy.querySelectorAll('[data-engrave]').forEach(el=>{el.style.opacity=1;el.style.strokeDashoffset=0;el.style.strokeDasharray='none';if(el.tagName.toLowerCase()==='text')el.removeAttribute('clip-path')});
      copy.querySelector('[data-grain]')?.remove();copy.querySelector('g').removeAttribute('filter');
      const image=new Image();image.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(copy))));await image.decode();
      const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1000;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,1600,1000);
      const data=ctx.getImageData(0,0,1600,1000).data,background=[data[0],data[1],data[2]];
      const dark=i=>Math.abs(data[i]-background[0])+Math.abs(data[i+1]-background[1])+Math.abs(data[i+2]-background[2])>60;
      const region=(x0,y0,x1,y1)=>{let n=0,k=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){k++;if(dark((y*1600+x)*4))n++;}return n/k};
      const coverage=region(0,0,1600,1000);
      const titleBox=boxes.filter(b=>b.h>40&&b.y<330).reduce((a,b)=>a?{x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),r:Math.max(a.r,b.x+b.w),b:Math.max(a.b,b.y+b.h)}:{x:b.x,y:b.y,r:b.x+b.w,b:b.y+b.h},null);
      const titleInk=titleBox?region(Math.round(titleBox.x),Math.round(titleBox.y+titleBox.b*0.0),Math.round(titleBox.r),Math.round(titleBox.b)):0;
      const vignetteInk=region(500,330,1100,620),borderInk=region(40,120,90,880),bodyInk=region(240,640,1360,800);
      const failures=[];if(overlaps.length)failures.push('overlapping text');if(textOutside.length)failures.push('text outside safe frame');if(thin)failures.push('line weight below 0.6');if(invalid)failures.push('invalid or empty paths');if(frames.length<4||openFrames||frameBounds.some(b=>b[0]<0||b[1]<0||b[0]+b[2]>1600||b[1]+b[3]>1000))failures.push('frame closure');if(duplicateIds.length)failures.push('duplicate ids');if(otherInk)failures.push('multiple inks');if(!fontsLoaded)failures.push('font unavailable');if(coverage<0.2||coverage>0.5)failures.push('ink coverage outside 20..50 percent');
      if(titleInk<0.3)failures.push('title too pale');if(vignetteInk<0.12||vignetteInk>0.6)failures.push('vignette tone outside 12..60 percent');if(borderInk<0.35)failures.push('border too pale');if(widths.size<3)failures.push('vignette lines do not swell');if(bodyInk>0.35)failures.push('body too dark to read');
      return{pass:!failures.length,failures,overlaps,textOutside,thin,invalid,frameCount:frames.length,openFrames,duplicateIds,otherInk,fontsLoaded,coverage:Number(coverage.toFixed(4)),titleInk:Number(titleInk.toFixed(3)),vignetteInk:Number(vignetteInk.toFixed(3)),borderInk:Number(borderInk.toFixed(3)),bodyInk:Number(bodyInk.toFixed(3)),strokeWidths:[...widths].map(Number).sort((a,b)=>a-b),strokes:lines.length+labels.length,boxes};
    })()`);
    report.consoleErrors = [...b.errors]; if (b.errors.length) { report.pass = false; report.failures.push('browser errors'); }
    if (out) { mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, JSON.stringify(report, null, 2)); writeFileSync(out.replace(/\.json$/, '') + '.png', await b.screenshot()); }
    console.log(JSON.stringify({ file, ...report, boxes: undefined })); return report;
  } finally { await b.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv[2]) { console.error('Usage: node scripts/audit.mjs certificate.html [--out report.json]'); process.exit(1); }
  const r = await audit(process.argv[2], { out: process.argv[3] === '--out' ? process.argv[4] : undefined }); if (!r.pass) process.exitCode = 1;
}
