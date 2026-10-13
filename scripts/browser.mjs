import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const delay = ms => new Promise(r => setTimeout(r, ms));
export async function browser({ width = 1600, height = 1000, scale = 1 } = {}) {
  const chrome = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].filter(Boolean).find(existsSync);
  if (!chrome) throw new Error('Chrome not found. Set CHROME_PATH to a Chrome or Chromium executable.');
  const profile = mkdtempSync(join(tmpdir(), 'copperplate-'));
  const child = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  let socket;
  const close = async () => { socket?.close(); child.kill('SIGTERM'); await Promise.race([new Promise(r => child.once('exit', r)), delay(1000)]); rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); };
  try {
    let port;
    for (let i = 0; i < 150; i++) {
      const active = join(profile, 'DevToolsActivePort');
      if (existsSync(active)) { port = Number(readFileSync(active, 'utf8').split('\n')[0]); break; }
      if (child.exitCode !== null) throw new Error('Chrome exited before starting. Browser launch may require sandbox permission.');
      await delay(100);
    }
    if (!port) throw new Error('Chrome startup timed out');
    const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    socket = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((r, reject) => { socket.onopen = r; socket.onerror = reject; });
    let serial = 0; const pending = new Map(), errors = [];
    socket.onmessage = event => {
      const data = JSON.parse(event.data);
      if (data.id) { const p = pending.get(data.id); pending.delete(data.id); clearTimeout(p?.timer); if (data.error) p?.reject(new Error(data.error.message)); else p?.resolve(data.result); }
      else if (data.method === 'Runtime.exceptionThrown') errors.push(data.params.exceptionDetails.text + ': ' + (data.params.exceptionDetails.exception?.description ?? ''));
      else if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') errors.push(data.params.args.map(a => a.value ?? a.description).join(' '));
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++serial, timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, Number(process.env.CDP_TIMEOUT ?? 240000));
      pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
    });
    await send('Runtime.enable'); await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
      return result.result.value;
    };
    const open = async file => {
      await send('Page.navigate', { url: pathToFileURL(resolve(file)).href });
      for (let i = 0; i < 200; i++) {
        if (await evaluate('document.readyState === "complete" && !!window.__ready')) { await evaluate('window.__ready'); return; }
        if (errors.length) throw new Error(errors.join('\n'));
        await delay(50);
      }
      throw new Error('Page did not become ready');
    };
    const screenshot = async (options = {}) => Buffer.from((await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, ...options })).data, 'base64');
    return { send, evaluate, open, screenshot, errors, close };
  } catch (error) { await close(); throw error; }
}
