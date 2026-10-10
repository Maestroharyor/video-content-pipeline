#!/usr/bin/env node
/* yt-research: what actually works as a thumbnail in one niche, measured instead of assumed.
   Three stages, each skippable, so a blocked scrape does not throw away the work after it:
     scrape    search results + channel /videos tabs → data.json (one row per video card)
     download  the winners' thumbnails from i.ytimg.com → thumbs/<id>.jpg
     measure   pixel statistics on each winner at true sidebar size → metrics in data.json + sheets

   Scoring. Raw views compare channels, not thumbnails: a 3M-view video on a 3M-median channel says nothing.
   Every row gets viewsPerDay, and every row from a channel with enough of a sample gets `outlier` =
   viewsPerDay / that channel's median viewsPerDay. An outlier of 4 means the thumbnail pulled four times
   what the channel's own audience normally gives it, which is the closest proxy to CTR available without
   the owner's Studio analytics. This is a proxy, not CTR: impressions and the algorithm are in it too.

   usage: node scripts/yt-research.js --out <dir> [--top 60] [--only scrape|download|measure] [--limit N]
          [--queries "a,b"] [--channels "@x,@y"]   (default: the lists below, written for the storage video)  */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { launchBrowser } = require('../renderer/browser');

const ROOT = path.resolve(__dirname, '..');

/* The niche: every query is a topic this video actually covers, so the sample is the shelf it will sit on. */
const QUERIES = ['localstorage', 'indexeddb', 'where do apps store data', 'sqlite mobile app',
  'android datastore room database', 'ios keychain userdefaults', 'electron tauri storage',
  'browser storage limits', 'offline first app', 'cookies vs localstorage'];

/* The channels the user pointed at, plus the neighbours they compete with, plus their own back catalogue. */
const CHANNELS = ['@CoreDumpped', '@Fireship', '@t3dotgg', '@ThePrimeTimeagen', '@WebDevSimplified',
  '@codewithmosh', '@lifetechfacts'];

const args = (argv => {
  const o = { out: null, top: 60, only: null, limit: 0, minAge: 21, queries: QUERIES, channels: CHANNELS };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') o.out = path.resolve(argv[++i]);
    else if (a === '--top') o.top = +argv[++i];
    else if (a === '--only') o.only = argv[++i];
    else if (a === '--limit') o.limit = +argv[++i];
    else if (a === '--min-age') o.minAge = +argv[++i];
    else if (a === '--queries') o.queries = argv[++i].split(',').map(x => x.trim()).filter(Boolean);
    else if (a === '--channels') o.channels = argv[++i].split(',').map(x => x.trim()).filter(Boolean);
    else throw new Error('unknown flag ' + a);
  }
  if (!o.out) throw new Error('--out <dir> is required');
  return o;
})(process.argv.slice(2));

const OUT = args.out;
const DATA = path.join(OUT, 'data.json');
const run = s => !args.only || args.only === s;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- parsing YouTube ---------- */

/* ytInitialData is a deep, frequently reshuffled tree, and YouTube is mid-migration between two card
   shapes: search results still ship `videoRenderer`, while channel /videos tabs have moved to
   `lockupViewModel`. Walking for both survives the migration; hand-written paths into `contents.twoColumn…`
   do not. A videoRenderer is only accepted when it carries a view count or a publish date, because plenty
   of other nodes (overlays, chapter markers, playback endpoints) also carry a videoId and a title. */
