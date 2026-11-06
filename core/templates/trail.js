/* The trail family (projects/free-apps-make-money, core/styles/trail.css): follow the money from whoever pays into the
   free app. One template, one canvas per scene, built from data:
     term    the counted way, said aloud ("Number two, freemium"): it lands huge in the middle on its beat, holds, then
             flies up into the headline's place while the next coin slot by the eyebrow fills (house rule: counted
             terms are shown big, then land in the counter)
     nodes   everything on the canvas, each entering on its own beat: tile (paper card), chip, logo, note (a banknote),
             dots (a crowd, some turning gold), months (a strip of months, paid ones in gold), row (ledger line),
             wallet, box (a parcel), stamp, strike
     edges   drawn paths; once drawn, coins run along them for the rest of the scene (a pure function of ctx.local)
     cast    characters + bubbles (core/components/cast.js)
     over    the card shown over the face in version B (dual's over windows); see trail.css
   data: {eyebrow, accent, h1, n (coins filled after this slide), term?: {text, size?}, h: canvas height,
          nodes: [{b, kind, x, y, w?, h?, ...}], edges: [{b, d (svg path in canvas px), coins?, period?, label?: {text, x, y}}],
          cast?, bubbles?, over?: {eb, h1, sub?, beat?, stamp?, strike?, coins?}}
   beats: term · every node's b · every edge's b · a1.. b1.. · card (over card) · sub · x1 · stamp */
const TR = { of: 10, hold: 1.0, fly: .5, coinPeriod: 1.6 };
/* Lucide icons (ISC licence, lucide.dev), stroke paths only */
const TR_ICON = {
  megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  gamepad: '<path d="M6 11h4M8 9v4M15 12h.01M18 10h.01"/><rect x="2" y="6" width="20" height="12" rx="4"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h3l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
  store: '<path d="m2 7 4.4-4.4A2 2 0 0 1 7.8 2h8.4a2 2 0 0 1 1.4.6L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M2 7h20v3a3 3 0 0 1-6 0 3 3 0 0 1-4 0 3 3 0 0 1-4 0 3 3 0 0 1-6 0z"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  chart: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  sparkle: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r=".5"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.7 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z"/>',
  cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.8-1.6l9.9-10.2a.5.5 0 0 1 .9.4l-1.9 6A1 1 0 0 0 13 10h7a1 1 0 0 1 .8 1.6l-9.9 10.2a.5.5 0 0 1-.9-.4l1.9-6A1 1 0 0 0 11 14z"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
  scroll: '<path d="M12 2v20M8 6l4-4 4 4M8 18l4 4 4-4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',
  map: '<path d="M14.1 4.6a2 2 0 0 0-1.8 0L8.4 6.5a2 2 0 0 1-1.8 0L3.4 4.9A1 1 0 0 0 2 5.8v12.4a1 1 0 0 0 .6.9l4 2a2 2 0 0 0 1.8 0l3.9-1.9a2 2 0 0 1 1.8 0l4 2a1 1 0 0 0 1.4-.9V5.8a1 1 0 0 0-.6-.9z"/><path d="M15 5v16M9 3v16"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  finger: '<path d="M10 11V4.5a1.5 1.5 0 0 1 3 0V10"/><path d="M13 9.5a1.5 1.5 0 0 1 3 0V11"/><path d="M16 10.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.2 16a1.6 1.6 0 0 1 2.5-2L8 16.2V8.5a1.5 1.5 0 0 1 2 0"/>',
};
const trIco = n => TR_ICON[n] ? `<svg viewBox="0 0 24 24">${TR_ICON[n]}</svg>` : '';
const trImg = s => s ? `<img src="${s}" alt="">` : '';
/* a guilloche rosette as svg path data: r(t) = R + a·sin(k·t), several phases (also drawn on the ground by kit.js) */
function trRosette(R, a, k, n, rings) {
  let out = '';
  for (let j = 0; j < rings; j++) {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const t = i / n * Math.PI * 2, r = R - j * (R * .12) + a * Math.sin(k * t + j * .7);
      d += (i ? 'L' : 'M') + (r * Math.cos(t)).toFixed(1) + ' ' + (r * Math.sin(t)).toFixed(1);
    }
    out += `<path d="${d}Z"/>`;
  }
  return out;
}

