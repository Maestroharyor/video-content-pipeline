/* heap: the Postgres heap-page look (core/styles/heap.css), built for projects/postgres-for-everything (look A, picked
   2026-11-17). The deck is drawn as Postgres's own 8 KB heap page on light paper: a jobs table whose rows are tuples,
   workers A (Postgres blue) and B (amber) lock rows, finished versions die hatched and struck until VACUUM; green is a
   win, red a break. A scorecard docked top right fills in one verdict per round.

   The scene engine is bistro (core/templates/bistro.js, on cafe.js): items enter on spoken words, move, swap, change
   state, terminals and editors type, arrows draw along their paths, and the over-the-face / split layouts come with it.
   This template prepares its own kinds into bistro's `html` items and hands everything else through unchanged
   (mirrors core/templates/signed.js).

   data: bistro's {eyebrow, accent, h1, w? (1540), h? (600), items, edges?, over?, sub?, split?, sweep?} plus
     score?: false hides the scorecard on this slide. Without a timeline (a lone poster or preview), the scorecard shows
             only when data.score is set: true = all "?", a number n = the first n verdicts already in.

   heap kinds (item.k):
     page  {title, size?: '8 KB', cols?: [header strings], rows: [row], states?: [state], rowIn?: [{b, row}], gc?, w}
             the heap-page table: a header bar "title … size", an optional column-header strip, then one 76px row per tuple
             (mono cells, the first cell bold as the id, a lock slot, a status pill on the right). h is computed:
             4 + 50 + (cols ? 40 : 0) + 76 x rows (HP.page fills it in).
           row   {cells: [string], st?: 'pend'|'a'|'b'|'done'|'dead'|'fail' (default 'pend'), lock?: 'A'|'B'|string|false, pill?: string}
                 st a = blue tint + "Worker A" padlock + blue "running" pill; b = amber tint + "Worker B" + amber pill;
                 pend = grey "pending" pill; done = green "done" pill; dead = hatched grey, every cell struck, "dead";
                 fail = red tint + "failed". lock defaults from st (a → Worker A, b → Worker B); 'A'/'B' read "Worker A/B",
                 any other string is shown as is, false hides it. pill overrides the pill's word.
           state {b, row (0-based), st, lock?, pill?}   applied in order, each from its beat (0.35 s tint fade, the pill pops)
           rowIn [{b, row}]                             those rows are invisible (space kept) until their beat, then rise in
           gc    CSS grid-template-columns override (default: 80px 1fr [auto …] [170px lock] 150px)
     trk   {n, items: [labels], lit, steps?: [{b, lit}]}   a numbered tracker of n slots: slots before `lit` are done (their
             label shown, number green), slot `lit` is current (blue), later slots show "?" (curiosity gap: never name an
             item before the voice does). lit is 1-based; lit = n + 1 = all done. steps move lit on later beats.
     logo  bistro/cafe logo kind, plus src?: a path (passet('logos/x.svg')) for a mark that is not in assets/logos/brands
     chip  cafe chip, plus src?: a path for the chip's mark

   score (automatic, not an item): PROJECT.score = [{tool, logo, verdict, kind: 'ok'|'keep', at: 's10', b: 'v'}],
     PROJECT.scoreFrom / scoreEnd = slide ids. On every full-frame slide from the start of scoreFrom to the start of
     scoreEnd a white scorecard sits in the top-right corner: one tile per entry (the tool's mark on a white tile, "?"
     under it), the verdict label replacing the "?" from beat b of slide at (and every slide after), the tile popping
     with a green ✓ (ok) or an amber "keep" badge as it lands. Hidden over the face (root .ovs) and with data.score false.
     Footprint (1920x1080 stage): right 16, top 10, about 90 tall, about 470 wide with every verdict in (x ≈ 1430-1904,
     y 1-100 with the badges): keep slide content and the eyebrow clear of that box.

   The ground ("the ground moves", margins only): tuple strips "(0,12) xmin 742 / id 12 · receipt" in outlined slots,
   some dead (hatched + struck), and line pointers "lp 12 → 0x1D00" drift slowly up the left (x 14-182) and right
   (x 1738-1906) margins at ~6% opacity, from absolute time (deterministic). Nothing sits behind the content box.

   window.HP: compact item builders for slide authors (the world box is 1540 x 600), all return plain item objects and
   take a trailing o = extra fields merged last (b, fx, cls, on, moves, out, pre, z …):
     HP.src(name)                                  'postgresql' → assets/logos/brands/postgresql.svg; a path passes through;
                                                   'aws:simple-queue-service' → assets/logos/aws/…; 'p:x' → passet('logos/x.svg')
     HP.page(id, x, y, w, title, rows, o)          rows: [row] (see above) or [[cells…], st?] tuples; o.cols/states/rowIn/size
     HP.row(cells, st, o)                          one row object {cells, st, …o}
     HP.trk(id, x, y, w, n, items, lit, o)         h 58
     HP.chip(id, x, y, html, o)                    o.logo (brand slug) | o.src (path) | o.icon; cls b/g/a/r/t/v, fill-*, mono
     HP.card(id, x, y, w, h, label, sub, o)        o.logo | o.img (a path, shown on a white tile) | o.icon | o.who; cls b/g/a/r
     HP.logo(id, x, y, name, label, o)             a mark on a white tile, 150 x 150 (cls 'sm'); name = slug or path
     HP.who(id, x, y, src, name, o)                a character, 170 x 170; src = an avatar name (passet('avatars/<n>.svg')) or a path
     HP.txt(id, x, y, html, o)                     free text (cls mono, big, lbl, r/g/b/a)
     HP.tag(id, x, y, html, o)                     a mono uppercase label (cf-txt lbl)
     HP.img(id, x, y, w, h, src, o)                an image, contained
     HP.vsc(id, x, y, w, h, file, lines, o)        VS Code (title 'jobs-app'); bistro vsc fields in o (files, blocks, hl …)
     HP.term(id, x, y, w, h, lines, o)             macOS Terminal; '$ ' lines type at PROJECT.prompt
     HP.psql(id, x, y, w, h, lines, o)             a Terminal running psql: '$ ' lines type at 'app=# ' (o.prompt), title o.title || 'psql'
     HP.chrome(id, x, y, w, h, url, html, o)       Chrome with a rebuilt page
     HP.packet(id, b, pts, o)                      an arrow drawing along pts on beat b (o.d seconds)
     HP.edge(id, a, z, o)                          a data.edges entry (a/z = item ids or [x, y]); cls b/a/g/r/mute, o.b, o.bend, o.dash */
