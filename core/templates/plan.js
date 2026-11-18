/* plan: the floor-plan look (core/styles/plan.css, built for projects/reverse-proxy-lb-gateway).
   The video explains three infrastructure roles with a restaurant, so every slide is one architect's plan on drafting
   paper: rooms with ink walls, a front door, actors as logo tiles or characters, requests as dots walking dashed paths.
   Configs and commands are never stand-in cards: they type into an accurate VS Code (Dark Modern), a macOS Terminal,
   Chrome or the AWS console placed beside the plan.

   The scene engine is core/templates/cafe.js (items entering on spoken words, moves, swaps, states, counters, edges):
   this template prepares the plan-only kinds into cafe `html` items, then animates what cafe does not know (typing in
   the editor and terminal, walking dots, the over-the-face card). Every cafe kind and field still works.

   data: cafe's {eyebrow, accent, h1, w?, h?, items, edges?, sub?} plus over?
   plan kinds (item.k):
     room   {label, sub?, cls?: 'r'|'b'|'g'|'a'|'t'|'ghost'|'thin'}   a walled room, label top-left
     door   {r? (radius 80), rot? (deg)}                                 a door swing (quarter arc)
     dot    {walk?: {b, pts: [[x, y], …], d?}}                          a request; walks the points from beat b over d s
     vsc    {file, lang: 'js'|'nginx'|'caddy'|'sh', lines: [string], files?: [name | {name, dir?, on?}], title?,
             pre? (the first rows already in the file), keep? (other rows already there, 1-based), blocks?: [{b, from, to}] (1-based rows typing from a beat; default: all
             rows after pre from the item's type.b or its entrance), hl?: [{b, rows, until?, cls?}], edits?: [{b, row, text}],
             fs? (font px, 22), start? (number of the first row shown: an excerpt keeps the file's own line numbers), ln?: 'Ln 4, Col 18'}
     term   {title?, lines: [string] ('$ ' = a command typed at the prompt, the rest print after it), b of typing = type.b}
     chrome {url, title?, html (page content), fav?: brand slug}
     aws    {spec (core/components/aws-console.js awsConsole), s? (scale)}
   over: true | {eyebrow?, h1?, lines?: [{html, b?}], marks?: [{src, b?}]}   the card shown on the LEFT of his face
     inside an `over` reveal (scripts/dual-render.js): in the transparent capture the slide's own content hides and
     only this card shows. The opaque deck (version A) never shows it. */
