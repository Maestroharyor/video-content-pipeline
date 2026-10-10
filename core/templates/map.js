/* map: the vidshare architecture as ONE canvas the cloud chapter keeps coming back to (projects/cloud-vs-devops).
   Slots start as dashed placeholders named for what the app needs ("Servers") and fill into the AWS service that
   provides it ("EC2"); edges draw and carry travelling pulses; badges attach to parts; a camera zooms into the region
   being talked about; an optional terminal and character sit in screen space, outside the camera.
   The world is authored at 1540x640 (the top layout's content box) so zoom 1 shows all of it.
   data: {eyebrow, accent, h1,
     slots: {<id>: state}   state: 'hide' | 'e' (empty, from the start) | 'E' (empty, appears on beat g<id>) |
                            'f' (filled from the start) | 'F' (empty from the start, fills on beat f<id>) | 'N' (hidden, appears filled on f<id>)
     boxes: {vpc|pub|priv|sg: 'pre' | 'beat'}   edges: {<n>: 'pre' | 'beat'}   flow: [edge numbers that carry pulses once drawn]
     badges: [{at, text, cls, dx, dy}]   cam0?: {x, y, z, ax, ay} (the opening framing)   cams: [{x, y, z, ax?, ay?}]   term?: {steps, x, y, w, title, cwd}
     meter?: {label, from, to, fmt, cls}   cast?, bubbles?, sub?, foot?}
   beats: g<id> · f<id> · vpc pub priv sg · e1..e6 · bd1..bdn · cam1..camn · term, tc1.., to1.. · meter · a1.., b1.. · sub */
const MAP = { W: 1540, H: 640 };
const MAP_NODES = {
  users: { x: 110, y: 250, g: ['i-globe', 'Viewers'], f: [null, 'Viewers', 'i-globe'] },
  cdn: { x: 340, y: 250, g: ['i-net', 'Delivery'], f: ['cloudfront', 'CloudFront'] },
  lb: { x: 640, y: 262, g: ['i-net', 'Routing'], f: ['elb', 'Load balancer'] },
  ec2: { x: 965, y: 262, g: ['i-server', 'Servers'], f: ['ec2', 'EC2 × 2'] },
  db: { x: 1330, y: 262, g: ['i-db', 'Database'], f: ['rds', 'RDS'] },
  s3: { x: 965, y: 548, g: ['i-file', 'Storage'], f: ['s3', 'S3'] },
};
const MAP_BOXES = {
  vpc: { x: 480, y: 34, w: 1036, h: 440, label: 'VPC 10.0.0.0/16', cls: 'vpcb' },
  pub: { x: 510, y: 88, w: 260, h: 356, label: 'Public subnet', cls: 'pub' },
  priv: { x: 800, y: 88, w: 690, h: 356, label: 'Private subnet', cls: 'priv' },
  sg: { x: 872, y: 150, w: 186, h: 258, label: 'Security group', cls: 'sgb' },
};
/* Edges run the way the content travels, from where it lives out to the viewer (S3 → CloudFront → Viewers, EC2 →
   load balancer → CloudFront): a line draws from its first node and the flow pulses move the same way. */
const MAP_EDGES = { 1: ['cdn', 'users'], 2: ['lb', 'cdn'], 3: ['ec2', 'lb'], 4: ['ec2', 'db'], 5: ['ec2', 's3'], 6: ['s3', 'cdn', [[340, 548]]] };
/* The vertical canvas gets a portrait world: the same architecture read top to bottom (Viewers at the top, the VPC
   under CloudFront, S3 beside EC2 with its line running up the left side to CloudFront). Same ids, same edge numbers
   and directions, so a slide's slots/edges/flow work on both; only its cams, badges and screen-space parts differ
   (data.v, core/registry.js). */