function harvest(node, out = [], seen = new Set()) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) { node.forEach(n => harvest(n, out, seen)); return out; }
  for (const k in node) {
    const v = node[k];
    if (k === 'videoRenderer' && v && v.videoId && (v.viewCountText || v.publishedTimeText) && !seen.has(v.videoId)) {
      seen.add(v.videoId); out.push(card(v));
    } else if (k === 'lockupViewModel' && v && v.contentId && v.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO' && !seen.has(v.contentId)) {
      const c = lockup(v); if (c) { seen.add(v.contentId); out.push(c); }
    }
    harvest(v, out, seen);
  }
  return out;
}
const txt = t => !t ? '' : t.simpleText || (t.runs || []).map(r => r.text).join('');
function card(v) {
  const thumbs = ((v.thumbnail || {}).thumbnails || []);
  return {
    id: v.videoId,
    title: txt(v.title),
    channel: txt(v.ownerText) || txt(v.longBylineText) || txt(v.shortBylineText) || '',
    views: parseViews(txt(v.viewCountText) || txt(v.shortViewCountText)),
    viewsRaw: txt(v.viewCountText) || txt(v.shortViewCountText),
    ageDays: parseAge(txt(v.publishedTimeText)),
    ageRaw: txt(v.publishedTimeText),
    length: txt(v.lengthText),
    thumb: thumbs.length ? thumbs[thumbs.length - 1].url : '',
  };
}
/* the new shape: one metadata row of loose "105K" / "4d ago" parts, with no labels on them */
function lockup(v) {
  const m = (v.metadata || {}).lockupMetadataViewModel; if (!m) return null;
  const parts = ((((m.metadata || {}).contentMetadataViewModel || {}).metadataRows) || [])
    .flatMap(r => (r.metadataParts || []).map(p => ((p.text || {}).content || '').trim())).filter(Boolean);
  const views = parts.find(t => /^[\d.,]+[KMB]?$/i.test(t) || /view/i.test(t));
  const age = parts.find(t => /ago$/i.test(t));
  const badge = (((v.contentImage || {}).thumbnailViewModel || {}).overlays || [])
    .flatMap(o => (((o.thumbnailBottomOverlayViewModel || {}).badges) || []))
    .map(b => ((b.thumbnailBadgeViewModel || {}).text) || '').find(t => /^\d+:/.test(t)) || '';
  return {
    id: v.contentId,
    title: ((m.title || {}).content || '').trim(),
    channel: parts.find(t => !/^[\d.,]+[KMB]?$/i.test(t) && !/ago$/i.test(t) && !/view/i.test(t)) || '',
    views: parseViews(views), viewsRaw: views || '',
    ageDays: parseAge(age), ageRaw: age || '',
    length: badge, thumb: '',
  };
}
/* "1.2M views" · "306K views" · "105K" · "1,234 views" */
function parseViews(s) {
  if (!s) return null;
  const m = s.replace(/,/g, '').match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return null;
  const mult = { k: 1e3, m: 1e6, b: 1e9 }[(m[2] || '').toLowerCase()] || 1;
  return Math.round(parseFloat(m[1]) * mult);
}
/* Both spellings YouTube ships: "3 weeks ago" on some surfaces, "3w ago" on others. `mo` is tested before
   `m`, or every month reads as a minute and a two-year-old video looks like it went up this afternoon. */
const AGE_UNITS = [['mo', 30.44], ['second', 1 / 86400], ['minute', 1 / 1440], ['hour', 1 / 24],
  ['day', 1], ['week', 7], ['month', 30.44], ['year', 365.25],
  ['s', 1 / 86400], ['m', 1 / 1440], ['h', 1 / 24], ['d', 1], ['w', 7], ['y', 365.25]];
function parseAge(s) {
  if (!s) return null;
  const m = String(s).trim().toLowerCase().match(/(\d+)\s*([a-z]+)/);
  if (!m) return null;
  const unit = AGE_UNITS.find(([u]) => m[2].startsWith(u));
  return unit ? +(+m[1] * unit[1]).toFixed(2) : null;
}

/* ---------- stage 1: scrape ---------- */

async function grab(page, url, scrolls) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction('window.ytInitialData !== undefined', { timeout: 20000 }).catch(() => {});
  for (let i = 0; i < scrolls; i++) {
    await page.evaluate(() => window.scrollBy(0, 4000));
    await sleep(900);
  }
  // After scrolling, the extra cards arrive as continuation responses and never reach ytInitialData, so the
  // DOM is read as well. Both card elements are matched: ytd-* is the old markup, yt-lockup-view-model the new.
  const initial = await page.evaluate(() => window.ytInitialData || null);
  const fromDom = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('ytd-video-renderer, ytd-rich-item-renderer, ytd-grid-video-renderer, yt-lockup-view-model').forEach(el => {
      const a = el.querySelector('a#video-title, a#video-title-link, a.yt-lockup-metadata-view-model-wiz__title, h3 a');
      const href = a && a.getAttribute('href');
      const id = href && (href.match(/[?&]v=([\w-]{11})/) || [])[1];
      if (!id) return;
      const meta = [...el.querySelectorAll('#metadata-line span, .yt-content-metadata-view-model-wiz__metadata-text, .yt-content-metadata-view-model__metadata-text')]
        .map(s => s.textContent.trim()).filter(Boolean);
      out.push({
        id,
        title: (a.getAttribute('title') || a.textContent || '').trim(),
        channel: ((el.querySelector('#channel-name a, .yt-content-metadata-view-model-wiz__metadata-row a') || {}).textContent || '').trim(),
        viewsRaw: meta.find(t => /view/i.test(t) || /^[\d.,]+[KMB]?$/i.test(t)) || '',
        ageRaw: meta.find(t => /ago$/i.test(t)) || '',
        length: ((el.querySelector('#time-status, .badge-shape-wiz__text') || {}).textContent || '').trim(),
      });
    });
    return out;
  });
  const rows = initial ? harvest(initial) : [];
  const have = new Set(rows.map(r => r.id));
  fromDom.forEach(d => {
    if (have.has(d.id)) return;
    have.add(d.id);
    rows.push({
      id: d.id, title: d.title.trim(), channel: (d.channel || '').trim(),
      views: parseViews(d.viewsRaw), viewsRaw: d.viewsRaw, ageDays: parseAge(d.ageRaw), ageRaw: d.ageRaw,
      length: (d.length || '').trim(), thumb: '',
    });
  });
  return rows;
}

