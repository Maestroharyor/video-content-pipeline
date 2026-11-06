#!/usr/bin/env node
/* Layout probe: loads the deck, steps every slide to t=0.5 and t=1 and reports elements that leave the safe
   margins, overflow their box, or throw, and (both canvases) text a viewer cannot read: CONTRAST under WCAG AA against
   the paper it sits on, TINY type, TIGHT text crowding its panel's edge; and on a thumbnail project (PROJECT.thumbs) text or logos
   YouTube crops or covers (THUMB-SAFE/BADGE/HOVER, GRID.thumb) or too small to read small (THUMB-SMALL). Exit code 1 when anything is wrong. */
const { resolve } = require('../renderer/config');
const { parseArgs } = require('../renderer/args');
const { openDeck } = require('../renderer/browser');
const contrast = require('../renderer/contrast');
const args = parseArgs(process.argv.slice(2));
const cfg = resolve(args);

const SEL = ['.eyebrow', '.h1', '.foot', '.sub', '.chip', '.badge', '.rowbar', '.panel', '.code', '.aws', '.cbar', '.stack',
  '.hrow', '.bbox', '.node', '.chk', '.cmp', '.vpc', '.aws-menu', '.aws-modal', '.aws-flash'];
// smallest text a phone viewer can read at arm's length on the 1080-wide stage (project.probe.minPx overrides)
const MINPX = 28;
// readable text on every canvas (worst-week review 1: a stamp that vanished on the desk, labels jammed to the edge):
// WCAG AA 4.5:1 (3:1 for large text: 24px bold or 32px), no type under READ_PX stage px, text at least TIGHT_PX inside its panel
const READ_PX = 16, TIGHT_PX = 6;
const CLIP = ['.rowbar', '.chip', '.badge', '.aws-btn', '.aws-bill .bl', '.chk .tx'];

