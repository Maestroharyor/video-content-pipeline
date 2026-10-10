const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1080, height: 1920 });
  await p.goto('file://' + path.resolve('deck.html'), { waitUntil: 'networkidle0' });
  await p.evaluateHandle('document.fonts.ready');
  for (const [id, t] of [['s06', 0], ['s06', 1], ['s07', 1], ['s09', 1], ['s10', 0], ['s10', 1], ['s02', 1], ['s14', 1], ['s08', 1]]) {
    console.log(await p.evaluate((i, tt) => {
      window.setFrame(i, tt);
      const sl = document.getElementById(i);
      const body = sl.querySelector('.body');
      const out = [i + ' t=' + tt];
      if (body) {
        const bb = body.getBoundingClientRect();
        const sc = sl.querySelector('.sc');
        const items = [...sl.querySelectorAll('.trow, .card, .loadrow')];
        const vis = items.filter(e => { const r = e.getBoundingClientRect(); return r.top > bb.top - 4 && r.bottom < bb.bottom + 4; });
        const last = items[items.length - 1].getBoundingClientRect();
        out.push('bodyH=' + Math.round(bb.height) + ' visible=' + vis.length + '/' + items.length +
          ' lastBottom-bodyBottom=' + Math.round(last.bottom - bb.bottom) +
          ' scH=' + (sc ? sc.scrollHeight : '-'));
      }
      const sc2 = sl.querySelector('#h-sc');
      if (sc2) {
        const vp = sc2.parentElement.getBoundingClientRect();
        const rows = [...sc2.querySelectorAll('.dtr')];
        const vis = rows.filter(e => { const r = e.getBoundingClientRect(); return r.top > vp.top - 4 && r.bottom < vp.bottom + 4; });
        out.push('dashVisible=' + vis.length + '/' + rows.length + ' vpH=' + Math.round(vp.height) + ' scH=' + sc2.scrollHeight);
      }
      return out.join('  ');
    }, id, t));
  }
  await b.close();
})();
