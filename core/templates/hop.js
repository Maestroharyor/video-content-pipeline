/* hop: the DNS lookup as a hub asking three tiers and getting three answers back.
   A DNS lookup is not a pipeline. The resolver is a hub: it asks root, gets a pointer back, asks the TLD, gets a
   pointer back, asks the authoritative server, gets the address back. A single left-to-right row cannot show that,
   so the six nodes sit as a hub plus a descending staircase and every exchange is a pair of bowed arcs — a query
   arc out and an answer arc returning on the other side of the chord, each with its own arrowhead.
   The arrangement is identical on all 18 hop slides, so across the section it reads as one diagram the narration
   walks around: nodes already passed stay lit ('seen'), the active node ignites, the live link's arcs draw and a
   packet rides the head of the line that is drawing.
   data: {eyebrow, accent, h1, h1size?, hop: {active, seen?, edge?: [from, to], pk?: {text, back?}, lit?: [[from, to], ...] | 'all',
          card?: {title, rows: [{k, v, off?}]}, nodes?: [{label, sub, ico}]}}
   `edge` is the link a packet travels. `lit` is the exchanges that have already travelled, in story order, as
   DIRECTED edges: [1,2] is the resolver asking root and [2,1] is root replying, and each lights exactly one arc,
   never the pair. Every entry but the last is history (dimmed, its colour kept); the last is the exchange the
   narration is on, at full brightness. On a slide with a packet that packet's arc is the live one and all of `lit`
   is history. So an arrow is lit only once its exchange has happened, and the reply never lights before the reply.
   beats: n1..nN (nodes) · pk (packet + the arc it rides) · card · cr1..crM (card rows) */
const HOP_NODES = [
  { label: 'You', sub: 'browser', ico: 'i-browser' },
  { label: 'Resolver', sub: 'local DNS', ico: 'i-net' },
  { label: 'Root', sub: 'the dot', ico: 'i-globe' },
  { label: 'TLD', sub: '.com', ico: 'i-db' },
  { label: 'Authoritative', sub: 'source of truth', ico: 'i-server' },
  { label: 'Web server', sub: 'example.com', ico: 'i-cloud' },
];
/* Geometry per canvas. The template is full-frame: it pins its own heading and owns everything below it, so it does
   not read the project's content grid. `at` is the left/top of each node box, `card` the detail card's slot, `head`
   the eyebrow/h1 tops (null = the grid's).
   horizontal (1920x1080): You and Resolver share a line; Root high, TLD mid, Authoritative low, each further right; Web
   server under You, which is who the browser actually connects to. Every box stays inside the 58/1862/56/870 safe
   rectangle. Measured, not guessed: a node's contents are 136px tall so nh cannot go below 140; the tallest card
   (three rows) ends at 382; a headline ends at 322, or 404 when it runs to three lines. Everything therefore lives
   between 420 and the caption line at 870. Root cannot sit high in the old x=940 slot because that is under the
   card, so it moves into the 790-1058 corridor between the headline and the card, which is the only gap in the top
   band wide enough for a 268px box.
   vertical (1080x1920): the same hub turned on its side. Heading and card stack at the top (a three-line headline
   ends near 476, the card below it ends near 800), and the six nodes fill 860-1520 in three columns: You over Web
   server on the left, the Resolver hub in the middle, Root / TLD / Authoritative down the right. The You-Web server
   chord runs down the left column, clear of the Resolver box. Nothing goes below 1560: a vertical social cut burns
   its captions into the band under it.
   links: one entry per exchange the narration makes. qb/ab bow the query and answer arcs to opposite sides of the
   chord (px at the control points); the signs are authored rather than derived so no arc is ever pushed through a
   node box. pa is where the packet chip sits: a hand-checked spot in clear space near the link, because a chip that
   rides all the way to its target lands on the glass it is pointing at and stops being readable. The chip drifts
   +/-38px along the link direction across its beat, so the message still visibly moves the way it is travelling. */