const MAP_V = {
  map: { W: 900, H: 1220 },
  nodes: {
    users: Object.assign({}, MAP_NODES.users, { x: 450, y: 80 }), cdn: Object.assign({}, MAP_NODES.cdn, { x: 450, y: 330 }),
    lb: Object.assign({}, MAP_NODES.lb, { x: 450, y: 590 }), ec2: Object.assign({}, MAP_NODES.ec2, { x: 450, y: 840 }),
    db: Object.assign({}, MAP_NODES.db, { x: 450, y: 1080 }), s3: Object.assign({}, MAP_NODES.s3, { x: 140, y: 840 }),
  },
  boxes: {
    vpc: Object.assign({}, MAP_BOXES.vpc, { x: 270, y: 450, w: 600, h: 755 }),
    pub: Object.assign({}, MAP_BOXES.pub, { x: 300, y: 505, w: 540, h: 190 }),
    priv: Object.assign({}, MAP_BOXES.priv, { x: 300, y: 715, w: 540, h: 475 }),
    sg: Object.assign({}, MAP_BOXES.sg, { x: 350, y: 765, w: 200, h: 190 }),
  },
  edges: Object.assign({}, MAP_EDGES, { 6: ['s3', 'cdn', [[140, 330]]] }),
};
const mapT = G => G.canvas === 'vertical' ? MAP_V : { map: MAP, nodes: MAP_NODES, boxes: MAP_BOXES, edges: MAP_EDGES };
/* The map is not clipped to its content box: a zoomed camera spreads it over the whole frame, and a clip box cut
   nodes in half mid-screen. Instead every framing is clamped so the parts on screen (nodes with their labels,
   boxes) stay inside the safe area below the heading: the zoom drops until they fit, then the pan slides them in. */
