/* Browser-level tests for the timeline render path on the template-gallery fixture (fps 10 to stay fast):
   setTime/transitions/exit transform, clip ≡ timeline equivalence, background drift determinism, captions,
   the parallel capture pool (identical pixels across browsers) and the one-pass encode with voiceover + bed. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { resolve } = require('../renderer/config');
const { openDeck } = require('../renderer/browser');
const { captureTimeline } = require('../renderer/assemble');
const { assembleMp4 } = require('../renderer/video');
const TL = require('../core/timeline');

const ROOT = path.resolve(__dirname, '..');
const PROJ = path.join(ROOT, 'projects', 'template-gallery');
const tl = JSON.parse(fs.readFileSync(path.join(PROJ, 'timeline.json'), 'utf8'));
const caps = JSON.parse(fs.readFileSync(path.join(PROJ, 'captions.json'), 'utf8'));
const probe = (f, ...a) => execFileSync('ffprobe', ['-v', 'error', ...a, f]).toString().trim();

test('setTime: layout, exit transform inside the transition tail, clean frames elsewhere, clip/timeline equivalence, bg + captions', async () => {
  const cfg = resolve({ project: 'template-gallery', fps: 10, res: '1080p' });
  const { browser, page, errors, slides } = await openDeck(cfg, { inject: { TIMELINE: tl, CAPTIONS: caps } });
  try {
    assert.deepStrictEqual(errors, []);
    assert.strictEqual(slides[0].start, 0); assert.strictEqual(slides[1].start, 3); assert.strictEqual(slides[0].motion, 2);
    const L = TL.layout(slides, tl);
    // inside the exit tail of slide 1 (2.6..3.0): one slide on, root faded + moved
    const tail = await page.evaluate(() => { const r = window.setTime(2.8); const on = [...document.querySelectorAll('.slide.on')]; return { r, n: on.length, op: on[0].style.opacity, tf: on[0].style.transform }; });
    assert.strictEqual(tail.n, 1); assert.ok(tail.r.out > 0 && tail.r.out < 1, JSON.stringify(tail.r));
    assert.ok(+tail.op < 1 && /translateY\(-/.test(tail.tf), JSON.stringify(tail));
    // right after the cut: the next slide, clean root, blank-ish first frame of its own
    const cut = await page.evaluate(() => { const r = window.setTime(3.0); const on = [...document.querySelectorAll('.slide.on')]; return { r, n: on.length, id: on[0].id, css: on[0].style.cssText }; });
    assert.strictEqual(cut.n, 1); assert.strictEqual(cut.id, 's02'); assert.strictEqual(cut.r.out, 0); assert.strictEqual(cut.css, '');
    // the clip contract and the timeline agree on the slide's own DOM
    const eq = await page.evaluate((id, start, motion) => { window.setFrame(id, .5); const a = document.getElementById(id).innerHTML; window.setTime(start + .5 * motion); return a === document.getElementById(id).innerHTML; }, 's02', L[1].start, L[1].motion);
    assert.ok(eq, 'setFrame(id,t) must equal setTime(start + t*motion)');
    // beats: a slide with word beats keeps clip/timeline parity and its rows enter on their beats (s04: r1 9.3, r2 9.9, r3 10.5), s05 uses numeric slide beats
    for (const [id, i] of [['s04', 3], ['s05', 4]]) {
      const ok = await page.evaluate((id, start, motion) => { window.setFrame(id, .5); const a = document.getElementById(id).innerHTML; window.setTime(start + .5 * motion); return a === document.getElementById(id).innerHTML; }, id, L[i].start, L[i].motion);
      assert.ok(ok, id + ': setFrame(id,t) must equal setTime(start + t*motion) with beats');
    }
    assert.strictEqual(L[3].motion, 2.5);   // last beat 1.5 + 1.0 tail (authored motion 2)
    const bt = await page.evaluate(() => { const op = id => document.getElementById(id).style.opacity;
      window.setTime(9.2); const a = [op('s04-r1'), op('s04-r2')]; window.setTime(9.75); const b = [op('s04-r1'), op('s04-r2')]; window.setTime(10.95); const c = [op('s04-r1'), op('s04-r3')];
      window.setTime(12.75); const d = [op('s05-r1'), op('s05-r2')]; window.setFrame('s04', 1); const e = [op('s04-r1'), op('s04-r3')]; return { a, b, c, d, e }; });
    assert.deepStrictEqual(bt.a, ['0', '0']);                                   // before the first beat nothing has entered
    assert.ok(+bt.b[0] === 1 && +bt.b[1] === 0, JSON.stringify(bt.b));          // r1 settled, r2 not yet (beat at 9.9)
    assert.ok(+bt.c[0] > 0.45 && +bt.c[0] < 0.6 && +bt.c[1] === 1, JSON.stringify(bt.c));   // r1 dimmed to ~.5 once r3 fired, r3 settled
    assert.ok(+bt.d[0] === 1 && +bt.d[1] === 0, JSON.stringify(bt.d));          // numeric beats: r1 (.3) settled, r2 (.8) not yet
    assert.deepStrictEqual(bt.e, ['0.5', '1']);                                  // end pose: every row visible, earlier ones dimmed
    // background drift is deterministic and moves
    const bg = await page.evaluate(() => { const g = document.querySelector('.bgfx .glow.a'); window.bgFrame(10); const a = g.style.transform; window.bgFrame(0); const z = g.style.transform; window.bgFrame(10); return { a, z, b: g.style.transform }; });
    assert.strictEqual(bg.a, bg.b); assert.notStrictEqual(bg.a, bg.z);
    // captions: current word highlighted, box hidden between groups
    const cp = await page.evaluate(() => { window.setTime(1.5); const b = document.getElementById('caps'); const now = b.querySelector('.now'); const op1 = b.style.opacity; window.setTime(35.9); return { now: now && now.textContent, op1, op2: b.style.opacity }; });
    assert.strictEqual(cp.now, 'template'); assert.strictEqual(cp.op1, '1'); assert.strictEqual(cp.op2, '0');
  } finally { await browser.close(); }
});

test('overlay decks: the first rendered frame of a slide is the requested frame, not the measuring pose', async () => {
  const cfg = resolve({ project: 'template-gallery', fps: 10, res: '1080p' });
  const { browser, page, errors } = await openDeck(cfg, { inject: { TIMELINE: tl, OVERLAY_OPTS: { pad: 48, align: 'v' } } });
  try {
    assert.deepStrictEqual(errors, []);
    const r = await page.evaluate(() => {
      const op = id => document.getElementById(id).style.opacity, top = id => document.getElementById(id).style.top;
      const n = window.OVERLAY.warm();
      window.setFrame('s02', 0); const a = [op('s02-q'), top('s02'), !!document.getElementById('s02-ovl')];
      window.setFrame('s02', 0); const b = [op('s02-q'), top('s02')];
      window.setTime(2.9); window.setTime(3.0); const c = [op('s02-q'), document.querySelector('.slide.on').id, top('s02')];
      window.setTime(5.5); const d = op('s02-q');
      return { n, a, b, c, d };
    });
    assert.strictEqual(r.n, 12);
    assert.deepStrictEqual(r.a.slice(0, 1), ['0']); assert.ok(r.a[2]); assert.strictEqual(r.a[1], r.b[1]);   // frame 0 is frame 0, card present, fit stable
    assert.deepStrictEqual(r.c, ['0', 's02', r.a[1]]);                                                    // the cut frame is a real frame 0
    assert.strictEqual(r.d, '1');
  } finally { await browser.close(); }
});

test('parallel capture produces identical frames per browser, and the one-pass encode muxes voiceover + bed', async () => {
  const cfg = resolve({ project: 'template-gallery', fps: 10, res: '1080p', preset: 'ultrafast' });
  cfg.preset = 'ultrafast';
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vid-asm-'));
  try {
    const { browser, slides } = await openDeck(cfg, { inject: { TIMELINE: tl } }); await browser.close();
    const L = TL.layout(slides, tl);
    const inject = { TIMELINE: tl, CAPTIONS: caps };
    const a = await captureTimeline(cfg, L, { dir: path.join(tmp, 'a'), jobs: 2, inject, to: 1.2 });
    const b = await captureTimeline(cfg, L, { dir: path.join(tmp, 'b'), jobs: 1, inject, to: 1.2 });
    assert.strictEqual(a.to, 12); assert.strictEqual(fs.readdirSync(a.dir).filter(f => f.endsWith('.png')).length, 12);
    // a cold browser and a warm one may differ by a pixel of compositor noise; anything visible would be far below 60 dB
    for (const f of ['00003.png', '00009.png']) {
      const r = spawnSync('ffmpeg', ['-hide_banner', '-i', path.join(a.dir, f), '-i', path.join(b.dir, f), '-lavfi', 'psnr', '-f', 'null', '-']);
      const m = /average:(inf|[\d.]+)/.exec(r.stderr.toString() + r.stdout.toString());
      const db = m ? (m[1] === 'inf' ? Infinity : +m[1]) : NaN;
      assert.ok(db >= 60, 'frame ' + f + ' differs between browsers (psnr ' + db + ')');
    }
    // silent 1.2s "voiceover" + a bed at 0.5s
    const vo = path.join(tmp, 'vo.wav');
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', '1.2', vo]);
    const out = assembleMp4(a.dir, cfg, { out: path.join(tmp, 'final.mp4'), total: 1.2, vo, beds: [{ file: path.join(ROOT, 'assets', 'audio', 'pop.wav'), at: 0.5 }] });
    assert.strictEqual(probe(out, '-select_streams', 'v', '-show_entries', 'stream=nb_frames,r_frame_rate,width,height', '-of', 'csv=p=0'), '1080,1920,10/1,12');
    assert.strictEqual(probe(out, '-select_streams', 'a', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0'), 'aac');
    assert.ok(Math.abs(+probe(out, '-show_entries', 'format=duration', '-of', 'csv=p=0') - 1.2) < 0.15);
    // a range is its own finished clip: frames 5..9 only, audio cut to match, first frame = the timeline's frame at `from`
    const cut = assembleMp4(a.dir, cfg, { out: path.join(tmp, 'cut.mp4'), total: 1.2, vo, beds: [{ file: path.join(ROOT, 'assets', 'audio', 'pop.wav'), at: 0.5 }], range: { from: 0.5, to: 1.0 } });
    assert.strictEqual(probe(cut, '-select_streams', 'v', '-show_entries', 'stream=nb_frames', '-of', 'csv=p=0'), '5');
    assert.ok(Math.abs(+probe(cut, '-show_entries', 'format=duration', '-of', 'csv=p=0') - 0.5) < 0.15);
    const pr = spawnSync('ffmpeg', ['-hide_banner', '-i', cut, '-i', path.join(a.dir, '00005.png'), '-lavfi', '[0:v]trim=end_frame=1[x];[x][1:v]psnr', '-f', 'null', '-']);
    const pm = /average:(inf|[\d.]+)/.exec(pr.stderr.toString());
    assert.ok(pm && (pm[1] === 'inf' || +pm[1] >= 30), 'first frame of the cut is not the frame at --from (psnr ' + (pm && pm[1]) + ')');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
