/* bistro: the dark restaurant look (core/styles/bistro.css), built for projects/reverse-proxy-lb-gateway (revision 2,
   replacing the light floor plan the user turned down: "use dark theme", "improve the illustration", "arrows and flips").
   The video explains a reverse proxy, a load balancer and an API gateway with a restaurant, so the story is drawn as an
   illustrated cutaway of that restaurant (street, door, host stand, dining room, order counter, kitchen; later a food hall
   with counters) on a deep night ground. Requests are glowing packets that travel visible paths with arrowheads; a thing
   that changes role flips over (the forward proxy turns into the reverse proxy). Code and commands sit in accurate app
   windows (VS Code Dark Modern, macOS Terminal, Chrome, the AWS console).

   The scene engine is core/templates/cafe.js (items entering on spoken words, moves, swaps, states, counters, edges). This
   template prepares its own kinds into cafe `html` items, then animates what cafe does not know: typing in the editor and
   terminal, packets walking paths, flips, lit parts of an illustration, and the over-the-face overlay.

   data: cafe's {eyebrow, accent, h1, w?, h?, items, edges?, sub?} plus over?
   bistro kinds (item.k):
     svg    {html, lit?: [{b, part, until?}]}       an illustration; parts are elements with data-part="name", lit on beats
     flip   {front, back, b2 (the flip beat)}         a card that turns over on b2 and shows its back
     packet {walk: {b, pts: [[x, y], …], d?, stay?}, label?}   a glowing request travelling a path
     vsc    {file, lang, lines, files?, title?, pre?, keep?, blocks?, hl?, edits?, fs?, start?, ln?}
            the font fits the longest line to the code column (never clipped): it steps down from fs (22) to a floor
            of 15 px, and a file that still does not fit throws, so it is reformatted (house rule)
     term   {title?, lines (`$ ` = a command typed at the prompt; the rest print after it), type: {b}}
     chrome {url, title?, html (the page), fav?}
     aws    {spec (awsConsole), s?}
   split: true   inside a split reveal the slide sits in the right two thirds beside the face (dual-render's split window)
   over: {rows?: [{html, icon?, logo?, b?, cls?}], eyebrow?, h1?}   inside an `over` reveal the slide's own content hides
     and the left of the frame darkens under a gradient; the heading sits top-left and every row is its own line with
     its own entrance (projects/backend-one-click's overlay; never a card on the face). */
