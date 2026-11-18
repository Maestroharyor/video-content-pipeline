/* signed: the token-coloured look (core/styles/signed.css), built for projects/sessions-vs-jwt. The video compares
   session cookies with JSON Web Tokens, so the deck is drawn in a token's three parts (header rose, payload
   violet, signature cyan, the dots white); sessions are green, the logout problem rose, the fixes amber.

   The scene engine is bistro (core/templates/bistro.js, on cafe.js): items enter on spoken words, move, swap, change
   state, terminals and editors type, arrows draw along their paths, and the over-the-face / split layouts come with it.
   This template prepares its own kinds into bistro's `html` items and hands everything else through unchanged.

   data: bistro's {eyebrow, accent, h1, w?, h?, items, edges?, over?, sub?}
   signed kinds (item.k):
     tok   {parts: [header, payload, signature], label?}   a token string, each segment in its colour, white dots
     seg   {part: 'h'|'p'|'s'|'g'|'a'|'r', title, lines: [string], hl?: [{b, row}]}   one decoded segment or a record;
                                                  hl lights row `row` (0-based) from beat b
     ck    {label, code?, no?}                  a check row: a ✓ chip (✗ with no) and the thing checked
     trk   {fix: 1..5}                          the four-fix tracker: fix `fix` lit, earlier ones done, later ones a "?" (curiosity
                                                gap, review 1: never name a fix before the voice does); fix 5 = all four done. Not `lit` or `on`: bistro and cafe own those
     kv    {title, logo?, lines: [html]}        a key / record card (Redis key, user row); state classes red, gone, ok
     clk   {from: 900, t0: {s: 's24', b: 'k1'}, label, ff?: {b, dur}}   a token's expiry countdown (sessions-vs-jwt review 3):
                                                mm:ss on the deck's absolute clock from beat t0.b of slide t0.s, so it keeps
                                                ticking across slides; ff fast-forwards it to 0:00 from beat ff.b over ff.dur s,
                                                then it reads "Expired · 401" (class exp)
   item.pscroll = [{b, y, dt?, d?}] on any item holding a .site element (a rebuilt web page in a chrome window): the page
   scrolls to y (site px) from beat b (+dt s) over d s, eased, one stop after another; item.zoom scales the site (review 4:
   "the jwt.io website shouldn't be cut off, it should be like a real enactment of the actual site")
   PROJECT.chapters = [{at: 's05', label}, …] (+ chaptersEnd: a slide id where it stops) draws a thin chapter bar across the top of every full-frame slide from the
   first chapter on (not over the face, not on slides with data.chap false); the current label pops for 2 s at its start.
   Everything else (term, vsc, chrome, chip, card, txt, who, stamp, svg, packet …) is bistro's or cafe's. */