async function scrape() {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36');
  // SOCS short-circuits the EU consent interstitial, which otherwise serves a wall instead of ytInitialData
  await browser.setCookie(
    { name: 'SOCS', value: 'CAISNQgQEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjQwNDIzLjA2X3AwGgJlbiADGgYIgOeasAY', domain: '.youtube.com', path: '/' },
    { name: 'PREF', value: 'hl=en&gl=US', domain: '.youtube.com', path: '/' });

  const rows = [];
  for (const q of args.queries) {
    const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q) + '&hl=en&gl=US';
    const got = await grab(page, url, 2);
    got.forEach(r => rows.push(Object.assign({ source: 'search:' + q }, r)));
    console.log(`search  ${q.padEnd(32)} ${got.length} cards`);
    await sleep(1400);   // deliberately unhurried: this is a research read, not a crawl
  }
  for (const c of args.channels) {
    const url = 'https://www.youtube.com/' + c + '/videos?hl=en&gl=US';
    const got = await grab(page, url, 4);
    got.forEach(r => rows.push(Object.assign({ source: 'channel:' + c }, r, { channel: r.channel || c })));
    console.log(`channel ${c.padEnd(32)} ${got.length} cards`);
    await sleep(1400);
  }
  await browser.close();
  return rows;
}

/* ---------- scoring ---------- */

const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; };

function score(rows) {
  // one row per video: the same video can appear in several queries
  const byId = new Map();
  rows.forEach(r => {
    const prev = byId.get(r.id);
    if (!prev) byId.set(r.id, Object.assign({ sources: [r.source] }, r));
    else { prev.sources.push(r.source); if (!prev.views && r.views) Object.assign(prev, { views: r.views, ageDays: r.ageDays, viewsRaw: r.viewsRaw, ageRaw: r.ageRaw }); }
  });
  const all = [...byId.values()].filter(r => r.views && r.ageDays);
  all.forEach(r => { r.viewsPerDay = Math.round(r.views / Math.max(r.ageDays, 1)); });

  const byChannel = new Map();
  all.forEach(r => { const k = r.channel.trim(); if (!byChannel.has(k)) byChannel.set(k, []); byChannel.get(k).push(r); });
  const medians = {};
  byChannel.forEach((list, ch) => { if (list.length >= 6) medians[ch] = median(list.map(r => r.viewsPerDay)); });
  all.forEach(r => {
    const m = medians[r.channel.trim()];
    r.channelMedian = m || null;
    r.outlier = m ? +(r.viewsPerDay / m).toFixed(2) : null;
  });
  // a channel with too small a sample still needs a rank: use its percentile among everything scraped
  const sorted = [...all].sort((a, b) => a.viewsPerDay - b.viewsPerDay);
  all.forEach(r => { r.vpdPercentile = +((sorted.indexOf(r) + 1) / sorted.length).toFixed(3); });
  all.forEach(r => { r.rank = r.outlier != null ? r.outlier : r.vpdPercentile * 2; });
  return { rows: all.sort((a, b) => b.rank - a.rank), medians };
}

/* ---------- stage 2: download ---------- */

function download(rows, into, n) {
  fs.mkdirSync(into, { recursive: true });
  let ok = 0;
  for (const r of rows.slice(0, n)) {
    const dest = path.join(into, r.id + '.jpg');
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { r.file = dest; ok++; continue; }
    for (const name of ['maxresdefault', 'hqdefault']) {
      try {
        execFileSync('curl', ['-sSL', '--fail', '-o', dest, `https://i.ytimg.com/vi/${r.id}/${name}.jpg`], { stdio: 'pipe' });
        if (fs.statSync(dest).size > 1000) { r.file = dest; r.thumbRes = name; ok++; break; }
      } catch (e) { /* maxres does not exist for every upload; fall through to hq */ }
    }
  }
  console.log(`downloaded ${ok}/${Math.min(n, rows.length)} thumbnails`);
  return ok;
}

