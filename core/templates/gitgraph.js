/* gitgraph: a dark Git client (core/styles/gitgraph.css), built for projects/undo-git-mistakes. The video explains how to
   undo Git mistakes, so the deck is the app people do that in: a commit graph with coloured lanes, round commit nodes
   with their hashes and messages, a HEAD label and branch pills that move along the graph, the three places changes live
   (working directory, staging area, repository, later the remote) as panels, files as chips with Git's status letters,
   and a macOS Terminal where every command types. Orange is HEAD and the accent; red is destructive; green is safe.

   The scene engine is bistro (core/templates/bistro.js, on cafe.js): items enter on spoken words, move, swap, change
   state, terminals and editors type, arrows draw along their paths, and the over-the-face / split layouts come with it.
   This template prepares its own kinds into bistro's `html` items and hands everything else through unchanged.

   data: bistro's {eyebrow, accent, h1, w?, h?, items, edges?, over?, sub?}
   gitgraph kinds (item.k):
     node  {hash, msg?, cls?, letter?}       a commit: a ring on the lane, the short hash in mono, the message beside it;
                                              letter (A, B, C …) sits in a badge left of the ring so viewers can follow the story
                                              cls: 'bad' (the wrong commit) · 'new' (just made) · 'ghost' (gone) · 'rv' (a revert)
     ref   {label, kind?: 'head'|'branch'|'remote'|'tag'}   a pill pointing at a commit (HEAD orange, branch green, remote violet)
     area  {label, sub?, icon, tag?}          one of the places changes live: a panel with a header; tag = the shop word
     file  {name, st: 'M'|'A'|'D'|'U'|'?'}    a file chip with its status letter, coloured like a Git client
     win   {title, branch?}                   the client's window chrome behind a scene (title bar, branch picker)
     lane  {}                                 use an edge with cls 'lane' (drawn on its beat like any edge)
   Everything else (term, vsc, chip, card, txt, who, stamp, packet …) is bistro's or cafe's. */