(function () {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const HS = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

  /* ---------- the ground: tuple strips and line pointers drifting up both margins ---------- */
  const TW = 168, TH = 52, PITCH = 66, ROWS = 22;
  const COLS = [{ x: 14, spd: 9, o: 0 }, { x: 1738, spd: 7, o: 11 }];
  const LABELS = ['welcome', 'receipt', 'invoice', 'resize', 'report', 'export', 'signup', 'sms'];
  // diagonal hatch lines clipped to the slot (no <pattern>: the ground is drawn twice and ids would clash)
  const HATCH = (() => { let d = ''; for (let a = -TH + 7; a < TW; a += 14) {
    let x0 = a, y0 = TH, x1 = a + TH, y1 = 0;
    if (x0 < 0) { y0 = TH + x0; x0 = 0; } if (x1 > TW) { y1 = x1 - TW; x1 = TW; }
    d += `M${x0} ${y0}L${x1} ${y1}`; } return d; })();
  const entry = k => {
    const n = ((k % 48) + 48) % 48 + 1;
    if (((k % 3) + 3) % 3 === 0) return { cls: 'lp', t1: '', t2: `lp ${n} → 0x${(8192 - n * 64).toString(16).toUpperCase()}` };
    const dead = HS(k * 1.31 + 2) > .62;
    return { cls: 'tu' + (dead ? ' dd' : ''), t1: `(0,${n}) xmin ${730 + n}`, t2: `id ${n} · ${LABELS[n % LABELS.length]}` };
  };
  const gHtml = () => `<g><rect x="0" y="0" width="${TW}" height="${TH}" rx="4"/><path class="ht" d="${HATCH}"/><text class="t1" x="9" y="21"></text><text class="t2" x="9" y="43"></text><path class="sk" d="M6 16H${TW - 6}M6 38H${TW - 6}"/></g>`;
  const html = () => '<svg class="hg" viewBox="0 0 1920 1080" preserveAspectRatio="none">' + COLS.map(() => `<g class="hc">${Array.from({ length: ROWS }, gHtml).join('')}</g>`).join('') + '</svg>';
  function frame(g, T) {
    g.querySelectorAll('svg.hg g.hc').forEach((col, ci) => {
      const c = COLS[ci], off = T * c.spd, k0 = Math.ceil((off - 1160) / PITCH);
      [...col.children].forEach((e, i) => {
        const k = k0 + i, y = 1100 + k * PITCH - off;
        if (e.dataset.k !== String(k)) {
          const en = entry(k + c.o), t = e.querySelectorAll('text');
          e.setAttribute('class', en.cls); t[0].textContent = en.t1; t[1].textContent = en.t2;
          t[1].setAttribute('y', en.cls === 'lp' ? '32' : '43'); e.dataset.k = String(k);
        }
        e.setAttribute('transform', `translate(${c.x} ${y.toFixed(1)})`);
        const hi = HS(k * 3.3 + ci) > .86 ? Math.max(0, Math.sin((T / 6 + HS(k)) * 6.28)) : 0;
        e.style.opacity = (.055 + .07 * hi).toFixed(3);
      });
    });
  }
  /* only on a heap deck: every bistro theme shares window.BS_GROUND, and bistro's groundFrame / split plate read it on
     every frame, so a later theme file that set it unconditionally would replace an earlier theme's live ground */
  if (window.PROJECT && PROJECT.theme === 'heap') {
    window.BS_GROUND = { theme: 'heap', kind: 'heap', icons: {}, marks: [], routes: [], nodes: [], html, frame };
    if (window.bsInstallGround) window.bsInstallGround();
  }

  const B0 = () => { const t = window.TEMPLATES && window.TEMPLATES.bistro; if (!t) throw new Error('heap: core/templates/bistro.js must load first'); return t; };

  /* ---------- the deck clock (signed.js): another slide's beats from the injected timeline ---------- */
  const TL = () => { const tl = window.TIMELINE; return tl ? (tl.slides || tl) : null; };
  const rec = sid => { const s = TL(); return s ? s.find(x => x.id === sid) || null : null; };
  const absBeat = (sid, b) => { const s = rec(sid); return s && s.beats && s.beats[b] ? s.beats[b][0] : null; };
  const slideStart = sid => { const s = rec(sid); return s ? s.start : null; };
  // the deck clock from the slide's own start (a single-slide poster has no absolute T; the timeline render does)
  const absT = c => { const s0 = slideStart(c.id); return s0 != null ? s0 + c.local : c.T; };

  /* ---------- logos: a brand slug, an aws: / p: name, or a path ---------- */
  const src = n => /[/.]/.test(n) ? n : /^aws:/.test(n) ? ASSETS + 'logos/aws/' + n.slice(4) + '.svg' : /^p:/.test(n) ? passet('logos/' + n.slice(2) + '.svg') : ASSETS + 'logos/brands/' + n + '.svg';
  const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></svg>';

  /* ---------- page ---------- */
  const PILL = { pend: 'pending', a: 'running', b: 'running', done: 'done', dead: 'dead', fail: 'failed' };
  const lockOf = (st, lock) => lock === false ? '' : lock != null ? (lock === 'A' || lock === 'B' ? 'Worker ' + lock : String(lock)) : st === 'a' ? 'Worker A' : st === 'b' ? 'Worker B' : '';
  const usesLock = it => it.rows.concat(it.states || []).some(r => r.lock || r.st === 'a' || r.st === 'b');
  const pageH = it => 4 + 50 + (it.cols ? 40 : 0) + 76 * it.rows.length;
  function pageHtml(it) {
    const n = it.rows.reduce((m, r) => Math.max(m, r.cells.length), 0), lk = usesLock(it);
    const gc = it.gc || ['80px'].concat(Array.from({ length: n - 1 }, (_, i) => i === 0 ? '1fr' : 'auto'), lk ? ['170px'] : [], ['150px']).join(' ');
    const ch = it.cols ? `<div class="ch" style="grid-template-columns:${gc}">${it.cols.concat(Array(Math.max(0, n + (lk ? 2 : 1) - it.cols.length)).fill('')).map(h => `<span>${esc(h)}</span>`).join('')}</div>` : '';
    const rows = it.rows.map((r, i) => {
      const st = r.st || 'pend', cells = Array.from({ length: n }, (_, j) => r.cells[j] != null ? r.cells[j] : '');
      return `<div class="rw st-${st}" data-row="${i}" style="grid-template-columns:${gc}"><i class="tn"></i>${cells.map((v, j) => `<span class="${j === 0 ? 'id' : 'c'}">${esc(v)}</span>`).join('')}` +
        `${lk ? `<span class="lk"></span>` : ''}<span class="pl"></span></div>`;
    }).join('');
    return `<div class="hp-page"><div class="hd"><span>${esc(it.title || 'heap page 0')}</span><span>${esc(it.size || '8 KB')}</span></div>${ch}${rows}</div>`;
  }
  function pageFrame(c, B, it) {
    const el = document.getElementById(c.p + it.id); if (!el) return;
    const sts = it.states || [], ins = it.rowIn || [];
    el.querySelectorAll('.rw').forEach(rw => {
      const i = +rw.dataset.row, r = it.rows[i];
      let st = r.st || 'pend', lock = r.lock, pill = r.pill, t0 = null;
      sts.forEach((s, j) => {
        if (s.row !== i) return;
        const at = B.at(s.b, cl(.3 + .5 * j / Math.max(1, sts.length), 0, .95), 1, 'pop', { focal: false });
        if (c.local >= at.s - .02 && (at.beat || at.p > 0)) { st = s.st; lock = s.lock; pill = s.pill; t0 = at.s; }
      });
      const key = st + '|' + lock + '|' + pill;
      if (rw.dataset.k !== key) {
        rw.className = 'rw st-' + st; rw.dataset.k = key;
        const lk = rw.querySelector('.lk'), lt = lockOf(st, lock);
        if (lk) lk.innerHTML = lt ? LOCK + '<span>' + esc(lt) + '</span>' : '';
        rw.querySelector('.pl').textContent = pill || PILL[st] || st;
      }
      const k = t0 == null ? 1 : cl((c.local - t0) / .35, 0, 1);
      rw.querySelector('.tn').style.opacity = k.toFixed(3);
      rw.querySelector('.pl').style.transform = `scale(${(1 + .14 * Math.sin(Math.PI * k)).toFixed(4)})`;
      // rows entering on a beat: invisible (space kept) until then, then rise in
      const inn = ins.find(x => x.row === i);
      if (inn) { const q = B.p(inn.b, .2 + .05 * i, .3 + .05 * i, 'enter', { focal: false }), e4 = eo4(q);
        rw.style.opacity = e4.toFixed(3); rw.style.transform = `translateY(${((1 - e4) * 18).toFixed(1)}px)`; }
    });
  }

  /* ---------- trk ---------- */
  function trkHtml(it) {
    return `<div class="hp-trk">${Array.from({ length: it.n }, (_, i) => `<span data-i="${i + 1}"><b>${i + 1}</b><em>${(it.items || [])[i] || ''}</em><i>?</i></span>`).join('')}</div>`;
  }
  function trkFrame(c, B, it) {
    const el = document.getElementById(c.p + it.id); if (!el) return;
    let lit = it.cur;
    (it.steps || []).forEach((s, j) => { const at = B.at(s.b, cl(.3 + .1 * j, 0, .95), 1, 'pop', { focal: false }); if (c.local >= at.s - .02 && (at.beat || at.p > 0)) lit = s.lit; });
    el.querySelectorAll('.hp-trk span').forEach(s => { const i = +s.dataset.i, k = i < lit ? 'done' : i === lit ? 'on' : 'q'; if (s.className !== k) s.className = k; });
  }

  /* ---------- score: the docked scorecard ---------- */
  const SC = () => (window.PROJECT && Array.isArray(PROJECT.score) && PROJECT.score.length) ? PROJECT.score : null;
  function scoreHtml(p) {
    const S = SC(); if (!S) return '';
    return `<div class="hp-score" id="${p}score">${S.map((s, i) => {
      // a missing mark fails the render (the renderer stops on any failed request): fetch it, or point logo at it ('p:name')
      return `<div class="sc ${s.kind === 'keep' ? 'keep' : 'ok'}" data-i="${i}"><span class="lg"><img src="${src(s.logo || '')}" alt="${esc(s.tool || '')}"></span>` +
        `<span class="q">?</span><span class="vd">${esc(s.verdict || '')}</span><i class="bd">${s.kind === 'keep' ? 'keep' : '✓'}</i></div>`;
    }).join('')}</div>`;
  }
  function scoreFrame(c) {
    const S = SC(), el = document.getElementById(c.p + 'score'); if (!S || !el) return;
    /* bistro sets .ovs on any slide with data.over, also outside a face window, and the overlay layout only applies in the
       alpha capture: so the card hides only there, over the face or beside it in a split (where it would sit past the
       plate's right edge). The deck-only master keeps it on every slide. */
    const transparent = document.getElementById('stage').classList.contains('transparent');
    const d = c.data, root = document.getElementById(c.id), T = absT(c);
    const over = transparent && root && (root.classList.contains('ovs') || root.classList.contains('split'));
    const timed = !!TL() && slideStart(c.id) != null;
    let on;
    if (timed) { const a = slideStart(PROJECT.scoreFrom), z = PROJECT.scoreEnd ? slideStart(PROJECT.scoreEnd) : null; on = a != null && T >= a && (z == null || T < z); }
    else on = d.score != null && d.score !== false;
    if (d.score === false || over) on = false;
    el.style.opacity = on ? '1' : '0';
    if (!on) return;
    el.querySelectorAll('.sc').forEach(tile => {
      const i = +tile.dataset.i, s = S[i];
      let t0 = null;
      if (timed) {
        // the verdict's own slide: its local beat; any other slide: the timeline's beat (or that slide's end if the beat is missing)
        if (s.at === c.id && c.beats && c.beats[s.b]) t0 = T - c.local + c.beats[s.b].s;
        else { t0 = absBeat(s.at, s.b); if (t0 == null) { const r = rec(s.at); t0 = r ? r.end : null; } }
      } else if (typeof d.score === 'number' && i < d.score) t0 = -1e9;
      const shown = t0 != null && T >= t0;
      tile.classList.toggle('on', shown);
      const k = shown ? cl((T - t0) / .55, 0, 1) : 1;
      tile.querySelector('.lg').style.transform = `scale(${(1 + .22 * Math.sin(Math.PI * k)).toFixed(4)})`;
      tile.querySelector('.bd').style.transform = `scale(${(shown ? .4 + .6 * bk(k) : 1).toFixed(4)})`;
    });
  }

  function prep(d) {
    if (d.__hp) return; d.__hp = true;
    d.items = (d.items || []).map(it => {
      switch (it.k) {
        case 'page': return Object.assign({}, it, { k: 'html', __page: true, h: it.h || pageH(it), fx: it.fx || 'up', cls: 'hp-pagew ' + (it.cls || ''), html: pageHtml(it) });
        // lit is renamed: bistro reads item.lit as an illustration's lit parts (signed's trk avoids the name for the same reason)
        case 'trk': { const o = Object.assign({}, it, { k: 'html', __trk: true, cur: it.lit || 1, fx: it.fx || 'fd', cls: 'hp-trkw ' + (it.cls || ''), html: trkHtml(it) }); delete o.lit; return o; }
        // a mark that lives outside assets/logos/brands (a project-fetched one): the logo tile with its own path
        case 'logo': return it.src ? Object.assign({}, it, { k: 'html', fx: it.fx || 'pop', cls: 'cf-logo ' + (it.cls || ''),
          html: `<span class="mk"><img src="${it.src}" alt="${esc(it.label || '')}"></span>${it.label ? `<b>${it.label}</b>` : ''}` }) : it;
        case 'chip': return it.src ? Object.assign({}, it, { html: `<img src="${it.src}" alt="">${it.html}` }) : it;
        default: return it;
      }
    });
  }
  defineTemplate('heap', {
    check: (d, def) => { prep(d); B0().check(d, def); },
    beats: d => {
      prep(d); const n = B0().beats(d);
      (d.items || []).forEach(it => (it.states || []).concat(it.rowIn || [], it.steps || []).forEach(h => { if (h.b && !n.includes(h.b)) n.push(h.b); }));
      return n;
    },
    html: (d, c) => { prep(d); return B0().html(d, c) + (d.score === false ? '' : scoreHtml(c.p)); },
    frame: (t, c) => {
      prep(c.data); B0().frame(t, c);
      const B = beats(c);
      (c.data.items || []).forEach(it => { if (it.__page) pageFrame(c, B, it); if (it.__trk) trkFrame(c, B, it); });
      scoreFrame(c);
    },
  });

  /* ---------- HP: compact item builders for the slides ---------- */
  const X = (base, o) => Object.assign(base, o || {});
  const promptUser = () => ((window.PROJECT && PROJECT.prompt) || 'mia@MacBook-Pro ~ % ').split('@')[0];
  const row = (cells, st, o) => X({ cells, st: st || 'pend' }, o);
  window.HP = {
    src,
    row,
    page: (id, x, y, w, title, rows, o) => {
      const rs = rows.map(r => Array.isArray(r) ? row(r[0], r[1], r[2]) : r);
      const it = X({ id, k: 'page', title, rows: rs, x, y, w }, o);
      it.h = it.h || pageH(it);
      return it;
    },
    trk: (id, x, y, w, n, items, lit, o) => X({ id, k: 'trk', n, items, lit, x, y, w, h: 58 }, o),
    chip: (id, x, y, html, o) => X({ id, k: 'chip', html, x, y, z: 6 }, o),
    card: (id, x, y, w, h, label, sub, o) => X({ id, k: 'card', label, sub, x, y, w, h }, o),
    logo: (id, x, y, name, label, o) => X(/[/.:]/.test(name) ? { id, k: 'logo', cls: 'sm', src: src(name), label, x, y, w: 150, h: 150 } : { id, k: 'logo', cls: 'sm', logo: name, label, x, y, w: 150, h: 150 }, o),
    who: (id, x, y, s, name, o) => X({ id, k: 'who', src: /[/.]/.test(s) ? s : passet('avatars/' + s + '.svg'), name, x, y, w: 170, h: 170 }, o),
    txt: (id, x, y, html, o) => X({ id, k: 'txt', html, x, y, z: 6 }, o),
    tag: (id, x, y, html, o) => X({ id, k: 'txt', cls: 'lbl', html, x, y, z: 6 }, o),
    img: (id, x, y, w, h, s, o) => X({ id, k: 'html', html: `<img src="${s}" alt="" style="width:100%;height:100%;object-fit:contain;display:block">`, x, y, w, h }, o),
    vsc: (id, x, y, w, h, file, lines, o) => X({ id, k: 'vsc', x, y, w, h, file, lines, title: 'jobs-app' }, o),
    term: (id, x, y, w, h, lines, o) => X({ id, k: 'term', x, y, w, h, lines, title: promptUser() + ' — -zsh — 120×30' }, o),
    psql: (id, x, y, w, h, lines, o) => X({ id, k: 'term', x, y, w, h, lines, prompt: 'app=# ', title: 'psql' }, o),
    chrome: (id, x, y, w, h, url, html, o) => X({ id, k: 'chrome', x, y, w, h, url, html }, o),
    packet: (id, b, pts, o) => X({ id, k: 'packet', x: pts[0][0] - 14, y: pts[0][1] - 14, w: 28, h: 28, walk: { b, pts, d: (o && o.d) || 1.2 } }, o),
    edge: (id, a, z, o) => X({ id, a, z }, o),
  };
})();
