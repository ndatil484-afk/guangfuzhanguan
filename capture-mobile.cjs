// 启动 Chrome headless 并截取移动端视图下"符号提取"章节
// 使用 Node 内置 WebSocket (Node 22+)
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'http://localhost:5173/#/';
const OUT_DIR = 'D:\\tare\\guangfu';
const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-414', width: 414, height: 896 },
  { name: 'tablet-768', width: 768, height: 1024 },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function capture(viewport) {
  const port = 9222 + Math.floor(Math.random() * 100);
  const userDataDir = `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Temp\\chrome-capture-${port}`;
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    `--window-size=${viewport.width},${viewport.height}`,
    'about:blank',
  ];
  console.log(`[${viewport.name}] launching Chrome on port ${port}...`);
  const proc = spawn(CHROME_PATH, args, { stdio: 'ignore' });

  try {
    let target = null;
    for (let i = 0; i < 50; i++) {
      await sleep(300);
      try {
        const tabs = await getJson(`http://127.0.0.1:${port}/json/list`);
        target = tabs.find(t => t.type === 'page');
        if (target) break;
      } catch (e) { /* retry */ }
    }
    if (!target) throw new Error('DevTools target not found');

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }); });

    let id = 0;
    const pending = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
    const send = (method, params) => {
      const myId = ++id;
      ws.send(JSON.stringify({ id: myId, method, params }));
      return new Promise((resolve, reject) => pending.set(myId, { resolve, reject }));
    };

    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send('Page.navigate', { url: URL });
    await sleep(3500);

    await send('Runtime.evaluate', {
      expression: `(async () => {
        let el = document.getElementById('chapter-04');
        for (let i = 0; i < 30 && !el; i++) {
          await new Promise(r => setTimeout(r, 200));
          el = document.getElementById('chapter-04');
        }
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top, behavior: 'instant' });
        }
        await new Promise(r => setTimeout(r, 2000));
        return 'ok';
      })();`,
      awaitPromise: true,
      returnByValue: true,
    });

    const res = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = `${OUT_DIR}\\${viewport.name}.png`;
    fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
    console.log(`[${viewport.name}] saved: ${outPath}`);

    ws.close();
  } finally {
    proc.kill();
    await sleep(500);
  }
}

(async () => {
  for (const vp of VIEWPORTS) {
    try { await capture(vp); }
    catch (e) { console.error(`[${vp.name}] error:`, e.message); }
  }
  console.log('done.');
})();