(function () {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const ICON = {
    folder: 'M3 6.5h6l2 2h10v10.5H3z',
    tray: 'M3 13h5l1.5 3h5L16 13h5M3 13l2.5-7h13L21 13v6H3z',
    history: 'M3.5 12a8.5 8.5 0 1 0 2.5-6M3.5 4v4h4M12 7.5V12l3 2',
    cloud: 'M7 18.5h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.3 9.7 4.4 4.4 0 0 0 7 18.5z',
    drawer: 'M3.5 4.5h17v15h-17zM3.5 12h17M10 8h4M10 15.5h4',
    laptop: 'M5 5.5h14v9H5zM2.5 18.5h19',
    book: 'M5 4.5h11a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3zM5 16.5a3 3 0 0 1 3-3h11',
  };
  const ico = n => `<svg viewBox="0 0 24 24"><path d="${ICON[n] || ICON.folder}"/></svg>`;
  /* the client's ground (bistro draws and drives it). Review 3 asked for background ideas to pick from; four are kept,
     chosen by PROJECT.ground or --var bg= (VARS wins, so a candidate renders without editing the project):
       lanes  the margins as a static commit graph: coloured lanes, a branch out and back, breathing rings (review 2)
       log    a living `git log --graph` in each margin: a commit pops onto the newest row every few seconds, branches fork
              and merge, and the whole log scrolls up as it is written
       stars  a commit constellation framing the content: rings at three depths drifting with parallax, joined parent to
              child, a pulse of light running down one edge after another
       diff   a diff stream: columns of + / - / @@ lines and short hashes drifting up the margins at their own speeds
     All of it stays outside the content box (x 230-1690, y 250-860) and under the content's darkening. */
  const HS = n => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
  const ICONS = {
    branch: 'M6 3v12M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9c0 5-12 3-12 6',
    commit: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM2 12h6M16 12h6',
    merge: 'M6 3v18M6 9a6 6 0 0 0 6 6h3M18 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    undo: 'M4 9h11a5 5 0 0 1 0 10H8M4 9l4-4M4 9l4 4',
    term: 'M3 4.5h18v15H3zM7 10l3 2-3 2M12 15h5',
    tag: 'M3 12V4h8l10 10-8 8z',
  };
  const BOX = { x0: 230, x1: 1690, y0: 250, y1: 860 };
  const inBox = (x, y, m) => x > BOX.x0 - m && x < BOX.x1 + m && y > BOX.y0 - m && y < BOX.y1 + m;
  const SVG0 = cls => `<svg class="${cls}" viewBox="0 0 1920 1080" preserveAspectRatio="none">`;

  // ---- log: a living git log --graph, one per margin ----
  const LOG = { pitch: 72, base: 1010, rows: 17, cols: [{ x0: 58, dx: 46, spd: 15, ph: 0 }, { x0: 1862, dx: -46, spd: 15, ph: 4.5 }] };
  const logRow = (k, c) => {   // what row k of column c holds: a commit on main, a fork, a branch commit or a merge
    const m = Math.floor(k / 9), r = k - 9 * m, on = HS(m * 7 + c * 31) > .2, len = 2 + Math.floor(HS(m * 3 + c * 17 + 1) * 3);
    if (!on || r < 1 || r > 2 + len) return 'main';
    return r === 1 ? 'fork' : r === 2 + len ? 'merge' : 'br';
  };
  const logHtml = () => SVG0('gl') + LOG.cols.map((c, ci) => `<g class="col c${ci}"><line class="mn" x1="${c.x0}" x2="${c.x0}"/>` +
    Array.from({ length: LOG.rows }, () => '<path class="br"/><circle class="cm"/>').join('') + '</g>').join('') + '</svg>';
  function logFrame(g, T) {
    g.querySelectorAll('svg.gl g.col').forEach((col, ci) => {
      const c = LOG.cols[ci], s = T * c.spd / LOG.pitch + c.ph, N = Math.floor(s), f = s - N;
      const age = f * LOG.pitch / c.spd, q = Math.min(1, age / .4), pop = q < 1 ? 1 + 2.7 * Math.pow(q - 1, 3) + 1.7 * Math.pow(q - 1, 2) : 1;
      const y = k => LOG.base - (s - k) * LOG.pitch, mn = col.querySelector('.mn'), br = col.querySelectorAll('path.br'), cm = col.querySelectorAll('circle.cm');
      mn.setAttribute('y1', '-40'); mn.setAttribute('y2', y(N).toFixed(1));
      for (let i = 0; i < LOG.rows; i++) {
        const k = N - i, t = logRow(k, ci), yy = y(k), yp = yy - LOG.pitch, xb = c.x0 + c.dx, h = LOG.pitch / 2;
        const x = t === 'br' ? xb : c.x0;
        let d = '';
        if (t === 'br') d = logRow(k - 1, ci) === 'fork' ? `M${c.x0} ${yp} C${c.x0} ${yp + h} ${xb} ${yy - h} ${xb} ${yy}` : `M${xb} ${yp} V${yy}`;
        if (t === 'merge') d = `M${xb} ${yp} C${xb} ${yp + h} ${c.x0} ${yy - h} ${c.x0} ${yy}`;
        br[i].setAttribute('d', d); br[i].style.opacity = i === 0 ? q.toFixed(3) : '';
        cm[i].setAttribute('cx', x); cm[i].setAttribute('cy', yy.toFixed(1));
        cm[i].setAttribute('r', ((t === 'merge' ? 10 : 8) * (i === 0 ? pop : 1)).toFixed(2));
        cm[i].setAttribute('class', 'cm ' + t + (i === 0 && q < 1 ? ' nw' : ''));
      }
    });
  }

  // ---- stars: a commit constellation at three depths ----
  const STARS = (() => {
    const pts = [];
    for (let i = 0; pts.length < 54 && i < 900; i++) {
      const x = HS(i * 2.1) * 1920, y = HS(i * 3.7 + 9) * 1080;
      if (inBox(x, y, 30) || pts.some(p => Math.hypot(p.x - x, p.y - y) < 95)) continue;
      pts.push({ x, y, l: Math.floor(HS(i * 5.3) * 3), ph: HS(i * 1.9) * 6.28, c: Math.floor(HS(i * 8.1) * 4) });
    }
    const edges = [];
    pts.forEach((p, i) => {
      const near = pts.map((q, j) => [Math.hypot(q.x - p.x, q.y - p.y), j]).filter(([dd, j]) => j !== i && dd < 260).sort((a, b) => a[0] - b[0]).slice(0, 2);
      near.forEach(([dd, j]) => { if (!edges.some(e => (e[0] === j && e[1] === i))) edges.push([i, j]); });
    });
    return { pts, edges };
  })();
  const starsHtml = () => SVG0('gs') + STARS.edges.map(() => '<line class="ed"/>').join('') +
    STARS.pts.map(p => `<circle class="st l${p.l} k${p.c}" r="${[3, 5, 8][p.l]}"/>`).join('') + '<circle class="pl" r="6"/><circle class="pl" r="6"/></svg>';
  const starAt = (p, T) => { const A = [8, 14, 22][p.l], P = [60, 45, 34][p.l];
    return [p.x + A * Math.sin(T / P * 6.28 + p.ph), p.y + A * .7 * Math.cos(T / (P * 1.3) * 6.28 + p.ph)]; };
  function starsFrame(g, T) {
    const svg = g.querySelector('svg.gs'); if (!svg) return;
    const at = STARS.pts.map(p => starAt(p, T)), ed = svg.querySelectorAll('.ed'), st = svg.querySelectorAll('.st'), pl = svg.querySelectorAll('.pl');
    STARS.edges.forEach(([a, b], i) => { ed[i].setAttribute('x1', at[a][0].toFixed(1)); ed[i].setAttribute('y1', at[a][1].toFixed(1)); ed[i].setAttribute('x2', at[b][0].toFixed(1)); ed[i].setAttribute('y2', at[b][1].toFixed(1)); });
    st.forEach((e, i) => { e.setAttribute('cx', at[i][0].toFixed(1)); e.setAttribute('cy', at[i][1].toFixed(1)); e.style.opacity = (.75 + .25 * Math.sin(T / 3 + i)).toFixed(3); });
    // two pulses, half a period apart, each running parent → child along the next edge
    pl.forEach((e, j) => { const P = 1.6, u = T / P + j * .5, n = Math.floor(u), q = u - n, [a, b] = STARS.edges[(n * 7 + j * 13) % STARS.edges.length];
      e.setAttribute('cx', (at[a][0] + (at[b][0] - at[a][0]) * q).toFixed(1)); e.setAttribute('cy', (at[a][1] + (at[b][1] - at[a][1]) * q).toFixed(1));
      e.style.opacity = Math.sin(Math.PI * q).toFixed(3); });
  }

  // ---- diff: + / - / @@ lines drifting up the margins ----
  const DIFF = ['@@ -1,6 +1,9 @@', '+ interface Card {', '+   number: string;', '+   expiry: Date;', '  }', '- pay(card)', '+ pay(card, cents)',
    'a75ab6a', '@@ -12,4 +12,7 @@', '+ errors.push(…)', '- return null;', '+ return errors;', 'ed1273c', '+ await charge()', '- // TODO',
    '@@ -23,3 +23,9 @@', '+ validateCard(card)', '  if (!card) {', '- throw err;', '+ throw new Error', '2d74db0', '+ const total =', '- total = 0;',
    '@@ -30,2 +30,4 @@', '+ applyDiscount()', '  return', '6377156', '- 19 lines', '+ TAX_RATE = 0.2'];
  const DCOL = [{ x: 22, spd: 13, o: 0 }, { x: 1726, spd: 9, o: 11 }];
  const DLH = 30, DROWS = 40;
  const diffHtml = () => SVG0('gd') + DCOL.map((c, ci) => `<g class="dc">${Array.from({ length: DROWS }, () => `<text x="${c.x}"></text>`).join('')}</g>`).join('') + '</svg>';
  function diffFrame(g, T) {
    g.querySelectorAll('svg.gd g.dc').forEach((col, ci) => {
      const c = DCOL[ci], off = T * c.spd, k0 = Math.ceil((off - 1130) / DLH);
      col.querySelectorAll('text').forEach((e, i) => {
        const k = k0 + i, y = 1100 + k * DLH - off, line = DIFF[((k + c.o) % DIFF.length + DIFF.length) % DIFF.length];
        if (e.dataset.k !== String(k)) { e.textContent = line; e.dataset.k = String(k);
          e.setAttribute('class', /^\+/.test(line) ? 'p' : /^-/.test(line) ? 'm' : /^@@/.test(line) ? 'h' : /^[0-9a-f]{7}$/.test(line) ? 'x' : 'c'); }
        e.setAttribute('y', y.toFixed(1));
        const hi = HS(k * 3.3 + ci) > .9 ? Math.max(0, Math.sin((T / 4 + HS(k) ) * 6.28)) : 0;
        e.style.opacity = (.55 + .45 * hi).toFixed(3);
      });
    });
  }

  const KIND = (window.VARS && window.VARS.bg) || (window.PROJECT && PROJECT.ground) || 'lanes';
  const LANES = {
    /* review 1 ("improve the background so it does not interfere with the text"): marks and lanes only in the margins.
       Review 2 ("too bland"): two lanes a side with a branch that leaves and merges back, breathing commit rings. */
    marks: [['tag', 300, 950, 90], ['term', 1500, 950, 90], ['undo', 1760, 900, 100], ['merge', 30, 900, 100]],
    routes: ['M70 1120 V-40', 'M70 760 C70 700 136 700 136 640 V380 C136 320 70 320 70 260',
      'M1850 1120 V-40', 'M1850 640 C1850 580 1784 580 1784 520 V250 C1784 190 1850 190 1850 130', 'M-40 1032 H1960'],
    nodes: [[70, 150, 0], [70, 230, 0], [70, 820, 0], [70, 960, 0], [136, 440, 1], [136, 560, 1],
      [1850, 90, 2], [1850, 720, 2], [1850, 860, 2], [1784, 330, 3], [1784, 450, 3], [520, 1032, 4, 7], [1320, 1032, 4, 7]],
  };
  const OWN = { log: [logHtml, logFrame], stars: [starsHtml, starsFrame], diff: [diffHtml, diffFrame] }[KIND];
  window.BS_GROUND = Object.assign({ theme: 'gitgraph', kind: KIND, icons: ICONS }, OWN ? { marks: [], routes: [], nodes: [], html: OWN[0], frame: OWN[1] } : LANES);
  if (window.bsInstallGround) window.bsInstallGround();

  const B0 = () => { const t = window.TEMPLATES && window.TEMPLATES.bistro; if (!t) throw new Error('gitgraph: core/templates/bistro.js must load first'); return t; };
  const REF = { head: 'HEAD', branch: '', remote: '', tag: '' };
  const ST = { M: 'm', A: 'a', D: 'd', U: 'u', '?': 'u' };
  function prep(d) {
    if (d.__gg) return; d.__gg = true;
    d.items = (d.items || []).map(it => {
      switch (it.k) {
        case 'node': return Object.assign({}, it, { k: 'html', fx: it.fx || 'pop', cls: 'gg-nodew ' + (it.cls || '') + (it.letter ? ' lt' : ''),
          html: `<div class="gg-node">${it.letter ? `<i class="lt">${esc(it.letter)}</i>` : ''}<i class="dot"></i><b>${esc(it.hash)}</b>${it.msg ? `<span>${esc(it.msg)}</span>` : ''}</div>` });
        case 'ref': return Object.assign({}, it, { k: 'html', fx: it.fx || 'sx', cls: 'gg-refw ' + (it.kind || 'branch') + ' ' + (it.cls || ''),
          html: `<span class="gg-ref">${it.kind === 'head' ? '<i class="hd"></i>' : ''}${esc(it.label || REF[it.kind || 'branch'])}</span>` });
        case 'area': return Object.assign({}, it, { k: 'html', fx: it.fx || 'up', cls: 'gg-areaw ' + (it.cls || ''),
          html: `<div class="gg-area"><div class="ah">${ico(it.icon)}<b>${esc(it.label)}</b>${it.tag ? `<span class="tg">${esc(it.tag)}</span>` : ''}</div>${it.sub ? `<div class="as">${it.sub}</div>` : ''}</div>` });
        case 'file': return Object.assign({}, it, { k: 'html', fx: it.fx || 'pop', cls: 'gg-filew ' + (ST[it.st] || 'm') + ' ' + (it.cls || ''),
          html: `<span class="gg-file">${window.BS_FILE_ICON && window.BS_FILE_ICON(it.name) ? `<i class="fi mi">${window.BS_FILE_ICON(it.name)}</i>` : '<i class="fi"></i>'}${esc(it.name)}<b>${esc(it.st === '?' ? 'U' : it.st)}</b></span>` });
        case 'win': return Object.assign({}, it, { k: 'html', fx: it.fx || 'fd', z: it.z != null ? it.z : 0, cls: 'gg-winw ' + (it.cls || ''),
          html: `<div class="gg-win"><div class="wt"><span class="dots"><i></i><i></i><i></i></span><b>${esc(it.title || 'shop-app')}</b>${it.branch ? `<span class="br"><svg viewBox="0 0 24 24"><path d="${window.BS_GROUND.icons.branch}"/></svg>${esc(it.branch)} ▾</span>` : ''}</div><div class="wb"></div></div>` });
        default: return it;
      }
    });
  }

  defineTemplate('gitgraph', {
    check: (d, def) => { prep(d); B0().check(d, def); },
    beats: d => { prep(d); return B0().beats(d); },
    html: (d, c) => { prep(d); return B0().html(d, c); },
    frame: (t, c) => { prep(c.data); B0().frame(t, c); },
  });
})();