const HOP_GEO = {
  horizontal: {
    nw: 268, nh: 140, am: 14, head: { ebTop: 104, h1Top: 158 }, card: { x: 1074, y: 104, w: 786 },
    at: [[76, 450], [500, 450], [790, 210], [1270, 450], [1560, 600], [76, 728]],
    links: [
      { a: 0, b: 1, qb: -34, ab: 34, pa: [422, 640] },    // you ask your resolver (below both boxes, clear of the lower arc's apex at 554)
      { a: 1, b: 2, qb: -46, ab: 26, pa: [960, 470] },    // resolver asks root (a short chord: the boxes are close, so the bows shrink with it or the pair curls into a hook)
      { a: 1, b: 3, qb: -96, ab: 64, pa: [1019, 520] },   // resolver asks the TLD (inside the lens the two arcs make: the bows are wide enough that the chip clears them at both ends of its drift)
      { a: 1, b: 4, qb: 92, ab: 30, pa: [1150, 730] },    // resolver asks the authoritative server (under both arcs, which bow below: above them the chip lands on the TLD box and on the resolver-to-TLD pair)
      { a: 0, b: 5, qb: -26, ab: 26, pa: [420, 654] },    // you connect to the web server
    ],
  },
  vertical: {
    nw: 268, nh: 140, am: 14, head: null, card: { x: 60, y: 520, w: 960 },
    at: [[60, 860], [330, 1120], [752, 860], [752, 1120], [752, 1380], [60, 1380]],
    links: [
      { a: 0, b: 1, qb: -30, ab: 30, pa: [210, 1040] },   // you ask your resolver (between the two left boxes, right of the you-web chord)
      { a: 1, b: 2, qb: -40, ab: 30, pa: [500, 990] },    // resolver asks root (above the rising chord)
      { a: 1, b: 3, qb: -40, ab: 28, pa: [520, 1276] },   // resolver asks the TLD (under the short level chord)
      { a: 1, b: 4, qb: 40, ab: 30, pa: [440, 1330] },    // resolver asks the authoritative server (under the falling chord)
      { a: 0, b: 5, qb: -26, ab: 26, pa: [214, 1290] },   // you connect to the web server (right of the left column's chord, under the resolver)
    ],
  },
};
const hopGeo = G => HOP_GEO[G.canvas] || HOP_GEO.horizontal;
const hopC = (g, i) => ({ x: g.at[i][0] + g.nw / 2, y: g.at[i][1] + g.nh / 2 });
/* where a line leaves node i heading towards point b: the ray from the centre hits the box edge, plus a margin,
   so the arc emerges clear of the glass instead of from under it */
