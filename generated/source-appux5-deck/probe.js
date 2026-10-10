const puppeteer = require('puppeteer');
const path = require('path');

const SEL = ['.eyebrow', '.h1', '.foot', '.sub', '.chip', '.badge', '.rowbar', '.panel', '.code',
  '.dev', '.dash', '.stack', '.hrow', '.bbox', '.content > div', '.trow', '.card', '.dtr', '.ltile'];

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.setViewport({ width: 1080, height: 1920 });
  await p.goto('file://' + path.resolve('deck.html'), { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');
  const ids = await p.evaluate(() => window.SLIDE_IDS);

  let bad = [];
  for (const id of ids) {
    for (const t of [0.5, 1]) {
      const r = await p.evaluate((i, tt, sel) => {
        window.setFrame(i, tt);
        const out = [];
        const sl = document.getElementById(i);
        sel.forEach(s => sl.querySelectorAll(s).forEach(e => {
          const cs = getComputedStyle(e);
          if (parseFloat(cs.opacity) < 0.03) return;
          const b = e.getBoundingClientRect();
          if (b.width < 2 || b.height < 2) return;
          const nm = (e.id || e.className.toString().slice(0, 26));
          if (b.left < 58 || b.right > 1022 || b.top < 96 || b.bottom > 1858)
            out.push('MARGIN ' + nm + ' [' + Math.round(b.left) + ',' + Math.round(b.top) + ',' + Math.round(b.right) + ',' + Math.round(b.bottom) + ']');
          if (e.scrollWidth > e.clientWidth + 3 && !e.classList.contains('sc') && cs.overflow !== 'hidden')
            out.push('OVERFLOW-X ' + nm + ' ' + e.scrollWidth + '>' + e.clientWidth);
        }));
        return out;
      }, id, t, SEL);
      r.forEach(x => bad.push(id + ' t=' + t + '  ' + x));
    }
  }
  await b.close();
  errs.forEach(e => console.log(e));
  const uniq = [...new Set(bad)];
  uniq.forEach(x => console.log(x));
  console.log('--- probe: ' + uniq.length + ' layout issues, ' + errs.length + ' js errors');
})();
