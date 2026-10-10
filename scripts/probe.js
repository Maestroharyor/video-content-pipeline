#!/usr/bin/env node
/* Layout probe: loads the deck, steps every slide to t=0.5 and t=1 and reports elements that leave the safe
   margins, overflow their box, or throw. Exit code 1 when anything is wrong. */
const { resolve } = require('../renderer/config');
const { parseArgs } = require('../renderer/args');
const { openDeck } = require('../renderer/browser');
const args = parseArgs(process.argv.slice(2));
const cfg = resolve(args);

const SEL = ['.eyebrow', '.h1', '.foot', '.sub', '.chip', '.badge', '.rowbar', '.panel', '.code', '.aws', '.cbar', '.stack',
  '.hrow', '.bbox', '.node', '.chk', '.cmp', '.vpc', '.aws-menu', '.aws-modal', '.aws-flash'];
// smallest text a phone viewer can read at arm's length on the 1080-wide stage (project.probe.minPx overrides)
const MINPX = 28;
const CLIP = ['.rowbar', '.chip', '.badge', '.aws-btn', '.aws-bill .bl', '.chk .tx'];

(async () => {
  const { browser, page, errors, slides } = await openDeck(cfg, { scale: 1 });   // review tooling works in CSS px / downscaled tiles: 1x is enough
  const bad = [];
  const P = cfg.project.probe || {};
  const sel = SEL.concat(P.sel || []);
  // project.probe.deep: selectors to overflow-check even though they are overflow:hidden (the property that makes
  // clipping invisible). project.probe.clip: extra selectors to test for horizontally truncated text.
  const deep = P.deep || [], clip = CLIP.concat(P.clip || []);
  for (const s of slides) {
    for (const t of [0.5, 1]) {
      const r = await page.evaluate((id, tt, sel, deep, clip, mobile, minpx) => {
        window.setFrame(id, tt);
        const out = [];
        const sl = document.getElementById(id);
        sel.forEach(q => sl.querySelectorAll(q).forEach(e => {
          const cs = getComputedStyle(e);
          if (parseFloat(cs.opacity) < 0.03) return;
          const b = e.getBoundingClientRect();
          if (b.width < 2 || b.height < 2) return;
          const nm = e.id || e.className.toString().slice(0, 26);
          const S = window.GRID.safe;
          if (tt === 1 && (b.left < S.l || b.right > S.r || b.top < S.t || b.bottom > S.b))   // entrances may start off-grid mid-motion
            out.push('MARGIN ' + nm + ' [' + [b.left, b.top, b.right, b.bottom].map(Math.round).join(',') + ']');
          if ((cs.overflow !== 'hidden' || deep.some(q => e.matches(q))) && !e.classList.contains('aws-tbl')) {
            if (e.scrollWidth > e.clientWidth + 3) out.push('OVERFLOW-X ' + nm + ' ' + e.scrollWidth + '>' + e.clientWidth);
            if (e.scrollHeight > e.clientHeight + 8 && !e.classList.contains('vpc')) out.push('OVERFLOW-Y ' + nm + ' ' + e.scrollHeight + '>' + e.clientHeight);
          }
        }));
        // text clipped inside console cells / rowbars (side-nav links ellipsize on purpose, so they are not checked)
        sl.querySelectorAll(clip.join(', ')).forEach(e => {
          if (parseFloat(getComputedStyle(e).opacity) < .03) return;
          if (e.scrollWidth > e.clientWidth + 3) out.push('CLIP ' + (e.id || e.className.toString().slice(0, 20)) + ' "' + e.textContent.trim().slice(0, 24) + '" ' + e.scrollWidth + '>' + e.clientWidth);
        });
        /* vertical: every visible text run and logo inside the phone's safe zone (GRID.mobile), not only the selectors
           above (a timeline's axis label hung off the left edge unchecked), and large enough to read on a phone:
           MINPX rendered px after every scale (vfit, a template's own) */
        const M = window.GRID.mobile;
        if (M && tt === 1 && mobile) {
          const own = e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
          const seen = (e, b) => { for (let x = e; x && x !== sl; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden' || parseFloat(c.opacity) < .3) return false; }
            return b.width >= 2 && b.height >= 2 && b.right > 0 && b.left < window.GRID.w; };
          // stickers pop in and out on their beat, so they are often gone by the end pose: check where they sit, whatever their opacity
          sl.querySelectorAll('.fx-emoji').forEach(e => { const b = e.getBoundingClientRect();
            if (b.width && (b.left < M.l - 1 || b.right > M.r + 1 || b.top < M.t - 1 || b.bottom > M.b + 1)) out.push('UNSAFE ' + e.id + ' (sticker) [' + [b.left, b.top, b.right, b.bottom].map(Math.round).join(',') + ']'); });
          sl.querySelectorAll('*').forEach(e => {
            if (e.closest('svg') && e.tagName !== 'svg' || e.closest('.bgfx,.fx-emoji,.fx-burst,.caps')) return;
            const isImg = e.tagName === 'IMG', isTxt = own(e);
            if (!isImg && !isTxt) return;
            const b = e.getBoundingClientRect(); if (!seen(e, b)) return;
            const nm = (e.id || e.className.toString().slice(0, 20) || e.tagName.toLowerCase()) + (isTxt ? ' "' + e.textContent.trim().slice(0, 18) + '"' : '');
            if (b.left < M.l - 1 || b.right > M.r + 1 || b.top < M.t - 1 || b.bottom > M.b + 1)
              out.push('UNSAFE ' + nm + ' [' + [b.left, b.top, b.right, b.bottom].map(Math.round).join(',') + ']');
            if (isTxt && e.offsetWidth) {
              const px = parseFloat(getComputedStyle(e).fontSize) * b.width / e.offsetWidth;
              if (px < minpx - .5) out.push('SMALL ' + nm + ' ' + px.toFixed(1) + 'px');
            }
          });
        }
        return out;
      }, s.id, t, sel, deep, clip, P.mobile !== false, P.minPx || MINPX);
      r.forEach(x => bad.push(s.slug + ' t=' + t + '  ' + x));
    }
  }
  await browser.close();
  errors.forEach(e => console.log(e));
  const uniq = [...new Set(bad)];
  uniq.forEach(x => console.log(x));
  console.log('--- probe ' + cfg.slug + ' (' + cfg.canvas + '): ' + slides.length + ' slides, ' + uniq.length + ' layout issues, ' + errors.length + ' load errors');
  process.exit(uniq.length || errors.length ? 1 : 0);
})();
