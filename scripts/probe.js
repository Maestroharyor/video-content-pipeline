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
        /* OVERLAP (reverse-proxy review 2, "No overlap. Add to pipeline"): no text may run into other text (a pill laid on
           a pill, a chip over code), and no drawn line (a diagram edge) may cross a label. Text is measured as its words
           (a range), clipped by any overflow-hidden ancestor (code scrolled out of an editor is not on screen), at both
           probe times. A run inside the same block as the other (a word inside its own line) is not a collision. */
        {
          const runs = [];
          sl.querySelectorAll('*').forEach(e => {
            const tn = [...e.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim());
            if (!tn.length || e.closest('svg,.bgfx,.fx-emoji,.fx-burst,.caps')) return;
            let op = 1; for (let x = e; x && x !== sl; x = x.parentElement) { const c = getComputedStyle(x);
              if (c.display === 'none' || c.visibility === 'hidden') return; op *= parseFloat(c.opacity); }
            if (op < .5) return;
            const rg = document.createRange(); rg.setStartBefore(tn[0]); rg.setEndAfter(tn[tn.length - 1]);
            let b = rg.getBoundingClientRect(); if (b.width < 2 || b.height < 2) return;
            b = { l: b.left, t: b.top, r: b.right, b: b.bottom };
            const raw = Object.assign({}, b);
            for (let x = e.parentElement; x && x !== sl; x = x.parentElement) { if (getComputedStyle(x).overflow === 'visible') continue;
              const q = x.getBoundingClientRect(); b = { l: Math.max(b.l, q.left), t: Math.max(b.t, q.top), r: Math.min(b.r, q.right), b: Math.min(b.b, q.bottom) }; }
            /* CLIP (undo-git review 1, "page C · the bug" cut off by its tile): text a box cuts off is overflow too. Editors,
               terminals and pages scroll by design, so they are exempt. */
            const cut = Math.max(b.l - raw.l, raw.r - b.r, b.t - raw.t, raw.b - b.b);
            if (cut > 2 && !e.closest('.bs-term,.bs-vsc,.bs-chrome,.aws,.gg-win') && !(illus && e.closest(illus))) out.push('CLIP ' + (e.id || e.className.toString().slice(0, 20) || e.tagName.toLowerCase()) + ' "' + e.textContent.trim().slice(0, 22) + '" cut by ' + cut.toFixed(0) + 'px');
            if (b.r - b.l < 2 || b.b - b.t < 2) return;
            runs.push({ e, b, nm: (e.id || e.className.toString().slice(0, 20) || e.tagName.toLowerCase()) + ' "' + e.textContent.trim().slice(0, 22) + '"' });
          });
          // the block a run belongs to: its nearest positioned item (a card, chip, tile, window), so two lines of one card never collide
          /* a thumbnail hook's lines are one heading too (.pt-title, the -thumbs kits): its tight stack is drawn on purpose, so it neither collides with itself nor spills */
          const block = e => { if (e.closest('.pt-title')) return 'heading'; for (let x = e; x && x !== sl; x = x.parentElement) { const pa = x.parentElement;
            if (pa && (pa.classList.contains('cf-world') || pa.classList.contains('rows') || pa.classList.contains('content'))) return x; } return e.closest('.eyebrow,.h1') ? 'heading' : e; };   // eyebrow + headline are one heading
          const P2 = 3;
          for (let i = 0; i < runs.length; i++) for (let j = i + 1; j < runs.length; j++) {
            const A = runs[i], Bq = runs[j];
            if (A.e.contains(Bq.e) || Bq.e.contains(A.e) || block(A.e) === block(Bq.e)) continue;
            const w = Math.min(A.b.r, Bq.b.r) - Math.max(A.b.l, Bq.b.l), h = Math.min(A.b.b, Bq.b.b) - Math.max(A.b.t, Bq.b.t);
            if (w > P2 && h > P2) out.push('OVERLAP ' + A.nm + ' × ' + Bq.nm);
          }
          /* SPILL (review 3, "overflow issues, fix all"): text running out of the item that holds it (a card label wider
             than its card). The TIGHT check skips gradient panels, so this measures every run against its item's box. */
          runs.forEach(rn => {
            // name tags under characters, labels under bars and an arrow's own label sit outside their item by design
            if (rn.e.closest('.nm,.cf-bar > b,.bs-arw,.sub-cta')) return;   // .sub-cta: the subscribe bar's notification menu hangs above the bar by design
            const it = block(rn.e); if (typeof it === 'string' || it === rn.e) return;
            const q = it.getBoundingClientRect(), k = q.width / (it.offsetWidth || q.width) || 1;
            const over = Math.max(q.left - rn.b.l, rn.b.r - q.right, q.top - rn.b.t, rn.b.b - q.bottom) / k;
            if (over > 2) out.push('SPILL ' + rn.nm + ' runs ' + over.toFixed(0) + 'px out of ' + (it.id || it.className.toString().slice(0, 20)));
          });
          /* PAD (undo-git review 1, "not enough padding" on a dark card): the TIGHT check above skips gradient panels, so text
             was allowed to touch a glass card's edge. Every run inside an item that shows a fill or a border (a card, a
             panel, a chip) must keep CARD_PAD px from that item's edges, gradients included. */
          const CARD_PAD = 10, shows = x => { const c = getComputedStyle(x); const bg = (c.backgroundColor.match(/[\d.]+/g) || []).map(Number);
            return c.backgroundImage !== 'none' || (bg.length >= 4 ? bg[3] > .3 : bg.length === 3) || parseFloat(c.borderTopWidth) > 0; };
          runs.forEach(rn => {
            if (rn.e.closest('.nm,.cf-bar > b,.bs-arw,.bs-term,.bs-vsc,.bs-chrome,.gg-win,.gg-ref,.gg-file b,.cf-stamp,.sub-cta') || (illus && rn.e.closest(illus))) return;
            const it = block(rn.e); if (typeof it === 'string' || it === rn.e) return;
            let box = null; for (let x = rn.e.parentElement; x && x !== it.parentElement; x = x.parentElement) if (shows(x)) { box = x; break; }
            if (!box || box.classList.contains('slide')) return;
            const q = box.getBoundingClientRect(), k = q.width / (box.offsetWidth || q.width) || 1;
            const gap = Math.min(rn.b.l - q.left, q.right - rn.b.r, rn.b.t - q.top, q.bottom - rn.b.b) / k;
            if (gap > -2 && gap < CARD_PAD - .5) out.push('TIGHT ' + rn.nm + ' ' + gap.toFixed(1) + 'px from its card edge');
          });
          /* LAID (undo-git review 2, "text touching edges"): a commit laid on a panel is its own item, so the PAD check above
             never measured it against the panel under it. Every run whose centre sits on another item's panel (a Git client
             panel, a card) keeps CARD_PAD px from that panel's edges. */
          const panels = [...sl.querySelectorAll('.gg-area,.cf-card')].filter(x => x.offsetWidth && getComputedStyle(x).visibility !== 'hidden');
          runs.forEach(rn => {
            if (rn.e.closest('.nm,.bs-arw,.bs-term,.bs-vsc,.bs-chrome,.gg-win,.sub-cta,.fx-emoji,.cf-stamp,.cf-bubble') || (illus && rn.e.closest(illus))) return;
            const cx = (rn.b.l + rn.b.r) / 2, cy = (rn.b.t + rn.b.b) / 2;
            panels.forEach(pn => {
              if (pn.contains(rn.e)) return;
              const q = pn.getBoundingClientRect(); if (cx < q.left || cx > q.right || cy < q.top || cy > q.bottom) return;
              const k = q.width / (pn.offsetWidth || q.width) || 1;
              const gap = Math.min(rn.b.l - q.left, q.right - rn.b.r, rn.b.t - q.top, q.bottom - rn.b.b) / k;
              if (gap < CARD_PAD - .5) out.push('TIGHT ' + rn.nm + ' ' + gap.toFixed(1) + 'px from the edge of the panel under it');
            });
          });
          /* TERM (undo-git review 2, "terminal gets cut off", "terminal padding bottom"): Terminal and editor windows do not
             scroll, so at the end pose every row must sit inside the window with room to spare below the last one. */
          sl.querySelectorAll('.bs-term .bd,.bs-vsc .cd').forEach(bd => {
            const rows = [...bd.children].filter(r => r.offsetHeight && getComputedStyle(r).display !== 'none'); if (!rows.length) return;
            const q = bd.getBoundingClientRect(), k = q.height / (bd.offsetHeight || q.height) || 1, last = rows[rows.length - 1].getBoundingClientRect();
            const room = (q.bottom - last.bottom) / k, need = bd.closest('.bs-term') ? 14 : 0;
            if (room < need - .5) out.push('TERM ' + (bd.closest('[id]') || bd).id + ' last row ' + (room < 0 ? 'cut by ' + (-room).toFixed(0) + 'px' : room.toFixed(0) + 'px from the bottom (min ' + need + ')'));
          });
          /* OVERLAP between items (same review: a chip laid into a terminal window; the text-only check never saw it): two
             scene items whose boxes cross without one holding the other. Things meant to sit on others are exempt: a
             speech bubble, a sticker, a character, a stamp, a backdrop window (z 0). */
          {
            const items = [...sl.querySelectorAll('.cf-world > *')].filter(x => {
              const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden' || parseFloat(c.opacity) < .5) return false;
              if (x.matches('.cf-who,.cf-bubble,.cf-stamp,.bs-arw,.gg-winw,.cf-edges,svg') || x.querySelector(':scope > .gg-win')) return false;
              const b = x.getBoundingClientRect(); return b.width > 4 && b.height > 4;
            }).map(x => ({ x, b: x.getBoundingClientRect() }));
            const holds = (a, b) => a.left <= b.left + 2 && a.top <= b.top + 2 && a.right >= b.right - 2 && a.bottom >= b.bottom - 2;
            for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
              const A = items[i].b, Bq = items[j].b;
              const w = Math.min(A.right, Bq.right) - Math.max(A.left, Bq.left), h = Math.min(A.bottom, Bq.bottom) - Math.max(A.top, Bq.top);
              if (w > 3 && h > 3 && !holds(A, Bq) && !holds(Bq, A)) out.push('OVERLAP item ' + (items[i].x.id || items[i].x.className.toString().slice(0, 20)) + ' × ' + (items[j].x.id || items[j].x.className.toString().slice(0, 20)));
            }
          }
          // a diagram edge drawn through a label: sample the visible path every 6px
          sl.querySelectorAll('path.cf-edge').forEach(pe => {
            const cs = getComputedStyle(pe); if (cs.display === 'none' || parseFloat(cs.opacity) < .3 || cs.visibility === 'hidden') return;
            let L = 0; try { L = pe.getTotalLength(); } catch (err) { return; }
            const drawn = cs.strokeDasharray && cs.strokeDasharray !== 'none' && !pe.classList.contains('dash') ? L - (parseFloat(cs.strokeDashoffset) || 0) : L;
            const M = pe.getScreenCTM(); if (!M || L < 1) return;
            const hit = new Set();
            for (let d = 0; d <= Math.max(0, drawn); d += 6) {
              const p = pe.getPointAtLength(d), x = M.a * p.x + M.c * p.y + M.e, y = M.b * p.x + M.d * p.y + M.f;
              runs.forEach(rn => { if (rn.e.closest('.ride')) return; if (x > rn.b.l + 2 && x < rn.b.r - 2 && y > rn.b.t + 2 && y < rn.b.b - 2) hit.add(rn.nm); });   // .ride: a token meant to sit on its line
            }
            hit.forEach(nm => out.push('OVERLAP line ' + (pe.id || 'edge') + ' through ' + nm));
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
