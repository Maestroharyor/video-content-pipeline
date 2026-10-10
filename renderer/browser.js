/* Launch headless Chrome via Puppeteer and open the deck in a known, fully-loaded state.
   openDeck(cfg, opts) → { browser, page, errors, slides }      (one page, the classic entry point)
   launchBrowser() + openPage(browser, cfg, opts)               (several pages of one browser for the capture pool)
   opts.inject = { TIMELINE, CAPTIONS, VARS } are set on window before any script runs (file:// pages cannot fetch JSON). */
const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');
const { loadTimeline } = require('./timeline');

const FONTS = ['400 30px Inter', '700 30px Inter', '500 30px ID', '700 30px ID', '800 30px ID', '900 30px ID', '400 30px JB', '700 30px JB', '400 30px OS', '700 30px OS'];

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb', '--font-render-hinting=none',
      '--disable-gpu-vsync', '--hide-scrollbars', '--disable-lcd-text'],
  });
}
/* what a project injects by default: its timeline.json and captions.json (when captions are on) */
function defaultInject(cfg) {
  const inj = {};
  const tl = cfg.projectDir ? loadTimeline(cfg.projectDir) : null;
  if (tl) inj.TIMELINE = tl;
  if (cfg.vars && Object.keys(cfg.vars).length) inj.VARS = cfg.vars;
  if (cfg.variant) inj.VARIANT = cfg.variant;   // core/grid.js lays PROJECT[VARIANT] over the base settings
  const caps = cfg.projectDir ? path.join(cfg.projectDir, 'captions.json') : null;
  const on = cfg.project && cfg.project.captions && cfg.project.captions.on;
  if (on && caps && fs.existsSync(caps)) inj.CAPTIONS = JSON.parse(fs.readFileSync(caps, 'utf8'));
  return inj;
}
async function openPage(browser, cfg, opts = {}) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  page.on('requestfailed', r => errors.push('REQUESTFAILED ' + r.url()));
  await page.setViewport({ width: cfg.width, height: cfg.height, deviceScaleFactor: opts.scale || cfg.scale || 1 });   // cfg.scale = the output resolution (renderer/project.js RES)
  const inject = opts.inject === undefined ? defaultInject(cfg) : (opts.inject || {});
  if (Object.keys(inject).length) await page.evaluateOnNewDocument(inj => { for (const k in inj) window[k] = inj[k]; }, inject);
  const url = pathToFileURL(path.resolve(cfg.deck)).href + (opts.canvas || cfg.canvas ? '?canvas=' + (opts.canvas || cfg.canvas) : '') + (cfg.variant ? '&variant=' + cfg.variant : '');
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    // every image must be decoded before the first capture
    await Promise.all([...document.images].map(img => img.complete && img.naturalWidth > 0 ? null :
      new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('image failed ' + img.src)); })));
  });
  try { await page.waitForFunction('window.DECK_READY === true', { timeout: 15000 }); }
  catch (e) { errors.push('DECK_READY never set (a slide threw while building)'); }
  // force every face the deck uses to load (hidden slides do not trigger font loading on their own)
  const fontReport = await page.evaluate(async (fonts) => {
    await Promise.all(fonts.map(f => document.fonts.load(f)));
    return fonts.map(f => [f, document.fonts.check(f)]);
  }, FONTS);
  const missing = fontReport.filter(f => !f[1]).map(f => f[0]);
  if (missing.length) errors.push('FONTS not loaded: ' + missing.join(', '));
  if (opts.transparent) await page.evaluate(() => { document.getElementById('stage').classList.add('transparent'); document.documentElement.classList.add('transparent'); document.body.classList.add('transparent'); });   // html+body too: omitBackground only clears the default white
  // caption-only pass: everything on the stage but #caps is hidden, so the capture is the caption band on alpha
  if (opts.capsOnly) await page.evaluate(() => document.getElementById('stage').classList.add('caps-only'));
  await page.evaluate(() => window.OVERLAY && window.OVERLAY.warm());   // overlay decks measure every end pose now, never mid-capture
  const slides = await page.evaluate(() => window.SLIDES);
  return { page, errors, slides, inject };
}
async function openDeck(cfg, opts = {}) {
  const browser = await launchBrowser();
  const r = await openPage(browser, cfg, opts);
  return Object.assign({ browser }, r);
}
module.exports = { openDeck, launchBrowser, openPage, defaultInject, FONTS };
