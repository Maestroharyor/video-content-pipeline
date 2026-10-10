const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const FRAMES = 100;                 // 5.00s at 20fps
const args = process.argv.slice(2);
const posterOnly = args.includes('--poster');
const ids = args.filter(a => !a.startsWith('--'));

(async () => {
  const b = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb', '--font-render-hinting=none']
  });
  const p = await b.newPage();
  await p.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await p.goto('file://' + path.resolve('deck.html'), { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');

  const all = await p.evaluate(() => window.SLIDE_IDS);
  const list = ids.length ? ids : all;
  const stage = await p.$('#stage');

  for (const id of list) {
    if (posterOnly) {
      await p.evaluate((i) => window.setFrame(i, 1), id);
      await new Promise(r => setTimeout(r, 60));
      await stage.screenshot({ path: 'poster/' + id + '.png' });
      console.log('poster', id);
      continue;
    }
    const dir = 'frames/' + id;
    fs.mkdirSync(dir, { recursive: true });
    for (let f = 0; f < FRAMES; f++) {
      await p.evaluate((i, t) => window.setFrame(i, t), id, f / (FRAMES - 1));
      await stage.screenshot({ path: dir + '/' + String(f).padStart(4, '0') + '.png' });
    }
    await p.evaluate((i) => window.setFrame(i, 1), id);
    await stage.screenshot({ path: 'poster/' + id + '.png' });
    console.log('rendered', id);
  }
  await b.close();
})();
