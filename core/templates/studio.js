/* studio: the mixing-desk look (core/styles/studio.css), built for projects/how-llms-are-trained. The video explains
   training as turning billions of knobs, so the deck is studio hardware: knob boards whose pointers spin, settle and
   nudge on spoken words, LED meters, probability bars, a waveform that goes from static to music, a network with a
   knob on every line, the road map the story keeps returning to, tokenizer chips, attention arcs and the causal mask.

   The scene engine is bistro (core/templates/bistro.js, on cafe.js): items enter on spoken words, move, change state,
   editors type, arrows draw, and the over-the-face / split layouts come with it. This template turns its own kinds
   into bistro `html` items and animates them after bistro's frame; everything else passes through unchanged.

   data: bistro's {eyebrow, accent, h1, w?, h?, items, edges?, over?, sub?}
   studio kinds (item.k):
     panel  {label?}                                   a brushed-metal plate with screws (a backdrop, z 0)
     knobs  {vals: [n|string], cols, ks? (72), start?: 'zero', rand?: beat, spin?: beat, settle?: beat, tvals?: [..],
             nudge?: [{b, deg}], sm?}                   a board of knobs. start zero = all pointing up until `rand` snaps
                                                       them to random angles; `spin` sets them spinning (values flicker)
                                                       until `settle` turns them to their tuned angle (tvals shown, green)
     vu     {label?, val?, levels: [{b, v}] | v, segs? (14), live?}   an LED ladder; level eases to v on each beat
     probs  {rows: [{l, cls?}], steps: [{b?, v: [..]}], max? (1), lw?}  probability bars; a step without b is the start
     wave   {clean?: beat}                             static noise; from `clean` it smooths into a music wave
     net    {layers: [3, 4, 4, 2], knobs?: true, back?: beat, fwd?: beat, nudge?: beat, labels?: [..]}
            nodes in columns, every line with a knob at its middle; `back` draws red arrows from the output back to the
            input one layer gap at a time (backpropagation), `fwd` blue ones forward, `nudge` turns every knob a notch
     road   {st: [{l, icon, b?, pre?}], lit?: [{b, i}], sw?, sh?}   the seven stations; a station shows "?" until its
            b (or pre) names it; the latest lit beat makes station i the current one (amber), lit ones before it done
     toks   {tokens: [{t, id?, c}], tb?: [beat per token], fs?}  tokenizer chips (c = colour 1..6, 'q' = the blank)
     att    {words: [..], from, w: [weight per word], b?, hb?, hi?}  arcs from words[from] back to each earlier word,
            drawn on b, their width by weight; hb thickens word hi's arc (Sarah)
     mask   {words: [..], b?, cell? (52)}             the causal mask: row r lights cells 0..r, the rest locked
   Beat names: every b / rand / spin / settle / nudge[].b / levels[].b / steps[].b / clean / back / fwd / st[].b /
   lit[].b / tb[] / hb, plus bistro's. */