(function () {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------- the ground: token segments drifting up both margins, in the token's colours ---------- */
  const SEGS = [['h', 'eyJhbGciOiJFUzI1NiJ9'], ['d', '.'], ['p', 'eyJyb2xlIjoiYWRtaW4i'], ['p', 'LCJzdWIiOiJ1XzQyIiwi'], ['p', 'aXNzIjoiaHR0cHM6Ly9h'],
    ['d', '.'], ['s', 'MEUCIQDx9kLq2v8Hn3s'], ['s', 'Zr0cT1bY4mWkqA5pD7'], ['h', 'eyJ0eXAiOiJKV1QifQ'], ['p', 'ImV4cCI6MTc5NDYyOTYw'], ['d', '.'], ['s', 'aG9fR2qLm8Vx']];
  const COLS = [{ x: 26, spd: 11, o: 0 }, { x: 1662, spd: 8, o: 5 }];
  const LH = 34, ROWS = 36;
  const SVG0 = () => '<svg class="sd" viewBox="0 0 1920 1080" preserveAspectRatio="none">';
  const html = () => SVG0() + COLS.map(() => `<g class="dc">${Array.from({ length: ROWS }, () => '<text></text>').join('')}</g>`).join('') + '</svg>';
  const HS = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
  function frame(g, T) {
    g.querySelectorAll('svg.sd g.dc').forEach((col, ci) => {
      const c = COLS[ci], off = T * c.spd, k0 = Math.ceil((off - 1130) / LH);
      col.querySelectorAll('text').forEach((e, i) => {
        const k = k0 + i, y = 1100 + k * LH - off, [cls, txt] = SEGS[((k + c.o) % SEGS.length + SEGS.length) % SEGS.length];
        if (e.dataset.k !== String(k)) { e.textContent = txt; e.dataset.k = String(k); e.setAttribute('class', cls); e.setAttribute('x', String(c.x + (cls === 'd' ? 100 : 0))); }
        e.setAttribute('y', y.toFixed(1));
        const hi = HS(k * 3.3 + ci) > .88 ? Math.max(0, Math.sin((T / 5 + HS(k)) * 6.28)) : 0;
        e.style.opacity = (.07 + .1 * hi).toFixed(3);
      });
    });
  }
  const ICONS = {
    key: 'M15.5 3.5a5 5 0 1 1-4.6 7L4 17.5V20h3v-2h2v-2h2l1.4-1.4a5 5 0 0 1 3.1-11.1zM17 6.5h.01',
    lock: 'M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11',
    cookie: 'M12 3a9 9 0 1 0 9 9 3.5 3.5 0 0 1-4-4 3.5 3.5 0 0 1-5-5zM8.5 10h.01M14 15.5h.01M9.5 16h.01',
    shield: 'M12 2.5 20 6v6c0 4.6-3.4 8.3-8 9.5-4.6-1.2-8-4.9-8-9.5V6z',
    card: 'M2.5 5h19v14h-19zM2.5 10h19M6.5 15h4',
  };
  /* review 1 ("improve the background or create 5 variants to review and choose"): five grounds, picked with
     PROJECT.ground or --var bg=<kind>. All stay in the margins / under the content at a few percent, and move slowly
     on their own sines so nothing visibly loops.
       tokens  token segments drifting up both margins, in the token's three colours (the first preview's ground)
       flow    requests travelling straight margin lanes as arrowheads, each landing a tiny 200 or 401 tag
       keys    the story's objects (key, lock, cookie, key card, ticket, wristband) drifting at three depths
       grid    a perspective floor under the content, three slow colour pools (header, payload, signature) orbiting
       seal    a security-print seal (guilloche rings) turning slowly behind the frame, sparkles on its rings */
  const KIND = (window.VARS && window.VARS.bg) || (window.PROJECT && PROJECT.ground) || 'tokens';
  const ICON2 = Object.assign({}, ICONS, {
    ticket: 'M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM14 7v10',
    band: 'M2 10h20v4H2zM9 8h6v8H9z',
    user: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21a8 8 0 0 1 16 0',
    server: 'M3 4h18v6H3zM3 14h18v6H3zM7 7h.01M7 17h.01',
  });

  // flow: lanes along the top and bottom margins and down both sides; arrowheads walk them, a status tag pops at the end
  const LANES = [[[-40, 70], [1960, 70]], [[1960, 1020], [-40, 1020]], [[60, 1120], [60, -40]], [[1860, -40], [1860, 1120]]];
  const flowHtml = () => SVG0() + LANES.map(l => `<path class="fl" d="M${l[0][0]} ${l[0][1]} L${l[1][0]} ${l[1][1]}"/>`).join('') +
    LANES.map(() => [0, 1, 2].map(() => '<g class="fa"><path d="M-14 -9 L6 0 L-14 9 Z"/><text x="12" y="6"></text></g>').join('')).join('') + '</svg>';
  function flowFrame(g, T) {
    const as = g.querySelectorAll('svg.sd g.fa');
    LANES.forEach((l, li) => [0, 1, 2].forEach(j => {
      const e = as[li * 3 + j], P = 9 + li * 1.7, u = ((T + j * P / 3 + li * 2.1) / P) % 1, n = Math.floor((T + j * P / 3 + li * 2.1) / P);
      const x = l[0][0] + (l[1][0] - l[0][0]) * u, y = l[0][1] + (l[1][1] - l[0][1]) * u, ang = Math.atan2(l[1][1] - l[0][1], l[1][0] - l[0][0]) * 180 / Math.PI;
      e.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
      const ok = HS(n * 7 + li * 3 + j) > .35, t = e.querySelector('text');
      if (t.dataset.n !== String(n)) { t.textContent = ok ? '200' : '401'; t.dataset.n = String(n); e.setAttribute('class', 'fa ' + (ok ? 'ok' : 'no')); }
      e.style.opacity = (Math.sin(Math.PI * u) * .9).toFixed(3);
    }));
  }

  // keys: objects at three depths (size, speed and opacity scale together)
  const OBJ = ['key', 'lock', 'cookie', 'card', 'ticket', 'band', 'shield', 'key', 'card', 'cookie', 'lock', 'ticket', 'band', 'shield'];
  const OPOS = OBJ.map((n, i) => ({ n, x: [90, 1700, 260, 1560, 120, 1780, 380, 1500, 60, 1820, 300, 1640, 180, 1720][i], y: [140, 220, 820, 900, 520, 600, 1000, 60, 980, 400, 300, 760, 700, 1000][i], d: i % 3 }));
  const keysHtml = () => OPOS.map((o, i) => `<svg class="ko d${o.d}" viewBox="0 0 24 24" style="left:${o.x}px;top:${o.y}px;width:${[70, 110, 160][o.d]}px;height:${[70, 110, 160][o.d]}px"><path d="${ICON2[o.n]}"/></svg>`).join('');
  function keysFrame(g, T) {
    g.querySelectorAll('.ko').forEach((e, i) => { const d = OPOS[i].d, A = [14, 24, 38][d], P = [70, 52, 40][d];
      e.style.transform = `translate(${(A * Math.sin(6.28 * T / P + i)).toFixed(1)}px,${(A * .8 * Math.cos(6.28 * T / (P * 1.3) + i * 2)).toFixed(1)}px) rotate(${(10 * Math.sin(6.28 * T / (P * 1.7) + i)).toFixed(2)}deg)`; });
  }

  // grid: a floor in perspective + three colour pools
  const gridHtml = () => '<div class="gp h"></div><div class="gp p"></div><div class="gp s"></div><svg class="gf" viewBox="0 0 1920 1080" preserveAspectRatio="none">' +
    Array.from({ length: 23 }, (_, i) => `<path d="M${960 + (i - 11) * 40} 700 L${960 + (i - 11) * 260} 1120"/>`).join('') +
    Array.from({ length: 9 }, () => '<path class="hz"/>').join('') + '</svg>';
  function gridFrame(g, T) {
    g.querySelectorAll('svg.gf path.hz').forEach((e, i) => { const q = ((i / 9) + T / 30) % 1, y = 700 + 420 * q * q; e.setAttribute('d', `M-40 ${y.toFixed(1)} H1960`); e.style.opacity = (q * .9).toFixed(3); });
    g.querySelectorAll('.gp').forEach((e, i) => { const a = 6.28 * T / (60 + i * 17) + i * 2.1;
      e.style.transform = `translate(${(260 * Math.cos(a)).toFixed(1)}px,${(150 * Math.sin(a * 1.3)).toFixed(1)}px)`; });
  }

  // seal: guilloche rings (rose curves) turning slowly in the lower right and upper left, sparkles on them
  const ros = (R, k, a, n) => { let d = ''; for (let t = 0; t <= 6.2832 + .001; t += 6.2832 / 360) { const r = R + a * Math.cos(k * t); d += (d ? 'L' : 'M') + (r * Math.cos(t)).toFixed(1) + ' ' + (r * Math.sin(t)).toFixed(1); } return d; };
  const SEALS = [{ x: 1700, y: 900, R: 300 }, { x: 180, y: 160, R: 220 }];
  const sealHtml = () => SVG0() + SEALS.map((S, si) => `<g class="sl" data-i="${si}">${[0, 1, 2, 3, 4].map(k => `<path class="r${k % 3}" d="${ros(S.R - k * 34, 12 + k * 4, 10 + k * 3)}"/>`).join('')}<circle r="${S.R * .32}" class="cc"/></g>`).join('') +
    Array.from({ length: 10 }, () => '<circle class="sp" r="3"/>').join('') + '</svg>';
  function sealFrame(g, T) {
    g.querySelectorAll('svg.sd g.sl').forEach((e, i) => { const S = SEALS[i]; e.setAttribute('transform', `translate(${S.x} ${S.y}) rotate(${((i ? -1 : 1) * T * 1.6).toFixed(2)})`); });
    g.querySelectorAll('svg.sd circle.sp').forEach((e, j) => { const S = SEALS[j % 2], a = T / (9 + j) + j * 1.7, r = S.R - (j % 5) * 34;
      e.setAttribute('cx', (S.x + r * Math.cos(a)).toFixed(1)); e.setAttribute('cy', (S.y + r * Math.sin(a)).toFixed(1)); e.style.opacity = (.3 * Math.max(0, Math.sin(T / 2 + j))).toFixed(3); });
  }

  const GROUNDS = {
    tokens: { marks: [['key', 230, 860, 150], ['lock', 1500, 120, 120], ['cookie', 300, 110, 120], ['card', 1440, 860, 150]], html, frame },
    flow: { marks: [], html: flowHtml, frame: flowFrame },
    keys: { marks: [], html: keysHtml, frame: keysFrame },
    grid: { marks: [], html: gridHtml, frame: gridFrame },
    seal: { marks: [], html: sealHtml, frame: sealFrame },
  };
  const GD = GROUNDS[KIND] || GROUNDS.tokens;
  window.BS_GROUND = { theme: 'signed', kind: KIND, icons: ICON2, marks: GD.marks, routes: [], nodes: [], html: GD.html, frame: GD.frame };
  if (window.bsInstallGround) window.bsInstallGround();

  const B0 = () => { const t = window.TEMPLATES && window.TEMPLATES.bistro; if (!t) throw new Error('signed: core/templates/bistro.js must load first'); return t; };
  const tokHtml = it => { const [h, p, s] = it.parts;
    return `<div class="sg-tok">${it.label ? `<span class="lbl">${esc(it.label)}</span>` : ''}<span class="h">${esc(h)}</span><span class="d">.</span><span class="p">${esc(p)}</span><span class="d">.</span><span class="s">${esc(s)}</span></div>`; };
  const TRK = ['Refresh tokens', 'Rotation', 'Denylist', 'Versioning'];
  const fmt = s => { s = Math.max(0, Math.ceil(s - 1e-6)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  // a beat's absolute time from the injected timeline (slide id + beat name)
  const absBeat = (sid, b) => { const tl = window.TIMELINE, s = tl && (tl.slides || tl).find(x => x.id === sid); return s && s.beats && s.beats[b] ? s.beats[b][0] : null; };
  const slideStart = sid => { const tl = window.TIMELINE, s = tl && (tl.slides || tl).find(x => x.id === sid); return s ? s.start : null; };
  // the deck clock from the slide's own start (a single-slide poster has no absolute T; the timeline render does)
  const absT = c => { const s0 = slideStart(c.id); return s0 != null ? s0 + c.local : c.T; };
  function clkFrame(c, it) {
    const el = document.getElementById(c.p + it.id); if (!el) return;
    const T = absT(c), t0 = it.t0 ? absBeat(it.t0.s, it.t0.b) : null, from = it.from || 900;
    let rem = t0 == null ? from : from - Math.max(0, T - t0), exp = false;
    const fb = it.ff && c.beats && c.beats[it.ff.b];
    if (fb) {
      const k = Math.min(1, Math.max(0, (c.local - fb.s) / (it.ff.dur || 2.4))), r0 = t0 == null ? from : from - Math.max(0, T - c.local + fb.s - t0);
      if (k > 0) rem = r0 * (1 - (1 - Math.pow(1 - k, 3)));
      exp = k >= 1;
    }
    el.querySelector('.tm').textContent = fmt(rem);
    el.querySelector('.sg-clk').classList.toggle('exp', exp);
    el.querySelector('.sg-clk').classList.toggle('low', !exp && rem < 60);
  }
  function scrollFrame(c, it) {
    const el = document.getElementById(c.p + it.id), site = el && el.querySelector('.site'); if (!site) return;
    let y = 0;
    it.pscroll.forEach(sc => { const bt = c.beats && c.beats[sc.b]; if (!bt) return; const t0 = bt.s + (sc.dt || 0), k = Math.min(1, Math.max(0, (c.local - t0) / (sc.d || .9)));
      const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; y = y + (sc.y - y) * e; });
    site.style.transform = 'scale(' + (it.zoom || 1) + ') translateY(' + (-y).toFixed(1) + 'px)';
  }
  const CH = () => (window.PROJECT && PROJECT.chapters) || null;
  function chapHtml(p) {
    const ch = CH(); if (!ch) return '';
    return `<div class="sg-chap" id="${p}chap">${ch.map((x, i) => `<span class="c" data-i="${i}"><i class="f"></i><b>${esc(x.label)}</b></span>`).join('')}</div>`;
  }
  function chapFrame(c) {
    const ch = CH(), el = document.getElementById(c.p + 'chap'); if (!ch || !el) return;
    const T = absT(c), at = ch.map(x => slideStart(x.at)), end = PROJECT.chaptersEnd ? slideStart(PROJECT.chaptersEnd) : null;
    const root = document.getElementById(c.id), over = root && root.classList.contains('ovs');
    const on = at[0] != null && T >= at[0] && (end == null || T < end) && !over;
    el.style.opacity = on ? '1' : '0';
    el.querySelectorAll('.c').forEach((s, i) => {
      const a = at[i], b = i + 1 < at.length ? at[i + 1] : end;
      const k = a == null ? 0 : Math.min(1, Math.max(0, (T - a) / ((b || a + 60) - a)));
      s.querySelector('.f').style.transform = 'scaleX(' + k.toFixed(4) + ')';
      const cur = a != null && T >= a && (b == null || T < b);
      s.classList.toggle('now', cur); s.classList.toggle('done', b != null && T >= b);
      // the chapter's label pops for 2 s as it starts
      const pk = cur ? Math.max(0, 1 - Math.abs((T - a) - .9) / 1.1) : 0;
      s.style.setProperty('--pk', pk.toFixed(3));
    });
  }
  function prep(d) {
    if (d.__sg) return; d.__sg = true;
    d.items = (d.items || []).map(it => {
      switch (it.k) {
        case 'tok': return Object.assign({}, it, { k: 'html', fx: it.fx || 'up', cls: 'sg-tokw ' + (it.cls || ''), html: tokHtml(it) });
        case 'seg': return Object.assign({}, it, { k: 'html', fx: it.fx || 'up', cls: 'sg-segw ' + (it.cls || ''),
          html: `<div class="sg-seg ${it.part || 'p'}"><span class="k">${esc(it.title)}</span>${it.lines.map((l, i) => `<span class="ln" data-row="${i}">${l}</span>`).join('')}</div>` });
        case 'ck': return Object.assign({}, it, { k: 'html', fx: it.fx || 'sx', cls: 'sg-ckw ' + (it.cls || ''),
          html: `<div class="sg-ck${it.no ? ' no' : ''}"><i>${it.no ? '✗' : '✓'}</i><span>${it.label}</span>${it.code ? `<code>${esc(it.code)}</code>` : ''}</div>` });
        case 'trk': return Object.assign({}, it, { k: 'html', on: it.states || [], fx: it.fx || 'fd', cls: 'sg-trkw ' + (it.cls || ''),
          html: `<div class="sg-trk">${TRK.map((t, i) => i + 1 > it.fix ? `<span class="q"><b>${i + 1}</b><i>?</i></span>` : `<span class="${i + 1 < it.fix ? 'done' : 'on'}"><b>${i + 1}</b>${t}</span>`).join('')}</div>` });
        case 'clk': return Object.assign({}, it, { clk: true, k: 'html', fx: it.fx || 'pop', cls: 'sg-clkw ' + (it.cls || ''),
          html: `<div class="sg-clk"><i class="ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg></i><span class="lb">${esc(it.label || 'Access token')}</span><b class="tm">${fmt(it.from || 900)}</b><em class="st">Expired · 401</em></div>` });
        case 'kv': return Object.assign({}, it, { k: 'html', fx: it.fx || 'up', cls: 'sg-kvw ' + (it.cls || ''),
          html: `<div class="sg-kv"><div class="t">${it.logo ? `<img src="${it.logo}" alt="">` : ''}${esc(it.title)}</div><div class="b">${it.lines.join('\n')}</div></div>` });
        default: return it;
      }
    });
  }
  defineTemplate('signed', {
    check: (d, def) => { prep(d); B0().check(d, def); },
    beats: d => { prep(d); const n = B0().beats(d); (d.items || []).forEach(it => (it.hl || []).concat(it.pscroll || []).forEach(h => { if (!n.includes(h.b)) n.push(h.b); })); return n; },
    html: (d, c) => { prep(d); return B0().html(d, c) + (d.chap === false ? '' : chapHtml(c.p)); },
    frame: (t, c) => {
      prep(c.data); B0().frame(t, c);
      // a seg's rows lit on their beats (a claim and the code line that set it light together)
      (c.data.items || []).forEach(it => { if (it.clk) clkFrame(c, it); if (it.pscroll) scrollFrame(c, it); });
      chapFrame(c);
      const B = c.beats || {};
      (c.data.items || []).forEach(it => { if (!it.hl) return; const el = document.getElementById(c.p + it.id); if (!el) return;
        it.hl.forEach(({ b, row }) => { const r = el.querySelector('.ln[data-row="' + row + '"]'), at = B[b] ? B[b].s : Infinity; if (r) r.classList.toggle('on', c.local >= at - .1); }); });
    },
  });
})();