(function () {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ---------- syntax colouring, VS Code Dark+ ---------- */
  function hlConf(line, caddy) {
    // nginx / Caddyfile: the first word of a statement is the directive, $vars light blue, numbers with units green,
    // URLs and paths orange, comments green-grey
    const out = []; let i = 0, first = true;
    const push = (cls, s) => out.push(cls ? `<span class="${cls}">${esc(s)}</span>` : esc(s));
    while (i < line.length) {
      const r = line.slice(i); let m;
      if ((m = /^\s+/.exec(r))) { push('', m[0]); i += m[0].length; continue; }
      if ((m = /^#.*/.exec(r))) { push('c', m[0]); i += m[0].length; continue; }
      if ((m = /^("[^"]*"|'[^']*')/.exec(r))) { push('s', m[0]); i += m[0].length; first = false; continue; }
      if ((m = /^\$[\w]+/.exec(r))) { push('v', m[0]); i += m[0].length; first = false; continue; }
      if ((m = /^[{};]/.exec(r))) { push('pu', m[0]); i += 1; if (m[0] !== '}') first = true; else first = true; continue; }
      if ((m = /^[^\s{};]+/.exec(r))) {
        const w = m[0];
        if (first) push(caddy && /\./.test(w) ? 's' : 'k', w);
        else if (/^(https?:\/\/|\/|:\d|\d+\.\d+\.\d+\.\d+|[\w-]+\.(com|local|example)\b)/.test(w)) push('s', w);
        else if (/^\d[\w/.]*$/.test(w)) push('n', w);
        else if (/=/.test(w)) { const k = w.indexOf('='); push('at', w.slice(0, k)); push('', '='); push(/^\d/.test(w.slice(k + 1)) ? 'n' : 's', w.slice(k + 1)); }
        else if (/^(on|off|ssl|http2|default_server|round_robin|random|least_conn|ip_hash|two)$/.test(w)) push('kc', w);
        else push('', w);
        i += w.length; first = false; continue;
      }
      push('', r[0]); i++;
    }
    return out.join('');
  }
  function hlSh(line) {
    return esc(line).replace(/(^|\s)(-{1,2}[\w-]+)/g, '$1<span class="k">$2</span>').replace(/(https?:\/\/[^\s<]+)/g, '<span class="s">$1</span>')
      .replace(/^(\w[\w-]*)/, '<span class="fn">$1</span>');
  }
  function hl(line, lang) {
    if (lang === 'nginx') return hlConf(line, false);
    if (lang === 'caddy') return hlConf(line, true);
    if (lang === 'sh') return hlSh(line);
    return typeof rlHl === 'function' ? rlHl(line, 'js') : esc(line);
  }
  const LANG = { js: 'JavaScript', nginx: 'Nginx', caddy: 'Caddyfile', sh: 'Shell Script' };
  const FI = { js: ['#F7DF1E', 'JS'], nginx: ['#3CB44A', 'N'], caddy: ['#1F88C0', 'C'], sh: ['#89E051', '$'], json: ['#CBCB41', '{}'], md: ['#519ABA', 'M'] };
  const ext = f => /\.js$/.test(f) ? 'js' : /\.conf$/.test(f) ? 'nginx' : /Caddyfile/.test(f) ? 'caddy' : /\.json$/.test(f) ? 'json' : /\.md$/.test(f) ? 'md' : /\.sh$/.test(f) ? 'sh' : '';
  const ficon = f => { const e = FI[ext(f)] || ['#8A8A8A', '≡']; return `<i class="fi" style="color:${e[0]}">${e[1]}</i>`; };
  const AB = ['M3 4.5h7l2 2h9v13H3z', 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.3 15.3 21 21', 'M6 3v12M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9c0 5-12 3-12 6',
    'M7 4l12 8-12 8z', 'M4 4h7v7H4zM13 13h7v7h-7zM4 13h7v7H4zM15 3l5 5-5 5-5-5z'];
  const svg = d => `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;

  /* ---------- VS Code, Dark Modern ---------- */
  function vscHtml(p, it) {
    const lang = it.lang || ext(it.file) || 'js', fs = it.fs || 22;
    const files = (it.files || [it.file]).map(f => typeof f === 'string' ? { name: f } : f);
    const ex = it.files ? `<div class="ex"><div class="eh">EXPLORER</div><div class="ep">⌄ ${esc(it.title || 'shop-app').toUpperCase()}</div>` +
      files.map(f => `<div class="ef${f.name === it.file ? ' on' : ''}${f.dir ? ' dir' : ''}" style="padding-left:${f.ind ? 20 + f.ind * 16 : 20}px">${f.dir ? '<i class="ch">›</i>' : ficon(f.name)}<span>${esc(f.name)}</span></div>`).join('') + '</div>' : '';
    const rows = it.lines.map((ln, i) => `<div class="ln" id="${p}${it.id}-r${i + 1}"><span class="g">${i + (it.start || 1)}</span><span class="t">${hl(ln, lang)}</span></div>`).join('');
    return `<div class="pl-vsc" style="--fs:${fs}px">
      <div class="vt"><span class="dots"><i></i><i></i><i></i></span><span class="nv">← →</span><div class="cc">${svg(AB[1])}${esc(it.title || 'shop-app')}</div></div>
      <div class="vm"><div class="ab">${AB.map((d, i) => `<span class="${i === 0 ? 'on' : ''}">${svg(d)}</span>`).join('')}</div>${ex}
        <div class="ea"><div class="tabs"><span class="tab on">${ficon(it.file)}<span>${esc(it.file)}</span><i class="x">×</i></span></div>
          <div class="bc"><span>${esc(it.title || 'shop-app')}</span><b>›</b>${ficon(it.file)}<span>${esc(it.file)}</span></div>
          <div class="cd" id="${p}${it.id}-code">${rows}</div></div></div>
      <div class="sb"><span class="rm">${svg('M8 7l-5 5 5 5M16 7l5 5-5 5')}</span><span>⎇ main</span><span>⊗ 0 ⚠ 0</span><span class="sp"></span><span>${it.ln || 'Ln ' + it.lines.length + ', Col 1'}</span><span>Spaces: ${lang === 'js' ? 2 : 4}</span><span>UTF-8</span><span>LF</span><span>${LANG[lang] || lang}</span></div></div>`;
  }
  /* ---------- macOS Terminal (Basic profile) ---------- */
  const PROMPT = 'ayo@MacBook-Pro ~ % ';
  function termHtml(p, it) {
    const rows = it.lines.map((ln, i) => /^\$ /.test(ln)
      ? `<div class="ln cmd" id="${p}${it.id}-r${i + 1}"><span class="pr">${esc(PROMPT)}</span><span class="t">${hlSh(ln.slice(2))}</span></div>`
      : `<div class="ln" id="${p}${it.id}-r${i + 1}"><span class="t">${esc(ln) || '&nbsp;'}</span></div>`).join('');
    return `<div class="pl-term"><div class="tb"><span class="dots"><i></i><i></i><i></i></span><span class="tt">${esc(it.title || 'ayo — -zsh — 120×30')}</span></div><div class="bd">${rows}</div></div>`;
  }
  /* ---------- Chrome ---------- */
  function chromeHtml(p, it) {
    const fav = it.fav ? `<img src="${logo(it.fav, true)}" alt="">` : '<i class="gl"></i>';
    return `<div class="pl-chrome"><div class="tabs"><span class="dots"><i></i><i></i><i></i></span><span class="tab">${fav}<span>${esc(it.title || it.url)}</span><i class="x">×</i></span><span class="nt">+</span></div>
      <div class="tool"><span class="nav">← → ↻</span><span class="omni"><i class="lk">${it.http ? 'ⓘ' : '🔒︎'}</i>${esc(it.url)}</span><span class="me"></span></div>
      <div class="page">${it.page || ''}</div></div>`;
  }

  function prep(d) {
    if (d.__plan) return; d.__plan = true;
    d.items = (d.items || []).map(it => {
      const o = Object.assign({}, it);
      const wrap = (kind, html) => Object.assign(o, { k: 'html', html, cls: `pl-${kind} ${o.cls || ''}`.trim(), plk: kind });
      switch (it.k) {
        case 'room': return wrap('room', `<span class="lb">${it.label || ''}</span>${it.sub ? `<span class="sb2">${it.sub}</span>` : ''}`);
        case 'door': { const r = it.r || 80; return Object.assign(wrap('door', `<svg viewBox="0 0 ${r} ${r}" style="width:${r}px;height:${r}px"><path class="leaf" d="M0 ${r}V0"/><path class="sw" d="M0 0A${r} ${r} 0 0 1 ${r} ${r}"/></svg>`), { r: it.rot || 0 }); }
        case 'dot': return wrap('dot', it.label ? `<span>${it.label}</span>` : '');
        case 'vsc': return Object.assign(wrap('vscw', ''), { lines: it.lines, __vsc: true });
        case 'term': return Object.assign(wrap('termw', ''), { lines: it.lines, __term: true });
        case 'chrome': return Object.assign(wrap('chromew', ''), { page: it.html });
        case 'aws': return wrap('awsw', '');
        default: return o;
      }
    });
  }
  // markup that needs the slide prefix is filled in at html() time
  function fill(d, p) {
    d.items.forEach(it => {
      if (it.plk === 'vscw') it.html = vscHtml(p, it);
      else if (it.plk === 'termw') it.html = termHtml(p, it);
      else if (it.plk === 'chromew') it.html = chromeHtml(p, it);
      else if (it.plk === 'awsw') it.html = `<div class="awsbox" style="transform:scale(${it.s || 1});transform-origin:0 0">${awsConsole(Object.assign({ id: p + it.id + '-aws', x: 0, y: 0 }, it.spec))}</div>`;
    });
  }
  function overHtml(p, d) {
    const o = d.over === true ? {} : d.over;
    const acc = ACCENT_VAR[o.acc || d.accent] ? `;--acc:var(${ACCENT_VAR[o.acc || d.accent]})` : '';
    const marks = (o.marks || []).length ? `<span class="mk">${o.marks.map((m, i) => `<img id="${p}ovm${i + 1}" src="${m.src}" alt="">`).join('')}</span>` : '';
    const lines = (o.lines || []).map((l, i) => `<span class="ln" id="${p}ovl${i + 1}">${l.html}</span>`).join('');
    return `<div class="pl-ov" id="${p}ov" style="top:${o.top || 250}px${acc}"><span class="eb">${o.eyebrow || d.eyebrow}</span><b>${o.h1 || d.h1}</b>${marks}${lines}</div>`;
  }
  function overBeats(d) {
    if (!d.over || d.over === true) return [];
    return [].concat((d.over.lines || []).map(l => l.b), (d.over.marks || []).map(m => m.b)).filter(Boolean);
  }
  function blocksOf(it) {
    const n = it.lines.length, pre = it.pre || 0;
    if (it.blocks) return it.blocks;
    return pre >= n ? [] : [{ b: it.type ? it.type.b : (it.b || it.id), from: pre + 1, to: n }];
  }
  function T() { const C = window.TEMPLATES && window.TEMPLATES.cafe; if (!C) throw new Error('plan: core/templates/cafe.js must load first'); return C; }

  /* the editor or terminal types: each block starts on its beat and its rows type one after another at a steady rate
     that ends before the next block (or the exit); rows not reached yet are not in the file (display:none) */
  function typeRows(c, B, it, rowId, outLine) {
    const p = c.p, n = it.lines.length, exit = (c.exit != null ? c.exit : c.screen) - .45;
    const pre = it.pre || 0, sched = [];
    const blocks = blocksOf(it).map(bk => ({ s: B.at(bk.b, .1, .3, 'enter', { focal: false }).s, from: bk.from, to: bk.to }));
    blocks.forEach((bk, k) => {
      const next = blocks[k + 1] ? blocks[k + 1].s - .1 : exit;
      let chars = 0; for (let i = bk.from; i <= bk.to; i++) chars += outLine(i) ? 0 : it.lines[i - 1].replace(/^\$ /, '').trim().length;
      const cps = Math.min(90, Math.max(it.cps || 24, chars / Math.max(.3, next - bk.s - .3)));
      let t = bk.s;
      for (let i = bk.from; i <= bk.to; i++) {
        const L = outLine(i) ? 0 : it.lines[i - 1].replace(/^\$ /, '').trim().length;
        const d = outLine(i) ? .05 : Math.max(.05, L / cps);
        sched[i] = { s: t + (outLine(i) ? .25 : 0), d, L }; t += d + (outLine(i) ? .3 : .06);
      }
    });
    let caret = 0;
    for (let i = 1; i <= n; i++) {
      const r = el(rowId(i)); if (!r) continue;
      const S = sched[i], kept = i <= pre || (it.keep || []).includes(i), shown = kept || !S || c.local >= S.s;
      if (!S && !kept && blocks.length) { r.style.display = 'none'; continue; }
      r.style.display = shown ? '' : 'none';
      if (!S || !shown) continue;
      caret = i;
      if (outLine(i)) continue;
      const q = cl((c.local - S.s) / S.d, 0, 1), k = q >= 1 ? -1 : Math.floor(q * S.L), t = r.querySelector('.t');
      if (t && t.dataset.k !== String(k)) {
        const raw = it.lines[i - 1].replace(/^\$ /, ''), ind = (/^ */.exec(raw) || [''])[0].length;
        t.innerHTML = k < 0 ? (it.__term ? hlSh(raw) : hl(raw, it.lang || ext(it.file))) : (it.__term ? hlSh(raw.slice(0, ind + k)) : hl(raw.slice(0, ind + k), it.lang || ext(it.file)));
        t.dataset.k = String(k);
      }
    }
    for (let i = 1; i <= n; i++) { const r = el(rowId(i)); if (r) r.classList.toggle('typing', i === caret && !!sched[i]); }
    const S = sched[caret], done = S && c.local >= S.s + S.d;
    const cr = caret && el(rowId(caret)); if (cr) cr.classList.toggle('blink', !!done && Math.floor((c.local - S.s - S.d) / .53) % 2 === 1);
    // the view keeps the caret row in sight
    const code = el(p + it.id + '-code'); const box = code && code.parentElement;
    if (code && cr && box) { const over = Math.max(0, cr.offsetTop + cr.offsetHeight + 20 - code.clientHeight); code.scrollTop = over; }
    const T0 = (c.T != null ? c.T : c.local) - c.local;
    (window.PL_TYPED = window.PL_TYPED || {})[p + it.id] = sched.filter(x => x && x.L).map(x => [+(T0 + x.s).toFixed(3), +x.d.toFixed(3), x.L]);
  }
  function walkAt(pts, q) {
    const seglen = []; let L = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seglen.push(l); L += l; }
    let d = q * L;
    for (let i = 0; i < seglen.length; i++) {
      if (d <= seglen[i] || i === seglen.length - 1) { const f = seglen[i] ? cl(d / seglen[i], 0, 1) : 1; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; }
      d -= seglen[i];
    }
    return pts[pts.length - 1];
  }

  defineTemplate('plan', {
    check: (d, def) => { prep(d); T().check(d, def); },
    beats: d => {
      prep(d);
      const n = T().beats(d);
      d.items.forEach(it => {
        (it.blocks || []).forEach(b => n.push(b.b)); (it.hl || []).forEach(h => { n.push(h.b); if (h.until) n.push(h.until); });
        (it.edits || []).forEach(e => n.push(e.b)); if (it.walk) n.push(it.walk.b);
      });
      return Array.from(new Set(n.concat(overBeats(d)).filter(Boolean)));
    },
    html: (d, c) => { fill(d, c.p); return T().html(d, c) + (d.over ? overHtml(c.p, d) : ''); },
    frame: (t, c) => {
      T().frame(t, c);
      const p = c.p, d = c.data, B = beats(c);
      d.items.forEach(it => {
        const id = p + it.id;
        if (it.__vsc || it.__term) {
          const isOut = i => it.__term && !/^\$ /.test(it.lines[i - 1]);
          typeRows(c, B, it, i => id + '-r' + i, isOut);
          (it.hl || []).forEach(h => {
            const on = B.p(h.b, .5, .55, 'pop', { focal: false }) > .3 && !(h.until && B.p(h.until, .9, .95, 'pop', { focal: false }) > .3);
            h.rows.forEach(r => cls(id + '-r' + r, h.cls || 'hl', on));
          });
          (it.edits || []).forEach(e => {
            const r0 = B.at(e.b, .5, .6, 'enter', { focal: false }), r = el(id + '-r' + e.row); if (!r) return;
            const t = r.querySelector('.t'), q = cl((c.local - r0.s) / .7, 0, 1);
            if (c.local < r0.s) return;
            const ind = (/^ */.exec(e.text) || [''])[0].length, body = e.text.slice(ind), k = q >= 1 ? -1 : Math.floor(q * body.length);
            const key = 'e' + k; if (t.dataset.k === key) return;
            t.innerHTML = hl(k < 0 ? e.text : e.text.slice(0, ind + k), it.lang || ext(it.file)); t.dataset.k = key;
            r.classList.add('edited');
          });
        }
        if (it.walk) {
          const e = el(id); if (!e) return;
          const w = it.walk, r0 = B.at(w.b, .3, .6, 'enter', { focal: false, len: w.d || 1.6 });
          const q = eio(cl((c.local - r0.s) / (w.d || 1.6), 0, 1));
          const [x, y] = walkAt(w.pts, q);
          e.style.left = (x - (it.w || 30) / 2).toFixed(1) + 'px'; e.style.top = (y - (it.h || 30) / 2).toFixed(1) + 'px';
          e.style.opacity = c.local >= r0.s - .05 ? (w.stay === false && q >= 1 ? '0' : '1') : '0';
        }
      });
      if (d.over) {
        const root = el(c.id); if (root) root.classList.add('ovs');
        const o = d.over === true ? {} : d.over;
        pp(p + 'ov', seg(c.local, .1, .1 + BEAT.pop), .9);
        (o.marks || []).forEach((m, i) => pp(p + 'ovm' + (i + 1), m.b && c.beats && c.beats[m.b] ? seg(c.local, c.beats[m.b].s, c.beats[m.b].s + BEAT.pop) : seg(c.local, .3 + i * .15, .6 + i * .15), .5));
        (o.lines || []).forEach((l, i) => { const lb = l.b && c.beats && c.beats[l.b], s = lb ? lb.s : .5 + i * .3; up(p + 'ovl' + (i + 1), seg(c.local, s, s + BEAT.enter), 14); });
      }
    },
  });
})();