function trNode(p, n) {
  const id = p + n.b, pos = `left:${n.x}px;top:${n.y}px`, wh = (n.w ? `;width:${n.w}px` : '') + (n.h ? `;height:${n.h}px` : '');
  switch (n.kind) {
    case 'tile': return `<div class="tr-tile ${n.cls || ''}" id="${id}" style="${pos}${wh}">
      <div class="tt">${n.icon ? trIco(n.icon) : ''}${trImg(n.src)}<span>${n.text || ''}</span></div>
      ${n.logos ? `<div class="lg">${n.logos.map(trImg).join('')}</div>` : ''}${n.sub ? `<div class="sb">${n.sub}</div>` : ''}</div>`;
    case 'chip': return `<div class="tr-chip ${n.cls || ''}" id="${id}" style="${pos}">${n.icon ? trIco(n.icon) : ''}${trImg(n.src)}${n.text}</div>`;
    case 'logo': return `<div class="tr-logo ${n.cls || ''}" id="${id}" style="${pos}">${trImg(n.src)}${n.label ? `<span>${n.label}</span>` : ''}</div>`;
    case 'note': return `<div class="tr-note" id="${id}" style="${pos}${wh}"><span class="nn">${n.no || ''}</span><span class="ns">${n.sign || ''}</span>
      <svg class="rose" viewBox="-80 -80 160 160">${trRosette(70, 7, 12, 180, 4)}</svg><div class="nv">${n.text}</div></div>`;
    case 'dots': {
      const dots = Array.from({ length: n.count }, (_, i) => `<i id="${id}d${i}" class="${(n.gold || []).includes(i) ? 'g' : ''}"></i>`).join('');
      return `<div class="tr-dots" id="${id}" style="${pos};grid-template-columns:repeat(${n.cols},44px)">${dots}</div>`;
    }
    case 'months': return `<div class="tr-months" id="${id}" style="${pos}">${n.months.map((m, i) =>
      `<div id="${id}m${i}" class="${i >= (n.free || 0) ? 'paid' : ''}"><b>${m}</b><span>${i < (n.free || 0) ? 'Free' : '$'}</span></div>`).join('')}</div>`;
    case 'row': return `<div class="tr-row" id="${id}" style="${pos}${wh}"><span class="no">${n.no || ''}</span>${n.text}${n.tail ? `<span class="tail">${n.tail}</span>` : ''}</div>`;
    case 'wallet': return `<div class="tr-wallet" id="${id}" style="${pos}">${trIco(n.icon || 'wallet')}${n.text || ''}</div>`;
    case 'box': return `<div class="tr-box" id="${id}" style="${pos}"></div>`;
    case 'label': return `<div class="tr-dlab" id="${id}" style="${pos}">${n.text}</div>`;
    case 'tap': return `<div class="tr-tap" id="${id}">${trIco('finger')}</div><div class="tr-rip" id="${id}r"></div>`;
    case 'stamp': return `<div class="tr-stamp ${n.cls || ''}" id="${id}" style="${pos};transform:rotate(${n.rot || -8}deg)">${n.text}</div>`;
    case 'strike': return `<div class="tr-strike" id="${id}" style="${pos};width:${n.w}px;transform:rotate(${n.rot || -4}deg) scaleX(0)"></div>`;
  }
  throw new Error('trail: unknown node kind ' + n.kind);
}
function trOver(p, o) {
  const ctr = o.n ? `<span class="ctr">${Array.from({ length: TR.of }, (_, i) => `<i id="${p}ovn${i}" class="${i < o.n - 1 ? 'on' : ''}"></i>`).join('')}</span>` : '';
  const chips = o.chips ? `<div class="ovk" id="${p}ovkw">${o.chips.map((k, i) => `<span class="tr-chip ${k.cls || 'gold'}" id="${p}ovk${i}" style="position:relative">${k.icon ? trIco(k.icon) : ''}${trImg(k.src)}${k.text}</span>`).join('')}</div>` : '';
  const coins = o.coins ? `<div class="coins">${Array.from({ length: o.coins }, (_, i) => `<i id="${p}ovc${i}"></i>`).join('')}</div>` : '';
  return `${chips}<div class="tr-ov" id="${p}ov">${ctr}<span class="eb">${o.eb}</span><b id="${p}ovh">${o.h1}</b>${o.sub ? `<span class="sb" id="${p}ovs">${o.sub}</span>` : ''}${coins}
    ${o.stamp ? `<span class="tr-ovstamp" id="${p}ovst" style="transform:rotate(-7deg)">${o.stamp}</span>` : ''}
    ${o.strike ? `<span class="tr-ovx" id="${p}ovx" style="left:${o.strike.x}px;top:${o.strike.y}px;width:${o.strike.w}px"></span>` : ''}</div>`;
}
function trNodeIn(B, c, n, i) {
  const id = c.p + n.b, kind = n.kind === 'strike' ? 'draw' : n.kind === 'months' || n.kind === 'dots' ? 'enter' : 'pop';
  const r = B.at(n.b, .1 + i * .06, .2 + i * .06, kind);
  if (n.kind === 'dots') {
    // the crowd fills in reading order over 0.8 s, then the gold ones light on their own beat (n.goldBeat)
    const g = n.goldBeat ? B.at(n.goldBeat, .6, .7, 'pop') : null;
    for (let k = 0; k < n.count; k++) {
      const q = seg(c.local, r.s + k * (.8 / n.count), r.s + k * (.8 / n.count) + .25), gold = (n.gold || []).includes(k);
      const gp = gold && g ? g.p : 1;
      st(id + 'd' + k, { opacity: String(cl(q * 2, 0, 1) * (gold && g ? .35 + .65 * gp : 1)), transform: 'scale(' + (.5 + .5 * bk(q)) * (gold && g ? 1 + .25 * pulse(gp) : 1) + ')',
        background: gold && g && gp < .5 ? '#2F4F42' : '' });
    }
    return r;
  }
  if (n.kind === 'months') {
    n.months.forEach((_, k) => pp(id + 'm' + k, seg(c.local, r.s + k * .32, r.s + k * .32 + BEAT.pop), .7));
    return r;
  }
  if (n.kind === 'tap') {
    // a finger glides to the target over the half second before the word, presses on it, then lifts away
    const r = B.at(n.b, .6, .7, 'pop'), s = r.s, g = seg(c.local, s - .5, s), pr = seg(c.local, s, s + .25), lift = seg(c.local, s + .9, s + 1.3);
    const x = lerp(n.from[0], n.to[0], eio(g)), y = lerp(n.from[1], n.to[1], eio(g)) + lift * 40;
    st(id, { left: x.toFixed(1) + 'px', top: y.toFixed(1) + 'px', opacity: String(cl(g * 3, 0, 1) * (1 - lift)), transform: 'scale(' + (1 - .18 * pulse(pr)).toFixed(4) + ')' });
    ripple(id + 'r', pr > 0 && pr < 1 ? seg(c.local, s, s + .6) : 0, n.to[0], n.to[1], 70);
    const t = n.press && el(c.p + n.press);
    if (t && pr > 0) { t.style.transform = (t.style.transform || '') + ' scale(' + (1 - .07 * pulse(pr)).toFixed(4) + ')'; if (pr >= 1) cls(t, 'gold', true); }
    return r;
  }
  if (n.kind === 'strike') { st(id, { transform: `rotate(${n.rot || -4}deg) scaleX(${eo(r.p).toFixed(4)})` }); return r; }
  if (n.kind === 'stamp') {
    const e = r.p, s = e < 1 ? 1.8 - .8 * eo(e) : 1;
    st(id, { opacity: String(cl(e * 3, 0, 1)), transform: `rotate(${n.rot || -8}deg) scale(${s.toFixed(4)})` });
    return r;
  }
  if (n.kind === 'row' || n.kind === 'tile' && !n.pop) { up(id, r.p, 30); if (n.kind === 'row' && r.p >= 1) cls(id, 'lit', true); return r; }
  pp(id, r.p, .7);
  return r;
}
defineTemplate('trail', {
  check: d => req(d, ['eyebrow', 'h1', 'h'], 'trail'),
  beats: d => baseBeats(d).concat(d.term ? ['term'] : [], (d.nodes || []).map(n => n.b), (d.nodes || []).filter(n => n.goldBeat).map(n => n.goldBeat),
    (d.edges || []).map(e => e.b), castBeats(d.cast, d.bubbles), d.over ? ['card', 'sub', 'x1', 'stamp'] : []),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw;
    const slots = Array.from({ length: TR.of }, (_, i) => `<i id="${p}cs${i}" class="${i < (d.n || 0) - (d.term ? 1 : 0) ? 'on' : ''}"></i>`).join('');
    const ctr = d.n != null ? `<div class="tr-ctr" id="${p}ctr">${slots}<b id="${p}ctn">${String(d.n).padStart(2, '0')}/${TR.of}</b></div>` : '';
    const t = d.term, tl = t ? Math.max(...t.text.split(/<br\s*\/?>/i).map(s => s.replace(/<[^>]+>/g, '').length)) : 0;
    const fsz = t ? (t.size || Math.min(170, Math.floor(1560 / tl))) : 0;
    const flash = t ? `<div class="tr-flash" id="${p}fl" style="top:${t.y || 700}px;font-size:${fsz}px"><small>${d.eyebrow}</small>${t.text}</div>` : '';
    const edges = (d.edges || []).map(e => `<svg class="tr-path" style="width:${w}px;height:${d.h}px" viewBox="0 0 ${w} ${d.h}"><path id="${p}${e.b}" class="${e.cls || ''}" d="${e.d}" pathLength="1"/></svg>
      ${Array.from({ length: e.coins || 0 }, (_, k) => `<div class="coin" id="${p}${e.b}c${k}">$</div>`).join('')}
      ${e.label ? `<div class="tr-elab" id="${p}${e.b}l" style="left:${e.label.x}px;top:${e.label.y}px">${e.label.text}</div>` : ''}`).join('');
    const nodes = (d.nodes || []).map(n => trNode(p, n)).join('');
    d._fs = fsz;
    return `${heading(p, d)}${ctr}${flash}<div class="content"><div class="rel" style="height:${d.h}px">${edges}${nodes}
      ${castBlock(p, d.cast, d.bubbles)}</div></div>${d.over ? trOver(p, d.over) : ''}`;
  },
  setup: (root, d, c) => {
    // coins follow their path: sample each path once (getPointAtLength) so frame() only interpolates
    d._pts = {};
    (d.edges || []).forEach(e => {
      const path = el(c.p + e.b); if (!path || !path.getTotalLength) return;
      const L = path.getTotalLength(), N = 60;
      d._pts[e.b] = Array.from({ length: N + 1 }, (_, i) => { const q = path.getPointAtLength(L * i / N); return [q.x, q.y]; });
    });
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    if (d.term) {
      // the counted term: huge in the middle, then up into the headline's place; the headline wipes in as it arrives
      const tb = B.at('term', .02, .1, 'pop', { focal: false });
      const nb = ['a1'].concat((d.nodes || []).map(n => n.b), (d.edges || []).map(e => e.b)).map(k => c.beats && c.beats[k] ? c.beats[k].s : 99).reduce((a, b) => Math.min(a, b), 99);
      const f0 = cl(Math.min(tb.s + TR.hold, nb - .15), tb.s + .55, 99), fly = seg(c.local, f0, f0 + TR.fly), fe = eio(fly);
      const fl = el(p + 'fl'), h1 = el(p + 'h1');
      if (fl && h1) {
        const dy = (h1.offsetTop + h1.offsetHeight / 2) - (fl.offsetTop + fl.offsetHeight / 2), k = c.grid.h1Size / d._fs;
        st(p + 'fl', { opacity: String(cl(tb.p * 3, 0, 1) * (1 - seg(fly, .25, .8))),
          transform: `translateY(${(dy * fe).toFixed(1)}px) scale(${((.8 + .2 * bk(tb.p)) * lerp(1, k, fe)).toFixed(4)})` });
      }
      up(p + 'eb', seg(c.local, f0 + .2, f0 + .55));
      h1In(p + 'h1', seg(c.local, f0 + TR.fly * .8, f0 + TR.fly * .8 + .7));   // after the flash has faded, so the word never shows twice
      const em = c.beats && c.beats.em; const h = el(p + 'h1');
      if (h) h.style.setProperty('--ul', eo(seg(c.local, em ? em.s : f0 + .6, (em ? em.s : f0 + .6) + BEAT.draw)).toFixed(3));
      // the coin slot for this way fills as the term arrives
      const land = seg(c.local, f0 + .35, f0 + .35 + BEAT.pop);
      const slot = el(p + 'cs' + (d.n - 1)); if (slot) { cls(slot, 'on', land > 0); st(slot, { transform: 'scale(' + (land > 0 ? .6 + .4 * bk(land) : 1).toFixed(4) + ')' }); }
      txt(p + 'ctn', String(land > 0 ? d.n : d.n - 1).padStart(2, '0') + '/' + TR.of);
      B.mark(f0);
    } else headIn(B, p);
    const ctr = el(p + 'ctr'), eb = el(p + 'eb');
    if (ctr && eb) { st(p + 'ctr', { top: (eb.offsetTop + (eb.offsetHeight - 24) / 2) + 'px' }); fd(p + 'ctr', seg(c.local, 0, .35)); }
    (d.edges || []).forEach((e, i) => {
      const r = B.at(e.b, .3 + i * .1, .4 + i * .1, 'draw');
      st(p + e.b, { strokeDasharray: e.cls === 'solid' ? `${r.p} 1` : '', opacity: String(cl(r.p * 3, 0, 1)) });
      if (e.label) pp(p + e.b + 'l', seg(c.local, r.s + .2, r.s + .2 + BEAT.pop), .7);
      const pts = d._pts && d._pts[e.b], per = e.period || TR.coinPeriod, n = e.coins || 0;
      for (let k = 0; k < n; k++) {
        const tt = c.local - r.e - k * per / n;
        if (!pts || tt < 0) { st(p + e.b + 'c' + k, { opacity: '0' }); continue; }
        const q = (tt % per) / per, j = q * (pts.length - 1), a = pts[Math.floor(j)], b = pts[Math.min(pts.length - 1, Math.floor(j) + 1)], f = j - Math.floor(j);
        st(p + e.b + 'c' + k, { left: lerp(a[0], b[0], f).toFixed(1) + 'px', top: lerp(a[1], b[1], f).toFixed(1) + 'px',
          opacity: String(Math.min(seg(q, 0, .12), 1 - seg(q, .86, 1))) });
      }
    });
    (d.nodes || []).forEach((n, i) => { if (n.kind !== 'tap') trNodeIn(B, c, n, i); });
    (d.nodes || []).forEach((n, i) => { if (n.kind === 'tap') trNodeIn(B, c, n, i); });
    castPlay(B, c, p, d.cast, d.bubbles);
    if (d.over) {
      const o = d.over, cb = B.at('card', .05, .12, 'enter', { focal: false });
      const r = el(c.id); if (r) r.classList.add('ovs');
      up(p + 'ov', cb.p, 60);
      const h = el(p + 'ovh'); if (h) h.style.setProperty('--ul', '1');
      if (o.sub) up(p + 'ovs', B.p('sub', .3, .4), 16);
      if (o.coins) for (let k = 0; k < o.coins; k++) pp(p + 'ovc' + k, seg(c.local, (c.beats && c.beats[o.coinBeat] ? c.beats[o.coinBeat].s : 1) + k * .07, (c.beats && c.beats[o.coinBeat] ? c.beats[o.coinBeat].s : 1) + k * .07 + BEAT.pop), .5);
      if (o.n) { const k = el(p + 'ovn' + (o.n - 1)), q = seg(c.local, cb.e, cb.e + BEAT.pop); if (k) { cls(k, 'on', q > 0); st(k, { transform: 'scale(' + (q > 0 ? .6 + .4 * bk(q) : 1).toFixed(4) + ')' }); } }
      const ov = el(p + 'ov'); if (ov && o.chips) st(p + 'ovkw', { top: (ov.offsetTop + ov.offsetHeight + 18) + 'px' });
      (o.chips || []).forEach((k, i) => { const b = c.beats && c.beats[k.beat]; pp(p + 'ovk' + i, b ? seg(c.local, b.s, b.s + BEAT.pop) : seg(c.local, cb.e + .3 + i * .3, cb.e + .6 + i * .3), .6); });
      if (o.strike) st(p + 'ovx', { transform: 'scaleX(' + eo(B.p('x1', .6, .7, 'draw')).toFixed(4) + ')' });
      if (o.stamp) { const s = B.p('stamp', .6, .7, 'pop'); st(p + 'ovst', { opacity: String(cl(s * 3, 0, 1)), transform: `rotate(-7deg) scale(${(s < 1 ? 1.8 - .8 * eo(s) : 1).toFixed(4)})` }); }
    }
    footIn(B, p); holdLife(B, p, d);
  }
});