/* ---------- stage 3: measure ---------- */

/* Everything here is a pixel fact. Word counts, subject type and whether an annotation is hand-drawn are
   read by eye off the contact sheet: no honest automated measure of those exists at this sample size. */
async function measure(rows) {
  const files = rows.filter(r => r.file);
  if (!files.length) return;
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.goto('about:blank');
  for (const r of files) {
    const b64 = fs.readFileSync(r.file).toString('base64');
    r.metrics = await page.evaluate(async (data) => {
      const img = new Image();
      img.src = 'data:image/jpeg;base64,' + data;
      await img.decode();
      // 168x94 is the sidebar size a viewer actually meets the thumbnail at
      const W = 168, H = 94, c = document.createElement('canvas');
      c.width = W; c.height = H;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0, W, H);
      const px = g.getImageData(0, 0, W, H).data;
      const lum = [], hue = [], sat = [];
      let warm = 0, cold = 0, red = 0, n = 0;
      for (let i = 0; i < px.length; i += 4) {
        const R = px[i] / 255, G = px[i + 1] / 255, B = px[i + 2] / 255;
        const mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn;
        let h = 0;
        if (d) h = mx === R ? 60 * (((G - B) / d) % 6) : mx === G ? 60 * ((B - R) / d + 2) : 60 * ((R - G) / d + 4);
        if (h < 0) h += 360;
        const s = mx ? d / mx : 0, l = .2126 * R + .7152 * G + .0722 * B;
        lum.push(l); hue.push(h); sat.push(s); n++;
        if (s > .35 && l > .2) { if (h < 70 || h > 300) warm++; else if (h > 170 && h < 280) cold++; }
        if (s > .45 && l > .25 && (h < 18 || h > 344)) red++;
      }
      const srt = [...lum].sort((a, b) => a - b);
      const q = f => srt[Math.floor(f * (srt.length - 1))];
      const cr = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      // the bright mass is the text; the dark mass is the ground it sits on
      const bright = q(.97), ground = q(.35);
      // where the weight sits: local contrast summed per vertical third
      const thirds = [0, 0, 0];
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        thirds[Math.min(2, Math.floor(x / (W / 3)))] += Math.abs(lum[i] - lum[i + 1]) + Math.abs(lum[i] - lum[i + W]);
      }
      const tot = thirds.reduce((a, b) => a + b, 0) || 1;
      // How many separate bright things are in the frame, and how big the biggest one is. Reading the
      // contact sheets, the thing that separates a hit from a miss is "two or three huge words" against
      // "eight small ones plus a screenshot", and that is a connected-component question: coarse the frame
      // down to 42x24 cells, mark the cells that are bright against their own ground, and count the blobs.
      const CW = 42, CH = 24, cell = new Array(CW * CH).fill(0);
      for (let cy = 0; cy < CH; cy++) for (let cx = 0; cx < CW; cx++) {
        let sum = 0, cnt = 0;
        for (let y = Math.floor(cy * H / CH); y < Math.floor((cy + 1) * H / CH); y++)
          for (let x = Math.floor(cx * W / CW); x < Math.floor((cx + 1) * W / CW); x++) { sum += lum[y * W + x]; cnt++; }
        cell[cy * CW + cx] = (sum / Math.max(cnt, 1)) > Math.max(.52, q(.5) + .22) ? 1 : 0;
      }
      let blobs = 0, biggest = 0;
      const seenCell = new Uint8Array(CW * CH);
      for (let i = 0; i < cell.length; i++) {
        if (!cell[i] || seenCell[i]) continue;
        blobs++;
        let size = 0; const stack = [i]; seenCell[i] = 1;
        while (stack.length) {
          const j = stack.pop(); size++;
          const jx = j % CW, jy = (j / CW) | 0;
          [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([ox, oy]) => {
            const nx = jx + ox, ny = jy + oy;
            if (nx < 0 || ny < 0 || nx >= CW || ny >= CH) return;
            const k = ny * CW + nx;
            if (cell[k] && !seenCell[k]) { seenCell[k] = 1; stack.push(k); }
          });
        }
        biggest = Math.max(biggest, size);
      }
      return {
        blobs, biggestBlob: biggest, brightCells: cell.reduce((a, b) => a + b, 0),
        meanLum: +(lum.reduce((a, b) => a + b, 0) / n).toFixed(3),
        p35: +ground.toFixed(3), p97: +bright.toFixed(3),
        contrast: +cr(bright, ground).toFixed(2),
        darkGround: ground < .18,
        warmPct: +(100 * warm / n).toFixed(1),
        coldPct: +(100 * cold / n).toFixed(1),
        redPct: +(100 * red / n).toFixed(1),
        meanSat: +(sat.reduce((a, b) => a + b, 0) / n).toFixed(3),
        weight: thirds.map(t => +(t / tot).toFixed(3)),
      };
    }, b64);
  }
  await browser.close();
  console.log(`measured ${files.length} thumbnails at 168x94`);
}