(function () {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const PROMPT = 'josh@MacBook-Pro ~ % ';   // a neutral made-up user (house rule: no real names on screen)

  /* ---------- syntax colouring, VS Code Dark+ ---------- */
  function hlConf(line, caddy) {
    const out = []; let i = 0, first = true;
    const push = (cls, s) => out.push(cls ? `<span class="${cls}">${esc(s)}</span>` : esc(s));
    while (i < line.length) {
      const r = line.slice(i); let m;
      if ((m = /^\s+/.exec(r))) { push('', m[0]); i += m[0].length; continue; }
      if ((m = /^#.*/.exec(r))) { push('c', m[0]); i += m[0].length; continue; }
      if ((m = /^("[^"]*"|'[^']*')/.exec(r))) { push('s', m[0]); i += m[0].length; first = false; continue; }
      if ((m = /^\$[\w]+/.exec(r))) { push('v', m[0]); i += m[0].length; first = false; continue; }
      if ((m = /^[{};]/.exec(r))) { push('pu', m[0]); i += 1; first = true; continue; }
      if ((m = /^[^\s{};]+/.exec(r))) {
        const w = m[0];
        if (first) push(caddy && /\./.test(w) ? 's' : 'k', w);
        else if (/^(https?:\/\/|\/|:\d|\d+\.\d+\.\d+\.\d+|[\w-]+\.(com|local|example)\b)/.test(w)) push('s', w);
        else if (/^\d[\w/.]*$/.test(w)) push('n', w);
        else if (/=/.test(w)) { const k = w.indexOf('='); push('at', w.slice(0, k)); push('', '='); push(/^\d/.test(w.slice(k + 1)) ? 'n' : 's', w.slice(k + 1)); }
        else if (/^(on|off|ssl|internal|round_robin|random|least_conn|ip_hash|two)$/.test(w)) push('kc', w);
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
  const CHROME = { ab: 52, ex: 230, gut: 64, pad: 26 };

  /* the font that fits the longest line in the code column; a file that cannot fit at 15 px is reformatted, never clipped */
  function fitFont(it) {
    const want = it.fs || 22, codeW = it.w - CHROME.ab - (it.files ? CHROME.ex : 0) - CHROME.gut - CHROME.pad;
    const cols = it.lines.reduce((m, l) => Math.max(m, l.length), 0) + 1;
    const fs = Math.min(want, Math.floor(codeW / (cols * .6) * 10) / 10);
    if (fs < 15) throw new Error(`bistro: ${it.file} has a ${cols - 1}-column line; the ${it.w}px editor would need ${fs}px type. Reformat the file (house rule: code is never cut off)`);
    return fs;
  }
  function vscHtml(p, it) {
    const lang = it.lang || ext(it.file) || 'js', fs = fitFont(it);
    const files = (it.files || [it.file]).map(f => typeof f === 'string' ? { name: f } : f);
    const ex = it.files ? `<div class="ex"><div class="eh">EXPLORER</div><div class="ep">⌄ ${esc(it.title || 'shop-app').toUpperCase()}</div>` +
      files.map(f => `<div class="ef${f.name === it.file ? ' on' : ''}">${ficon(f.name)}<span>${esc(f.name)}</span></div>`).join('') + '</div>' : '';
    const rows = it.lines.map((ln, i) => `<div class="ln" id="${p}${it.id}-r${i + 1}"><span class="g">${i + (it.start || 1)}</span><span class="t">${hl(ln, lang)}</span></div>`).join('');
    return `<div class="bs-vsc" style="--fs:${fs}px">
      <div class="vt"><span class="dots"><i></i><i></i><i></i></span><span class="nv">← →</span><div class="cc">${svg(AB[1])}${esc(it.title || 'shop-app')}</div></div>
      <div class="vm"><div class="ab">${AB.map((d, i) => `<span class="${i === 0 ? 'on' : ''}">${svg(d)}</span>`).join('')}</div>${ex}
        <div class="ea"><div class="tabs"><span class="tab on">${ficon(it.file)}<span>${esc(it.file)}</span><i class="x">×</i></span></div>
          <div class="bc"><span>${esc(it.title || 'shop-app')}</span><b>›</b>${ficon(it.file)}<span>${esc(it.file)}</span></div>
          <div class="cd" id="${p}${it.id}-code">${rows}</div></div></div>
      <div class="sb"><span class="rm">${svg('M8 7l-5 5 5 5M16 7l5 5-5 5')}</span><span>⎇ main</span><span>⊗ 0 ⚠ 0</span><span class="sp"></span><span>${it.ln || 'Ln ' + it.lines.length + ', Col 1'}</span><span>Spaces: ${lang === 'js' ? 2 : 4}</span><span>UTF-8</span><span>LF</span><span>${LANG[lang] || lang}</span></div></div>`;
  }
  function termHtml(p, it) {
    const rows = it.lines.map((ln, i) => /^\$ /.test(ln)
      ? `<div class="ln cmd" id="${p}${it.id}-r${i + 1}"><span class="pr">${esc(PROMPT)}</span><span class="t">${hlSh(ln.slice(2))}</span></div>`
      : `<div class="ln" id="${p}${it.id}-r${i + 1}"><span class="t">${esc(ln) || '&nbsp;'}</span></div>`).join('');
    return `<div class="bs-term"><div class="tb"><span class="dots"><i></i><i></i><i></i></span><span class="tt">${esc(it.title || 'josh — -zsh — 120×30')}</span></div><div class="bd">${rows}</div></div>`;
  }
  function chromeHtml(p, it) {
    const fav = it.fav ? `<img src="${logo(it.fav, true)}" alt="">` : '<i class="gl"></i>';
    return `<div class="bs-chrome"><div class="tabs"><span class="dots"><i></i><i></i><i></i></span><span class="tab">${fav}<span>${esc(it.title || it.url)}</span><i class="x">×</i></span><span class="nt">+</span></div>
      <div class="tool"><span class="nav">← → ↻</span><span class="omni"><i class="lk">⊙</i>${esc(it.url)}</span><span class="me"></span></div>
      <div class="page">${it.page || ''}</div></div>`;
  }

  function prep(d) {
    if (d.__bs) return; d.__bs = true;
    d.items = (d.items || []).map(it => {
      const o = Object.assign({}, it);
      const wrap = (kind, html) => Object.assign(o, { k: 'html', html, cls: `bs-${kind} ${o.cls || ''}`.trim(), bsk: kind });
      switch (it.k) {
        case 'svg': return wrap('svg', it.html);
        case 'flip': return wrap('flip', `<div class="fl" id="__FL__"><div class="fa">${it.front}</div><div class="fb">${it.back}</div></div>`);
        // a request is an arrow: its line draws along straight segments with the arrowhead at the tip (review 2: no
        // glowing dot easing along a curve). The item sits at 0,0 so the svg draws in world coordinates; `pre` keeps
        // cafe's slide-up entrance off it (that entrance plus the walk made the curved path).
        case 'packet': return Object.assign(wrap('arw', `<svg class="aw" width="2" height="2"><path class="tr" d=""/><path class="hd" d="M-16 -10 L6 0 L-16 10 Z"/></svg>${it.label ? `<span class="lb">${it.label}</span>` : ''}`),
          { x: 0, y: 0, w: 2, h: 2, pre: true });
        case 'vsc': return Object.assign(wrap('vscw', ''), { lines: it.lines, __vsc: true });
        case 'term': return Object.assign(wrap('termw', ''), { lines: it.lines, __term: true });
        case 'chrome': return Object.assign(wrap('chromew', ''), { page: it.html });
        case 'aws': return wrap('awsw', '');
        default: return o;
      }
    });
  }
  function fill(d, p) {
    d.items.forEach(it => {
      if (it.bsk === 'vscw') it.html = vscHtml(p, it);
      else if (it.bsk === 'termw') it.html = termHtml(p, it);
      else if (it.bsk === 'chromew') it.html = chromeHtml(p, it);
      else if (it.bsk === 'awsw') it.html = `<div class="awsbox" style="transform:scale(${it.s || 1});transform-origin:0 0">${awsConsole(Object.assign({ id: p + it.id + '-aws', x: 0, y: 0 }, it.spec))}</div>`;
      else if (it.bsk === 'flip') it.html = it.html.replace('__FL__', p + it.id + '-fl');
      else if (it.bsk === 'svg') {
        // gradient ids are per slide (the same illustration appears on many slides; duplicate ids clash), parts get ids to light
        let h = it.html;
        const defs = [...h.matchAll(/<(?:linearGradient|radialGradient|pattern|filter|clipPath)[^>]*\sid="([\w-]+)"/g)].map(m => m[1]);
        defs.forEach(n => { h = h.split(`id="${n}"`).join(`id="${p}${it.id}-g-${n}"`).split(`url(#${n})`).join(`url(#${p}${it.id}-g-${n})`); });
        it.html = h.replace(/data-part="([\w-]+)"/g, (m, n) => `${m} id="${p}${it.id}-${n}"`);
      }
    });
  }
  /* the overlay: a left-side darkening, the heading top-left, every row its own line */
  // the overlay's subscribe bar: one options object for its markup and its motion (the cursor's targets scale with k)
  const SUB_OV = { x: 0, y: 0, k: .37, name: 'LifeTech Facts', handle: '@lifetechfacts' };
  function overHtml(p, d) {
    const o = d.over === true ? {} : d.over;
    const acc = ACCENT_VAR[o.acc || d.accent] ? `;--acc:var(${ACCENT_VAR[o.acc || d.accent]})` : '';
    const rows = (o.rows || []).map((r, i) => `<div class="row ${r.cls || ''}" id="${p}ovr${i + 1}">${r.logo ? `<img src="${logo(r.logo, true)}" alt="">` : r.img ? `<img src="${r.img}" alt="">` : r.icon ? `<span class="ic"><svg viewBox="0 0 24 24"><use href="#i-${r.icon}"/></svg></span>` : ''}<span>${r.html}</span>${r.side ? `<img class="sd" src="${r.side}" alt="">` : ''}</div>`).join('');
    // o.sub = {b}: the channel's subscribe bar (core/components/subscribe.js) under the rows, its clicks playing from that word
    const sub = o.sub ? `<div class="sbw">${SUB.html(p + 'ov', SUB_OV)}</div>` : '';
    return `<div class="bs-ov" id="${p}ov" style="${acc}"><div class="shade"></div><div class="col"><span class="eb">${o.eyebrow || d.eyebrow}</span><b class="hd">${o.h1 || d.h1}</b><div class="rows">${rows}</div>${sub}</div></div>`;
  }
  const overBeats = d => (d.over && d.over !== true ? (d.over.rows || []).map(r => r.b).concat(d.over.sub ? [d.over.sub.b] : []) : []).filter(Boolean);
  function blocksOf(it) {
    const n = it.lines.length, pre = it.pre || 0;
    if (it.blocks) return it.blocks;
    return pre >= n ? [] : [{ b: it.type ? it.type.b : (it.b || it.id), from: pre + 1, to: n }];
  }
  function T() { const C = window.TEMPLATES && window.TEMPLATES.cafe; if (!C) throw new Error('bistro: core/templates/cafe.js must load first'); return C; }

  function typeRows(c, B, it, rowId, outLine) {
    const p = c.p, n = it.lines.length, exit = (c.exit != null ? c.exit : c.screen) - .45;
    const pre = it.pre || 0, sched = [];
    /* a block's `by` (a beat) is when its typing must be done: s36 typed its server block until the slide's exit while the
       view had already scrolled back to the top, so keys sounded over code no one could see (review 7) */
    const blocks = blocksOf(it).map(bk => ({ s: B.at(bk.b, .1, .3, 'enter', { focal: false }).s, from: bk.from, to: bk.to,
      by: bk.by ? B.at(bk.by, .1, .3, 'enter', { focal: false }).s : null }));
    blocks.forEach((bk, k) => {
      const next = Math.min(blocks[k + 1] ? blocks[k + 1].s - .1 : exit, bk.by != null ? bk.by - .1 : Infinity);
      let chars = 0; for (let i = bk.from; i <= bk.to; i++) chars += outLine(i) ? 0 : it.lines[i - 1].replace(/^\$ /, '').trim().length;
      const cps = Math.min(90, Math.max(it.cps || 24, chars / Math.max(.3, next - bk.s - .3)));
      let t = bk.s;
      for (let i = bk.from; i <= bk.to; i++) {
        const L = outLine(i) ? 0 : it.lines[i - 1].replace(/^\$ /, '').trim().length, d = outLine(i) ? .05 : Math.max(.05, L / cps);
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
        const raw = it.lines[i - 1].replace(/^\$ /, ''), ind = (/^ */.exec(raw) || [''])[0].length, lang = it.lang || ext(it.file);
        t.innerHTML = it.__term ? hlSh(k < 0 ? raw : raw.slice(0, ind + k)) : hl(k < 0 ? raw : raw.slice(0, ind + k), lang);
        t.dataset.k = String(k);
      }
    }
    for (let i = 1; i <= n; i++) { const r = el(rowId(i)); if (r) r.classList.toggle('typing', i === caret && !!sched[i]); }
    /* gutter numbers count the rows on screen, like a real editor: lines not typed yet push nothing down (review 6, the
       gutter read 1 2 3 4 8 9 while rows 5-7 waited to be typed) */
    let num = it.start || 1;
    for (let i = 1; i <= n; i++) {
      const r = el(rowId(i)), g = r && r.querySelector('.g'); if (!g || r.style.display === 'none') continue;
      if (g.textContent !== String(num)) g.textContent = String(num);
      num++;
    }
    const S = sched[caret], done = S && c.local >= S.s + S.d;
    const cr = caret && el(rowId(caret)); if (cr) cr.classList.toggle('blink', !!done && Math.floor((c.local - S.s - S.d) / .53) % 2 === 1);
    const code = el(p + it.id + '-code');
    /* scroll like the real editor: the line being typed stays in view (the view moves only when it has to), and a
       scroll entry ({b, row}) glides the view to that row on its word (revision 3: "the UI should scroll like a normal
       UI", never a top half hidden while it is typed) */
    if (code) {
      // row offsets are measured from the code area's first row (offsetTop counts from the window, header and tabs included)
      const r1 = code.querySelector('.ln'), o0 = r1 ? r1.offsetTop : 0;
      const maxTop = Math.max(0, code.scrollHeight - code.clientHeight);
      /* review 7 ("should scroll down when typing this"): the typed line keeps two rows of room under it, like an editor's
         scroll-off, instead of sitting on the bottom edge; when typing jumps to a line further down the view glides there
         (.45 s from the line's first key) instead of cutting */
      const follow = r => (r ? cl(r.offsetTop - o0 + r.offsetHeight * 3 + 12 - code.clientHeight, 0, maxTop) : 0);
      let top = follow(cr);
      if (cr && S) {
        let pv = 0; for (let i = caret - 1; i >= 1; i--) if (sched[i] && el(rowId(i)) && el(rowId(i)).style.display !== 'none') { pv = i; break; }
        const pr = pv && el(rowId(pv));
        if (pr && c.local < S.s + .45) top = lerp(follow(pr), top, eio(cl((c.local - S.s) / .45, 0, 1)));
      }
      (it.scroll || []).forEach(sc => {
        const r0 = B.at(sc.b, .3, .6, 'enter', { focal: false }), row = el(rowId(sc.row));
        if (c.local >= r0.s && row) top = lerp(top, Math.min(maxTop, Math.max(0, row.offsetTop - o0 - 8)), eio(cl((c.local - r0.s) / .7, 0, 1)));
      });
      /* while a line is being typed it is always on screen: a scroll entry never takes the view off the caret (review 7: keys
         sounded while the view had moved away, as if typing went on out of sight) */
      if (cr && S && !done && c.local >= S.s) top = cl(top, cr.offsetTop - o0 + cr.offsetHeight + 12 - code.clientHeight, cr.offsetTop - o0 - 8);
      code.scrollTop = top;
    }
    const T0 = (c.T != null ? c.T : c.local) - c.local;
    (window.PL_TYPED = window.PL_TYPED || {})[p + it.id] = sched.filter(x => x && x.L).map(x => [+(T0 + x.s).toFixed(3), +x.d.toFixed(3), x.L]);
  }
  function walkAt(pts, q) {
    const segs = []; let L = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(l); L += l; }
    let d = q * L;
    for (let i = 0; i < segs.length; i++) {
      if (d <= segs[i] || i === segs.length - 1) { const f = segs[i] ? cl(d / segs[i], 0, 1) : 1; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; }
      d -= segs[i];
    }
    return pts[pts.length - 1];
  }
  /* the points from the start to the tip at q (the drawn trail), and the direction of the segment the tip is on */
  function trailTo(pts, q) {
    let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const out = [pts[0]]; let d = q * L;
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (d >= l) { out.push(pts[i]); d -= l; continue; }
      const f = l ? d / l : 0; out.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]); break;
    }
    return out;
  }
  function segAt(pts, q) {
    const t = trailTo(pts, q), n = t.length;
    const i = Math.min(Math.max(1, n - 1), pts.length - 1), a = pts[i - 1], b = pts[i];
    return [b[0] - a[0], b[1] - a[1]];
  }

  /* the ground (revision 3, "have elements moving and transparent like the backend video"): grain, faint dashed routes
     with arrows creeping along them, and the story's objects (server, lock, plate, globe, routes) watermarked at ~5%,
     each drifting on its own slow sine so nothing visibly loops. Added to core/bg.js's .bgfx and driven by its bgFrame. */
  const G_ICONS = {
    server: 'M4 3h16v7H4zM4 14h16v7H4zM7 6.5h2M7 17.5h2',
    lock: 'M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11',
    cloche: 'M3 18h18M5 18a7 7 0 0 1 14 0M12 9V7M10.5 7h3',
    globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
    fork: 'M6 3v6a3 3 0 0 0 6 0V3M9 9v12M17 3c-2 2-2 7 0 9v9',
    route: 'M5 5h6v6H5zM13 13h6v6h-6zM8 11v5h5',
  };
  const G_MARKS = [['server', 210, 210, 220], ['lock', 1640, 250, 170], ['cloche', 1500, 820, 240], ['globe', 330, 820, 200],
    ['fork', 960, 140, 150], ['route', 1180, 560, 180], ['server', 720, 900, 150], ['route', 90, 520, 140]];
  const G_ROUTES = ['M-40 300 H700 V620 H1960', 'M-40 860 H420 V180 H1300 V760 H1960', 'M240 -40 V400 H1580 V1120'];
  // the ground's markup, by class only (it is drawn twice: once on the stage, once inside every split slide's plate)
  const groundHtml = () => '<i class="grain"></i><svg class="rt" viewBox="0 0 1920 1080" preserveAspectRatio="none">' +
    G_ROUTES.map(d => `<path class="rp" d="${d}"/>`).join('') + G_ROUTES.map(() => '<path class="ah" d="M-12 -8 L6 0 L-12 8 Z"/>').join('') + '</svg>' +
    G_MARKS.map(m => `<svg class="wm" viewBox="0 0 24 24" style="left:${m[1]}px;top:${m[2]}px;width:${m[3]}px;height:${m[3]}px"><path d="${G_ICONS[m[0]]}"/></svg>`).join('');
  // one deterministic frame of a ground at T seconds of the video
  function groundFrame(g, T) {
    const w = 2 * Math.PI * (T || 0);
    g.querySelectorAll('.wm').forEach((e, i) => {
      e.style.transform = `translate(${(26 * Math.sin(w / (41 + i * 7) + i)).toFixed(1)}px,${(20 * Math.cos(w / (53 + i * 5) + i * 2)).toFixed(1)}px) rotate(${(6 * Math.sin(w / (67 + i * 3) + i)).toFixed(2)}deg)`;
    });
    const rp = g.querySelectorAll('.rp'), ah = g.querySelectorAll('.ah');
    rp.forEach((r, i) => {
      const L = r.__len || (r.__len = r.getTotalLength()), d = ((T || 0) * 46 + i * 600) % L, pt = r.getPointAtLength(d), pn = r.getPointAtLength(Math.min(L, d + 2));
      ah[i].setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${(Math.atan2(pn.y - pt.y, pn.x - pt.x) * 180 / Math.PI).toFixed(1)})`);
    });
  }
  /* the ground (revision 3, "have elements moving and transparent like the backend video"): grain, faint dashed routes
     with arrows creeping along them, and the story's objects watermarked at ~5%, each drifting on its own slow sine so
     nothing visibly loops. Added to core/bg.js's .bgfx and driven by its bgFrame. */
  function installGround() {
    if (!window.PROJECT || PROJECT.theme !== 'bistro') return;
    const fx = document.querySelector('#stage .bgfx'); if (!fx || fx.querySelector('.bs-ground')) return;
    const g = document.createElement('div'); g.className = 'bs-ground'; g.innerHTML = groundHtml();
    fx.insertBefore(g, fx.querySelector('.vig'));
    const base = window.bgFrame;
    window.bgFrame = function (T) { if (base) base(T); groundFrame(g, T); };
    window.bgFrame(0);
  }
  installGround();

  defineTemplate('bistro', {
    check: (d, def) => { prep(d); T().check(d, def); },
    beats: d => {
      prep(d);
      const n = T().beats(d);
      d.items.forEach(it => {
        (it.blocks || []).forEach(b => { n.push(b.b); if (b.by) n.push(b.by); }); (it.hl || []).forEach(h => { n.push(h.b); if (h.until) n.push(h.until); });
        (it.edits || []).forEach(e => n.push(e.b)); (it.scroll || []).forEach(s => n.push(s.b)); if (it.walk) { n.push(it.walk.b); if (it.walk.until) n.push(it.walk.until); } if (it.b2) n.push(it.b2);
        (it.lit || []).forEach(l => { n.push(l.b); if (l.until) n.push(l.until); });
      });
      return Array.from(new Set(n.concat(overBeats(d)).filter(Boolean)));
    },
    html: (d, c) => { fill(d, c.p); return T().html(d, c) + (d.over ? overHtml(c.p, d) : '') + (d.sweep ? `<div class="bs-sweep" id="${c.p}sweep"></div>` : '') + `<div class="bs-ground bs-sg" id="${c.p}sg">${groundHtml()}</div>`; },
    frame: (t, c) => {
      T().frame(t, c);
      const p = c.p, d = c.data, B = beats(c);
      d.items.forEach(it => {
        const id = p + it.id;
        if (it.__vsc || it.__term) {
          typeRows(c, B, it, i => id + '-r' + i, i => it.__term && !/^\$ /.test(it.lines[i - 1]));
          (it.hl || []).forEach(h => {
            const on = B.p(h.b, .5, .55, 'pop', { focal: false }) > .3 && !(h.until && B.p(h.until, .9, .95, 'pop', { focal: false }) > .3);
            h.rows.forEach(r => cls(id + '-r' + r, h.cls || 'hl', on));
          });
          (it.edits || []).forEach(e => {
            const r0 = B.at(e.b, .5, .6, 'enter', { focal: false }), r = el(id + '-r' + e.row); if (!r || c.local < r0.s) return;
            const t = r.querySelector('.t'), q = cl((c.local - r0.s) / .7, 0, 1);
            const ind = (/^ */.exec(e.text) || [''])[0].length, body = e.text.slice(ind), k = q >= 1 ? -1 : Math.floor(q * body.length);
            const key = 'e' + k; if (t.dataset.k === key) return;
            t.innerHTML = hl(k < 0 ? e.text : e.text.slice(0, ind + k), it.lang || ext(it.file)); t.dataset.k = key;
            r.classList.add('edited');
          });
        }
        if (it.walk) {
          const e = el(id); if (!e) return;
          const w = it.walk, r0 = B.at(w.b, .3, .6, 'enter', { focal: false, len: w.d || 1.6 }), d0 = w.d || 1.6;
          // the arrow loops while the slide holds (w.loop): draw, hold .5 s, fade .3 s, draw again
          /* an arrow never starts before the things it joins (review 3, "arrow shows and moves before cards show up"):
             every item whose box holds either end of the path (40 px slack) must have finished entering on its own beat */
          let start = r0.s;
          const ends = [w.pts[0], w.pts[w.pts.length - 1]];
          d.items.forEach(o => {
            if (o === it || o.pre || o.bsk === 'arw' || o.bsk === 'svg' || /ghost/.test(o.cls || '') || o.x == null || !o.w || !o.h) return;
            if (!ends.some(([x, y]) => x >= o.x - 40 && x <= o.x + o.w + 40 && y >= o.y - 40 && y <= o.y + o.h + 40)) return;
            const bt = c.beats && c.beats[o.b || o.id]; if (bt) start = Math.max(start, bt.s + .45);
          });
          start += w.delay || 0;   // the stagger counts from when the cards are in, so arrows in a sequence stay one after another (review 4)
          const el0 = c.local - start, per = d0 + (w.gap || .8), lap = w.loop && el0 > per ? el0 % per : el0;
          const q = 1 - Math.pow(1 - cl(lap / d0, 0, 1), 2);           // steady, easing out only as it arrives
          const fade = w.loop && el0 > 0 ? 1 - cl((lap - d0 - (w.gap || .8) + .3) / .3, 0, 1) : 1;
          const tip = walkAt(w.pts, q), seg = segAt(w.pts, q);
          const trail = trailTo(w.pts, q).map(pt => pt[0].toFixed(1) + ' ' + pt[1].toFixed(1)).join(' L');
          const tr = e.querySelector('.tr'), hd = e.querySelector('.hd'), lb = e.querySelector('.lb');
          if (tr) tr.setAttribute('d', 'M' + trail);
          if (hd) hd.setAttribute('transform', `translate(${tip[0].toFixed(1)} ${tip[1].toFixed(1)}) rotate(${(Math.atan2(seg[1], seg[0]) * 180 / Math.PI).toFixed(1)})`);
          if (lb) { lb.style.left = (tip[0] + 22).toFixed(1) + 'px'; lb.style.top = (tip[1] - 46).toFixed(1) + 'px'; }
          e.style.opacity = el0 < -.02 ? '0' : (w.stay === false && q >= 1 ? String(1 - cl((lap - d0) / .3, 0, 1)) : fade.toFixed(3));
          if (w.until && c.beats && c.beats[w.until] && c.local >= c.beats[w.until].s && lap < 0.05) e.style.opacity = '0';
          if (w.until && c.beats && c.beats[w.until] && c.local >= c.beats[w.until].s + d0) e.style.opacity = '0';
        }
        if (it.b2) {
          const f = el(id + '-fl'), q = eio(B.p(it.b2, .5, .7, 'enter', { len: .9, focal: false }));
          if (f) f.style.transform = `rotateY(${(q * 180).toFixed(2)}deg)`;
        }
        // every part's classes are decided across all its entries first, so two words lighting one part never cancel
        if ((it.lit || []).length) {
          const want = {}, all = {};
          it.lit.forEach(l => {
            const on = B.p(l.b, .5, .55, 'pop', { focal: false }) > .3 && !(l.until && B.p(l.until, .9, .95, 'pop', { focal: false }) > .3);
            [].concat(l.part).forEach(pt => (l.cls || 'lit').split(' ').forEach(k => { (all[pt] = all[pt] || new Set()).add(k); if (on) (want[pt] = want[pt] || new Set()).add(k); }));
          });
          Object.keys(all).forEach(pt => all[pt].forEach(k => cls(id + '-' + pt, k, want[pt] && want[pt].has(k))));
        }
      });
      // data.sweep: a band of light crosses the frame as a new part of the video opens (0.05-0.95 s); the tracker pulses with it
      if (d.sweep && d.sec && c.local > .36) { const q = seg(c.local, .36, 1.5), k = Math.sin(Math.PI * q); st(p + 'sec', { transform: `scale(${(1 + .18 * k).toFixed(3)})`, transformOrigin: '0 50%', boxShadow: k > .01 ? `0 0 ${(28 * k).toFixed(1)}px rgba(255,255,255,${(.25 * k).toFixed(3)})` : '' }); }
      if (d.sweep) { const q = seg(c.local, .05, .95); st(p + 'sweep', { transform: `translateX(${(-40 + 180 * eio(q)).toFixed(1)}%)`, opacity: String(q > 0 && q < 1 ? 1 : 0) }); }
      /* split (revision 3, "still no split view"): inside a split reveal the whole slide shrinks into the right two thirds
         on its own plate and dual-render lays the face crop on the left (bistro.css .slide.split). Wins over `over`. */
      /* the layout follows the face window the frame is in (review 4: a split window that ran into a slide not flagged split
         drew it full width over the face). PROJECT.reveals decides: a split window shrinks any slide into the right two
         thirds with the moving ground on its plate; an over window lays the slide's overlay rows on the face (a slide with no
         overlay rows goes split instead). Outside a render (posters, preview) the slide's own data.split / data.over decide. */
      const RV = (window.PROJECT && Array.isArray(window.PROJECT.reveals)) ? window.PROJECT.reveals : [];
      const win = c.T != null && c.T !== c.local ? RV.find(r => c.T >= r.at - (r.in || 0) - .001 && c.T < r.to + (r.out || 0)) : null;
      const asSplit = win ? (!!win.split || (!!win.over && !d.over)) : !!d.split;
      const asOver = win ? (!asSplit && !!win.over && !!d.over) : (!d.split && !!d.over);
      const root0 = el(c.id);
      if (root0) { root0.classList.toggle('split', asSplit); root0.classList.toggle('ovs', asOver); root0.classList.remove('wiping'); }
      /* the split ramp is a wipe (review 6: crossfading the split and full layouts showed two half-opaque editors): over the
         window's `in` seconds the plate shrinks from full frame to the right two thirds, over its `out` seconds it grows back
         over the face. dual-render lays this capture on the face third with no dissolve (scripts/dual-render.js, split.wipe). */
      if (root0 && asSplit && win && win.split && win.split.wipe) {
        let k = 1;
        if (win.in && c.T < win.at) k = (c.T - (win.at - win.in)) / win.in;
        else if (win.out && c.T >= win.to) k = 1 - (c.T - win.to) / win.out;
        k = eio(cl(k, 0, 1));
        // only the alpha capture wipes; the deck-only master (version A, opaque) keeps every slide's exit
        root0.classList.toggle('wiping', k < 1 && document.getElementById('stage').classList.contains('transparent'));
        root0.style.setProperty('--spk', (1 - .2 * k).toFixed(4)); root0.style.setProperty('--spx', (320 * k).toFixed(2) + 'px'); root0.style.setProperty('--spq', k.toFixed(4));
      }
      if (asSplit) { const sg = el(p + 'sg'); if (sg) groundFrame(sg, c.T != null ? c.T : c.local); }
      else if (asOver) {
        const root = el(c.id); if (root) root.classList.add('ovs');
        const o = d.over === true ? {} : d.over;
        // over.from: the second of the slide its window opens (the overlay fades in from there, not from the slide's start)
        const o0 = o.from || 0;
        st(p + 'ov', { opacity: String(eo(seg(c.local, o0, o0 + .6))) });
        // a row enters on its word (b), at a set second of the slide (at), or staggered; it rises 24px as it fades in
        if (o.sub) { const sb = o.sub.b && c.beats && c.beats[o.sub.b], t0 = sb ? sb.s : o.sub.at != null ? o.sub.at : 1; st(p + 'ovsb', { opacity: String(eo(seg(c.local, t0 - .3, t0))) }); SUB.frame(p + 'ov', Math.max(0, c.local - t0), SUB_OV); }
        (o.rows || []).forEach((r, i) => { const rb = r.b && c.beats && c.beats[r.b], s = rb ? rb.s : r.at != null ? r.at : .5 + i * .35; up(p + 'ovr' + (i + 1), seg(c.local, s, s + BEAT.enter * 1.4), 24); });
      }
    },
  });
})();