function hopAnchor(g, i, b) {
  const a = hopC(g, i), dx = b.x - a.x, dy = b.y - a.y;
  const sx = dx ? (g.nw / 2 + g.am) / Math.abs(dx) : Infinity;
  const sy = dy ? (g.nh / 2 + g.am) / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return { x: a.x + dx * s, y: a.y + dy * s };
}
/* cubic bezier bowed `bow` px off the chord, with a point sampler so the packet can ride it */
function hopArc(g, from, to, bow) {
  const a = hopAnchor(g, from, hopC(g, to)), b = hopAnchor(g, to, hopC(g, from));
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const c1 = { x: a.x + dx * .28 + nx * bow, y: a.y + dy * .28 + ny * bow };
  const c2 = { x: a.x + dx * .72 + nx * bow, y: a.y + dy * .72 + ny * bow };
  const at = q => { const m = 1 - q, w = [m * m * m, 3 * m * m * q, 3 * m * q * q, q * q * q];
    return { x: w[0] * a.x + w[1] * c1.x + w[2] * c2.x + w[3] * b.x, y: w[0] * a.y + w[1] * c1.y + w[2] * c2.y + w[3] * b.y }; };
  const f = v => Math.round(v * 10) / 10;
  return { d: `M${f(a.x)} ${f(a.y)}C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(b.x)} ${f(b.y)}`, at };
}
/* the link list is the same on every canvas (only bows and chip spots differ), so pair lookups use the horizontal one */
const HOP_LINKS = HOP_GEO.horizontal.links;
/* index of the authored link for an unordered node pair, or -1 */
const hopLink = e => !e ? -1 : HOP_LINKS.findIndex(l => (l.a === e[0] && l.b === e[1]) || (l.a === e[1] && l.b === e[0]));
/* the one arc a DIRECTED edge names, as the id suffix the markup uses: 'q' runs a->b, 'a' runs b->a */
function hopArcKey(e) {
  if (!e || e.length !== 2) return null;
  for (let i = 0; i < HOP_LINKS.length; i++) {
    const l = HOP_LINKS[i];
    if (l.a === e[0] && l.b === e[1]) return i + 'q';
    if (l.a === e[1] && l.b === e[0]) return i + 'a';
  }
  return null;
}
defineTemplate('hop', {
  check: d => req(d, ['eyebrow', 'h1', 'hop'], 'hop'),
  beats: d => baseBeats(d).concat(seqN('n', (d.hop.nodes || HOP_NODES).length),
    ['pk', 'card'], seqN('cr', (d.hop.card && d.hop.card.rows || []).length)),
  html: (d, c) => {
    const p = c.p, G = c.grid, g = hopGeo(G), h = d.hop, nodes = h.nodes || HOP_NODES;
    const ns = nodes.map((it, i) => `<div class="rt-node" id="${p}n${i + 1}" style="left:${g.at[i][0]}px;top:${g.at[i][1]}px;width:${g.nw}px;height:${g.nh}px">
      <span class="ri"><svg viewBox="0 0 24 24"><use href="#${it.ico}"/></svg></span><span class="rn">${it.label}</span><span class="rs">${it.sub}</span></div>`).join('');
    // the arc layer paints before the nodes, so a line always runs behind the glass it points at
    const arcs = g.links.map((l, i) => {
      const q = hopArc(g, l.a, l.b, l.qb), a = hopArc(g, l.b, l.a, -l.ab);
      return `<path class="rt-arc" id="${p}q${i + 1}" d="${q.d}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>
        <path class="rt-arc back" id="${p}a${i + 1}" d="${a.d}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>`;
    }).join('');
    const svg = `<svg class="rt-svg" id="${p}svg" width="${G.w}" height="${G.h}" viewBox="0 0 ${G.w} ${G.h}"><defs>
      <marker id="${p}mq" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5.2" markerHeight="5.2" orient="auto"><path d="M0 1L9 5L0 9Z" fill="var(--teal)"/></marker>
      <marker id="${p}ma" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5.2" markerHeight="5.2" orient="auto"><path d="M0 1L9 5L0 9Z" fill="var(--green)"/></marker>
      </defs>${arcs}</svg>`;
    const card = h.card ? `<div class="rt-card" id="${p}card" style="left:${g.card.x}px;top:${g.card.y}px;width:${g.card.w}px">
      <div class="rc-t">${h.card.title}</div>
      ${(h.card.rows || []).map((r, i) => `<div class="rc-r ${r.off ? 'off' : ''}" id="${p}cr${i + 1}"><span>${r.k}</span><b>${r.v}</b></div>`).join('')}</div>` : '';
    const pk = h.pk ? `<div class="rt-pk ${h.pk.back ? 'back' : ''}" id="${p}pk" style="left:0;top:0">${h.pk.text}</div>` : '';
    return `${heading(p, Object.assign({}, g.head, d))}${svg}${ns}${card}${pk}`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, g = hopGeo(c.grid), h = d.hop, nodes = h.nodes || HOP_NODES, n = nodes.length, B = beats(c);
    headIn(B, p);
    const act = h.active == null ? -1 : h.active, seen = h.seen == null ? act : h.seen;
    // the diagram itself: a quick group entrance, so it is present before the narration names the hop
    const rows = B.group('n', n, { a: .06, step: .035, len: .14, kind: 'enter' });
    nodes.forEach((_, i) => {
      const id = p + 'n' + (i + 1), r = rows[i];
      up(id, r.p, 26);
      cls(id, 'seen', i < seen);
      cls(id, 'hot', i === act && r.p > .5);
    });
    /* Arcs: every link settles in faintly with the later of its two nodes. The live link draws on the `pk` beat —
       an outbound question draws the query arc, a reply (pk.back) draws the answer arc — and the packet rides the
       head of whichever line is being drawn, so the chip and the stroke arrive together. */
    const li = hopLink(h.edge), back = !!(h.pk && h.pk.back);
    const pkr = B.at('pk', .34, .62, 'enter', { len: .9 });
    const q = eio(cl(pkr.p, 0, 1));
    /* `lit` is a trail of directed edges in story order. Everything in it has already travelled, so it is
       history; the one the narration is on now is the last entry, unless a packet is riding an arc this slide,
       in which case that packet is the live thing and the whole trail is history. An edge given without a
       packet is itself the exchange being talked about, so it lights by default. */
    const litAll = h.lit === 'all';
    const trail = litAll ? [] : (h.lit || (h.edge && !h.pk ? [h.edge] : [])).map(hopArcKey).filter(k => k !== null);
    const liveKey = h.pk || !trail.length ? null : trail[trail.length - 1];
    const seenKeys = new Set(h.pk ? trail : trail.slice(0, -1));
    HOP_LINKS.forEach((l, i) => {
      const rest = cl(Math.min(rows[l.a].p, rows[l.b].p), 0, 1);
      const live = i === li;
      [['q', !back], ['a', back]].forEach(([k, drawing]) => {
        const id = p + k + (i + 1), e = el(id);
        if (!e) return;
        /* Four states. The arc the packet is on wipes in over its beat; the arc the narration is on is held at
           full stroke; an arc already travelled keeps its colour at a little over half; everything else rests
           faint. The difference between the last two has to be colour, not opacity: .6 against .3 on a grey
           stroke is not a difference anyone reads at a glance. */
        const key = i + k;
        const hot = live && drawing && !!h.pk;
        const isLive = !hot && (litAll || key === liveKey);
        const isSeen = !hot && !isLive && seenKeys.has(key);
        const cut = hot ? q : rest > 0 ? 1 : 0;                       // how much of the path is drawn
        const op = hot ? cl(q, 0, 1) : isLive ? rest : isSeen ? rest * .62 : rest * (live ? .5 : .3);
        e.style.strokeDashoffset = (1 - cut).toFixed(4);
        e.style.opacity = op.toFixed(3);
        e.classList.toggle('live', hot || isLive);
        e.classList.toggle('seen', isSeen);
        e.setAttribute('marker-end', cut > .96 && op > .05 ? `url(#${p}m${k})` : 'none');
      });
    });
    if (h.pk && li >= 0) {
      const l = g.links[li], from = hopC(g, back ? l.b : l.a), to = hopC(g, back ? l.a : l.b);
      const dx = to.x - from.x, dy = to.y - from.y, L = Math.hypot(dx, dy) || 1, k = lerp(-38, 38, q);
      st(p + 'pk', { left: (l.pa[0] + dx / L * k) + 'px', top: (l.pa[1] + dy / L * k) + 'px',
        opacity: String(cl(Math.min(pkr.p * 6, (1 - pkr.p) * 6 + .62), 0, 1)) });   // settles at .62, not .35: a hop slide holds this pose for seconds and the chip has to stay readable
    } else if (h.pk) up(p + 'pk', B.p('pk', .34, .48));
    // the detail card, parked where no headline length and no arc can reach it (top right, or under the heading on vertical)
    if (h.card) {
      up(p + 'card', B.p('card', .50, .66), 30);
      const crs = B.group('cr', (h.card.rows || []).length, { a: .58, step: .05, len: .12, kind: 'enter', dim: false });
      crs.forEach((r, i) => fd(p + 'cr' + (i + 1), r.p));
    }
    footIn(B, p); holdLife(B, p, d, { alias: { pk: 'pk', card: 'card' } });
  }
});
