/* LifeTech Facts end-screen plate (20s): a branded background for YouTube's end screen. It frames the spots where the clickable elements are
   added later in YouTube Studio (video slots 16:9, one subscribe circle) and leaves them empty. Built by 1.5s (slots stroke on, the lockup
   resolves with the shared ending LF.resolve, labels open), then an ambient hold that can be trimmed anywhere.
   Layout: 'one' = one video + subscribe (default), 'two' = two videos + subscribe      (PROJECT.endscreen.layout, or --var layout=two).
   Style:  one per intro concept, so the end screen matches the intro a video opened with   (PROJECT.endscreen.style, or --var style=commit):
           boot · orbit · beats · commit · loaded · silicon · bits · blueprint · eclipse · generate. A style only adds its own motif (STYLES
           below: markup behind the slots + a frame function); slots, subscribe circle, labels and lockup are shared, so every style places
           the YouTube elements in the same spots.
   Everything stays clear of the bottom 12% (player controls). Every value is a pure function of ctx.local (seconds).
   Logo drawing: window.LF (assets/logos/lifetechfacts/lf-logo.js). */
(function () {
  const { G, WM, f2, hash, rad } = LF;
  const T0 = .15, SHEEN = 6, BEAT = .42;   // the disc bursts at T0; seconds between sheens during the hold; the beat of the 'beats' style
  const pick = (d, k, def) => (window.VARS && window.VARS[k]) || d[k] || def;
  /* stage px on the 1920x1080 canvas. slots: {x, y, w, h, label}; sub: subscribe circle; free: anchor of the empty area a style may use;
     L: the lockup in the shape LF's helpers expect */
  const geo = (grid, layout) => { const W = grid.w, H = grid.h;
    if (layout === 'two') { const D = 124, cap = 60, ws = cap / WM.cap, ww = WM.width * ws, x0 = (W - (D + 34 + ww)) / 2, cy = 138, w = 560, h = 315, y = 292, gap = 96;
      return { two: 1, slots: [{ x: W / 2 - gap / 2 - w, y, w, h, label: 'watch' }, { x: W / 2 + gap / 2, y, w, h, label: 'more' }], sub: { x: 640, y: 770, r: 104 }, free: { x: 1450, y: 770 },
        box: { x0, x1: x0 + D + 34 + ww, y0: 60, y1: 210 },
        L: { W, H, D, cx: x0 + D / 2, cy, ws, ww, cap, wx: x0 + D + 34 - WM.x0 * ws, wy: cy - cap / 2 - 12, tagX: x0 + D + 34, tagW: ww, tagY: cy + cap / 2 + 4, tag: 17, k: D / 380 } }; }
    const D = 330, ww = 1.26 * D, ws = ww / WM.width, cap = WM.cap * ws, cx = 470, top = 150, w = 640, h = 360, x = 1090, y = 232;
    return { two: 0, slots: [{ x, y, w, h, label: 'watch' }], sub: { x: x + 112, y: y + h + 172, r: 104 }, free: { x: cx, y: 800 }, arrows: { x: 872, y: y + h / 2 },
      box: { x0: cx - ww / 2 - 10, x1: cx + ww / 2 + 10, y0: top - 30, y1: top + D + .175 * D + cap + .085 * D + 40 },
      L: { W, H, D, cx, cy: top + D / 2, ws, ww, cap, wx: cx - ww / 2 - WM.x0 * ws, wy: top + D + .175 * D, tagX: cx - 300, tagW: 600, tagY: top + D + .175 * D + cap + .085 * D, tag: 22, k: D / 380 } }; };
  /* connectors to the things worth clicking. Layout one: from the mark sideways to the slot and the subscribe circle. Layout two: a trunk drops from
     the lockup into the gap between the slots and turns into each of them (v: leaves vertically, arrives horizontally) */
  const links = g => { const L = g.L, r = L.D / 2, A = g.slots[0], B = g.slots[1], C = g.sub;
    return g.two ? [{ a: { x: L.W / 2, y: 216 }, b: { x: A.x + A.w + 18, y: A.y + A.h * .5 }, v: 1 }, { a: { x: L.W / 2, y: 216 }, b: { x: B.x - 18, y: B.y + B.h * .62 }, v: 1 }]
      : [{ a: { x: L.cx + r + 16, y: L.cy - 12 }, b: { x: A.x - 16, y: A.y + A.h / 2 }, v: 0 }, { a: { x: L.cx + r + 16, y: L.cy + 12 }, b: { x: C.x - C.r - 30, y: C.y }, v: 0 }]; };
  const curve = k => { const d = .5 * (k.b.x - k.a.x), c0 = k.v ? { x: k.a.x, y: k.b.y - 40 } : { x: k.a.x + d, y: k.a.y }, c1 = k.v ? { x: k.a.x, y: k.b.y } : { x: k.b.x - d, y: k.b.y };
    return { d: `M${f2(k.a.x)} ${f2(k.a.y)}C${f2(c0.x)} ${f2(c0.y)} ${f2(c1.x)} ${f2(c1.y)} ${f2(k.b.x)} ${f2(k.b.y)}`, at: q => { const m = 1 - q, w = [m * m * m, 3 * m * m * q, 3 * m * q * q, q * q * q]; return { x: w[0] * k.a.x + w[1] * c0.x + w[2] * c1.x + w[3] * k.b.x, y: w[0] * k.a.y + w[1] * c0.y + w[2] * c1.y + w[3] * k.b.y }; } }; };
  /* a circuit trace between the same points, j = 0..2 of three parallel ones: straight, one 45° jog, straight */
  const trace = (k, j) => { const a = k.a, b = k.b, o = (j - 1) * 16; let P;
    if (k.v) { const s = Math.sign(b.x - a.x) || 1, x = a.x + s * (8 + 9 * j), y = b.y + (1 - j) * 16, run = Math.abs(b.x - x) - 2; P = [[x, a.y], [x, y - run], [x + s * run, y], [b.x, y]]; }
    else { const s = Math.sign(b.y - a.y) || 1, dj = Math.abs(b.y - a.y), x1 = Math.max(a.x + 40, b.x - 34 - dj) - o * s * .4, x2 = Math.min(b.x - 14, x1 + dj); P = [[a.x, a.y + o], [x1, a.y + o], [x2, b.y + o], [b.x, b.y + o]]; }
    const len = P.slice(1).map((q, n) => Math.hypot(q[0] - P[n][0], q[1] - P[n][1])), total = len.reduce((x, y) => x + y, 0);
    return { d: 'M' + P.map(q => f2(q[0]) + ' ' + f2(q[1])).join('L'), at: q => { let r = q * total; for (let n = 0; n < len.length; n++) { if (r <= len[n] || n === len.length - 1) { const u = len[n] ? r / len[n] : 0; return { x: lerp(P[n][0], P[n + 1][0], u), y: lerp(P[n][1], P[n + 1][1], u) }; } r -= len[n]; } } }; };
  const SPARK = 'M0 -13C1.6 -4.4 4.4 -1.6 13 0C4.4 1.6 1.6 4.4 0 13C-1.6 4.4 -4.4 1.6 -13 0C-4.4 -1.6 -1.6 -4.4 0 -13Z';
  const line = (id, d, col, w, extra) => `<path id="${id}" d="${d}" pathLength="1" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 1" stroke-dashoffset="1" ${extra || ''}/>`;
  const cellsOf = g => { const out = [], hitBox = (x, y, b) => x + 60 > b.x0 && x < b.x1 && y + 60 > b.y0 && y < b.y1;
    const boxes = [g.box].concat(g.slots.map(q => ({ x0: q.x - 40, x1: q.x + q.w + 40, y0: q.y - 70, y1: q.y + q.h + 40 })), [{ x0: g.sub.x - 150, x1: g.sub.x + 560, y0: g.sub.y - 150, y1: g.sub.y + 150 }, { x0: g.free.x - 300, x1: g.free.x + 300, y0: g.free.y - 40, y1: g.free.y + 40 }]);
    for (let y = 0; y < 900; y += 60) for (let x = 0; x < 1920; x += 60) if (!boxes.some(b => hitBox(x, y, b)) && hash(x * .13 + y * 1.7) > .45) out.push({ x, y }); return out; };

  /* ---- one motif per intro concept. x: {p, t, g, L, d}; back(x) → svg markup behind the slots, dom(x) → html, frame(x + {T, S, at}) ---- */
  const STYLES = {
    orbit: { arrows: 1,
      back: x => `<g transform="translate(${f2(x.L.cx)} ${f2(x.L.cy)})"><g id="${x.p}ysat" opacity="0" transform="rotate(-18)"><ellipse rx="${f2(x.L.D * .92)}" ry="${f2(x.L.D * .26)}" fill="none" stroke="${x.t.line}" stroke-width="2.5" stroke-dasharray="2 12" stroke-linecap="round"/><circle id="${x.p}ys1" r="${x.g.two ? 5 : 7}" fill="${x.t.ink}"/><circle id="${x.p}ys2" r="${x.g.two ? 4 : 5}" fill="${x.t.line}"/></g></g>
<g id="${x.p}ynet" opacity="0">${[0, 1, 2, 3, 4, 5, 6].map(i => `<line id="${x.p}ye${i}" stroke="${x.t.line}" stroke-width="2" opacity=".6"/>`).join('')}${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<circle id="${x.p}yn${i}" r="${f2(4 + 5 * hash(i + 3))}" fill="${i % 3 ? x.t.line : x.t.ink}"/>`).join('')}</g>`,
      frame: x => { const { T, L, g, at } = x, sa = T * .7, rx = L.D * .92, ry = L.D * .26; at('ysat', { opacity: f2(.85 * eo(x.S(.9, 1.6))) });
        at('ys1', { cx: f2(rx * Math.cos(sa)), cy: f2(ry * Math.sin(sa)) }); at('ys2', { cx: f2(rx * Math.cos(sa + 2.6)), cy: f2(ry * Math.sin(sa + 2.6)) });
        const N = [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ x: g.free.x + (i - 3.5) * 78 + 14 * Math.sin(T * .5 + i * 1.7), y: g.free.y + (i % 2 ? -38 : 34) * (.6 + .4 * hash(i)) + 10 * Math.cos(T * .4 + i * 2.3) }));
        at('ynet', { opacity: f2(eo(x.S(1.0, 1.7))) }); N.forEach((n, i) => { at('yn' + i, { cx: f2(n.x), cy: f2(n.y) }); if (i < 7) at('ye' + i, { x1: f2(n.x), y1: f2(n.y), x2: f2(N[i + 1].x), y2: f2(N[i + 1].y) }); }); } },
    boot: { arrows: 1,
      dom: x => `<div class="lfx-term" id="${x.p}yterm" style="left:${f2(x.g.free.x - 400)}px;top:${f2(x.g.free.y - 16)}px;color:${x.t.ink}"><span style="opacity:.55">${x.d.prompt}</span><span id="${x.p}yty"></span><b id="${x.p}yct" style="background:${x.t.ink}"></b></div>`,
      frame: x => { const n = Math.round(x.d.command.length * x.S(.6, 1.35)); txt(x.p + 'yty', x.d.command.slice(0, n)); st(x.p + 'yterm', { opacity: f2(x.S(.45, .6)) });
        st(x.p + 'yct', { opacity: x.T < 1.4 || Math.floor((x.T - 1.4) / .5) % 2 === 0 ? 1 : 0 }); } },
    beats: { arrows: 1,
      back: x => x.g.slots.map((q, i) => `<rect id="${x.p}ypn${i}" x="${q.x}" y="${q.y}" width="0" height="${q.h}" rx="16" fill="${x.t.panel}"/>`).join('') + `<g id="${x.p}ybars" opacity="0">${[0, 1, 2].map(i => `<g transform="translate(${f2(x.g.free.x - 171 + i * 118)} ${f2(x.g.free.y)})"><rect width="106" height="7" rx="3.5" fill="${x.t.line}" opacity=".3"/><rect id="${x.p}ybb${i}" width="0" height="7" rx="3.5" fill="${x.t.ink}"/></g>`).join('')}</g>`,
      frame: x => { const { T, at, g } = x; g.slots.forEach((q, i) => { const a = .05 + BEAT * i, qa = expo(seg(T, a, a + .22)), qb = expo(seg(T, a + .3, a + .52)); at('ypn' + i, { x: f2(q.x + q.w * qb), width: f2(q.w * (qa - qb)) }); });   // a panel wipes through each slot on the beat
        at('ybars', { opacity: f2(x.S(.9, 1.3)) }); const ph = (T % (4 * BEAT)) / BEAT; [0, 1, 2].forEach(i => at('ybb' + i, { width: f2(106 * cl(ph - i, 0, 1) * (ph < 3.6 ? 1 : 0)) })); } },
    commit: {
      back: x => links(x.g).map((k, i) => { const c = curve(k); return line(x.p + 'yl' + i, c.d, i ? x.t.line : x.t.ink, 6) + [.34, .68].map((q, j) => `<circle id="${x.p}yc${i}${j}" cx="${f2(c.at(q).x)}" cy="${f2(c.at(q).y)}" r="0" fill="${x.t.ink}"/>`).join('') + `<circle id="${x.p}yh${i}" r="13" fill="${LF.BLUE}" stroke="${x.t.ink}" stroke-width="4" opacity="0"/><circle id="${x.p}yp${i}" r="6" fill="${x.t.ink}" opacity="0"/>`; }).join(''),
      frame: x => { const { T, at, g } = x; links(g).forEach((k, i) => { const c = curve(k), a = .7 + .15 * i, q = eio(seg(T, a, a + .7)), e = c.at(1);
        at('yl' + i, { 'stroke-dashoffset': (1 - q).toFixed(4) }); [.34, .68].forEach((u, j) => at('yc' + i + j, { r: f2(10 * bk(cl((q - u) * 8, 0, 1))) }));
        at('yh' + i, { cx: f2(e.x), cy: f2(e.y), opacity: q >= 1 ? 1 : 0, r: f2(13 + 2 * Math.sin(T * 2.2 + i)) });
        const ph = ((T - 1.6 + 1.5 * i) / 3) % 1, pt = c.at(eio(cl(ph / .45, 0, 1))); at('yp' + i, { cx: f2(pt.x), cy: f2(pt.y), opacity: T > 1.6 && ph < .45 ? 1 : 0 }); }); } },
    loaded: { arrows: 1,
      back: x => `<defs>${x.g.slots.map((q, i) => `<clipPath id="${x.p}ycp${i}"><rect x="${q.x}" y="${q.y}" width="${q.w}" height="${q.h}" rx="16"/></clipPath>`).join('')}</defs>` + x.g.slots.map((q, i) => `<g clip-path="url(#${x.p}ycp${i})"><rect id="${x.p}ysw${i}" y="${q.y}" width="150" height="${q.h}" fill="${x.t.line}" opacity=".09" transform="skewX(-18)"/><rect id="${x.p}ylb${i}" x="${q.x}" y="${q.y}" width="0" height="6" fill="${x.t.ink}"/></g>`).join('') +
        `<g id="${x.p}yspin" fill="none" stroke="${x.t.ink}" stroke-width="7" stroke-linecap="round" opacity="0">${[0, 180].map(a => { const r = x.g.sub.r + 38, P = v => f2(x.g.sub.x + r * Math.cos(rad(v))) + ' ' + f2(x.g.sub.y + r * Math.sin(rad(v))); return `<path d="M${P(a)}A${r} ${r} 0 0 1 ${P(a + 55)}"/>`; }).join('')}</g>`,
      frame: x => { const { T, at, g } = x; g.slots.forEach((q, i) => { const ph = ((T + 2 * i) % 4) / 4; at('ysw' + i, { x: f2(q.x + 120 + (q.w + 500) * (((T * .22 + .3 * i) % 1)) - 300) });
          at('ylb' + i, { width: f2(q.w * (ph < .55 ? .7 * eo(ph / .55) : .7 + .3 * eio((ph - .55) / .35)) * (ph < .9 ? 1 : 0)), opacity: f2(x.S(1.0, 1.4)) }); });
        at('yspin', { opacity: f2(x.S(.9, 1.3)), transform: `rotate(${f2(-150 * T)} ${g.sub.x} ${g.sub.y})` }); } },
    silicon: {
      back: x => links(x.g).map((k, i) => [0, 1, 2].map(j => { const c = trace(k, j); return line(x.p + 'yt' + i + j, c.d, x.t.line, 3.5, 'opacity=".8"') + `<circle id="${x.p}yv${i}${j}" cx="${f2(c.at(1).x)}" cy="${f2(c.at(1).y)}" r="0" fill="none" stroke="${x.t.line}" stroke-width="3.5"/><circle id="${x.p}yu${i}${j}" r="5.5" fill="${x.t.ink}" opacity="0"/>`; }).join('')).join(''),
      frame: x => { const { T, at, g } = x; links(g).forEach((k, i) => [0, 1, 2].forEach(j => { const c = trace(k, j), a = .6 + .1 * i + .08 * j, q = eio(seg(T, a, a + .7));
        at('yt' + i + j, { 'stroke-dashoffset': (1 - q).toFixed(4) }); at('yv' + i + j, { r: f2(7 * bk(cl((q - .95) * 20, 0, 1))) });
        const ph = ((T - 1.5 + .9 * j + 1.4 * i) / 2.8) % 1, pt = c.at(cl(ph / .4, 0, 1)); at('yu' + i + j, { cx: f2(pt.x), cy: f2(pt.y), opacity: T > 1.5 && ph < .4 ? 1 : 0 }); })); } },
    bits: { arrows: 1,
      back: x => `<g fill="${x.t.line}">${cellsOf(x.g).map((c, i) => `<rect id="${x.p}yq${i}" x="${c.x + 3}" y="${c.y + 3}" width="54" height="54" rx="4" opacity="0"/>`).join('')}</g>`,
      dom: x => `<div class="lfx-term" id="${x.p}yro" style="left:${f2(x.g.free.x - 400)}px;top:${f2(x.g.free.y - 16)}px;color:${x.t.dim};text-transform:uppercase;letter-spacing:.06em">${x.d.res} <b style="color:${x.t.ink};width:auto;height:auto;background:none;display:inline;margin:0 0 0 .6em">${x.d.resValue}</b></div>`,
      frame: x => { const { T, at, g } = x, sx = lerp(-120, 2300, x.S(0, 1.1)); cellsOf(g).forEach((c, i) => { const dx = sx - c.x, glow = dx < 0 ? 0 : Math.exp(-dx / 260) * .5, tw = .05 + .16 * Math.pow(Math.max(0, Math.sin(T * (.5 + hash(i + 2)) + 6.28 * hash(i))), 6);
          at('yq' + i, { opacity: f2(Math.max(glow, tw * x.S(.9, 1.8))) }); }); st(x.p + 'yro', { opacity: f2(x.S(1.0, 1.4)) }); } },
    blueprint: { arrows: 1,
      back: x => { const { L, t, g } = x, R = L.D / 2, q = g.slots[g.slots.length - 1], dx = q.x + q.w + 44; return `<g id="${x.p}ybp" stroke="${t.line}" stroke-width="1.5" fill="none">
  <line id="${x.p}ycxh" y1="${f2(L.cy)}" y2="${f2(L.cy)}" opacity=".5"/><line id="${x.p}ycxv" x1="${f2(L.cx)}" x2="${f2(L.cx)}" opacity=".5"/>
  <circle id="${x.p}yring" cx="${f2(L.cx)}" cy="${f2(L.cy)}" r="${f2(R + 22)}" stroke-dasharray="10 7" opacity="0"/>
  <g id="${x.p}ydim" opacity="0"><line x1="${dx}" x2="${dx}" y1="${q.y}" y2="${q.y + q.h}"/>${[0, 1].map(s => `<line x1="${dx - 10}" x2="${dx + 10}" y1="${q.y + s * q.h}" y2="${q.y + s * q.h}"/>`).join('')}</g></g>
<text id="${x.p}ydt" x="${dx + 16}" y="${q.y + q.h / 2 + 7}" opacity="0" class="lfx-mono">${x.d.ratio}</text>`; },
      dom: x => `<div class="lfx-term" id="${x.p}yttl" style="left:${f2(x.g.free.x - (x.g.two ? 400 : -22))}px;${x.g.two ? '' : 'text-align:left;'}top:${f2(x.g.free.y - 16)}px;color:${x.t.dim};font-weight:400;font-size:22px">${x.d.sheet}</div>`,
      frame: x => { const { T, at, L } = x, cq = eo4(x.S(0, .6)), reach = 2000; at('ycxh', { x1: f2(L.cx - reach * cq), x2: f2(L.cx + reach * cq) }); at('ycxv', { y1: f2(L.cy - reach * cq), y2: f2(L.cy + reach * cq) });
        at('yring', { opacity: f2(.7 * x.S(.8, 1.3)), transform: `rotate(${f2(-8 * T)} ${f2(L.cx)} ${f2(L.cy)})` }); at('ydim', { opacity: f2(x.S(.9, 1.3)) }); at('ydt', { opacity: f2(x.S(1.0, 1.4)) }); st(x.p + 'yttl', { opacity: f2(x.S(1.1, 1.5)) }); } },
    eclipse: { arrows: 1, mask: 1,
      back: x => `<circle id="${x.p}yrim" cx="${f2(x.L.cx)}" cy="${f2(x.L.cy)}" r="${f2(x.L.D / 2 + 14)}" fill="none" stroke="${x.t.line}" stroke-width="2" opacity="0"/><circle id="${x.p}ybd" r="${x.g.two ? 5 : 8}" fill="${x.t.ink}" opacity="0"/><circle id="${x.p}ybs" r="6" fill="${x.t.ink}" opacity="0"/>`,
      frame: x => { const { T, at, L, g } = x, R = G.R * L.D / 1000, dist = R * 2.15 * eio(x.S(.05, 1.25)), moon = { cx: f2(L.cx + dist * Math.cos(rad(148))), cy: f2(L.cy + dist * Math.sin(rad(148))), r: f2(R + 2) };
        at('ymo', moon); at('yrim', { opacity: f2(.5 * x.S(0, .4)) }); const a = -T * .55, b = T * .8;
        at('ybd', { cx: f2(L.cx + (L.D / 2 + 14) * Math.cos(a)), cy: f2(L.cy + (L.D / 2 + 14) * Math.sin(a)), opacity: f2(x.S(1.2, 1.7)) }); at('ybs', { cx: f2(g.sub.x + (g.sub.r + 18) * Math.cos(b)), cy: f2(g.sub.y + (g.sub.r + 18) * Math.sin(b)), opacity: f2(x.S(1.2, 1.7)) }); } },
    generate: { arrows: 1,
      back: x => `<g id="${x.p}ypts">${Array.from({ length: 30 }, (_, i) => i % 3 === 0 ? `<rect id="${x.p}yk${i}" x="-11" y="-4" width="22" height="8" rx="4" fill="${i % 2 ? x.t.line : x.t.ink}" opacity="0"/>` : `<circle id="${x.p}yk${i}" r="${f2(3 + 3 * hash(i + 50))}" fill="${i % 2 ? x.t.line : x.t.ink}" opacity="0"/>`).join('')}</g>
<g id="${x.p}ypill" opacity="0"><rect x="${f2(x.g.free.x - 190)}" y="${f2(x.g.free.y - 36)}" width="380" height="72" rx="36" fill="#0E1526" stroke="${x.t.line}" stroke-width="2.5"/><path d="${SPARK}" transform="translate(${f2(x.g.free.x - 148)} ${f2(x.g.free.y)}) scale(1.15)" fill="${x.t.line}"/><text x="${f2(x.g.free.x - 118)}" y="${f2(x.g.free.y + 9)}" class="lfx-pill">${x.d.pill}</text></g>`,
      frame: x => { const { T, at, L, g } = x; for (let i = 0; i < 30; i++) { const out = eo4(seg(T, T0, T0 + .9 + .3 * hash(i + 4))), r = (L.D / 2 + 30 + (g.two ? 40 : 120) * hash(i + 1)) * out, a = hash(i) * 6.283 - T * (.12 + .18 * hash(i + 3));
          at('yk' + i, { transform: `translate(${f2(L.cx + r * Math.cos(a))} ${f2(L.cy + r * .8 * Math.sin(a))}) rotate(${f2(a * 57.3 - 90)})`, opacity: f2(out * (.25 + .6 * Math.pow(Math.max(0, Math.sin(T * (.6 + hash(i + 8)) + 6.28 * hash(i + 9))), 2))) }); }
        at('ypill', { opacity: f2(x.S(1.0, 1.4)), transform: `translate(0 ${f2(8 * (1 - eo(x.S(1.0, 1.4))))})` }); } },
  };

  defineSlide({
    slug: '01-endscreen', dur: 20, audio: 'lf-endscreen-sting.wav',
    data: { theme: (window.PROJECT.endscreen || {}).theme, layout: (window.PROJECT.endscreen || {}).layout, style: (window.PROJECT.endscreen || {}).style, tagline: (window.PROJECT.endscreen || {}).tagline || LF.TAGLINE,
      watch: 'Watch next', more: 'More like this', subscribe: 'Subscribe', subNote: 'New videos on tech, dev and AI',
      prompt: '~/lifetechfacts $ ', command: './watch --next', res: 'res', resValue: '3840×2160 · 60 fps', ratio: '16 : 9', sheet: 'LTF end screen · rev A · scale 1:1', pill: 'Watch the next one' },
    html: (d, c) => {
      const p = c.p, t = LF.theme(d), g = geo(c.grid, pick(d, 'layout', 'one')), L = g.L, s = g.sub, Y = STYLES[pick(d, 'style', 'orbit')] || STYLES.orbit, x = { p, t, g, L, d };
      const slot = (q, i) => { const r = `x="${q.x}" y="${q.y}" width="${q.w}" height="${q.h}" rx="16" pathLength="1" fill="none"`, b = 34, cn = (cx, cy, sx, sy) => `<path d="M${cx} ${cy + sy * b}L${cx} ${cy}L${cx + sx * b} ${cy}"/>`;
        return `<g id="${p}sl${i}"><rect x="${q.x}" y="${q.y}" width="${q.w}" height="${q.h}" rx="16" fill="${t.line}" opacity=".07" id="${p}sf${i}"/>
  <rect id="${p}sr${i}" ${r} stroke="${t.line}" stroke-width="2.5" stroke-dasharray="1 1" stroke-dashoffset="1" opacity=".7"/><rect id="${p}sg${i}" ${r} stroke="${t.ink}" stroke-width="3.5" stroke-linecap="round" stroke-dasharray=".09 .91" opacity="0"/>
  <g id="${p}sc${i}" fill="none" stroke="${t.ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0">${cn(q.x - 12, q.y - 12, 1, 1)}${cn(q.x + q.w + 12, q.y - 12, -1, 1)}${cn(q.x - 12, q.y + q.h + 12, 1, -1)}${cn(q.x + q.w + 12, q.y + q.h + 12, -1, -1)}</g>
  <path id="${p}sp${i}" d="M${q.x + q.w / 2 - 20} ${q.y + q.h / 2 - 26}L${q.x + q.w / 2 + 26} ${q.y + q.h / 2}L${q.x + q.w / 2 - 20} ${q.y + q.h / 2 + 26}Z" fill="${t.line}" opacity="0"/></g>`; };
      const label = (id, lx, ly, text) => `<div class="lfx-lb" id="${p}${id}" style="left:${f2(lx)}px;top:${f2(ly)}px;color:${t.ink}">${text}</div>`;
      const arrows = g.arrows && Y.arrows ? [0, 1, 2].map(i => `<path id="${p}ar${i}" d="M${g.arrows.x + i * 46} ${g.arrows.y - 30}l30 30l-30 30" fill="none" stroke="${t.line}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>`).join('') : '';
      const mark = Y.mask ? `<defs><mask id="${p}ylit" maskUnits="userSpaceOnUse" x="0" y="0" width="${L.W}" height="${L.H}"><rect width="${L.W}" height="${L.H}" fill="#fff"/><circle id="${p}ymo" fill="#000"/></mask></defs><g mask="url(#${p}ylit)">${LF.mark(p)}</g>` : LF.mark(p);
      return `${LF.css}<style>.lfx-lb{position:absolute;font:600 22px/1 ID,Inter,sans-serif;letter-spacing:.3em;text-transform:uppercase;white-space:nowrap;opacity:0}.lfx-lb small{display:block;margin-top:12px;font:500 19px/1 ID,Inter,sans-serif;letter-spacing:.04em;text-transform:none;opacity:.62}
.lfx-term{position:absolute;width:800px;text-align:center;font:700 28px/1 JB,monospace;white-space:pre;opacity:0}.lfx-term b{display:inline-block;width:.5em;height:1em;margin-left:3px;vertical-align:-.12em}
.lfx-mono{font:400 22px JB,monospace;fill:${t.dim}}.lfx-pill{font:600 26px ID,Inter,sans-serif;fill:${t.ink}}</style>${LF.bg(p, t)}
<svg class="lfi" id="${p}svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}"><defs>${LF.defs(p)}</defs>
${Y.back ? Y.back(x) : ''}
${g.slots.map(slot).join('')}
<g id="${p}sub" transform="translate(${s.x} ${s.y})"><circle id="${p}su0" r="${s.r}" fill="${t.line}" fill-opacity=".07" stroke="${t.line}" stroke-width="3"/><circle id="${p}su1" r="${s.r + 18}" fill="none" stroke="${t.line}" stroke-width="2.5" stroke-dasharray="3 13" stroke-linecap="round" opacity=".8"/></g>
${arrows}
${LF.shock(p, L, t)}
${mark}
${LF.word(p, t.word)}
</svg>
${g.slots.map((q, i) => label('lb' + i, q.x, q.y - 50, d[q.label])).join('')}
${label('lbs', s.x + s.r + 66, s.y - 22, `${d.subscribe}<small>${d.subNote}</small>`)}
${Y.dom ? Y.dom(x) : ''}
${LF.tag(p, L, d.tagline, t)}`;
    },
    frame: (u, c) => {
      const p = c.p, T = c.local, d = c.data, t = LF.theme(d), g = geo(c.grid, pick(d, 'layout', 'one')), L = g.L, S = (a, b) => seg(T, a, b), at = (id, o) => LF.at(p, id, o), Y = STYLES[pick(d, 'style', 'orbit')] || STYLES.orbit;
      /* 0.00-1.75  build: slots stroke on and get their corner brackets, the lockup resolves, subscribe circle pops, labels open */
      LF.resolve(p, L, T, t, { t0: T0, rot0: 200 });
      g.slots.forEach((q, i) => { const a = .05 + .12 * i;
        at('sr' + i, { 'stroke-dashoffset': (1 - eio(seg(T, a, a + .6))).toFixed(4) }); at('sf' + i, { opacity: f2(.07 * seg(T, a + .3, a + .7)) });
        at('sc' + i, { opacity: f2(seg(T, a + .45, a + .7)), transform: `translate(${f2(q.x + q.w / 2)} ${f2(q.y + q.h / 2)}) scale(${(1 + .03 * (1 - eo4(seg(T, a + .45, a + .9))) + .004 * Math.sin(T * 1.6 + i)).toFixed(4)}) translate(${f2(-q.x - q.w / 2)} ${f2(-q.y - q.h / 2)})` });
        at('sp' + i, { opacity: f2(.28 * seg(T, a + .5, a + .8)) });
        /* hold: a highlight travels round the slot border, one lap every five seconds */
        at('sg' + i, { 'stroke-dashoffset': (-(((T - 1 + 2.5 * i) / 5) % 1)).toFixed(4), opacity: f2(.9 * seg(T, 1.2, 1.8)) });
        st(p + 'lb' + i, { opacity: f2(eo(seg(T, .7 + .1 * i, 1.1 + .1 * i))), letterSpacing: f2(.3 + .15 * (1 - eo(seg(T, .7 + .1 * i, 1.1 + .1 * i)))) + 'em' }); });
      at('sub', { transform: `translate(${g.sub.x} ${g.sub.y}) scale(${f2(bk(S(.5, .85)))})` });
      at('su0', { r: f2(g.sub.r + 3 * Math.sin(T * 1.9)) }); at('su1', { transform: `rotate(${f2(T * 9)})`, r: f2(g.sub.r + 18 + 3 * Math.sin(T * 1.9 + 1)) });
      st(p + 'lbs', { opacity: f2(eo(S(.85, 1.25))) });
      /* hold: chevrons run towards the slot (layout one, styles without connectors), a sheen crosses the disc every SHEEN seconds, plus the style's own motif */
      if (g.arrows && Y.arrows) [0, 1, 2].forEach(i => at('ar' + i, { opacity: f2(S(1.0, 1.4) * (.18 + .62 * Math.pow(Math.max(0, Math.sin(T * 2.6 - i * .9)), 3))) }));
      if (T > 3) LF.sheen(p, cl(((T - 1) % SHEEN) / .7, 0, 1), t.sheen);
      if (Y.frame) Y.frame({ p, T, t, g, L, d, S, at });
    }
  });
})();