(function () {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const HS = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const C = (a, b, x) => Math.min(b, Math.max(a, x));
  const E = q => q < .5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;   // ease in-out
  const EO = q => 1 - Math.pow(1 - q, 3);
  const at = (c, b) => (b && c.beats && c.beats[b]) ? c.beats[b].s : null;
  const prog = (c, b, len) => { const s = at(c, b); return s == null ? 0 : C(0, 1, (c.local - s + .1) / (len || .6)); };
  const fmtV = v => typeof v === 'string' ? v : (Math.abs(v) < .01 && v !== 0 ? v.toFixed(3) : v.toFixed(2)).replace('-', '−');

  /* ---------- the ground: rack ears with screws, knobs turning slowly in the margins, LED ladders breathing ---------- */
  const GK = [[70, 150, 70], [80, 420, 56], [64, 700, 80], [1786, 130, 64], [1800, 380, 76], [1790, 690, 58], [96, 930, 50], [1770, 930, 62]];
  const GL = [[150, 900, 12], [1730, 880, 14], [1716, 110, 10], [140, 90, 10]];
  const html = () => '<div class="st-g"><div class="ear l">' + [60, 1000].map(y => `<i style="top:${y}px"></i>`).join('') + '</div><div class="ear r">' +
    [60, 1000].map(y => `<i style="top:${y}px"></i>`).join('') + '</div>' +
    GK.map(k => `<div class="gk" style="left:${k[0]}px;top:${k[1]}px;--s:${k[2]}px"><b></b></div>`).join('') +
    GL.map(l => `<div class="gl" style="left:${l[0]}px;top:${l[1]}px">${Array.from({ length: l[2] }, () => '<i></i>').join('')}</div>`).join('') + '</div>';
  function frame(g, T) {
    g.querySelectorAll('.gk b').forEach((b, i) => { b.style.transform = `rotate(${(-120 + 240 * (.5 + .5 * Math.sin(T / (11 + i * 3) + i * 1.9))).toFixed(1)}deg)`; });
    g.querySelectorAll('.gl').forEach((l, j) => {
      const n = GL[j][2], lv = .35 + .3 * Math.sin(T / (2.3 + j * .7) + j) + .15 * Math.sin(T * 1.7 + j * 3);
      l.querySelectorAll('i').forEach((e, k) => { const on = k / n < lv; e.className = on ? 'on' + (k / n > .82 ? ' r' : k / n > .6 ? ' w' : '') : ''; });
    });
  }
  /* only on a studio deck (heap.js's guard): every bistro theme shares window.BS_GROUND and this file loads after slate.js,
     so setting it unconditionally replaced a slate deck's live ground with the rack's and its frame crashed */
  if (!window.PROJECT || PROJECT.theme === 'studio') {
    window.BS_GROUND = { theme: 'studio', icons: {}, marks: [], routes: [], nodes: [], html, frame };
    if (window.bsInstallGround) window.bsInstallGround();
  }

  /* icons this deck needs that core/icons.js lacks (Lucide-style strokes), added to the shared i-* sprite so overlay rows
     (#i-name) and cafe items (icon: 'name') both find them; existing ids are never redefined */
  const ADD = {
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/><circle cx="16" cy="16" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
    atom: '<circle cx="12" cy="12" r="1.6" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12z"/>',
    code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    gpu: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="9" cy="12" r="3"/><circle cx="17" cy="12" r="2"/><path d="M5 18v3M9 18v3M13 18v3"/>',
    cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    brain: '<path d="M9 3a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zM15 3a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3 3 3 0 0 1-3-3"/>',
    filter: '<path d="M3 4h18l-7 9v6l-4 2v-8z"/>',
    mail: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3 7 9 6 9-6"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 12 10 5 10-5M2 17l10 5 10-5"/>',
    pen: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    scale: '<path d="M12 3v18M5 21h14M3 7h18M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    repeat: '<path d="M17 2.5 20.5 6 17 9.5"/><path d="M3.5 11.5V10a4 4 0 0 1 4-4h13M7 21.5 3.5 18 7 14.5"/><path d="M20.5 12.5V14a4 4 0 0 1-4 4h-13"/>',
    train: '<circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    leash: '<circle cx="5" cy="12" r="3"/><circle cx="19" cy="12" r="3"/><path d="M8 12c3-4 5 4 8 0"/>',
  };
  (function addIcons() {
    const host = document.querySelector('svg defs') || document.querySelector('svg');
    if (!host) return;
    Object.keys(ADD).forEach(k => { if (document.getElementById('i-' + k)) return;
      const sym = document.createElementNS('http://www.w3.org/2000/svg', 'symbol'); sym.id = 'i-' + k; sym.setAttribute('viewBox', '0 0 24 24');
      sym.setAttribute('fill', 'none'); sym.setAttribute('stroke', 'currentColor'); sym.setAttribute('stroke-width', '1.9'); sym.setAttribute('stroke-linecap', 'round'); sym.setAttribute('stroke-linejoin', 'round');
      sym.innerHTML = ADD[k]; host.appendChild(sym); });
  })();

  const B0 = () => { const t = window.TEMPLATES && window.TEMPLATES.bistro; if (!t) throw new Error('studio: core/templates/bistro.js must load first'); return t; };

  /* ---------- markup per kind ---------- */
  const ICON = {
    data: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    tokens: 'M3 7h7v4H3zM12 7h9v4h-9zM3 14h10v4H3zM15 14h6v4h-6z',
    train: 'M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1',
    base: 'M4 4h16v16H4zM8 9h8M8 13h8M8 17h5',
    sft: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11M9 8h6',
    rlhf: 'M7 11v9H4v-9zM7 11l4-7a2 2 0 0 1 3 2l-1 4h6a2 2 0 0 1 2 2.3l-1.4 6.5A2 2 0 0 1 17.6 20H7',
    chat: 'M4 5h16v11H9l-5 4z M8 9.5h8M8 12.5h5',
    web: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
    lock: 'M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11',
  };
  /* a chat bubble: ST_REPLY(html, 'user'|'bot') */
  window.ST_REPLY = (html, who) => `<div class="st-reply ${who || 'bot'}"><span class="av"><svg viewBox="0 0 24 24"><use href="#i-${who === 'user' ? 'user' : 'sparkle'}"/></svg></span><p>${html}</p></div>`;
  const isvg = n => `<svg viewBox="0 0 24 24"><path d="${ICON[n] || ICON.data}"/></svg>`;
  const panelHtml = it => `<div class="st-panel">${[[12, 12], [null, 12], [12, null], [null, null]].map(([l, t]) => `<i class="sc" style="${l == null ? 'right:12px' : 'left:12px'};${t == null ? 'bottom:12px' : 'top:12px'}"></i>`).join('')}${it.label ? `<span class="lb" style="left:36px">${esc(it.label)}</span>` : ''}</div>`;
  function knobsHtml(it) {
    const n = it.vals.length, cols = it.cols || n, rows = Math.ceil(n / cols), ks = it.ks || 72;
    const cw = it.w / cols, rh = it.h / rows;
    return `<div class="st-knobs${it.sm ? ' sm' : ''}">${it.vals.map((v, i) => `<div class="st-knob" data-i="${i}" style="--ks:${ks}px;left:${((i % cols) * cw + cw / 2 - ks / 2 - 10).toFixed(1)}px;top:${(Math.floor(i / cols) * rh + (rh - ks - 40) / 2).toFixed(1)}px;width:${ks + 20}px">` +
      `<div class="kn"><div class="pt"></div></div><b class="v">${fmtV(v)}</b></div>`).join('')}</div>`;
  }
  const vuHtml = it => `<div class="st-vu"><div class="lad">${Array.from({ length: it.segs || 14 }, () => '<i></i>').join('')}</div>${it.label ? `<b>${it.label}</b>` : ''}${it.val ? `<s>${it.val}</s>` : ''}</div>`;
  const probsHtml = it => `<div class="st-probs" style="--lw:${it.lw || 220}px">${it.rows.map((r, i) => `<div class="pr ${r.cls || ''}" data-i="${i}"><span class="l">${esc(r.l)}</span><span class="tr"><i class="f"></i></span><span class="v"></span></div>`).join('')}</div>`;
  const waveHtml = it => `<div class="st-wave"><svg viewBox="0 0 ${it.w} ${it.h}" preserveAspectRatio="none"><path class="mid" d="M0 ${it.h / 2} H${it.w}"/><path class="wv"/></svg></div>`;
  function netGeo(it) {
    // every layer centred on the box's middle, all layers on the same node spacing (the widest layer fills the height)
    const L = it.layers, padX = 60, padY = 50, mx = Math.max(...L), gap = mx > 1 ? (it.h - 2 * padY) / (mx - 1) : 0;
    const nodes = L.map((n, li) => Array.from({ length: n }, (_, k) => ({
      x: padX + (it.w - 2 * padX) * li / (L.length - 1), y: it.h / 2 + (k - (n - 1) / 2) * gap })));
    const edges = []; for (let g = 0; g < L.length - 1; g++) nodes[g].forEach(a => nodes[g + 1].forEach(b => edges.push({ g, a, b })));
    return { nodes, edges };
  }
  function netHtml(it) {
    const { nodes, edges } = netGeo(it), r = it.r || 22;
    const ed = edges.map((e, i) => `<path class="e" d="M${e.a.x} ${e.a.y} L${e.b.x} ${e.b.y}"/>`).join('');
    const kn = it.knobs === false ? '' : edges.map((e, i) => { const mx = (e.a.x + e.b.x) / 2, my = (e.a.y + e.b.y) / 2; return `<g class="kg" data-i="${i}" transform="translate(${mx.toFixed(1)} ${my.toFixed(1)})"><circle class="kb" r="9"/><path class="kp" d="M0 0 L0 -8"/></g>`; }).join('');
    const bk = edges.map((e, i) => `<path class="bk" data-g="${e.g}" d="M${e.b.x} ${e.b.y} L${e.a.x} ${e.a.y}"/>`).join('');
    const fw = edges.map((e, i) => `<path class="fw" data-g="${e.g}" d="M${e.a.x} ${e.a.y} L${e.b.x} ${e.b.y}"/>`).join('');
    const nd = nodes.map((col, li) => col.map(n => `<circle class="n${li === 0 ? ' in' : li === nodes.length - 1 ? ' out' : ''}" cx="${n.x}" cy="${n.y}" r="${r}"/>`).join('')).join('');
    const lb = (it.labels || []).map((l, li) => l ? `<text class="lt" x="${nodes[li][0].x}" y="${it.h + 10}" text-anchor="middle">${esc(l)}</text>` : '').join('');
    return `<div class="st-net"><svg viewBox="0 0 ${it.w} ${it.h}">${ed}${it.back ? bk : ''}${it.fwd ? fw : ''}${kn}${nd}${lb}</svg></div>`;
  }
  const roadHtml = it => `<div class="st-road" style="--sw:${it.sw || 180}px;--sh:${it.sh || 150}px">${it.st.map((s, i) => (i ? `<i class="ar" data-i="${i}"></i>` : '') +
    `<div class="sta" data-i="${i}"><span class="num">${i + 1}</span><i class="led"></i><span class="nm">${isvg(s.icon)}<b>${s.l}</b></span><span class="q">?</span></div>`).join('')}</div>`;
  const toksHtml = it => `<div class="st-toks" style="--tfs:${it.fs || 40}px">${it.tokens.map((t, i) => `<div class="st-tok c${t.c}" data-i="${i}"><span class="t">${esc(t.t)}</span>${t.id != null ? `<span class="i">${t.id}</span>` : ''}</div>`).join('')}</div>`;
  const attHtml = it => `<div class="st-att"><svg viewBox="0 0 ${it.w} ${it.h}"></svg><div class="ws">${it.words.map((w, i) => `<span class="w${i === it.from ? ' she' : i === it.hi ? ' sarah' : i > it.from ? ' fut' : ''}" data-i="${i}">${esc(w)}</span>`).join('')}</div></div>`;
  function maskHtml(it) {
    const n = it.words.length, cs = it.cell || 52;
    let h = `<div class="st-mask" style="grid-template-columns:150px repeat(${n},${cs}px);grid-template-rows:140px;grid-auto-rows:${cs}px"><span></span>` + it.words.map(w => `<span class="h col">${esc(w)}</span>`).join('');
    it.words.forEach((w, r) => { h += `<span class="h r">${esc(w)}</span>` + it.words.map((_, c2) => c2 <= r ? `<i class="c ok" data-r="${r}"></i>` : `<i class="c no">${isvg('lock')}</i>`).join(''); });
    return h + '</div>';
  }
  const KINDS = { panel: panelHtml, knobs: knobsHtml, vu: vuHtml, probs: probsHtml, wave: waveHtml, net: netHtml, road: roadHtml, toks: toksHtml, att: attHtml, mask: maskHtml };
  const FX = { panel: 'fd', knobs: 'up', vu: 'up', probs: 'up', wave: 'fd', net: 'fd', road: 'up', toks: 'pop', att: 'fd', mask: 'up' };
  function prep(d) {
    if (d.__st) return; d.__st = true;
    // data.v.pos (9:16) reaches a studio kind before its html is built, so a portrait cols / fs / w takes effect;
    // cafe's check applies pos again afterwards (same values, harmless)
    const pos = d.pos || {};
    d.items = (d.items || []).map(it => KINDS[it.k] && pos[it.id] ? Object.assign({}, it, pos[it.id]) : it);
    d.items = d.items.map(it => KINDS[it.k] ? Object.assign({}, it, { k: 'html', __st: it.k, fx: it.fx || FX[it.k], z: it.z != null ? it.z : it.k === 'panel' ? 0 : it.z,
      cls: 'st-' + it.k + 'w ' + (it.cls || ''), html: KINDS[it.k](it) }) : it);
  }
  function stBeats(d) {
    const n = (d.cam || []).map(k => k.b).filter(Boolean);
    d.items.forEach(it => {
      ['rand', 'spin', 'settle', 'clean', 'back', 'fwd', 'hb'].forEach(k => typeof it[k] === 'string' && n.push(it[k]));
      if (it.__st === 'net' && typeof it.nudge === 'string') n.push(it.nudge);
      if (Array.isArray(it.nudge)) it.nudge.forEach(x => n.push(x.b));
      (Array.isArray(it.levels) ? it.levels : []).forEach(x => x.b && n.push(x.b));
      (it.steps || []).forEach(x => x.b && n.push(x.b));
      (it.st || []).forEach(x => x.b && n.push(x.b)); (it.lit || []).forEach(x => n.push(x.b)); (it.tb || []).forEach(x => x && n.push(x));
      if (it.__st === 'att' || it.__st === 'mask') { if (it.b) n.push(it.b); }
    });
    return n;
  }

  /* ---------- per-frame animation of the kinds ---------- */
  function knobsFrame(c, it, e) {
    const t = c.local, tr = at(c, it.rand), ts = at(c, it.spin), tz = at(c, it.settle);
    e.querySelectorAll('.st-knob').forEach((k, i) => {
      const rnd = HS(i * 7.3 + (it.seed || 1)) * 270 - 135, spd = (HS(i * 3.1 + 9) > .5 ? 1 : -1) * (90 + 160 * HS(i * 5.7));
      let a = it.start === 'zero' ? 0 : rnd;
      if (tr != null && it.start === 'zero') a = rnd * E(C(0, 1, (t - tr + .1) / .6));
      const spinning = ts != null && t >= ts - .1;
      if (spinning) a += (Math.min(t, tz != null ? tz : t) - ts + .1) * spd;
      let tuned = 0;
      if (tz != null && t >= tz - .1) { const tgt = (it.tangle || [])[i] != null ? it.tangle[i] : (HS(i * 2.2 + 4) * 60 - 30); tuned = E(C(0, 1, (t - tz + .1) / 1)); a = a + (tgt - a) * tuned; }
      (it.nudge || []).forEach(nd => { const s = at(c, nd.b); if (s != null) a += (nd.deg || 18) * (HS(i + 1.3) > .5 ? 1 : -1) * E(C(0, 1, (t - s + .1) / .6)); });
      k.querySelector('.pt').style.transform = `rotate(${a.toFixed(1)}deg)`;
      const v = k.querySelector('.v');
      let txt = fmtV(it.vals[i]);
      if (spinning && tuned < .5) txt = fmtV(Math.round((HS(i * 13 + Math.floor(t * 7)) * 4 - 2) * 100) / 100);
      if (tuned >= .5 && it.tvals) txt = fmtV(it.tvals[i]);
      if (v.textContent !== txt) v.textContent = txt;
      k.classList.toggle('tuned', tuned >= .5 && !!it.tvals);
    });
  }
  function vuFrame(c, it, e) {
    const L = Array.isArray(it.levels) ? it.levels : [{ v: it.v != null ? it.v : it.levels }];
    let lv = 0, started = false;
    L.forEach(x => { const s = x.b ? at(c, x.b) : 0; if (s == null) return; const q = EO(C(0, 1, (c.local - s + .1) / .6)); if (q > 0) started = true; lv = lv + (x.v - lv) * q; });
    if (started && it.live !== false) lv += (it.live || .04) * Math.sin(c.local * 7 + (it.x || 0)) * Math.sin(c.local * 2.3);
    const segs = e.querySelectorAll('.lad i'), n = segs.length;
    segs.forEach((s, k) => { const on = (k + .5) / n < lv; const cl2 = on ? 'on' + (k / n >= .82 ? ' r' : k / n >= .6 ? ' w' : '') : ''; if (s.className !== cl2) s.className = cl2; });
  }
  function probsFrame(c, it, e) {
    const max = it.max || 1; let v = (it.steps[0].b ? it.rows.map(() => 0) : it.steps[0].v).slice();
    it.steps.forEach((s0, j) => { if (!s0.b) return; const s = at(c, s0.b); if (s == null) return; const q = E(C(0, 1, (c.local - s + .1) / (s0.d || .8))); v = v.map((x, i) => x + (s0.v[i] - x) * q); });
    e.querySelectorAll('.pr').forEach((r, i) => {
      r.querySelector('.f').style.transform = `scaleX(${Math.max(.006, v[i] / max).toFixed(4)})`;
      const txt = fmtV(v[i] < .0095 ? Math.max(.001, Math.round(v[i] * 1000) / 1000) : v[i]); const vv = r.querySelector('.v'); if (vv.textContent !== txt) vv.textContent = txt;
    });
  }
  function waveFrame(c, it, e) {
    const W = it.w, H = it.h, t = c.local, s = at(c, it.clean), q = s == null ? 0 : E(C(0, 1, (t - s + .1) / 1.4));
    let d = '';
    for (let x = 0; x <= W; x += 6) {
      const k = x / 6, env = Math.sin(Math.PI * x / W);
      const nz = (HS(k * 1.37 + Math.floor(t * 24) * 7.1) * 2 - 1) * .9;
      const cl2 = (Math.sin(x / 38 - t * 5) * .6 + Math.sin(x / 15 - t * 7.5) * .25 + Math.sin(x / 90 + t) * .15) * (.55 + .45 * Math.sin(x / 140 - t * 1.6));
      const y = H / 2 + (H * .42) * env * ((1 - q) * nz + q * cl2);
      d += (d ? 'L' : 'M') + x + ' ' + y.toFixed(1);
    }
    e.querySelector('.wv').setAttribute('d', d);
    e.querySelector('.st-wave').classList.toggle('clean', q > .5);
  }
  function netFrame(c, it, e) {
    const t = c.local, gaps = it.layers.length - 1;
    const draw = (sel, b, rev) => { const s = at(c, b); e.querySelectorAll(sel).forEach(p => {
      const g = +p.dataset.g, order = rev ? gaps - 1 - g : g, L = p.__l || (p.__l = p.getTotalLength());
      const q = s == null ? 0 : EO(C(0, 1, (t - s + .1 - order * .45) / .5));
      p.style.strokeDasharray = L; p.style.strokeDashoffset = (L * (1 - q)).toFixed(1); p.style.opacity = q > 0 ? '1' : '0'; }); };
    if (it.back) draw('.bk', it.back, true);
    if (it.fwd) draw('.fw', it.fwd, false);
    const sb = at(c, it.back), sn = at(c, typeof it.nudge === 'string' ? it.nudge : null);
    e.querySelectorAll('.kg').forEach((g, i) => {
      let a = HS(i * 4.7) * 240 - 120;
      if (sb != null) { const gi = Math.floor(i / Math.max(1, e.querySelectorAll('.kg').length / gaps)); const q = E(C(0, 1, (t - sb + .1 - (gaps - 1 - gi) * .45 - .4) / .5)); a += 25 * (HS(i) > .5 ? 1 : -1) * q; }
      if (sn != null) a += 18 * (HS(i + 2) > .5 ? 1 : -1) * E(C(0, 1, (t - sn + .1) / .6));
      g.querySelector('.kp').setAttribute('transform', `rotate(${a.toFixed(1)})`);
    });
  }
  function roadFrame(c, it, e) {
    const t = c.local; let cur = -1;
    (it.lit || []).forEach(l => { const s = at(c, l.b); if (s != null && t >= s - .1) cur = Math.max(cur, l.i); });
    if (it.cur != null && cur < 0) cur = it.cur;
    e.querySelectorAll('.sta').forEach((s, i) => {
      const st0 = it.st[i], sb = st0.b ? at(c, st0.b) : null, named = st0.pre || (sb != null && t >= sb - .1) || i <= cur;
      s.querySelector('.nm').style.display = named ? '' : 'none'; s.querySelector('.q').style.display = named ? 'none' : '';
      s.classList.toggle('on', i === cur); s.classList.toggle('done', cur >= 0 && i < cur && named);
      if (named && sb != null) { const q = C(0, 1, (t - sb + .1) / .3); s.style.transform = `scale(${(1 + .08 * Math.sin(Math.PI * q)).toFixed(3)})`; }
    });
    e.querySelectorAll('.ar').forEach(a => a.classList.toggle('lit', +a.dataset.i <= cur));
  }
  function toksFrame(c, it, e) {
    e.querySelectorAll('.st-tok').forEach((k, i) => {
      const b = (it.tb || [])[i] || it.b || it.id, s = at(c, b);
      const q = s == null ? 1 : C(0, 1, (c.local - s + .1) / .3), k2 = q < 1 ? (.82 + .18 * (1 - Math.pow(1 - q, 3)) + .06 * Math.sin(Math.PI * q)) : 1;
      k.style.opacity = C(0, 1, q * 2.2).toFixed(3); k.style.transform = `scale(${k2.toFixed(3)})`;
      const iEl = k.querySelector('.i'), tok = it.tokens[i];
      if (iEl && tok.id != null && typeof tok.id === 'number') { const qi = s == null ? 1 : EO(C(0, 1, (c.local - s - .1) / .5)); const txt = String(Math.round(tok.id * qi)); if (iEl.textContent !== txt) iEl.textContent = txt; }
    });
  }
  function attFrame(c, it, e) {
    const svg = e.querySelector('svg'), ws = e.querySelectorAll('.w'), box = e.getBoundingClientRect(), sc = box.width / it.w || 1;
    const pos = Array.from(ws).map(w => { const r = w.getBoundingClientRect(); return { x: (r.left - box.left + r.width / 2) / sc, y: (r.top - box.top) / sc }; });
    if (!svg.__init) { svg.innerHTML = it.words.map((_, i) => i < it.from ? `<path data-i="${i}"/>` : '').join(''); svg.__init = 1; }
    const s = at(c, it.b), sh = at(c, it.hb), f = pos[it.from];
    svg.querySelectorAll('path').forEach((p, j) => {
      const i = +p.dataset.i, o = pos[i], h = 60 + (f.x - o.x) * .28;
      p.setAttribute('d', `M${f.x.toFixed(1)} ${(f.y - 6).toFixed(1)} C${f.x.toFixed(1)} ${(f.y - h).toFixed(1)} ${o.x.toFixed(1)} ${(o.y - h).toFixed(1)} ${o.x.toFixed(1)} ${(o.y - 6).toFixed(1)}`);
      const L = p.getTotalLength(), q = s == null ? 1 : EO(C(0, 1, (c.local - s + .1 - (it.from - 1 - i) * .12) / .6));
      let wgt = it.w8 ? it.w8[i] : .2; if (i === it.hi && sh != null) wgt = wgt + (1 - wgt) * E(C(0, 1, (c.local - sh + .1) / .6));
      p.style.strokeWidth = (2 + 16 * wgt).toFixed(1); p.style.opacity = (.35 + .65 * wgt).toFixed(3);
      p.style.strokeDasharray = L; p.style.strokeDashoffset = (L * (1 - q)).toFixed(1);
    });
  }
  function maskFrame(c, it, e) {
    const s = at(c, it.b);
    e.querySelectorAll('.c.ok').forEach(k => { const r = +k.dataset.r; k.classList.toggle('on', s == null || c.local >= s - .1 + r * .25); });
  }
  /* a compact knob strip for an over-the-face row (ST_OVK(vals, spinBeat, settleBeat) in a row's html): the rows are
     bistro's, so the strip spins here, from its data-b beat until data-z (if any) */
  window.ST_OVK = (vals, b, z) => `<span class="st-ovk" data-b="${b || ''}" data-z="${z || ''}">${vals.map(v => `<span class="k"><i class="kn"><i class="pt"></i></i><em>${fmtV(v)}</em></span>`).join('')}</span>`;
  function ovkFrame(c, root) {
    root.querySelectorAll('.st-ovk').forEach(g => {
      const s = at(c, g.dataset.b), z = at(c, g.dataset.z), t = c.local;
      g.querySelectorAll('.k').forEach((k, i) => {
        let a = HS(i * 7.3 + 1) * 270 - 135; const spd = (HS(i * 3.1 + 9) > .5 ? 1 : -1) * (120 + 160 * HS(i * 5.7));
        if (s != null && t >= s - .1) a += (Math.min(t, z != null ? z : t) - s + .1) * spd;
        if (z != null && t >= z - .1) a = a + (HS(i * 2.2 + 4) * 60 - 30 - a) * E(C(0, 1, (t - z + .1) / 1));
        k.querySelector('.pt').style.transform = `rotate(${a.toFixed(1)}deg)`;
        if (s != null && t >= s - .1 && (z == null || t < z)) { const em = k.querySelector('em'), txt = fmtV(Math.round((HS(i * 13 + Math.floor(t * 7)) * 4 - 2) * 100) / 100); if (em.textContent !== txt) em.textContent = txt; }
      });
    });
  }
  /* strikes (review 3: "All the strikethroughs should animate from left to right like a normal strike through animation"):
     any element with data-sk="<beat>" draws from its left edge to full width over .35 s from that beat (+ data-dl
     seconds), keeping its data-r rotation; before the beat it has no width. Works in slide items and overlay rows. */
  function strikeFrame(c, root) {
    root.querySelectorAll('[data-sk]').forEach(k => {
      const s = at(c, k.dataset.sk), q = s == null ? 1 : EO(C(0, 1, (c.local - s + .1 - (+k.dataset.dl || 0)) / .35));
      k.style.transformOrigin = '0 50%';
      k.style.transform = `rotate(${+k.dataset.r || 0}deg) scaleX(${q.toFixed(4)})`;
    });
  }
  const FRAMES = { knobs: knobsFrame, vu: vuFrame, probs: probsFrame, wave: waveFrame, net: netFrame, road: roadFrame, toks: toksFrame, att: attFrame, mask: maskFrame };

  /* the progress tracker (review 1: "progress tracker"): PROJECT.stages = [[seconds, stage], …] in deck time; the stage
     the frame is in lights, done ones fill, later ones wait as "?" (curiosity gap). Stage -1 hides it; a slide that
     draws the road map itself sets data.trk = false. Hidden inside over-the-face windows (studio.css). */
  const STAGES = ['Data', 'Tokens', 'Pre-training', 'Base model', 'SFT', 'RLHF', 'Assistant'];
  const trkHtml = p => `<div class="st-trk" id="${p}trk">${STAGES.map((l, i) => `<span data-i="${i}"><i></i><b>${l}</b></span>`).join('')}</div>`;
  function trkFrame(c) {
    const e = document.getElementById(c.p + 'trk'); if (!e) return;
    // deck time from the slide's own start (a single-slide poster runs its local clock in c.T)
    const sl = (window.SLIDES || []).find(x => x.id === c.id), T = sl && sl.start != null ? sl.start + c.local : c.T, st = (window.PROJECT && PROJECT.stages) || [];
    let cur = -1; st.forEach(([t, i]) => { if (T >= t) cur = i; });
    e.style.opacity = cur < 0 ? '0' : String(C(0, 1, c.local / .4));
    e.querySelectorAll('span').forEach((s2, i) => { const k = i === cur ? 'on' : i < cur ? 'done' : 'q'; if (s2.className !== k) s2.className = k; });
  }
  /* camera (review 1: "more camera motion"): data.cam = [{b, s, x, y, d?}] — on beat b the world eases (d s, 1.2) to scale
     s around the world point (x, y) (placed at the world's centre); {b, s: 1} returns to the full view. */
  function camFrame(c) {
    const d = c.data; if (!d.cam || !d.cam.length) return;
    const root = document.getElementById(c.id), w = root && root.querySelector('.cf-world'); if (!w) return;
    const W = d.w || 1540, H = d.h || 600;
    let s = 1, fx = W / 2, fy = H / 2;
    d.cam.forEach(k => { const t0 = at(c, k.b); if (t0 == null) return; const q = E(C(0, 1, (c.local - t0 + .1) / (k.d || 1.2)));
      const ts = k.s != null ? k.s : 1, tx = k.x != null ? k.x : W / 2, ty = k.y != null ? k.y : H / 2;
      s += (ts - s) * q; fx += (tx - fx) * q; fy += (ty - fy) * q; });
    w.style.transformOrigin = '0 0';
    // the world's top edge never rises above its box (review 1, R1: a low focus pushed the scene over the heading)
    const tx = W / 2 - fx * s, ty = Math.max(0, H / 2 - fy * s);
    w.style.transform = s === 1 && fx === W / 2 && fy === H / 2 ? '' : `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${s.toFixed(4)})`;
  }

  defineTemplate('studio', {
    check: (d, def) => { prep(d); B0().check(d, def); },
    beats: d => { prep(d); return Array.from(new Set(B0().beats(d).concat(stBeats(d)))); },
    html: (d, c) => { prep(d); return B0().html(d, c) + (d.trk === false || !(window.PROJECT && PROJECT.stages) ? '' : trkHtml(c.p)); },
    frame: (t, c) => {
      prep(c.data); B0().frame(t, c);
      c.data.items.forEach(it => { const f = FRAMES[it.__st]; if (!f) return; const e = document.getElementById(c.p + it.id); if (e) f(c, it, e); });
      const root = document.getElementById(c.id); if (root) { ovkFrame(c, root); strikeFrame(c, root); }
      trkFrame(c); camFrame(c);
    },
  });
})();