/* ---------- sheets ---------- */

function sheet(rows, file, tileW, cols) {
  const files = rows.filter(r => r.file).map(r => r.file);
  if (files.length < 2) return;
  const W = tileW, H = Math.round(tileW * 9 / 16);
  const layout = files.map((_, i) => `${(i % cols) * W}_${Math.floor(i / cols) * H}`).join('|');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...files.flatMap(f => ['-i', f]),
    '-filter_complex', files.map((_, i) => `[${i}:v]scale=${W}:${H},setsar=1[s${i}]`).join(';') + ';'
      + files.map((_, i) => `[s${i}]`).join('') + `xstack=inputs=${files.length}:layout=${layout}:fill=black`,
    path.join(OUT, file)]);
  console.log('wrote', path.relative(ROOT, path.join(OUT, file)), `(${files.length} tiles @ ${W}px)`);
}

/* ---------- main ---------- */

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let db = fs.existsSync(DATA) ? JSON.parse(fs.readFileSync(DATA, 'utf8')) : null;

  if (run('scrape')) {
    const raw = await scrape();
    const { rows, medians } = score(raw);
    db = { scrapedAt: new Date().toISOString(), queries: args.queries, channels: args.channels, cardsSeen: raw.length, channelMedians: medians, rows };
    fs.writeFileSync(DATA, JSON.stringify(db, null, 2));
    console.log(`\n${raw.length} cards → ${rows.length} scored videos, ${Object.keys(medians).length} channels with a usable median`);
  }
  if (!db) throw new Error('no data.json yet: run without --only, or with --only scrape first');

  /* Winners AND a control group, or the study proves nothing: a list of 60 hits shares whatever the whole
     niche does (dark grounds, big type), and only the contrast against 60 misses from the same channels
     says which of those traits actually separates them.
     Both sets are drawn from videos at least --min-age days old. viewsPerDay flatters a video that went up
     yesterday, because views arrive fastest in the first days and the rate decays afterwards; without the
     age floor the "winners" are just the newest uploads. */
  const n = args.limit || args.top;
  const mature = db.rows.filter(r => r.outlier != null && r.ageDays >= args.minAge).sort((a, b) => b.outlier - a.outlier);
  const sets = [
    { key: 'top', dir: path.join(OUT, 'thumbs'), rows: mature.slice(0, n) },
    { key: 'control', dir: path.join(OUT, 'thumbs-control'), rows: mature.slice(-n) },
  ];
  db.minAge = args.minAge;
  db.sets = {};

  for (const set of sets) {
    set.rows.forEach(r => { r.set = set.key; });
    if (run('download')) download(set.rows, set.dir, set.rows.length);
    if (run('measure')) {
      set.rows.forEach(r => { const f = path.join(set.dir, r.id + '.jpg'); if (fs.existsSync(f)) r.file = f; });
      await measure(set.rows);
      sheet(set.rows, `${set.key}-210.png`, 210, 8);   // the width a thumbnail is in the YouTube sidebar
      sheet(set.rows, `${set.key}-480.png`, 480, 6);   // big enough to read the type decisions
    }
    db.sets[set.key] = set.rows.map(r => r.id);
  }
  fs.writeFileSync(DATA, JSON.stringify(db, null, 2));
  const band = s => { const o = s.rows.map(r => r.outlier); return `${Math.min(...o).toFixed(2)}x – ${Math.max(...o).toFixed(2)}x`; };
  console.log(`\nwinners  ${sets[0].rows.length} thumbnails, ${band(sets[0])}`);
  console.log(`control  ${sets[1].rows.length} thumbnails, ${band(sets[1])}`);
})().catch(e => { console.error(e.message); process.exit(1); });