(async () => {
  const { browser, page, errors, slides } = await openDeck(cfg, { scale: 1 });   // review tooling works in CSS px / downscaled tiles: 1x is enough
  const bad = [];
  // the colour maths, shared with the test (renderer/contrast.js), defined in the page from its source
  await page.evaluate(`window.__contrast = (() => { ${Object.values(contrast).map(f => f.toString()).join('\n')}
    return { ${Object.keys(contrast).join(', ')} }; })()`);
  const P = cfg.project.probe || {};
  const sel = SEL.concat(P.sel || []);
  // project.probe.deep: selectors to overflow-check even though they are overflow:hidden (the property that makes
  // clipping invisible). project.probe.clip: extra selectors to test for horizontally truncated text.
  const deep = P.deep || [], clip = CLIP.concat(P.clip || []);
  for (const s of slides) {
    for (const t of [0.5, 1]) {
      const r = await page.evaluate((id, tt, sel, deep, clip, mobile, minpx, illus, READ_PX, TIGHT_PX, hookSel, thumbSkip) => {
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
        /* readability on every canvas, at the end pose: each visible text run outside a drawn UI (project.probe.illus) */
        if (tt === 1) {
          const { parseColor: rgba, composite: over, contrastRatio, minContrast } = window.__contrast;
          const stageBg = rgba(getComputedStyle(document.getElementById('stage')).backgroundColor) || [0, 0, 0, 1];
          const ownTxt = e => [...e.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
          sl.querySelectorAll('*').forEach(e => {
            const tn = ownTxt(e); if (!tn.length || e.closest('svg,.bgfx,.fx-emoji,.fx-burst,.caps') || (illus && e.closest(illus))) return;
            let vis = true, op = 1; for (let x = e; x && x !== sl; x = x.parentElement) { const c = getComputedStyle(x);
              if (c.display === 'none' || c.visibility === 'hidden') { vis = false; break; } op *= parseFloat(c.opacity); }
            const b = e.getBoundingClientRect(); if (!vis || op < .5 || b.width < 2 || b.height < 2) return;
            const cs = getComputedStyle(e), fg = rgba(cs.color); if (!fg || fg[3] < .5) return;
            const nm = (e.id || e.className.toString().slice(0, 20) || e.tagName.toLowerCase()) + ' "' + e.textContent.trim().slice(0, 18) + '"';
            const px = parseFloat(cs.fontSize) * (e.offsetWidth ? b.width / e.offsetWidth : 1);
            if (px < READ_PX - .5) out.push('TINY ' + nm + ' ' + px.toFixed(1) + 'px');
            // the paper under the text: the nearest ancestor with a solid enough fill; a gradient or image fill is unknown, so skip
            let bg = null, panel = null;
            for (let x = e; x; x = x.parentElement) { const c = getComputedStyle(x), k = rgba(c.backgroundColor);
              if (c.backgroundImage !== 'none' && (!k || k[3] < .5)) return;
              if (k && k[3] >= .5) { bg = k[3] < 1 ? over(k, stageBg) : k; panel = x; break; } }
            bg = bg || stageBg;
            const ratio = contrastRatio(fg, bg);
            if (ratio < minContrast(px, parseInt(cs.fontWeight, 10))) out.push('CONTRAST ' + nm + ' ' + ratio.toFixed(2) + ':1');
            // an inline highlight (a marked word inside a line) hugs its text on purpose: only block panels are checked
            if (panel && panel !== sl && panel.id !== 'stage' && !panel.classList.contains('slide') && getComputedStyle(panel).display !== 'inline') {
              const r = document.createRange(); r.setStartBefore(tn[0]); r.setEndAfter(tn[tn.length - 1]);
              const t2 = r.getBoundingClientRect(), p2 = panel.getBoundingClientRect(), k = p2.width / (panel.offsetWidth || p2.width);
              const gap = Math.min(t2.left - p2.left, p2.right - t2.right, t2.top - p2.top, p2.bottom - t2.bottom) / (k || 1);
              if (t2.width && gap < TIGHT_PX - .5) out.push('TIGHT ' + nm + ' ' + gap.toFixed(1) + 'px from its panel edge');
            }
          });
        }
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
            let b = e.getBoundingClientRect(); if (!seen(e, b)) return;
            // what an overflow-clipping ancestor hides is not on screen (a long page scrolled inside a browser viewport)
            for (let x = e.parentElement; x && x !== sl; x = x.parentElement) { const o = getComputedStyle(x).overflow;
              if (o !== 'visible') { const r = x.getBoundingClientRect(), L = Math.max(b.left, r.left), T = Math.max(b.top, r.top);
                b = { left: L, top: T, right: Math.max(L, Math.min(b.right, r.right)), bottom: Math.max(T, Math.min(b.bottom, r.bottom)), width: 0 };
                b.width = b.right - b.left; } }
            if (b.width < 2 || b.bottom - b.top < 2) return;
            const nm = (e.id || e.className.toString().slice(0, 20) || e.tagName.toLowerCase()) + (isTxt ? ' "' + e.textContent.trim().slice(0, 18) + '"' : '');
            if (b.left < M.l - 1 || b.right > M.r + 1 || b.top < M.t - 1 || b.bottom > M.b + 1)
              out.push('UNSAFE ' + nm + ' [' + [b.left, b.top, b.right, b.bottom].map(Math.round).join(',') + ']');
            // project.probe.illus: text inside a drawn UI (a browser page, an app's chrome) is illustration detail, sized
            // like the real UI; it must stay on screen but is not held to the reading size
            if (isTxt && e.offsetWidth && !(illus && e.closest(illus))) {
              const px = parseFloat(getComputedStyle(e).fontSize) * b.width / e.offsetWidth;
              if (px < minpx - .5) out.push('SMALL ' + nm + ' ' + px.toFixed(1) + 'px');
            }
          });
        }
        /* a thumbnail (GRID.thumb): every visible text run and logo inside the crop-safe box and out of the duration-badge
           and hover-icon corners, the hook big enough for the sidebar, every other word big enough for the home feed.
           The ground and the channel mark are exempt (project.probe.thumbSkip) */
        const T = window.GRID.thumb;
        if (T && tt === 1) {
          const skip = thumbSkip.join(',');
          const own = e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
          sl.querySelectorAll('*').forEach(e => {
            if (e.closest('svg') && e.tagName !== 'svg' || e.closest(skip)) return;
            const isImg = e.tagName === 'IMG', isTxt = own(e);
            if (!isImg && !isTxt) return;
            let op = 1; for (let x = e; x && x !== sl; x = x.parentElement) { const c = getComputedStyle(x);
              if (c.display === 'none' || c.visibility === 'hidden') return; op *= parseFloat(c.opacity); }
            const b = e.getBoundingClientRect(); if (op < .3 || b.width < 2 || b.height < 2) return;
            // a text box is often wider than its words (a centred title spans the stage): measure the words themselves
            let r = b;
            if (isTxt) { const rg = document.createRange(); rg.selectNodeContents(e); r = rg.getBoundingClientRect(); }
            const nm = (e.id || e.className.toString().slice(0, 20) || e.tagName.toLowerCase()) + (isTxt ? ' "' + e.textContent.trim().slice(0, 18) + '"' : ' ' + (e.getAttribute('src') || '').split('/').pop());
            const at = ' [' + [r.left, r.top, r.right, r.bottom].map(Math.round).join(',') + ']';
            if (r.left < T.box.l - 1 || r.right > T.box.r + 1 || r.top < T.box.t - 1 || r.bottom > T.box.b + 1) out.push('THUMB-SAFE ' + nm + at);
            if (r.right > T.badge.l && r.bottom > T.badge.t) out.push('THUMB-BADGE ' + nm + at);
            if (r.right > T.hover.l && r.top < T.hover.b) out.push('THUMB-HOVER ' + nm + at);
            if (isTxt && e.offsetWidth) {
              const px = parseFloat(getComputedStyle(e).fontSize) * b.width / e.offsetWidth, hook = e.closest(hookSel);
              const min = hook ? T.hookPx : T.textPx;
              if (px < min - .5) out.push('THUMB-SMALL ' + nm + ' ' + px.toFixed(0) + 'px < ' + min + (hook ? ' (hook)' : ''));
            }
          });
        }
        return out;
      }, s.id, t, sel, deep, clip, P.mobile !== false, P.minPx || MINPX, (P.illus || []).join(',') || null, P.readPx || READ_PX, P.tightPx != null ? P.tightPx : TIGHT_PX,
        P.hook || '.pt-title', P.thumbSkip || ['.pt-mark', '.pt-ground']);
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