function mapFit(d, G, cam) {
  const s = d.slots, xs = [], ys = [], { nodes: MAP_NODES, boxes: MAP_BOXES } = mapT(G);
  Object.keys(s).filter(id => s[id] !== 'hide').forEach(id => { const n = MAP_NODES[id]; xs.push(n.x - 90, n.x + 90); ys.push(n.y - 70, n.y + 92); });
  Object.keys(d.boxes || {}).forEach(b => { const x = MAP_BOXES[b]; xs.push(x.x, x.x + x.w); ys.push(x.y - 18, x.y + x.h + 18); });
  const S = G.safe, V = { l: S.l - G.cx, r: S.r - G.cx, t: (G.mapTop || 200) - G.cy, b: S.b - G.cy };
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const z = Math.min(cam.z, (V.r - V.l) / (x1 - x0), (V.b - V.t) / (y1 - y0));
  const slide = (t, a, b, lo, hi) => a + t < lo ? lo - a : b + t > hi ? hi - b : t;
  return { z, tx: slide(cam.ax - cam.x * z, x0 * z, x1 * z, V.l, V.r), ty: slide(cam.ay - cam.y * z, y0 * z, y1 * z, V.t, V.b) };
}
function mapNode(p, id, n) {
  const f = n.f, fIco = f[2] ? `<span class="mp-gi"><svg viewBox="0 0 24 24"><use href="#${f[2]}"/></svg></span>` : `<img src="${logo(f[0])}" alt="">`;
  return `<div class="mp-n" id="${p}n${id}" style="left:${n.x - 80}px;top:${n.y - 64}px">
    <div class="mp-g" id="${p}g${id}"><span class="mp-gi"><svg viewBox="0 0 24 24"><use href="#${n.g[0]}"/></svg></span><b>${n.g[1]}</b></div>
    <div class="mp-f" id="${p}f${id}"><span class="mp-fi">${fIco}</span><b>${f[1]}</b></div></div>`;
}
defineTemplate('map', {
  check: d => req(d, ['eyebrow', 'h1', 'slots'], 'map'),
  beats: d => {
    const s = d.slots, out = [];
    Object.keys(s).forEach(id => { if (s[id] === 'E') out.push('g' + id); if (s[id] === 'F' || s[id] === 'N') out.push('f' + id); });
    Object.keys(d.boxes || {}).forEach(b => { if (d.boxes[b] === 'beat') out.push(b); });
    Object.keys(d.edges || {}).forEach(e => { if (d.edges[e] === 'beat') out.push('e' + e); });
    return baseBeats(d).concat(out, seqN('bd', (d.badges || []).length), seqN('cam', (d.cams || []).length),
      d.term ? ['term'].concat(tmBeats(d.term.steps, 't')) : [], d.meter ? ['meter'] : [], castBeats(d.cast, d.bubbles), ['sub']);
  },
  html: (d, c) => {
    const p = c.p, G = c.grid, s = d.slots, { map: MAP, nodes: MAP_NODES, boxes: MAP_BOXES, edges: MAP_EDGES } = mapT(G);
    const boxes = Object.keys(MAP_BOXES).filter(b => (d.boxes || {})[b]).map(b => { const x = MAP_BOXES[b];
      return `<div class="box ${x.cls}" id="${p}${b}" style="left:${x.x}px;top:${x.y}px;width:${x.w}px;height:${x.h}px"><b>${x.label}</b></div>`; }).join('');
    // an edge to a hidden node is not drawn (a vertical slide can hide parts it has no room for, data.v.slots)
    const shown = e => MAP_EDGES[e].slice(0, 2).every(id => s[id] && s[id] !== 'hide');
    const edges = Object.keys(d.edges || {}).filter(shown).map(e => {
      const [a, b, via] = MAP_EDGES[e], A = MAP_NODES[a], Bn = MAP_NODES[b];
      const pts = [[A.x, A.y], ...(via || []), [Bn.x, Bn.y]];
      const dd = pts.map((q, j) => (j ? 'L' : 'M') + q[0] + ' ' + q[1]).join(' ');
      return `<svg class="draw mp-e" id="${p}e${e}" style="left:0;top:0;width:${MAP.W}px;height:${MAP.H}px" viewBox="0 0 ${MAP.W} ${MAP.H}"><path d="${dd}"/></svg>`;
    }).join('');
    const pulses = (d.flow || []).map(e => `<i class="mp-dot" id="${p}pd${e}a"></i><i class="mp-dot" id="${p}pd${e}b"></i>`).join('');
    const nodes = Object.keys(s).filter(id => s[id] !== 'hide').map(id => mapNode(p, id, MAP_NODES[id])).join('');
    const badges = (d.badges || []).map((b, i) => { const n = MAP_NODES[b.at];
      return `<div class="badge ${b.cls || 'b'} mp-bd" id="${p}bd${i + 1}" style="left:${n.x + (b.dx || 60)}px;top:${n.y + (b.dy == null ? -110 : b.dy)}px">${b.text}</div>`; }).join('');
    const term = d.term ? tmWin({ id: p + 'term', p, pre: 't', steps: d.term.steps, title: d.term.title, cwd: d.term.cwd,
      x: d.term.x || 0, y: d.term.y || 0, w: d.term.w || 700, accent: d.accent, small: true, cls: 'mp-term' }) : '';
    const meter = d.meter ? `<div class="badge ${d.meter.cls || 'r'} mp-meter" id="${p}meter" style="left:${d.meter.x || 1180}px;top:${d.meter.y || 520}px">
      <small>${d.meter.label}</small><span id="${p}amt">${d.meter.fmt(d.meter.from)}</span></div>` : '';
    return `${heading(p, d)}<div class="content"><div class="rel"${G.canvas === 'vertical' ? ' data-fit="self"' : ''}>
      <div class="mp-view" style="position:absolute;left:0;top:0;width:${MAP.W}px;height:${MAP.H}px">
        <div class="mp-world" id="${p}world" style="width:${MAP.W}px;height:${MAP.H}px">${boxes}${edges}${pulses}${nodes}${badges}</div></div>
      ${meter}${term}${castBlock(p, d.cast, d.bubbles)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c), s = d.slots, MAP = mapT(c.grid).map;
    headIn(B, p);
    // camera: each cam beat eases from the previous framing over .9s (fraction fallback: evenly spread)
    // a cam puts world point (x, y) at view point (ax, ay), default the centre; a terminal on the left moves ax right
    const cam0 = Object.assign({ x: MAP.W / 2, y: MAP.H / 2, z: 1, ax: MAP.W / 2, ay: MAP.H / 2 }, d.cam0 || {});
    let cam = cam0;
    (d.cams || []).forEach((k, i) => {
      const r = B.at('cam' + (i + 1), .2 + i * .15, .3 + i * .15, 'enter', { len: .9, focal: false });
      const q = eio(cl(r.p, 0, 1)), a = cam, K = Object.assign({ ax: MAP.W / 2, ay: MAP.H / 2 }, k);
      cam = { x: lerp(a.x, K.x, q), y: lerp(a.y, K.y, q), z: lerp(a.z, K.z, q), ax: lerp(a.ax, K.ax, q), ay: lerp(a.ay, K.ay, q) };
    });
    const f = mapFit(d, c.grid, cam);
    st(p + 'world', { transform: `translate(${f.tx.toFixed(2)}px,${f.ty.toFixed(2)}px) scale(${f.z.toFixed(4)})` });
    // boxes and edges
    Object.keys(d.boxes || {}).forEach(b => fd(p + b, d.boxes[b] === 'pre' ? 1 : B.p(b, .1, .2)));
    const edgeP = {};
    Object.keys(d.edges || {}).forEach(e => { edgeP[e] = d.edges[e] === 'pre' ? 1 : B.p('e' + e, .3, .4, 'draw'); draw(p + 'e' + e, edgeP[e]); });
    // pulses ride a drawn edge on a 1.6s loop, two per edge half a loop apart
    (d.flow || []).forEach(e => {
      const path = el(p + 'e' + e) && el(p + 'e' + e).querySelector('path'); if (!path) return;
      const L = path.getTotalLength(), on = (edgeP[e] || 0) >= 1;
      ['a', 'b'].forEach((k, j) => {
        const ph = (((c.local || 0) / 1.6) + j * .5) % 1, pt = path.getPointAtLength(L * ph);
        st(p + 'pd' + e + k, { opacity: on ? (Math.sin(ph * Math.PI) * .95).toFixed(3) : 0, transform: `translate(${pt.x - 7}px,${pt.y - 7}px)` });
      });
    });
    // slots: placeholder → service
    Object.keys(s).forEach(id => {
      const v = s[id]; if (v === 'hide') return;
      let show = 1, fill = 0;
      if (v === 'E') show = B.p('g' + id, .1, .2, 'pop');
      if (v === 'f') fill = 1;
      if (v === 'F') fill = B.p('f' + id, .3, .4, 'pop');
      if (v === 'N') { fill = B.p('f' + id, .3, .4, 'pop'); show = fill; }
      pp(p + 'n' + id, show, .7);
      fd(p + 'g' + id, 1 - cl(fill * 2, 0, 1));
      st(p + 'f' + id, { opacity: cl(fill * 1.6, 0, 1), transform: 'scale(' + (.6 + .4 * bk(cl(fill, 0, 1))).toFixed(4) + ')' });
    });
    B.group('bd', (d.badges || []).length, { a: .5, step: .06, len: .1, kind: 'pop', dim: false }).forEach((r, i) => pp(p + 'bd' + (i + 1), r.p, .7));
    if (d.term) { const tr = B.at('term', .2, .3); up(p + 'term', tr.p, 30); tmPlay(B, c, p, 't', d.term.steps, tr, .3, .8); }
    if (d.meter) { const m = B.at('meter', .6, .7, 'pop'); pp(p + 'meter', m.p, .7);
      tick(p + 'amt', B.on ? seg(c.local, m.s, m.s + 1.6) : seg(t, m.fa, m.fb + .2), d.meter.from, d.meter.to, d.meter.fmt); }
    castPlay(B, c, p, d.cast, d.bubbles);
    footIn(B, p); holdLife(B, p, d);
  }
});
