/* End-to-end checks for the render pipeline, using projects/template-gallery as the fixture in both canvases.
   Renders one short slide at a low fps into a temp dir and inspects the outputs with ffprobe.   Run: npm test */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { resolve } = require('../renderer/config');
const { openDeck } = require('../renderer/browser');
const { captureSlide } = require('../renderer/capture');
const { mp4, webm } = require('../renderer/video');
const { gif } = require('../renderer/gif');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vid-test-'));
const mk = canvas => resolve({ project: 'template-gallery', canvas, fps: 10, outputDir: path.join(tmp, canvas, 'renders'), frameDir: path.join(tmp, canvas, 'frames') });

function probe(file, decoder) {
  // VP9 alpha lives in Matroska block-additions; only the libvpx decoder reports it as yuva420p
  const out = execFileSync('ffprobe', ['-v', 'error', ...(decoder ? ['-c:v', decoder] : []), '-select_streams', 'v:0', '-show_entries',
    'stream=width,height,r_frame_rate,pix_fmt,codec_name,nb_frames,color_space,color_primaries,color_transfer,color_range:stream_tags=alpha_mode:format=duration', '-of', 'json', file]).toString();
  const j = JSON.parse(out); return Object.assign({}, j.streams[0], { duration: +j.format.duration });
}

for (const canvas of ['vertical', 'horizontal']) {
  test(`gallery loads on the ${canvas} canvas: assets resolve, fonts load, grid matches the stage, frames are deterministic`, async () => {
    const cfg = Object.assign(mk(canvas), { preset: 'ultrafast' });
    const { browser, page, errors, slides } = await openDeck(cfg);
    try {
      assert.deepStrictEqual(errors, [], 'page load errors');
      assert.ok(slides.length >= 10, 'gallery slides registered');
      const geo = await page.evaluate(() => { const r = document.getElementById('stage').getBoundingClientRect(); return { w: r.width, h: r.height, g: window.GRID.canvas, gw: window.GRID.w, gh: window.GRID.h }; });
      assert.deepStrictEqual([geo.w, geo.h, geo.g], [cfg.width, cfg.height, canvas], 'stage size follows the canvas');
      assert.deepStrictEqual([geo.gw, geo.gh], [cfg.width, cfg.height], 'GRID matches the renderer config');
      const broken = (await page.evaluate(() => [...document.images].map(i => [i.getAttribute('src'), i.naturalWidth]))).filter(i => !(i[1] > 0));
      assert.deepStrictEqual(broken, [], 'all <img> assets decode');
      assert.ok(await page.evaluate(() => ['800 30px ID', '400 30px Inter', '400 30px JB', '400 30px OS'].every(f => document.fonts.check(f))), 'deck fonts loaded');
      for (const s of slides) for (const t of [0, .5, 1]) await page.evaluate((id, tt) => window.setFrame(id, tt), s.id, t);
      const first = slides[0].id;
      const a = await page.evaluate(id => { window.setFrame(id, .5); return document.getElementById(id).innerHTML; }, first);
      await page.evaluate(id => window.setFrame(id, 1), first);
      const b = await page.evaluate(id => { window.setFrame(id, .5); return document.getElementById(id).innerHTML; }, first);
      assert.strictEqual(a, b, 'setFrame is deterministic');
      // safe-area probe at t=1 for every slide
      const viol = await page.evaluate(() => {
        const S = window.GRID.safe, out = [];
        for (const s of window.SLIDES) {
          window.setFrame(s.id, 1);
          document.querySelectorAll('#' + s.id + ' .eyebrow, #' + s.id + ' .h1, #' + s.id + ' .foot, #' + s.id + ' .sub, #' + s.id + ' .badge, #' + s.id + ' .aws, #' + s.id + ' .cbar, #' + s.id + ' .cmp, #' + s.id + ' .chk, #' + s.id + ' .bbox').forEach(e => {
            if (parseFloat(getComputedStyle(e).opacity) < .03) return;
            const b = e.getBoundingClientRect(); if (b.width < 2) return;
            if (b.left < S.l || b.right > S.r || b.top < S.t || b.bottom > S.b) out.push(s.slug + ' ' + (e.id || e.className));
          });
        }
        return out;
      });
      assert.deepStrictEqual(viol, [], 'every template stays inside the safe area');
    } finally { await browser.close(); }
  });
}

test('frames, gif, mp4 and alpha webm have the right geometry and timing (vertical + horizontal mp4)', async () => {
  for (const canvas of ['vertical', 'horizontal']) {
    const cfg = Object.assign(mk(canvas), { preset: 'ultrafast' });
    const { browser, page, slides } = await openDeck(cfg);
    const slide = slides.find(s => s.dur <= 2) || slides[0];
    let dir, frames;
    try { ({ dir, frames } = await captureSlide(page, slide, cfg)); } finally { await browser.close(); }
    assert.strictEqual(frames, Math.round(slide.dur * cfg.fps), 'frame count = dur * fps');
    const m = mp4(dir, slide.slug, cfg);
    const pm = probe(m);
    assert.strictEqual(pm.codec_name, 'h264');
    // the gallery renders at the canvas default resolution: 2k (4/3x) vertical, 4k (2x) horizontal
    assert.deepStrictEqual([cfg.outWidth, cfg.outHeight], canvas === 'vertical' ? [1440, 2560] : [3840, 2160], canvas + ' default resolution');
    assert.deepStrictEqual([pm.width, pm.height], [cfg.outWidth, cfg.outHeight], canvas + ' mp4 geometry = stage x scale');
    assert.deepStrictEqual([pm.color_space, pm.color_primaries, pm.color_transfer, pm.color_range], ['bt709', 'bt709', 'bt709', 'tv'], 'mp4 is tagged BT.709');
    assert.strictEqual(pm.r_frame_rate, cfg.fps + '/1', 'mp4 frame rate');
    assert.ok(Math.abs(pm.duration - (slide.dur + cfg.hold)) < 0.15, 'mp4 duration ~ dur + hold (' + pm.duration + ')');
    if (canvas === 'vertical') {
      const g = gif(dir, slide.slug, cfg);
      const pg = probe(g);
      assert.deepStrictEqual([pg.width, pg.height], [Math.round(cfg.width * cfg.gifScale), Math.round(cfg.height * cfg.gifScale)], 'gif geometry');
      assert.strictEqual(pg.r_frame_rate, cfg.gifFps + '/1', 'gif frame rate');
      assert.ok(Math.abs(pg.duration - (slide.dur + cfg.hold)) < 0.2, 'gif duration ~ dur + hold (' + pg.duration + ')');
      const t = await openDeck(cfg, { transparent: true });
      let adir;
      try { ({ dir: adir } = await captureSlide(t.page, slide, cfg, { transparent: true })); } finally { await t.browser.close(); }
      const w = webm(adir, slide.slug, cfg);
      assert.strictEqual(probe(w, 'libvpx-vp9').pix_fmt, 'yuva420p', 'webm carries alpha');
      assert.strictEqual(probe(w).tags && probe(w).tags.alpha_mode, '1', 'alpha_mode tag set');
    }
  }
});

test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
