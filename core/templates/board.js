/* The board family (projects/what-makes-computer-faster, core/styles/board.css): the inside of a laptop as one
   motherboard the whole deck returns to. Three sockets (1 CPU, 2 RAM, 3 storage) joined by gold traces; parts seat on
   the word that names them; data is a glowing pulse running storage → RAM → CPU; a slow part flushes rose and the
   pulses queue at it. A camera moves between parts (cam0 → cam, clamped so the board never shows its edge).

   data (all optional except eyebrow/h1):
     mode: 'board' (default) | 'laptops'
     board mode:
       nums: true                 socket numbers + "?" until seated (beats s1 s2 s3 light the sockets in turn)
       seated: ['cpu','ram','ssd'] parts already in place when the slide opens
       seat: 'cpu'|'ram'|'ssd'     the part that drops in on its own beat (beat name = the part)
       lit: ['ram']                sockets glowing from the start (beat name = the part, if listed in `seat` it pops)
       cam0, cam: 'all'|'cpu'|'ram'|'ssd'   camera move over the first .9 s (cam0 defaults to cam)
       qm: 'ram'                   a "?" badge over that part on its beat
       part2: {text, on}           a pill over the RAM socket on beat `on`
       trace: true                 every trace pulses from the `trace` beat
       ops: true                   pulses fire out of the CPU from the `ops` beat
       pulse: {beat}               a pulse route storage → RAM → CPU from `beat`
       apps: [{src}]               app tiles fly storage → RAM on beat `ap`
       pin: {text, icon, beat, acc, x, y, w}   one chip pinned on the board's lower edge, on its beat (os, lock)
       alias: {beat: id-suffix}     what the hold's hero ring circles, when the beat name is not an element id
       storage: 'ssd'|'both'       'both' shows an HDD platter (beat k1) beside the SSD (beat k2)
       extras: true                GPU slot (k1), fan (k2), software chip (k3) on the board's lower edge
       cases: [{text, small, part, hot}]   bottleneck tracker: case n enters on c<n>, its part flushes on x<n>
       chips: [{text, small, icon, tag, cls, beat}]   panel chips under the board (one row of up to three, or stacked)
       cast, bubbles               the alive kit's characters (beats a1.. b1..)
     laptops mode: laptops: [{name, tag, small}], eq: true (x1 strikes = to ≠), cast, bubbles
     bottle / ddr / dual modes (part 2): see the block above bdHeight
   beats: board s1 s2 s3 cpu ram ssd trace ops t1 ap os lock f1 k1..k3 c1..c3 x1..x3 lap1 lap2 a1.. b1.. */
const BD = { W: 880, H: 600, gap: 36, chipH: 112, chipStep: 128 };
const BD_PART = {
  cpu: { x: 40, y: 60, w: 280, h: 280, c: '--blue', acc: 'b', lbl: 'CPU' },
  ram: { x: 350, y: 40, w: 160, h: 340, c: '--teal', acc: 't', lbl: 'RAM' },
  ssd: { x: 560, y: 100, w: 290, h: 220, c: '--amber', acc: 'a', lbl: 'STORAGE' },
};
const BD_CAM = { all: { x: 440, y: 300, s: 1 }, cpu: { x: 180, y: 200, s: 1.32 }, ram: { x: 430, y: 210, s: 1.32 }, ssd: { x: 705, y: 210, s: 1.32 } };
// storage → RAM → CPU, the way a file travels when it is opened
const BD_ROUTE = [[705, 210], [535, 210], [430, 210], [335, 210], [180, 200]];
const BD_OPS = [[[180, 200], [180, 380], [180, 470]], [[180, 200], [335, 120], [350, 120]], [[180, 200], [40, 200], [20, 200]], [[180, 200], [180, 60], [180, 20]]];
const BD_ICON = {
  gpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="9" cy="12" r="3"/><circle cx="16" cy="12" r="3"/><path d="M5 18v3M9 18v3"/></svg>',
  fan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="2.2"/><path d="M12 9.8C12 6 13.5 3 16 3.5c2.4.5 1.5 4.5-2.2 6.8M14.2 12c3.8 0 6.8 1.5 6.3 4-.5 2.4-4.5 1.5-6.8-2.2M12 14.2c0 3.8-1.5 6.8-4 6.3-2.4-.5-1.5-4.5 2.2-6.8M9.8 12C6 12 3 10.5 3.5 8c.5-2.4 4.5-1.5 6.8 2.2"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg>',
};
const bdUse = n => `<svg class="ic" viewBox="0 0 24 24"><use href="#i-${n}"/></svg>`;
function bdAcc(a) { return ACCENT_VAR[a] ? `--acc:var(${ACCENT_VAR[a]})` : ''; }
/* a point at fraction k (0..1) along a polyline */
function bdAlong(pts, k) {
  const seglen = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seglen.push(l); tot += l; }
  let d = cl(k, 0, 1) * tot;
  for (let i = 0; i < seglen.length; i++) {
    if (d <= seglen[i] || i === seglen.length - 1) { const f = seglen[i] ? cl(d / seglen[i], 0, 1) : 0; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; }
    d -= seglen[i];
  }
  return pts[pts.length - 1];
}
function bdCamXf(name) {
  const c = BD_CAM[name || 'all'] || BD_CAM.all, s = c.s;
  const tx = cl(BD.W / 2 - c.x * s, BD.W - BD.W * s, 0), ty = cl(BD.H / 2 - c.y * s, BD.H - BD.H * s, 0);
  return { tx, ty, s };
}
function bdTraces() {
  const P = [];
  [120, 160, 200, 240, 280].forEach(y => P.push(`<path d="M320 ${y} H350"/>`));
  [170, 210, 250].forEach(y => P.push(`<path d="M510 ${y} H560"/>`));
  [110, 180, 250].forEach(x => P.push(`<path class="thin" d="M${x} 340 V${x === 180 ? 470 : 430} H${x === 180 ? 180 : x + 30}"/>`));
  [650, 710, 770].forEach(x => P.push(`<path class="thin" d="M${x} 320 V420 H${x + 40}"/>`));
  P.push('<path class="thin" d="M430 380 V470 H530"/>', '<path class="thin" d="M40 200 H20"/>', '<path class="thin" d="M180 60 V20"/>', '<path class="thin" d="M350 120 H335"/>');
  const vias = [[20, 200], [180, 20], [140, 430], [280, 430], [180, 470], [530, 470], [690, 420], [750, 420], [810, 420], [335, 120]]
    .map(v => `<circle cx="${v[0]}" cy="${v[1]}" r="7"/>`).join('');
  return `<svg class="bd-traces" width="${BD.W}" height="${BD.H}" viewBox="0 0 ${BD.W} ${BD.H}">${P.join('')}${vias}</svg>`;
}
function bdPartHtml(p, k, d) {
  const g = BD_PART[k];
  if (k === 'cpu') {
    const pins = [];
    for (let i = 0; i < 8; i++) {
      const o = 30 + i * 26;
      pins.push(`<i class="pin" style="left:${o}px;top:-12px;width:10px;height:14px"></i>`, `<i class="pin" style="left:${o}px;bottom:-12px;width:10px;height:14px"></i>`,
        `<i class="pin" style="top:${o}px;left:-12px;width:14px;height:10px"></i>`, `<i class="pin" style="top:${o}px;right:-12px;width:14px;height:10px"></i>`);
    }
    return `<div class="bd-cpu" id="${p}cpu" style="left:${g.x + 20}px;top:${g.y + 20}px;width:${g.w - 40}px;height:${g.h - 40}px">${pins.join('')}<div class="die">CPU</div></div>`;
  }
  if (k === 'ram') {
    const stick = (i) => `<div class="bd-dimm" id="${p}ram${i}" style="left:${g.x + 20 + i * 68}px;top:${g.y + 14}px;width:54px;height:${g.h - 28}px">
      ${[0, 1, 2, 3].map(j => `<i style="top:${18 + j * 72}px;height:56px"></i>`).join('')}<b></b></div>`;
    return `<div id="${p}ram" style="position:absolute;left:0;top:0;opacity:0">${stick(0)}${stick(1)}</div>`;
  }
  if (d.storage === 'both') {
    return `<div class="bd-plat" id="${p}hdd" style="left:${g.x + 16}px;top:${g.y + 32}px;width:156px;height:156px"><i class="arm" style="transform:rotate(-35deg)"></i></div>
      <div class="bd-ssd" id="${p}ssdc" style="left:${g.x + 184}px;top:${g.y + 60}px;width:92px;height:100px;padding:0 10px;justify-content:center"><i style="width:60px;height:60px"></i></div>
      <span id="${p}ssd" style="position:absolute;left:0;top:0;opacity:0"></span>`;
  }
  return `<div class="bd-ssd" id="${p}ssd" style="left:${g.x + 20}px;top:${g.y + 50}px;width:${g.w - 40}px;height:${g.h - 100}px"><i></i><i></i><b>SSD</b></div>`;
}
function bdBoard(p, d) {
  const socks = ['cpu', 'ram', 'ssd'].map((k, i) => {
    const g = BD_PART[k];
    return `<div class="bd-sock" id="${p}sk${k}" style="left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h}px;--acc:var(${g.c})">
      ${d.nums ? `<span class="no">${i + 1}</span><span class="q" id="${p}q${k}">?</span>` : ''}</div>`;
  }).join('');
  const parts = ['cpu', 'ram', 'ssd'].filter(k => (d.seated || []).includes(k) || d.seat === k || (k === 'ssd' && d.storage === 'both'))
    .map(k => bdPartHtml(p, k, d)).join('');
  const lbls = ['cpu', 'ram', 'ssd'].map(k => {
    const g = BD_PART[k];
    return `<span class="bd-lbl ${g.acc}" id="${p}lb${k}" style="left:${g.x}px;top:${g.y + g.h + 10}px;width:${g.w}px;text-align:center">${g.lbl}</span>`;
  }).join('');
  const hots = ['cpu', 'ram', 'ssd'].map(k => {
    const g = BD_PART[k], cs = (d.cases || []).find(c => c.part === k);
    return cs ? `<div class="bd-hot" id="${p}hot${k}" style="left:${g.x - 8}px;top:${g.y - 8}px;width:${g.w + 16}px;height:${g.h + 16}px"><b>${cs.hot}</b></div>` : '';
  }).join('');
  const extras = d.extras ? `
    <div class="bd-x" id="${p}k1" style="left:50px;top:490px;width:300px;height:84px;color:var(--tx)"><span style="color:var(--violet)">${BD_ICON.gpu}</span>GPU</div>
    <div class="bd-fan" id="${p}k2" style="left:380px;top:474px;width:112px;height:112px;color:var(--violet)">${BD_ICON.fan}</div>
    <div class="bd-x" id="${p}k3" style="left:530px;top:490px;width:310px;height:84px"><span style="color:var(--violet)">${BD_ICON.code}</span>Software</div>` : '';
  const pulses = Array.from({ length: 5 }, (_, i) => `<i class="bd-pulse" id="${p}pl${i}"></i>`).join('') +
    BD_OPS.map((_, i) => `<i class="bd-pulse" id="${p}op${i}" style="--pc:var(--blue)"></i>`).join('');
  const apps = (d.apps || []).map((a, i) => `<span class="bd-app" id="${p}ap${i}"><img src="${a.src}" alt=""></span>`).join('');
  const qm = d.qm ? `<span class="bd-qm" id="${p}qm" style="left:${BD_PART[d.qm].x + BD_PART[d.qm].w / 2 - 44}px;top:${BD_PART[d.qm].y + BD_PART[d.qm].h / 2 - 44}px">?</span>` : '';
  const part2 = d.part2 ? `<span class="bd-part2" id="${p}part2" style="left:${BD_PART.ram.x - 40}px;top:${BD_PART.ram.y + 120}px">${d.part2.text}</span>` : '';
  const holes = [[18, 18], [BD.W - 48, 18], [18, BD.H - 48], [BD.W - 48, BD.H - 48]].map(h => `<i class="bd-hole" style="left:${h[0]}px;top:${h[1]}px"></i>`).join('');
  return `<div class="bd-pcb" id="${p}board" style="width:${BD.W}px;height:${BD.H}px">${holes}
    <div class="bd-world" id="${p}world" style="width:${BD.W}px;height:${BD.H}px">${bdTraces()}${socks}${parts}${lbls}${extras}${hots}${pulses}${apps}${qm}${part2}${bdP3Html(p, d)}</div></div>`;
}
function bdChips(p, d, y0) {
  const ch = d.chips || [], n = ch.length, row = n === 3 || d.chipRow;
  const w = row ? Math.floor((BD.W - (n - 1) * 20) / n) : BD.W;
  return ch.map((c, i) => {
    const x = row ? i * (w + 20) : 0, y = row ? y0 : y0 + i * BD.chipStep;
    return `<div class="bd-chip ${c.cls || ''}" id="${p}${c.beat || 'k' + (i + 1)}" style="left:${x}px;top:${y}px;width:${w}px;${bdAcc(c.acc || d.accent)}${row ? ';justify-content:center;padding:0 26px;font-size:32px;gap:12px' : ''}">
      ${c.icon ? (typeof P4_ICON !== 'undefined' && P4_ICON[c.icon] ? p4Ic(c.icon) : bdUse(c.icon)) : ''}${c.src ? `<img src="${c.src}" alt="" style="width:44px;height:44px">` : ''}<span>${c.text}${c.small ? `<br><small>${c.small}</small>` : ''}</span>
      ${c.tag ? `<span class="tag" id="${p}${c.beat || 'k' + (i + 1)}tg">${c.tag}</span>` : ''}</div>`;
  }).join('');
}
function bdCases(p, d, y0) {
  const n = (d.cases || []).length, w = Math.floor((BD.W - (n - 1) * 20) / n);
  return (d.cases || []).map((c, i) => `<div class="bd-chip bad" id="${p}c${i + 1}" style="left:${i * (w + 20)}px;top:${y0}px;width:${w}px;height:120px;flex-direction:column;
    justify-content:center;align-items:flex-start;gap:2px;padding:0 22px"><small>Case ${i + 1}</small><span>${c.text}</span></div>`).join('');
}
function bdLaptops(p, d) {
  const L = d.laptops, w = 370, h = 270, xs = [0, BD.W - w];
  const laps = L.map((l, i) => `<div class="bd-lap" id="${p}lap${i + 1}" style="left:${xs[i]}px;top:0;width:${w}px;height:${h}px">
      <div class="scr"><b>${l.name}</b></div><div class="base"></div></div>
    <div class="bd-tag" id="${p}tg${i + 1}" style="left:${xs[i] + 20}px;top:${h + 24}px;width:${w - 40}px"><span>${l.tag}</span><small>${l.small || ''}</small></div>`).join('');
  const eq = d.eq ? `<div class="bd-eq${d.eqText ? ' txt' : ''}" id="${p}eq" style="left:${w}px;top:70px;width:${BD.W - 2 * w}px">${d.eqText || '='}<i class="x" id="${p}x1"></i></div>` : '';
  return laps + eq;
}
/* ---------- part 2 (projects/what-makes-laptop-faster-2): three more modes on the same board family ----------
   bottle: his water-bottle analogy, drawn. Two bottles upside down over two bowls: the body is the RAM (how much water),
     the neck is the CPU (how fast it can leave). data.bottles [{tag, body}] (body = relative size), data.on {key: beat}
     names the beat each element waits for (show tags ram cpu p1 p2 cut m1 m2 eq); data.pre lists the ones already there.
     data.meters [{text}], data.wide: true = bottle 2's neck already cut wide.
     part 5: data.solo = one bottle, centred, at bottle 2's size; on.fill = the water rises from the neck to the brim
     between show and that beat; data.pill {text, beat} = a callback pill top left; data.wait [{src}] + on.wait = app
     tiles queue beside the bottle with a "?" (no room left). data.parts {ram: {text, small}, cpu: {text, small}} (solo):
     the body carries memory chips and a callout on on.ram, the mouth becomes a CPU chip with a callout on on.cpu.
   ddr: two DIMM rows racing to their bandwidth. data.rows [{name, val, unit, max}] (beats r1 r2 bar), chips k1 k2.
   dual: one stick on one lane vs two sticks on two lanes into the CPU. data.panels [{title, sticks, lanes}]
     (beats one two lanes), data.tag {text} on k1. */
const BTL = { W: 880, H: 760, cx: [230, 650], bodyH: [250, 320], bodyW: [190, 250], bot: 400, sh: 452, neck: 492, bowlY: 600, nw: 46, nwWide: 120 };
function btPath(cx, top, bw, nw) {
  const r = 30, L = cx - bw / 2, R = cx + bw / 2, nl = cx - nw / 2, nr = cx + nw / 2;
  return `M${L + r},${top} H${R - r} Q${R},${top} ${R},${top + r} V${BTL.bot} C${R},${BTL.bot + 34} ${nr},${BTL.bot + 26} ${nr},${BTL.sh} V${BTL.neck} ` +
    `H${nl} V${BTL.sh} C${nl},${BTL.bot + 26} ${L},${BTL.bot + 34} ${L},${BTL.bot} V${top + r} Q${L},${top} ${L + r},${top} Z`;
}
const btI = (d, i) => d.solo ? 1 : i;
const btCx = (d, i) => d.solo ? BTL.W / 2 : BTL.cx[i];
function btHtml(p, d) {
  const bs = d.bottles || [{ tag: '16GB' }, { tag: '32GB' }];
  const svgs = bs.map((b, i) => {
    const cx = btCx(d, i), top = BTL.bot - BTL.bodyH[btI(d, i)], bw = BTL.bodyW[btI(d, i)];
    return `<svg class="bt-svg" width="${BTL.W}" height="${BTL.H}" viewBox="0 0 ${BTL.W} ${BTL.H}" style="position:absolute;left:0;top:0">
      <defs><clipPath id="${p}bc${i}"><path id="${p}bcp${i}" d="${btPath(cx, top, bw, BTL.nw)}"/></clipPath>
      <clipPath id="${p}wc${i}"><path d="M${cx - 150},${BTL.bowlY} Q${cx},${BTL.bowlY + 150} ${cx + 150},${BTL.bowlY} Z"/></clipPath></defs>
      <path class="bt-glass" id="${p}bg${i}" d="${btPath(cx, top, bw, BTL.nw)}"/>
      ${d.parts ? btDimm(p, cx, top, bw) : ''}
      <rect class="bt-water" id="${p}bw${i}" clip-path="url(#${p}bc${i})" x="${cx - bw / 2 - 4}" y="${top + 40}" width="${bw + 8}" height="${BTL.neck - top}"/>
      <path class="bt-line" id="${p}bl${i}" d="${btPath(cx, top, bw, BTL.nw)}"/>
      <rect class="bt-cap" id="${p}nk${i}" x="${cx - BTL.nw / 2 - 8}" y="${BTL.sh - 4}" width="${BTL.nw + 16}" height="${BTL.neck - BTL.sh + 8}" rx="10"/>
      <rect class="bt-water" id="${p}bo${i}" clip-path="url(#${p}wc${i})" x="${cx - 150}" y="${BTL.bowlY + 80}" width="300" height="80"/>
      <path class="bt-bowl" d="M${cx - 160},${BTL.bowlY} Q${cx},${BTL.bowlY + 160} ${cx + 160},${BTL.bowlY}"/><path class="bt-rim" d="M${cx - 172},${BTL.bowlY} H${cx + 172}"/>
    </svg>
    <i class="bt-stream" id="${p}st${i}" style="left:${cx - 12}px;top:${BTL.neck}px;height:${BTL.bowlY - BTL.neck + 30}px;width:24px"></i>
    ${b.tag ? '' : '<!--'}<span class="bt-tag" id="${p}tg${i}" style="left:${cx - 110}px;top:${top - 76}px;width:220px">${b.tag}</span>${b.tag ? '' : '-->'}
    ${(d.meters || [])[i] ? `<span class="bt-meter ${d.meters[i].cls || ''}" id="${p}m${i}" style="left:${cx - 170}px;top:${BTL.bowlY + 96}px;width:340px">${d.meters[i].text}</span>` : ''}`;
  }).join('');
  const lbl = (k, y, txt, c) => `<div class="bt-lbl" id="${p}lb${k}" style="top:${y}px;--acc:var(${c})"><i class="l"></i><b>${txt}</b><i class="r"></i></div>`;
  return `<div class="bt" style="position:absolute;left:0;top:0;width:${BTL.W}px;height:${BTL.H}px">${svgs}
    ${d.parts ? btParts(p, d) : lbl('ram', 230, 'RAM', '--teal') + lbl('cpu', BTL.sh + 2, 'CPU', '--blue')}
    ${d.eq ? `<b class="bt-eq" id="${p}eq" style="top:${BTL.bowlY + 92}px">${d.eq}</b>` : ''}
    ${d.pill ? `<span class="bd-part2" id="${p}pill" style="left:0;top:40px">${d.pill.text}</span>` : ''}
    ${(d.wait || []).map((a, j) => `<span class="bd-app" id="${p}wt${j}" style="left:${BTL.W - 70}px;top:${110 + j * 104}px"><img src="${a.src}" alt=""></span>`).join('')}
    ${(d.wait || []).length ? `<span class="bd-qm" id="${p}wq" style="left:${BTL.W - 160}px;top:${110 + d.wait.length * 104}px">?</span>` : ''}</div>`;
}
// part 5: the body drawn as a memory stick (chips + gold pins behind the water), the mouth as a processor
function btDimm(p, cx, top, bw) {
  const cw = 62, ch = 64, gx = 24, x0 = cx - cw - gx / 2, ys = [top + 40, top + 120, top + 200];
  const chips = ys.flatMap(y => [x0, x0 + cw + gx].map(x => `<rect class="bt-ram" x="${x}" y="${y}" width="${cw}" height="${ch}" rx="6"/>`)).join('');
  return `<g class="bt-dimm" id="${p}dm">${chips}<rect class="bt-pins" x="${cx - bw / 2 + 34}" y="${BTL.bot - 46}" width="${bw - 68}" height="16"/></g>`;
}
function btParts(p, d) {
  const cx = BTL.W / 2, top = BTL.bot - BTL.bodyH[1], bw = BTL.bodyW[1];
  const part = (k, y, to, acc) => { const q = d.parts[k]; return `<div class="bt-part" id="${p}lb${k}" style="top:${y - 34}px;--acc:var(${acc})">
    <div class="rw" style="width:${to}px"><b>${q.text}</b><i class="ld"></i></div><small>${q.small || ''}</small></div>`; };
  const pins = Array.from({ length: 4 }, (_, j) => `<i style="top:${10 + j * 14}px"></i>`).join('');
  return part('ram', (top + BTL.bot) / 2, cx - bw / 2 - 6, '--teal') + part('cpu', (BTL.sh + BTL.neck) / 2, cx - 62, '--blue') +
    `<div class="bt-chip" id="${p}chip" style="left:${cx - 54}px;top:${(BTL.sh + BTL.neck) / 2 - 38}px"><span class="pl">${pins}</span><span class="pr">${pins}</span><b>CPU</b></div>`;
}
function btFrame(B, c, p, d) {
  const t = c.local, on = d.on || {}, pre = d.pre || [];
  const at = (k, a, b, kind) => pre.includes(k) ? { p: 1, s: -9 } : on[k] ? B.at(on[k], a, b, kind || 'enter') : { p: 0, s: 1e9 };
  const show = at('show', .05, .2), tags = at('tags', .2, .3, 'pop'), ram = at('ram', .3, .4, 'pop'), cpu = at('cpu', .45, .55, 'pop');
  const cut = d.wide ? { p: 1, s: -9 } : at('cut', .4, .5, 'pop');
  const bs = d.bottles || [{}, {}];
  bs.forEach((_, i) => {
    const sv = el(p + 'bg' + i) && el(p + 'bg' + i).ownerSVGElement;
    if (sv) { const k = cl(show.p * 1.4 - i * .25, 0, 1); sv.style.opacity = String(eo(k)); sv.style.transform = `translateY(${((1 - eo4(k)) * 40).toFixed(1)}px)`; }
    pp(p + 'tg' + i, i ? seg(t, tags.s + .15, tags.s + .15 + BEAT.pop) : tags.p, .6);
    // the neck: bottle 2's is cut wide on its beat (the new processor)
    const nw = i === 1 ? lerp(BTL.nw, BTL.nwWide, eo(cut.p)) : BTL.nw, cx = btCx(d, i), top = BTL.bot - BTL.bodyH[btI(d, i)];
    const dd = btPath(cx, top, BTL.bodyW[btI(d, i)], nw);
    ['bg', 'bl', 'bcp'].forEach(k => { const e = el(p + k + i); if (e) e.setAttribute('d', dd); });
    const nk = el(p + 'nk' + i); if (nk) { nk.setAttribute('x', (cx - nw / 2 - 8).toFixed(1)); nk.setAttribute('width', (nw + 16).toFixed(1)); nk.style.opacity = String(cl(cpu.p * 2, 0, 1)); }
    // pour: the stream is as wide as the neck lets it be; the bottle drains and the bowl fills at that rate
    const pr = at('p' + (i + 1), .3 + i * .2, .4 + i * .2), rate = nw / BTL.nw, sw = nw * .55;
    const run = Math.max(0, t - pr.s), flow = pr.p >= 0 && run > 0 ? cl(run / .35, 0, 1) : 0;
    st(p + 'st' + i, { opacity: String(flow.toFixed(3)), width: sw.toFixed(1) + 'px', left: (cx - sw / 2).toFixed(1) + 'px',
      backgroundPosition: '0 ' + ((t * 520) % 1000).toFixed(1) + 'px' });
    const drained = cl(run * rate * .035, 0, .55), bw = el(p + 'bw' + i);
    if (bw && on.fill) {
      // part 5: the water climbs from the neck to the brim, finishing on the fill beat
      const fl = B.at(on.fill, .5, .6, 'pop'), fp = cl((t - show.s - .3) / Math.max(.6, fl.s + .3 - show.s - .3), 0, 1);
      bw.setAttribute('y', lerp(BTL.neck, top + 2, eo(fp)).toFixed(1));
    } else if (bw) bw.setAttribute('y', (top + 40 + drained * (BTL.bot - top)).toFixed(1));
    const bo = el(p + 'bo' + i); if (bo) bo.setAttribute('y', (BTL.bowlY + 80 - cl(run * rate * 16, 0, 72)).toFixed(1));
    if ((d.meters || [])[i]) pp(p + 'm' + i, at('m' + (i + 1), .6, .7, 'pop').p, .6);
  });
  if (d.parts) { st(p + 'dm', { opacity: String(cl(ram.p * 2, 0, 1)) }); pp(p + 'chip', cpu.p, .5); }
  ['ram', 'cpu'].forEach((k, j) => { const r = j ? cpu : ram; st(p + 'lb' + k, { opacity: String(cl(r.p * 2.5, 0, 1)), transform: `scale(${(.7 + .3 * bk(cl(r.p, 0, 1))).toFixed(4)})` }); });
  if (d.eq) pp(p + 'eq', at('eq', .6, .7, 'pop').p, .4);
  if (d.pill) pp(p + 'pill', B.p(d.pill.beat, .1, .2, 'pop'), .5);
  if ((d.wait || []).length) {
    const w = at('wait', .7, .8, 'enter');
    d.wait.forEach((_, j) => {
      const q = seg(t, w.s + j * .15, w.s + j * .15 + .4), bob = Math.sin(t * 8 + j * 1.7) * 5 * cl((t - w.s) * 2, 0, 1);
      st(p + 'wt' + j, { opacity: String(cl(q * 3, 0, 1)), transform: `translateY(${(bob + (1 - eo4(q)) * 40).toFixed(1)}px)` });
    });
    pp(p + 'wq', seg(t, w.s + .5, w.s + .5 + BEAT.pop), .4);
  }
}
const BDDR = { W: 880, rowH: 170, rowStep: 200, dimW: 300 };
function ddrHtml(p, d) {
  const rows = (d.rows || []).map((r, i) => {
    const y = i * BDDR.rowStep;
    const chips = Array.from({ length: 6 }, (_, j) => `<i style="left:${18 + j * 46}px"></i>`).join('');
    return `<div class="dd-row" id="${p}r${i + 1}" style="top:${y}px;height:${BDDR.rowH}px;--acc:var(${r.c || '--amber'})">
      <div class="dd-dimm" style="width:${BDDR.dimW - 30}px">${chips}<b class="pins"></b></div>
      <div class="dd-side"><span class="nm">${r.name}<small>${r.small || ''}</small></span><span class="vl" id="${p}vl${i}">0</span>
        <div class="dd-track"><i class="dd-fill" id="${p}fl${i}" style="width:${(100 * r.val / r.max).toFixed(1)}%"></i></div></div></div>`;
  }).join('');
  const n = (d.rows || []).length, y0 = n * BDDR.rowStep;
  const note = d.note ? `<span class="dd-note" id="${p}nt" style="top:${y0 - 14}px">${d.note}</span>` : '';
  return rows + note + bdChips(p, Object.assign({}, d, { chipRow: true }), y0 + 40);
}
function ddrFrame(B, c, p, d) {
  const t = c.local;
  const g = (d.rows || []).map((_, i) => B.at('r' + (i + 1), .1 + i * .15, .2 + i * .15, 'enter'));
  g.forEach((r, i) => up(p + 'r' + (i + 1), r.p, 30));
  const bar = B.at('bar', .4, .6, 'bar', { len: 1.4 });
  (d.rows || []).forEach((r, i) => {
    // both bars climb at the same speed, so DDR5 keeps climbing after DDR4 has stopped
    const f = cl((t - bar.s) / (1.8 * r.val / r.max), 0, 1);
    st(p + 'fl' + i, { transform: 'scaleX(' + eo(f).toFixed(4) + ')' });
    txt(p + 'vl' + i, (r.val * eo(f)).toFixed(r.dp != null ? r.dp : 1) + ' ' + (r.unit || 'GB/s'));
  });
  if (d.note) up(p + 'nt', seg(t, bar.s + .6, bar.s + 1), 10);
  (d.chips || []).forEach((ch, i) => up(p + (ch.beat || 'k' + (i + 1)), B.p(ch.beat || 'k' + (i + 1), .6 + i * .12, .72 + i * .12, 'enter'), 20));
}
const BDU = { W: 880, panH: 250, step: 280 };
function duHtml(p, d) {
  const pan = (d.panels || []).map((pn, i) => {
    const y = i * BDU.step, n = pn.sticks || 1, L = pn.lanes || 1;
    const sticks = Array.from({ length: n }, (_, j) => `<div class="du-stick" style="left:${36 + j * 74}px"></div>`).join('');
    const ly = L === 1 ? [140] : [112, 176];
    const lanes = ly.map((yy, j) => `<i class="du-lane" id="${p}ln${i}${j}" style="top:${yy}px"></i>` +
      Array.from({ length: 4 }, (_, k) => `<i class="bd-pulse du-pl" id="${p}pl${i}${j}${k}" style="top:${yy}px"></i>`).join('')).join('');
    return `<div class="du-pan" id="${p}${i ? 'two' : 'one'}" style="top:${y}px;height:${BDU.panH}px;--acc:var(${pn.c || '--violet'})">
      <span class="ttl">${pn.title}</span>${sticks}${lanes}<div class="du-cpu">CPU</div></div>`;
  }).join('');
  const y0 = (d.panels || []).length * BDU.step;
  return pan + (d.tag ? `<div class="du-tag" id="${p}k1" style="top:${y0 + 10}px">${d.tag.text}</div>` : '');
}
function duFrame(B, c, p, d) {
  const t = c.local;
  const one = B.at('one', .05, .2), two = B.at('two', .25, .4), lanes = B.at('lanes', .45, .55, 'pop');
  up(p + 'one', one.p, 30); up(p + 'two', two.p, 30);
  (d.panels || []).forEach((pn, i) => {
    const L = pn.lanes || 1, s0 = i ? lanes.s : one.s + .4;
    for (let j = 0; j < L; j++) {
      cls(p + 'ln' + i + j, 'lit', t >= s0);
      for (let k = 0; k < 4; k++) {
        const id = p + 'pl' + i + j + k;
        if (t < s0) { st(id, { opacity: '0' }); continue; }
        const q = (((t - s0) / 1.6 - k / 4 - j * .12) % 1 + 1) % 1, x = lerp(250, 660, q);
        st(id, { opacity: String((Math.min(1, seg(t, s0, s0 + .2)) * (1 - seg(q, .9, 1))).toFixed(3)), left: x.toFixed(1) + 'px' });
      }
    }
  });
  if (d.tag) pp(p + 'k1', B.p('k1', .7, .8, 'pop'), .6);
}
/* ---------- part 3 (projects/what-makes-laptop-faster-3): the CPU, five more modes on the same board family ----------
   clock: the CPU package with a square-wave clock running out of it into a scope. data.scope (label, beat k1, the wave
     on beat `wave`), data.count {to, unit} rolls on beat `n`. data.heat {label, from, to} swaps the counter for a
     temperature bar (beat `heat`) and slows the wave on x1 (thermal throttling), the readout swapping from → to.
   ipc: two lanes of work per tick. data.lanes [{name, small, per, period, c}] (lane 1 at once, lane 2 on r1), a "?" on q,
     work-done bars racing from `bar`, chips k1 k2 stacked under them.
   cores: a die of core tiles, each a worker. data.cores (8), lit on w (1), two (2), eight (all); data.tasks chips k1..k3.
     data.fewer: x1 dims every core but the first, k1 brings a panel of four bigger cores (data.big {title, tag}).
   arch: one row per chip family: logo tile, name, a die drawing; rows on k1..k3, "≠" badges between them on x1.
     data.chips [{logo, name, small, die: 'hybrid'|'tiles'|'soc'}]
   recap: two struck chips (x1 x2) then a checklist whose terms flash big as they are said (t1..tn) and land in their row.
   board mode, part 3 options: cache {text} (beat cache; quick pulses CPU ↔ cache from `pulse`; x1 greys the long RAM trip),
     fan (a fan beside the CPU on k1), camOn (the camera move waits for that beat). laptops: eqText replaces "=". */
const BCK = { W: 880, H: 600, cpu: 220, scopeX: 270, scopeY: 30, scopeW: 610, scopeH: 230, per: 64 };
function ckWave(w, h, per) {
  let d = `M0 ${h * .75}`;
  for (let x = 0; x < w; x += per) d += ` H${x + per / 2} V${h * .25} H${x + per} V${h * .75}`;
  return d;
}
function ckHtml(p, d) {
  const cpu = `<div class="ck-cpu" id="${p}cpuc" style="left:0;top:${BCK.scopeY + 5}px;width:${BCK.cpu}px;height:${BCK.cpu}px"><div class="die">CPU</div><i class="led" id="${p}led"></i></div>`;
  const W = BCK.scopeW + BCK.per * 6;
  const scope = `<div class="ck-scope" id="${p}wave" style="left:${BCK.scopeX - 20}px;top:${BCK.scopeY}px;width:${BCK.scopeW}px;height:${BCK.scopeH}px">
      <svg width="${W}" height="${BCK.scopeH}" viewBox="0 0 ${W} ${BCK.scopeH}" id="${p}wsvg" style="position:absolute;left:0;top:0;overflow:visible">
        <path d="${ckWave(W, BCK.scopeH, BCK.per)}" id="${p}wp"/></svg><span class="ck-rd" id="${p}ghz">${d.readout || '4.2 GHz'}</span></div>`;
  const lbl = d.scope ? `<div class="bd-chip" id="${p}k1" style="left:${BCK.scopeX - 20}px;top:${BCK.scopeY + BCK.scopeH + 26}px;width:${BCK.scopeW}px;height:96px;justify-content:center;${bdAcc(d.accent)}">${bdUse('clock')}<span>${d.scope}</span></div>` : '';
  let low = '';
  if (d.count) low = `<div class="ck-count" id="${p}n" style="top:${BCK.scopeY + BCK.scopeH + 150}px"><b id="${p}nv">0</b><small>${d.count.unit}</small></div>`;
  if (d.heat) low = `<div class="ck-heat" id="${p}heat" style="top:${BCK.scopeY + BCK.scopeH + 150}px"><span class="nm">Temperature</span>
      <div class="ck-track"><i class="ck-fill" id="${p}hf"></i></div></div>
    <div class="ck-thr" id="${p}x1" style="top:${BCK.scopeY + BCK.scopeH + 330}px">${d.heat.label}</div>`;
  return cpu + scope + lbl + low;
}
function ckFrame(B, c, p, d) {
  const t = c.local;
  up(p + 'cpuc', B.p('cpu', .02, .12, 'enter', { focal: false }), 24);
  const wv = B.at('wave', .1, .25, 'enter', { focal: false });
  up(p + 'wave', wv.p, 20);
  if (d.scope) up(p + 'k1', B.p('k1', .3, .42, 'enter'), 16);
  // the wave scrolls one period per tick; throttled, the period stretches (fewer ticks a second)
  const x1 = d.heat ? B.at('x1', .6, .7, 'pop') : null, slow = x1 ? eio(seg(t, x1.s, x1.s + 1.2)) : 0;
  const per = BCK.per * (1 + 1.4 * slow), speed = 300;
  const run = Math.max(0, t - wv.s), phase = d.heat ? (run * speed * (1 - .5 * slow)) : run * speed;
  const sx = 1 + 1.4 * slow;
  st(p + 'wsvg', { transform: `translateX(${(-(phase % per)).toFixed(1)}px) scaleX(${sx.toFixed(4)})`, transformOrigin: '0 0' });
  const blink = run > 0 ? ((phase / per) % 1 < .5 ? 1 : .25) : .25;
  st(p + 'led', { opacity: String(blink) });
  if (d.count) {
    const n = B.at('n', .5, .65, 'pop', { len: .4 });
    pp(p + 'n', n.p, .7);
    const f = eo(seg(t, n.s, n.s + 1.3)), v = Math.round(d.count.to * f / 1e6) * 1e6;
    txt(p + 'nv', v.toLocaleString('en-US'));
  }
  if (d.heat) {
    const h = B.at('heat', .1, .3, 'enter', { focal: false });
    up(p + 'heat', Math.min(h.p, seg(t, wv.e, wv.e + .4)), 20);
    const f = eo(seg(t, h.s + .3, (x1 ? x1.s : h.s + 3) + .2));
    st(p + 'hf', { transform: 'scaleX(' + (.25 + .72 * f).toFixed(4) + ')', background: f > .7 ? 'var(--rose)' : f > .4 ? 'var(--amber)' : 'var(--green)' });
    pp(p + 'x1', x1.p, .6);
    txt(p + 'ghz', slow > .5 ? d.heat.to : d.heat.from);
    cls(p + 'wave', 'hot', slow > .5);
  }
}
const BIP = { W: 880, laneH: 220, step: 244, trackL: 290, trackR: 852, col: 70 };
function ipHtml(p, d) {
  const lanes = (d.lanes || []).map((ln, i) => {
    const cols = Array.from({ length: 9 }, (_, j) => `<div class="ip-col" id="${p}c${i}_${j}">${Array.from({ length: ln.per }, () => '<i></i>').join('')}</div>`).join('');
    return `<div class="ip-lane" id="${p}${i ? 'r1' : 'r0'}" style="top:${i * BIP.step}px;height:${BIP.laneH}px;--acc:var(${ln.c || '--blue'})">
      <div class="nm">${ln.name}<small>${ln.small}</small></div><div class="ip-track">${cols}</div>
      <div class="ip-bar"><i id="${p}bf${i}"></i></div><span class="ip-wd" id="${p}wd${i}">Work done</span></div>`;
  }).join('');
  const y0 = (d.lanes || []).length * BIP.step + 10;
  const qm = `<span class="bd-qm" id="${p}q" style="left:${BIP.trackR - 140}px;top:20px;z-index:4">?</span>`;
  const chips = (d.chips || []).map((ch, i) => `<div class="bd-chip" id="${p}k${i + 1}" style="left:0;top:${y0 + i * BD.chipStep}px;width:${BIP.W}px;${bdAcc(ch.acc || d.accent)}">
      ${ch.icon ? bdUse(ch.icon) : ''}<span>${ch.text}${ch.small ? `<br><small>${ch.small}</small>` : ''}</span></div>`).join('');
  return lanes + qm + chips;
}
function ipFrame(B, c, p, d) {
  const t = c.local, L = d.lanes || [];
  const r0 = B.at('r0', .02, .15, 'enter', { focal: false }), r1 = B.at('r1', .4, .55, 'enter');
  up(p + 'r0', r0.p, 30); up(p + 'r1', r1.p, 30);
  const bar = B.at('bar', .65, .8, 'bar');
  // the faster lane fills its bar in 3 s; the other at its own rate (work per tick / seconds per tick)
  const rates = L.map(ln => ln.per / ln.period), top = Math.max(...rates);
  L.forEach((ln, i) => {
    const s0 = i ? r1.s : r0.s;
    for (let j = 0; j < 9; j++) {
      const ph = ((Math.max(0, t - s0) / ln.period + j) % 9) / 9, x = BIP.trackR - BIP.trackL - 40 - ph * (BIP.trackR - BIP.trackL - 40);
      const vis = t < s0 ? 0 : Math.min(1, seg(ph, 0, .08) * 1) * (1 - seg(ph, .88, 1)) * cl((t - s0) / .3, 0, 1);
      st(p + 'c' + i + '_' + j, { opacity: vis.toFixed(3), transform: `translateX(${x.toFixed(1)}px)` });
    }
    const f = t < bar.s ? 0 : Math.min(rates[i] / top, (t - bar.s) / 3);   // each lane fills at its own rate and stops at its share
    st(p + 'bf' + i, { transform: 'scaleX(' + eo(f).toFixed(4) + ')' });
    st(p + 'wd' + i, { opacity: String(cl((t - bar.s) * 3, 0, 1)) });
  });
  pp(p + 'q', B.p('q', .2, .3, 'pop') * (1 - B.p('r1', .4, .55)), .4);
  (d.chips || []).forEach((_, i) => up(p + 'k' + (i + 1), B.p('k' + (i + 1), .3 + i * .5, .42 + i * .5, 'enter'), 20));
}
const BCO = { W: 880, dieH: 500, tw: 190, th: 188, gx: 18, gy: 20, x0: 26, y0: 70 };   // 70 + 2 × 188 + 20 = 466: the tiles end inside the die
const CO_WORKER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="7" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>';
function coHtml(p, d) {
  const n = d.cores || 8;
  const tiles = Array.from({ length: n }, (_, i) => {
    const x = BCO.x0 + (i % 4) * (BCO.tw + BCO.gx), y = BCO.y0 + Math.floor(i / 4) * (BCO.th + BCO.gy);
    return `<div class="co-tile" id="${p}co${i}" style="left:${x}px;top:${y}px;width:${BCO.tw}px;height:${BCO.th}px">
      <span class="wk" id="${p}wk${i}">${CO_WORKER}</span><b>Core ${i + 1}</b><i class="job"><i id="${p}jb${i}"></i></i></div>`;
  }).join('');
  const die = `<div class="co-die" id="${p}die" style="height:${BCO.dieH}px"><span class="ttl">CPU</span><span class="cnt" id="${p}cnt"></span>${tiles}</div>`;
  const y0 = BCO.dieH + BD.gap;
  let low = '';
  if (d.tasks) low = bdChips(p, Object.assign({}, d, { chips: d.tasks.map(t => Object.assign({ cls: d.tasksStack ? 'stk' : '' }, t)) }), y0);
  if (d.big) {
    const bt = Array.from({ length: 4 }, (_, i) => `<div class="co-big" style="left:${26 + i * 212}px"><span class="wk">${CO_WORKER}</span><i class="job"><i id="${p}bj${i}"></i></i></div>`).join('');
    low = `<div class="co-die big" id="${p}k1" style="top:${y0}px;height:250px"><span class="ttl">${d.big.title}</span><span class="cnt on">${d.big.tag}</span>${bt}</div>`;
  }
  return die + low;
}
function coFrame(B, c, p, d) {
  const t = c.local, n = d.cores || 8;
  up(p + 'die', B.p('die', .02, .15, 'enter', { focal: false }), 30);
  const w = B.at('w', .2, .3, 'pop'), two = B.at('two', .35, .45, 'pop'), eight = B.at('eight', .5, .6, 'pop');
  const x1 = d.fewer ? B.at('x1', .3, .4, 'pop') : null;
  let label = '';
  for (let i = 0; i < n; i++) {
    const on = d.fewer ? 1 : i === 0 ? w.p : i === 1 ? two.p : seg(t, eight.s + (i - 2) * .07, eight.s + (i - 2) * .07 + BEAT.pop);
    const off = x1 && i > 0 ? eo(x1.p) : 0;
    cls(p + 'co' + i, 'lit', on > .5 && off < .5);
    st(p + 'co' + i, { opacity: String((1 - .6 * off).toFixed(3)) });
    pp(p + 'wk' + i, on, .3);
    // a job bar loops while the core works; an idle core's bar stops
    const q = ((t * (.55 + .07 * (i % 3)) + i * .37) % 1);
    st(p + 'jb' + i, { transform: 'scaleX(' + (on > .5 && off < .5 ? q : 0).toFixed(3) + ')' });
  }
  if (!d.fewer) label = t >= eight.s ? `${n} workers` : t >= two.s ? '2 workers' : t >= w.s ? '1 core = 1 worker' : '';
  else label = x1 && t >= x1.s ? 'Only 1 busy' : `${n} cores`;
  txt(p + 'cnt', label); cls(p + 'cnt', 'on', !!label);
  if (d.tasks) d.tasks.forEach((_, i) => up(p + 'k' + (i + 1), B.p('k' + (i + 1), .6 + i * .1, .7 + i * .1, 'enter'), 20));
  if (d.big) {
    up(p + 'k1', B.p('k1', .6, .75, 'enter'), 30);
    for (let i = 0; i < 4; i++) st(p + 'bj' + i, { transform: 'scaleX(' + ((t * 1.3 + i * .29) % 1).toFixed(3) + ')' });
  }
}
const BAR_ = { W: 880, rowH: 196, step: 236 };
function arDie(kind) {
  if (kind === 'hybrid') return '<i class="P" style="left:8px;top:8px;width:56px;height:56px"></i><i class="P" style="left:70px;top:8px;width:56px;height:56px"></i>' +
    '<i class="P" style="left:8px;top:70px;width:56px;height:56px"></i><i class="P" style="left:70px;top:70px;width:56px;height:56px"></i>' +
    Array.from({ length: 8 }, (_, i) => `<i class="E" style="left:${134 + (i % 2) * 30}px;top:${8 + Math.floor(i / 2) * 30}px;width:24px;height:24px"></i>`).join('');
  if (kind === 'tiles') return '<i class="P" style="left:8px;top:8px;width:84px;height:118px"></i><i class="P" style="left:100px;top:8px;width:84px;height:118px"></i>';
  return '<i class="P" style="left:8px;top:8px;width:70px;height:56px"></i><i class="G" style="left:84px;top:8px;width:100px;height:56px"></i>' +
    '<i class="M" style="left:8px;top:70px;width:176px;height:56px"></i>';
}
function arHtml(p, d) {
  const rows = (d.chips || []).map((ch, i) => `<div class="ar-row" id="${p}k${i + 1}" style="top:${i * BAR_.step}px;height:${BAR_.rowH}px">
      <div class="ltile ar-logo"><img src="${ch.logo}" alt=""></div>
      <div class="ar-nm">${ch.name}<small>${ch.small || ''}</small></div><div class="ar-die">${arDie(ch.die)}</div></div>`).join('');
  const neq = (d.chips || []).slice(1).map((_, i) => `<span class="ar-neq" id="${p}nq${i}" style="top:${(i + 1) * BAR_.step - (BAR_.step - BAR_.rowH) / 2 - 36}px">≠</span>`).join('');
  return rows + neq;
}
function arFrame(B, c, p, d) {
  (d.chips || []).forEach((_, i) => up(p + 'k' + (i + 1), B.p('k' + (i + 1), .1 + i * .2, .22 + i * .2, 'enter'), 30));
  const x = B.at('x1', .8, .9, 'pop');
  (d.chips || []).slice(1).forEach((_, i) => pp(p + 'nq' + i, seg(c.local, x.s + i * .12, x.e + i * .12), .3));
}
const BRC = { W: 880, rowY: 150, rowStep: 100, rowH: 86 };
function rcHtml(p, d) {
  const sx = (d.struck || []).map((s, i) => `<div class="bd-chip rc-st" id="${p}x${i + 1}" style="left:${i * 450}px;top:0;width:430px;height:104px;justify-content:center">
      <span>${s}</span><i class="rc-line" id="${p}xl${i + 1}"></i></div>`).join('');
  const rows = (d.terms || []).map((tm, i) => `<div class="rc-row" id="${p}t${i + 1}" style="top:${BRC.rowY + i * BRC.rowStep}px;height:${BRC.rowH}px;--acc:var(${tm.c || '--blue'})">
      <span class="ck">${bdUse('check')}</span><b>${tm.text}</b><small>${tm.small || ''}</small></div>
    <div class="rc-flash" id="${p}fl${i}" style="--acc:var(${tm.c || '--blue'})">${tm.text}</div>`).join('');
  return sx + rows;
}
function rcFrame(B, c, p, d) {
  const t = c.local;
  (d.struck || []).forEach((_, i) => {
    const x = B.at('x' + (i + 1), .05 + i * .1, .15 + i * .1, 'pop');
    up(p + 'x' + (i + 1), seg(t, x.s - .25, x.s + .05), 16);
    st(p + 'xl' + (i + 1), { transform: 'scaleX(' + eo(seg(t, x.s + .1, x.s + .45)).toFixed(4) + ')' });
    dim(p + 'x' + (i + 1), seg(t, x.s + .5, x.s + .9), .55);
  });
  // each counted term: big and bold in the middle as it is said (.3 s), then it flies into its row (.45 s)
  (d.terms || []).forEach((_, i) => {
    const r = B.at('t' + (i + 1), .4 + i * .1, .5 + i * .1, 'pop'), s = r.s;
    const big = seg(t, s, s + .22), fly = eio(seg(t, s + .3, s + .75));
    const y = lerp(300, BRC.rowY + i * BRC.rowStep + BRC.rowH / 2, fly), sc = lerp(1, .38, fly) * (.7 + .3 * bk(big));
    st(p + 'fl' + i, { opacity: String((cl(big * 3, 0, 1) * (1 - seg(fly, .85, 1))).toFixed(3)), transform: `translate(-50%,-50%) translateY(${y.toFixed(1)}px) scale(${sc.toFixed(4)})` });
    st(p + 't' + (i + 1), { opacity: String(seg(fly, .7, 1).toFixed(3)) });
  });
}
/* board mode, part 3: a cache block on the CPU's edge with quick hits, the long RAM trip greyed, a fan by the CPU */
function bdP3Html(p, d) {
  let h = '';
  if (d.cache) h += `<div class="bd-cache" id="${p}cache" style="left:236px;top:244px;width:118px;height:78px">${d.cache.text || 'Cache'}</div>
    <i class="bd-pulse" id="${p}ch0" style="--pc:var(--green)"></i><i class="bd-pulse" id="${p}ch1" style="--pc:var(--green)"></i>
    <i class="bd-pulse" id="${p}rt0" style="--pc:var(--tx3)"></i>
    <span class="bd-skip" id="${p}skip" style="left:${BD_PART.ram.x - 30}px;top:${BD_PART.ram.y + 140}px">${d.cache.skip || 'Skipped'}</span>`;
  if (d.fan) h += `<div class="bd-fan" id="${p}k1" style="left:120px;top:420px;width:130px;height:130px;color:var(--blue);z-index:6">${BD_ICON.fan}</div>`;
  return h;
}
function bdP3Frame(B, c, p, d) {
  const t = c.local;
  if (d.cache) {
    pp(p + 'cache', B.p('cache', .2, .3, 'pop'), .5);
    const pl = B.at('pulse', .4, .5, 'enter'), x1 = B.at('x1', .6, .7, 'pop');
    // hits: CPU die → cache and back, quick (0.6 s a round trip)
    [0, 1].forEach(i => {
      if (t < pl.s) { st(p + 'ch' + i, { opacity: '0' }); return; }
      const q = (((t - pl.s) / .6 + i * .5) % 1), k = q < .5 ? q * 2 : 2 - q * 2, xy = [lerp(180, 295, k), lerp(200, 283, k)];
      st(p + 'ch' + i, { opacity: String(cl((t - pl.s) * 4, 0, 1)), left: xy[0].toFixed(1) + 'px', top: xy[1].toFixed(1) + 'px' });
    });
    // the long trip to RAM: a slow grey pulse, then it stops and RAM reads "skipped"
    const on = t >= pl.s + .3, gone = seg(t, x1.s, x1.s + .4);
    const q = on ? ((t - pl.s - .3) / 2.4) % 1 : 0, xy = bdAlong([[180, 200], [335, 210], [430, 210]], q < .5 ? q * 2 : 2 - q * 2);
    st(p + 'rt0', { opacity: String((on ? .8 : 0) * (1 - gone)), left: xy[0].toFixed(1) + 'px', top: xy[1].toFixed(1) + 'px' });
    pp(p + 'skip', x1.p, .5);
    dim(p + 'ram', seg(t, x1.s, x1.s + .4), .45);
  }
  if (d.fan) {
    pp(p + 'k1', B.p('k1', .3, .4, 'pop'), .5);
    const f = el(p + 'k1'); if (f) f.querySelector('svg').style.transform = 'rotate(' + ((t * 260) % 360).toFixed(1) + 'deg)';
  }
}
/* ---------- part 4 (projects/what-makes-laptop-faster-4): storage, four more modes on the same board family ----------
   drives: a hard drive seen from above (platter spins from `spin`, arm swings on `arm`, hunts a sector from `seek`).
     data.show 'hdd' = one big drive + data.chips under it; 'both' = HDD panel left, SSD panel right (beats ssd, x1
     strikes "Moving parts", cells lights the flash cells, race sends both after one file, win tags the SSD), chips k1.
   speeds: one row per drive (an M.2 stick, a bar, a counter). data.rows [{name, small, val (MB/s), label, beat, c}];
     data.group {title, beat, from (first row index), chip {text, beat}} frames the NVMe rows; data.note under them.
   swap: a RAM panel (4 app slots) beside a storage panel with a swap slice. Apps fill RAM on `ap`; RAM flushes on
     `full` while two more wait; on `sw` the arrow draws, the two oldest apps move into swap and the waiting two take
     their slots. data.chips under it (k1, with its tag on x1).
     data.lanes [{title, drive: 'ssd'|'hdd', beat, slow}] draws swap lanes instead: pulses RAM ↔ drive from `l1`,
     x1 flushes the slow lane and pops its tag.
   chain: three stations (data.stations [{name, small, icon, c}] on w1..w3), a file box on f1 with a lock pill (lock),
     one arrow per hop drawn on e1 / e2 that the box then rides. */
const P4_ICON = {
  power: '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/>',
  app: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20M6 4v4M10 4v4"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  disk: '<path d="M22 12H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><circle cx="6" cy="16" r="1.2" style="fill:currentColor;stroke:none"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  chip: '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  warehouse: '<path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12M6 14h12"/><rect x="6" y="10" width="12" height="12"/>',
  bench: '<path d="M3 10h18M5 10v10M19 10v10M5 15h14"/><rect x="7" y="4" width="5" height="6" rx="1"/><path d="M15 6h3"/>',
  workers: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
};
const p4K = (id, k) => { const e = el(id); if (e) e.style.setProperty('--k', k.toFixed(4)); };
const p4Ic = (n, cls) => `<svg class="${cls || 'ic'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P4_ICON[n]}</svg>`;
/* a hard drive from above: S = box width; the arm pivots near the bottom-right corner */
const HD = { rest: -100, seek: [-138, -112, -128, -118] };
function hdHtml(id, x, y, S) {
  const D = Math.round(S * .86), o = Math.round(S * .07);
  return `<div class="hd-box" id="${id}" style="left:${x}px;top:${y}px;width:${S}px;height:${Math.round(S * 1.25)}px">
    <div class="hd-plat" style="left:${o}px;top:${o}px;width:${D}px;height:${D}px"><div class="hd-spin" id="${id}sp"><i class="hd-tgt" id="${id}tg" style="left:${Math.round(D * .5 + D * .3)}px;top:${Math.round(D * .5)}px"></i></div><i class="hub"></i></div>
    <div class="hd-arm" id="${id}arm" style="left:${Math.round(S * .86)}px;top:${Math.round(S * 1.05)}px;width:${Math.round(S * .62)}px;transform:rotate(${HD.rest}deg)"><i></i></div>
    <i class="hd-piv" style="left:${Math.round(S * .86) - 22}px;top:${Math.round(S * 1.05) - 22}px"></i></div>`;
}
/* platter angle: spins up over .6 s to 720°/s from `s0`; the arm swings between seek targets from `seekS` */
function hdFrame(id, t, s0, seekS, armOn) {
  const run = Math.max(0, t - s0), ang = run < .6 ? 600 * run * run : 600 * .36 + 720 * (run - .6);
  st(id + 'sp', { transform: 'rotate(' + ang.toFixed(1) + 'deg)' });
  let a = HD.rest;
  if (t >= seekS) {
    const k = (t - seekS) / .55, i = Math.floor(k), f = eio(cl(k - i, 0, 1) * 1.6 > 1 ? 1 : cl(k - i, 0, 1) * 1.6);
    const from = i ? HD.seek[(i - 1) % HD.seek.length] : HD.rest, to = HD.seek[i % HD.seek.length];
    a = lerp(from, to, f);
  }
  st(id + 'arm', { transform: 'rotate(' + a.toFixed(2) + 'deg)' });
  cls(id + 'arm', 'on', armOn);
  cls(id + 'tg', 'on', t >= seekS);
}
function ssdHtml(id, x, y, w, h) {
  const cells = Array.from({ length: 24 }, (_, i) => `<i id="${id}c${i}"></i>`).join('');
  return `<div class="sd-m2" id="${id}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
    <div class="ctl">${p4Ic('chip', 'ci')}</div><div class="cells">${cells}</div><b class="edge"></b><i class="notch"></i></div>`;
}
function drHtml(p, d) {
  if (d.show !== 'both') {
    const S = 380;
    return `<div class="dr-pan solo" style="left:0;top:0;width:${BD.W}px;height:560px">${hdHtml(p + 'hdd', (BD.W - S) / 2, 46, S)}</div>` +
      bdChips(p, Object.assign({}, d, { chipRow: true }), 560 + BD.gap);
  }
  const W = 420, H = 520;
  const hddP = `<div class="dr-pan" id="${p}ph" style="left:0;top:0;width:${W}px;height:${H}px"><span class="ttl">HDD</span>${hdHtml(p + 'hdd', 60, 76, 300)}
    <span class="dr-rd" id="${p}rdh">Seeking…</span></div>`;
  const ssdP = `<div class="dr-pan" id="${p}ssd" style="left:${BD.W - W}px;top:0;width:${W}px;height:${H}px;--acc:var(--green)"><span class="ttl">SSD</span>
    <span class="dr-mv" id="${p}x1">${p4Ic('gear')}Moving parts<i class="ln" id="${p}x1l"></i></span>
    ${ssdHtml(p + 'm2', 120, 80, 180, 360)}<span class="dr-rd ok" id="${p}rds">Found ✓</span>
    <span class="dr-win" id="${p}win">${d.win || 'Much faster'}</span></div>`;
  return hddP + ssdP + bdChips(p, d, H + BD.gap);
}
function drFrame(B, c, p, d) {
  const t = c.local;
  if (d.show !== 'both') {
    up(p + 'hdd', B.p('hdd', .02, .15, 'enter', { focal: false }), 30);
    const sp = B.at('spin', .3, .4, 'pop'), arm = B.at('arm', .5, .6, 'pop'), sk = B.at('seek', .7, .8, 'enter');
    hdFrame(p + 'hdd', t, sp.s, sk.s, t >= arm.s);
    (d.chips || []).forEach((ch, i) => { const n = ch.beat || 'k' + (i + 1); up(p + n, B.p(n, .2 + i * .3, .32 + i * .3, 'enter'), 20); });
    return;
  }
  // the HDD is already there (it carries on from the slide before) and keeps spinning; the SSD slides in beside it
  st(p + 'ph', { opacity: '1' }); st(p + 'hdd', { opacity: '1' });
  const ss = B.at('ssd', .02, .15, 'enter', { focal: false });
  up(p + 'ssd', ss.p, 40);
  const race = B.at('race', .6, .7, 'enter'), win = B.at('win', .8, .9, 'pop');
  hdFrame(p + 'hdd', t + 30, 0, t >= race.s ? race.s + 30 : 1e9, t >= race.s);
  dim(p + 'ph', seg(t, ss.s, ss.s + .4) * .5 + seg(t, win.s, win.s + .4) * .5, .5);
  const x1 = B.at('x1', .3, .4, 'pop');
  up(p + 'x1', seg(t, x1.s - .3, x1.s), 10);
  st(p + 'x1l', { transform: 'scaleX(' + eo(seg(t, x1.s + .05, x1.s + .4)).toFixed(4) + ')' });
  const cells = B.at('cells', .45, .55, 'pop');
  for (let i = 0; i < 24; i++) cls(p + 'm2c' + i, 'on', t >= cells.s + (i % 6) * .03);
  // the race: the SSD answers at once (one cell flashes), the HDD's readout keeps seeking
  cls(p + 'm2c9', 'hit', t >= race.s + .25);
  pp(p + 'rds', seg(t, race.s + .3, race.s + .3 + BEAT.pop), .5);
  up(p + 'rdh', seg(t, race.s, race.s + .3), 10);
  pp(p + 'win', win.p, .6);
  (d.chips || []).forEach((ch, i) => { const n = ch.beat || 'k' + (i + 1); up(p + n, B.p(n, .2, .3, 'enter'), 20); });
}
const BSP = { rowH: 130, step: 146, head: 70 };
function spY(d, i) {
  const g = d.group, gi = g ? g.from : 1e9;
  return i < gi ? i * BSP.step : gi * BSP.step + 24 + BSP.head + (i - gi) * BSP.step;
}
function spHeight(d) {
  const n = (d.rows || []).length;
  return spY(d, n - 1) + BSP.rowH + (d.group ? 16 : 0) + (d.note ? 56 : 0);
}
function spHtml(p, d) {
  const max = Math.max(...d.rows.map(r => r.val));
  const rows = d.rows.map((r, i) => `<div class="sp-row" id="${p}${r.beat}" style="top:${spY(d, i)}px;height:${BSP.rowH}px;--acc:var(${r.c || '--amber'})">
      ${r.art === 'ram' ? `<div class="sp-m2" style="background:#0F3B2A;--acc:var(--teal)"><i></i><i></i><i></i><b style="right:6px;left:6px;top:auto;bottom:-3px;width:auto;height:8px;background:repeating-linear-gradient(90deg,var(--gold2) 0 4px,transparent 4px 8px)"></b></div>` : '<div class="sp-m2"><i></i><i></i><i></i><b></b></div>'}
      <span class="nm">${r.name}<small>${r.small || ''}</small></span><span class="vl" id="${p}vl${i}"></span>
      <div class="dd-track"><i class="dd-fill" id="${p}fl${i}" style="width:${Math.max(r.min || 0, 100 * r.val / max).toFixed(2)}%"></i></div></div>`).join('');
  const g = d.group;
  const grp = g ? `<div class="sp-grp" id="${p}${g.beat}" style="top:${g.from * BSP.step}px;height:${spY(d, d.rows.length - 1) + BSP.rowH + 16 - g.from * BSP.step}px">
      <span class="ttl">${g.title}</span>${g.chip ? `<span class="sp-pci" id="${p}${g.chip.beat}">${g.chip.text}</span>` : ''}</div>` : '';
  const note = d.note ? `<span class="dd-note" id="${p}nt" style="top:${spHeight(d) - 40}px">${d.note}</span>` : '';
  return grp + rows + note;
}
function spFrame(B, c, p, d) {
  const t = c.local, max = Math.max(...d.rows.map(r => r.val));
  if (d.group) {
    up(p + d.group.beat, B.p(d.group.beat, .2, .3, 'enter'), 30);
    if (d.group.chip) pp(p + d.group.chip.beat, B.p(d.group.chip.beat, .3, .4, 'pop'), .5);
  }
  let last = 0;
  d.rows.forEach((r, i) => {
    const R = B.at(r.beat, .1 + i * .2, .2 + i * .2, 'enter');
    up(p + r.beat, R.p, 24);
    // every bar grows at the same speed, so a faster drive's bar keeps going after the slower one has stopped
    const s0 = r.bar ? B.at(r.bar, .15 + i * .2, .25 + i * .2, 'pop').s : R.s + .15;
    const f = cl((t - s0) / Math.max(.45, 2.2 * r.val / max), 0, 1);
    // data streams through the bar at the drive's own speed, so the holds keep moving and Gen 5 visibly races
    st(p + 'fl' + i, { transform: 'scaleX(' + eo(f).toFixed(4) + ')', backgroundPosition: (Math.max(0, t - s0) * (30 + 420 * r.val / max)).toFixed(1) + 'px 0' });
    const v = r.val * eo(f);
    txt(p + 'vl' + i, d.lat ? (f >= 1 ? r.label : '') : f >= 1 ? r.label : t < s0 ? '' : v < 1000 ? Math.round(v) + ' MB/s' : (v / 1000).toFixed(1) + ' GB/s');
    last = Math.max(last, R.s);
  });
  if (d.note) up(p + 'nt', seg(t, last + .8, last + 1.2), 10);
}
const BSW = { pw: 380, ph: 500 };
function swHtml(p, d) {
  if (d.lanes) return swLanesHtml(p, d);
  const slots = [[40, 96], [200, 96], [40, 276], [200, 276]].map(s => `<i class="sw-slot" style="left:${s[0]}px;top:${s[1]}px"></i>`).join('');
  const ram = `<div class="sw-pan" id="${p}pram" style="left:0;top:0;width:${BSW.pw}px;height:${BSW.ph}px;--acc:var(--teal)"><span class="ttl">RAM</span>
    <span class="sw-full" id="${p}full">Full</span>${slots}
    <div class="sw-meter"><i id="${p}mt"></i></div><span class="sw-pct" id="${p}pct">0%</span></div>`;
  const sto = `<div class="sw-pan" id="${p}psto" style="left:${BD.W - BSW.pw}px;top:0;width:${BSW.pw}px;height:${BSW.ph}px;--acc:var(--amber)"><span class="ttl">Storage</span>
    <div class="sw-slice" id="${p}sw"><b>Swap</b></div>
    <div class="sw-files">${[0, 1, 2].map(i => `<span>${p4Ic('file')}</span>`).join('')}<small>Your files</small></div></div>`;
  const arrow = `<div class="p4-arw h" id="${p}arw" style="left:${BSW.pw + 10}px;top:${186}px;width:${BD.W - 2 * BSW.pw - 20}px"><i class="sh"></i><i class="hd"></i></div>`;
  const apps = (d.apps || []).map((a, i) => `<span class="bd-app sw-app" id="${p}ap${i}"><img src="${a.src}" alt=""></span>`).join('');
  return ram + sto + arrow + apps + bdChips(p, d, BSW.ph + BD.gap);
}
// slot centres in the RAM panel, the waiting spots above it and the swap slice in the storage panel (board px)
const SW_SLOT = [[115, 171], [275, 171], [115, 351], [275, 351]], SW_WAIT = [[115, 440], [275, 440]];
const SW_SWAP = [[BD.W - BSW.pw + 120, 204], [BD.W - BSW.pw + 260, 204]];
function swFrame(B, c, p, d) {
  if (d.lanes) return swLanesFrame(B, c, p, d);
  const t = c.local;
  st(p + 'pram', { opacity: '1' }); up(p + 'psto', B.p('psto', .02, .15, 'enter', { focal: false }), 20);
  const ap = B.at('ap', .1, .2, 'enter'), full = B.at('full', .4, .5, 'pop'), sw = B.at('sw', .55, .65, 'pop');
  cls(p + 'pram', 'bad', t >= full.s && t < sw.s + 1.6);
  pp(p + 'full', full.p * (1 - seg(t, sw.s + 1.4, sw.s + 1.7)), .5);
  pp(p + 'sw', sw.p, .3); cls(p + 'sw', 'on', t >= sw.s);
  // the arrow draws across the gap first, then the oldest two apps ride it into swap
  const aw = eo(seg(t, sw.s + .1, sw.s + .5));
  st(p + 'arw', { opacity: String(cl(aw * 4, 0, 1)) }); p4K(p + 'arw', aw);
  (d.apps || []).forEach((_, i) => {
    let xy, o;
    if (i < 4) {
      const q = seg(t, ap.s + i * .3, ap.s + i * .3 + .45);
      xy = [SW_SLOT[i][0], SW_SLOT[i][1] + (1 - eo4(q)) * -60]; o = cl(q * 3, 0, 1);
      if (i < 2) {
        const m = eio(seg(t, sw.s + .6 + i * .25, sw.s + 1.3 + i * .25)), via = [BSW.pw + 60, 186];
        xy = m < .5 ? [lerp(xy[0], via[0], m * 2), lerp(xy[1], via[1], m * 2)] : [lerp(via[0], SW_SWAP[i][0], m * 2 - 1), lerp(via[1], SW_SWAP[i][1], m * 2 - 1)];
      }
    } else {
      const j = i - 4, q = seg(t, full.s - .5 + j * .2, full.s - .1 + j * .2), m = eio(seg(t, sw.s + 1.3 + j * .2, sw.s + 1.8 + j * .2));
      const bob = m > 0 ? 0 : Math.sin(t * 9 + j) * 5 * cl((t - full.s) * 2, 0, 1);
      xy = [lerp(SW_WAIT[j][0], SW_SLOT[j][0], m), lerp(SW_WAIT[j][1] + bob, SW_SLOT[j][1], m)]; o = cl(q * 3, 0, 1);
    }
    st(p + 'ap' + i, { opacity: String(o), left: xy[0].toFixed(1) + 'px', top: xy[1].toFixed(1) + 'px' });
  });
  // the RAM meter: a quarter per app in it; full turns it rose, swapping two out drops it to half until the waiting two land
  const inR = [0, 1, 2, 3].reduce((n, i) => n + seg(t, ap.s + i * .3, ap.s + i * .3 + .45), 0)
    - [0, 1].reduce((n, i) => n + seg(t, sw.s + .6 + i * .25, sw.s + 1.3 + i * .25), 0)
    + [0, 1].reduce((n, j) => n + seg(t, sw.s + 1.3 + j * .2, sw.s + 1.8 + j * .2), 0);
  const pct = Math.round(25 * inR);
  st(p + 'mt', { transform: 'scaleX(' + (inR / 4).toFixed(4) + ')', background: pct >= 100 ? 'var(--rose)' : 'var(--teal)' });
  txt(p + 'pct', pct + '%');
  (d.chips || []).forEach((ch, i) => { const n = ch.beat || 'k' + (i + 1); up(p + n, B.p(n, .7, .8, 'enter'), 20); });
  if ((d.chips || []).some(ch => ch.tag)) pp(p + 'k1tg', B.p('x1', .85, .95, 'pop'), .6);
}
const BSL = { h: 250, step: 280 };
function swLanesHtml(p, d) {
  return d.lanes.map((ln, i) => {
    const y = i * BSL.step, drive = ln.drive === 'hdd' ? hdHtml(p + 'ld' + i, 700, 62, 130) : ssdHtml(p + 'ld' + i, 690, 92, 160, 120);
    const pl = Array.from({ length: 4 }, (_, k) => `<i class="bd-pulse" id="${p}lp${i}${k}" style="--pc:var(--teal)"></i>`).join('');
    return `<div class="sw-lane" id="${p}${ln.beat}" style="top:${y}px;height:${BSL.h}px;--acc:var(${ln.drive === 'hdd' ? '--amber' : '--green'})">
      <span class="ttl">${ln.title}</span><span class="sw-ltag" id="${p}lt${i}">${ln.tag || ''}</span>
      <div class="sw-ram"><i></i><i></i><b>RAM</b></div><i class="sw-trk"></i>${drive}${pl}</div>`;
  }).join('');
}
function swLanesFrame(B, c, p, d) {
  const t = c.local, l1 = B.at('l1', .4, .5, 'enter'), x1 = B.at('x1', .7, .8, 'pop');
  d.lanes.forEach((ln, i) => {
    const L = B.at(ln.beat, .05 + i * .2, .15 + i * .2, 'enter', { focal: false });
    up(p + ln.beat, L.p, 30);
    if (ln.drive === 'hdd') { st(p + 'ld' + i, { opacity: '1' }); hdFrame(p + 'ld' + i, t, L.s, t >= l1.s ? l1.s : 1e9, t >= l1.s); }
    else { st(p + 'ld' + i, { opacity: '1' }); for (let k = 0; k < 24; k++) cls(p + 'ld' + i + 'c' + k, 'on', t >= L.s + .2); }
    const per = ln.slow ? 5.2 : 1.1;
    for (let k = 0; k < 4; k++) {
      const id = p + 'lp' + i + k;
      if (t < l1.s) { st(id, { opacity: '0' }); continue; }
      const q = (((t - l1.s) / per - k / 4) % 1 + 1) % 1, b = q < .5 ? q * 2 : 2 - q * 2;
      st(id, { opacity: String(Math.min(1, seg(t, l1.s + k * per / 4, l1.s + k * per / 4 + .2)).toFixed(3)), left: lerp(200, 660, b).toFixed(1) + 'px', top: '150px' });
      const e = el(id); if (e) e.style.setProperty('--pc', ln.slow && t >= x1.s ? 'var(--rose)' : 'var(--teal)');
    }
    if (ln.slow) { cls(p + ln.beat, 'bad', t >= x1.s); pp(p + 'lt' + i, x1.p, .6); }
    else pp(p + 'lt' + i, seg(t, l1.s + .4, l1.s + .4 + BEAT.pop), .5);
  });
}
const BCH = { rowH: 170, step: 240, slotX: 750 };
function chHtml(p, d) {
  const rows = (d.stations || []).map((s, i) => `<div class="ch-row" id="${p}w${i + 1}" style="top:${i * BCH.step}px;height:${BCH.rowH}px;--acc:var(${s.c})">
      <span class="ch-ic">${p4Ic(s.icon)}</span><span class="nm">${s.name}<small>${s.small}</small></span><i class="ch-slot"></i></div>`).join('');
  const arrows = [0, 1].map(i => `<div class="p4-arw v" id="${p}e${i + 1}" style="left:${BCH.slotX - 12}px;top:${i * BCH.step + BCH.rowH + 4}px;height:${BCH.step - BCH.rowH - 8}px"><i class="sh"></i><i class="hd"></i></div>`).join('');
  const det = d.detour ? `<div class="bd-chip bad" id="${p}${d.detour.tagBeat || 'k1'}" style="left:0;top:${2 * BCH.step + BCH.rowH + BD.gap}px;width:${BD.W}px;justify-content:center">${bdUse('warn')}<span>${d.detour.tag}</span></div>` : '';
  const box = `${det}<span class="ch-box" id="${p}f1">${p4Ic('file')}</span>
    <span class="ch-lock" id="${p}lock">${p4Ic('lock')}${d.lock || 'Long term'}</span>
    <span class="ch-zap" id="${p}zap">${p4Ic('zap')}</span>`;
  return rows + arrows + box;
}
function chFrame(B, c, p, d) {
  const t = c.local;
  (d.stations || []).forEach((_, i) => up(p + 'w' + (i + 1), B.p('w' + (i + 1), .05 + i * .15, .15 + i * .15, 'enter'), 30));
  const f1 = B.at('f1', .5, .6, 'pop'), e1 = B.at('e1', .7, .8, 'enter'), e2 = B.at('e2', .85, .95, 'enter');
  pp(p + 'lock', B.p('lock', .6, .7, 'pop'), .5);
  dim(p + 'lock', seg(t, e1.s + .4, e1.s + .7), .35);
  // each hop: the arrow draws in the gap (head at its tip), then the box rides it down to the next station
  [e1, e2].forEach((e, i) => {
    const k = eo(seg(t, e.s, e.s + .45));
    st(p + 'e' + (i + 1), { opacity: String(cl(k * 4, 0, 1)) }); p4K(p + 'e' + (i + 1), k);
  });
  const cy = i => i * BCH.step + BCH.rowH / 2;
  const m1 = eio(seg(t, e1.s + .4, e1.s + 1)), m2 = eio(seg(t, e2.s + .4, e2.s + 1));
  const y = m2 > 0 ? lerp(cy(1), cy(2), m2) : lerp(cy(0), cy(1), m1);
  st(p + 'f1', { top: y.toFixed(1) + 'px' });
  pp(p + 'f1', f1.p, .5);
  if (d.detour) {
    // part 5: the box never leaves the warehouse; the workers (zap) climb to it on `beat`, the workbench row dims
    const w3 = B.at('w3', .35, .45, 'enter', { focal: false }), x = B.at(d.detour.dimBeat || 'x1', .4, .5, 'pop'), go = B.at(d.detour.beat || 'w', .5, .6, 'enter');
    st(p + 'f1', { top: cy(0).toFixed(1) + 'px' }); pp(p + 'f1', f1.p, .5);
    st(p + 'e1', { opacity: '0' }); st(p + 'e2', { opacity: '0' });   // nothing travels down: no hop arrows
    dim(p + 'w2', seg(t, x.s, x.s + .4), .35);
    const m = eio(seg(t, go.s, go.s + 1.1));
    pp(p + 'zap', seg(t, w3.s + .3, w3.s + .6), .6);
    st(p + 'zap', { left: lerp(836, 640, m).toFixed(1) + 'px', top: lerp(cy(2), cy(0), m).toFixed(1) + 'px',
      transform: 'rotate(' + (8 * Math.sin(t * (m >= 1 ? 3 : 7))).toFixed(2) + 'deg)' });
    up(p + (d.detour.tagBeat || 'k1'), B.p(d.detour.tagBeat || 'k1', .75, .85, 'enter'), 20);
    return;
  }
  pp(p + 'zap', seg(t, e2.s + 1, e2.s + 1.3), .6);
  const zp = el(p + 'zap'); if (zp && t > e2.s + 1.3) zp.style.transform = 'rotate(' + (8 * Math.sin((t - e2.s) * 7)).toFixed(2) + 'deg)';
}
const P3_MODES = { clock: [ckHtml, ckFrame], ipc: [ipHtml, ipFrame], cores: [coHtml, coFrame], arch: [arHtml, arFrame], recap: [rcHtml, rcFrame],
  drives: [drHtml, drFrame], speeds: [spHtml, spFrame], swap: [swHtml, swFrame], chain: [chHtml, chFrame] };
/* laptops: 270 + 24 + 88; board: the board + gap + chips/cases */
function bdHeight(d) {
  if (d.mode === 'laptops') return 382 + ((d.cast || []).length ? 260 : 0);
  if (d.mode === 'bottle') return BTL.H;
  if (d.mode === 'ddr') return (d.rows || []).length * BDDR.rowStep + 40 + BD.chipH;
  if (d.mode === 'dual') return (d.panels || []).length * BDU.step + (d.tag ? 110 : 0);
  if (d.mode === 'clock') return d.heat ? 690 : 600;
  if (d.mode === 'ipc') return (d.lanes || []).length * BIP.step + 10 + (d.chips || []).length * BD.chipStep - 16;
  if (d.mode === 'cores') return BCO.dieH + (d.tasks ? BD.gap + BD.chipH : d.big ? BD.gap + 250 : 0);
  if (d.mode === 'arch') return (d.chips || []).length * BAR_.step - (BAR_.step - BAR_.rowH);
  if (d.mode === 'drives') return d.show === 'both' ? 520 + ((d.chips || []).length ? BD.gap + BD.chipH : 0) : 560 + BD.gap + BD.chipH;
  if (d.mode === 'speeds') return spHeight(d);
  if (d.mode === 'swap') return d.lanes ? d.lanes.length * BSL.step - (BSL.step - BSL.h) + ((d.cast || []).length ? 260 : 0) : BSW.ph + ((d.chips || []).length ? BD.gap + BD.chipH : 0);
  if (d.mode === 'chain') return 2 * BCH.step + BCH.rowH + (d.detour ? BD.gap + BD.chipH : 0);
  if (d.mode === 'recap') return BRC.rowY + (d.terms || []).length * BRC.rowStep - (BRC.rowStep - BRC.rowH);
  const n = (d.chips || []).length, row = n === 3 || d.chipRow;
  return BD.H + ((d.cases || []).length ? BD.gap + 120 : n ? BD.gap + (row ? BD.chipH : n * BD.chipStep - 16) : 0);
}
defineTemplate('board', {
  check: d => req(d, ['eyebrow', 'h1'], 'board'),
  beats: d => baseBeats(d).concat(['board', 's1', 's2', 's3', 'cpu', 'ram', 'ssd', 'trace', 'ops', 't1', 'ap', 'os', 'lock', 'f1',
    'lap1', 'lap2', 'r0', 'r1', 'r2', 'bar', 'one', 'two', 'lanes', 'wave', 'n', 'heat', 'q', 'die', 'w', 'eight', 'cache', 'pulse', 't2', 't3', 't4', 't5', 'x1', 'x2', 'x3', 'c1', 'c2', 'c3', 'k1', 'k2', 'k3', 'em',
    'hdd', 'spin', 'arm', 'seek', 'cells', 'race', 'win', 'n1', 'g3', 'g4', 'g5', 'full', 'sw', 'l1', 'w1', 'w2', 'w3', 'e1', 'e2', 'psto'], castBeats(d.cast, d.bubbles)),
  html: (d, c) => {
    const p = c.p, H = bdHeight(d);
    let body;
    if (d.mode === 'laptops') body = bdLaptops(p, d);
    else if (d.mode === 'bottle') body = btHtml(p, d);
    else if (d.mode === 'ddr') body = ddrHtml(p, d);
    else if (d.mode === 'dual') body = duHtml(p, d);
    else if (P3_MODES[d.mode]) body = P3_MODES[d.mode][0](p, d);
    else body = bdBoard(p, d) + ((d.cases || []).length ? bdCases(p, d, BD.H + BD.gap) : bdChips(p, d, BD.H + BD.gap)) +
      (d.pin ? `<div class="bd-chip" id="${p}${d.pin.beat}" style="left:${d.pin.x != null ? d.pin.x : BD.W - 380}px;top:${d.pin.y != null ? d.pin.y : BD.H - 112}px;width:${d.pin.w || 360}px;height:84px;font-size:32px;justify-content:center;z-index:7;${bdAcc(d.pin.acc || d.accent)}">${d.pin.icon ? bdUse(d.pin.icon) : ''}${d.pin.text}</div>` : '');
    return `${heading(p, d)}<div class="content"><div class="rel" style="height:${H}px;${bdAcc(d.accent)}">
      <div style="position:absolute;left:0;top:0;width:${BD.W}px;height:${H}px">${body}</div>${castBlock(p, d.cast, d.bubbles)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c), t = c.local;
    headIn(B, p);
    if (d.mode === 'bottle' || d.mode === 'ddr' || d.mode === 'dual' || P3_MODES[d.mode]) {
      (P3_MODES[d.mode] ? P3_MODES[d.mode][1] : d.mode === 'bottle' ? btFrame : d.mode === 'ddr' ? ddrFrame : duFrame)(B, c, p, d);
      castPlay(B, c, p, d.cast, d.bubbles);
      footIn(B, p); holdLife(B, p, d, { alias: d.alias || {} });
      return;
    }
    if (d.mode === 'laptops') {
      const l1 = B.at('lap1', .06, .2, 'enter', { focal: false });
      up(p + 'lap1', l1.p, 40);
      const l2 = B.at('lap2', .14, .28, 'enter', { focal: false, after: l1, delay: .2 });
      up(p + 'lap2', l2.p, 40);
      const k = B.at('k1', .3, .4, 'pop');
      pp(p + 'tg1', k.p, .6); pp(p + 'tg2', seg(t, k.s + .12, k.e + .12), .6);
      pp(p + 'eq', seg(t, k.s + .3, k.e + .3), .4);
      if (d.eq && !d.eqText) {   // an OR between two options is a question, never struck
        const x = B.at('x1', .6, .7, 'pop');
        st(p + 'x1', { opacity: String(cl(x.p * 3, 0, 1)), transform: 'rotate(28deg) scaleY(' + eo(x.p).toFixed(3) + ')' });
      }
      castPlay(B, c, p, d.cast, d.bubbles);
      footIn(B, p); holdLife(B, p, d, { alias: { k1: 'tg1' } });
      return;
    }
    const bd = B.at('board', .02, .12, 'enter', { focal: false, chain: false });
    up(p + 'board', d.boardIn === false ? 1 : bd.p, 30);
    // camera: cam0 → cam over the first .9 s (cut scenes continue the previous framing)
    const a = bdCamXf(d.cam0 || d.cam), b = bdCamXf(d.cam), cs = d.camOn ? B.at(d.camOn, .3, .4).s - .2 : .05, k = eio(seg(t, cs, cs + .9));
    st(p + 'world', { transform: `translate(${lerp(a.tx, b.tx, k).toFixed(1)}px,${lerp(a.ty, b.ty, k).toFixed(1)}px) scale(${lerp(a.s, b.s, k).toFixed(4)})` });
    // sockets: numbered ones light on s1..s3; a seated part's socket is lit; `lit` ones glow from the start
    ['cpu', 'ram', 'ssd'].forEach((kk, i) => {
      let on = (d.seated || []).includes(kk) || (d.lit || []).includes(kk) ? 1 : 0;
      if (d.nums) {
        const s = B.at('s' + (i + 1), .2 + i * .12, .3 + i * .12, 'pop');
        on = Math.max(on, s.p);
        pp(p + 'q' + kk, s.p, .5);
      }
      if (d.seat === kk) on = Math.max(on, B.p(kk, .2, .4, 'pop'));
      cls(p + 'sk' + kk, 'lit', on > .5);
      const lb = (d.seated || []).includes(kk) ? 1 : d.seat === kk ? seg(t, B.at(kk, .2, .4).e, B.at(kk, .2, .4).e + .3) : 0;
      up(p + 'lb' + kk, lb, 10);
    });
    // parts: seated show at once; the seated-on-beat part drops in
    ['cpu', 'ram'].forEach(kk => { if ((d.seated || []).includes(kk)) st(p + kk, { opacity: '1', transform: 'none' }); });
    if ((d.seated || []).includes('ssd') && d.storage !== 'both') st(p + 'ssd', { opacity: '1' });
    if (d.seat) {
      const s = B.p(d.seat, .2, .4, 'pop', { len: .45 });
      if (d.seat === 'ssd' && d.storage === 'both') {
        pp(p + 'hdd', B.p('k1', .3, .45, 'pop'), .5); pp(p + 'ssdc', B.p('k2', .45, .6, 'pop'), .5);
        const rot = 'rotate(' + (-35 + 25 * Math.sin(t * 2.4)).toFixed(1) + 'deg)';
        const arm = el(p + 'hdd') && el(p + 'hdd').querySelector('.arm'); if (arm) arm.style.transform = rot;
      } else st(p + d.seat, { opacity: String(cl(s * 3, 0, 1)), transform: 'translateY(' + Math.round((1 - eo4(s)) * -120) + 'px)' });
    }
    if (d.qm) pp(p + 'qm', B.p(d.qm, .3, .45, 'pop'), .4);
    if (d.part2) pp(p + 'part2', B.p(d.part2.on, .4, .55, 'pop'), .5);
    // extras on the lower edge
    if (d.extras) [1, 2, 3].forEach(i => pp(p + 'k' + i, B.p('k' + i, .2 + i * .15, .35 + i * .15, 'pop'), .6));
    if (d.extras) { const fan = el(p + 'k2'); if (fan) fan.querySelector('svg').style.transform = 'rotate(' + ((t * 220) % 360).toFixed(1) + 'deg)'; }
    // apps fly from storage into the RAM sticks
    const ap = (d.apps || []).length ? B.at('ap', .3, .5, 'enter', { len: .9 }) : null;
    (d.apps || []).forEach((_, i) => {
      const q = ap ? seg(t, ap.s + i * .18, ap.s + i * .18 + .8) : 0, from = [705, 160 + i * 60], to = [430, 100 + i * 100];
      const x = lerp(from[0], to[0], eio(q)), y = lerp(from[1], to[1], eio(q)) - Math.sin(q * Math.PI) * 60;
      st(p + 'ap' + i, { opacity: String(cl(q * 4, 0, 1)), left: x.toFixed(1) + 'px', top: y.toFixed(1) + 'px', transform: 'scale(' + (.8 + .2 * eo(q)).toFixed(3) + ')' });
    });
    if (d.pin) up(p + d.pin.beat, B.p(d.pin.beat, .5, .6, 'enter'), 16);
    bdP3Frame(B, c, p, d);
    // pulses: a route storage → RAM → CPU, looping from its beat; in a bottleneck they queue at the weak part
    const route = d.pulse ? B.at(d.pulse.beat || 't1', .5, .7, 'enter', { focal: d.pulse.focal !== false }) : null;
    const trace = d.trace ? B.at('trace', .3, .5, 'enter') : null;
    const caseRecs = (d.cases || []).map((_, i) => ({ c: B.at('c' + (i + 1), .1 + i * .3, .2 + i * .3, 'enter'), x: B.at('x' + (i + 1), .15 + i * .3, .25 + i * .3, 'pop') }));
    let active = -1; caseRecs.forEach((r, i) => { if (t >= r.c.s) active = i; });
    const pc = active >= 0 ? 'var(--rose)' : 'var(--gold2)';
    const p0 = route ? route.s : trace ? trace.s : (d.cases || []).length ? 0 : null;
    for (let i = 0; i < 5; i++) {
      const id = p + 'pl' + i;
      if (p0 == null || t < p0) { st(id, { opacity: '0' }); continue; }
      let kk, vis = 1;
      const part = active >= 0 ? d.cases[active].part : null;
      if (part && t >= caseRecs[active].x.s) {
        // queued: stacked behind the weak part, nudging forward; storage drips them out slowly instead
        const qk = part === 'ram' ? .44 : part === 'cpu' ? .97 : null, wob = .006 * Math.sin(t * 6 + i);
        kk = qk != null ? qk - i * .055 + wob : (((t - p0) / 4.2 - i / 5) % 1 + 1) % 1 * .5;
      } else {
        const per = (d.pulse && d.pulse.per) || 1.8; kk = (((t - p0) / per - i / 5) % 1 + 1) % 1;
        vis = Math.min(1, seg(t, p0 + i * per / 5, p0 + i * per / 5 + .15)) * (1 - seg(kk, .92, 1));
      }
      const xy = bdAlong(BD_ROUTE, kk);
      st(id, { opacity: String(vis.toFixed(3)), left: xy[0].toFixed(1) + 'px', top: xy[1].toFixed(1) + 'px' });
      const pe = el(id); if (pe) pe.style.setProperty('--pc', pc);
    }
    // the CPU's own work: short pulses firing out along its traces
    const ops = d.ops ? B.at('ops', .5, .6, 'enter') : null;
    BD_OPS.forEach((path, i) => {
      if (!ops || t < ops.s) { st(p + 'op' + i, { opacity: '0' }); return; }
      const kk = (((t - ops.s) / .9 - i / 4) % 1 + 1) % 1, xy = bdAlong(path, kk);
      st(p + 'op' + i, { opacity: String((1 - kk).toFixed(3)), left: xy[0].toFixed(1) + 'px', top: xy[1].toFixed(1) + 'px' });
    });
    // bottleneck tracker + the part that flushes
    caseRecs.forEach((r, i) => {
      up(p + 'c' + (i + 1), r.c.p, 24);
      const nx = caseRecs[i + 1];
      if (nx) dim(p + 'c' + (i + 1), seg(t, nx.c.s, nx.c.s + BEAT.dim), .45);
      const part = d.cases[i].part, off = nx ? seg(t, nx.c.s, nx.c.s + .3) : 0;
      const hp = r.x.p * (1 - off);
      st(p + 'hot' + part, { opacity: String(hp.toFixed(3)), transform: 'scale(' + (1.08 - .08 * eo(r.x.p)).toFixed(4) + ')' });
    });
    // panel chips
    if (!d.extras) (d.chips || []).forEach((ch, i) => {
      const name = ch.beat || 'k' + (i + 1);
      up(p + name, B.p(name, .4 + i * .12, .52 + i * .12, 'enter'), 20);
    });
    castPlay(B, c, p, d.cast, d.bubbles);
    footIn(B, p); holdLife(B, p, d, { alias: Object.assign({ trace: 'board', ops: d.seat || 'cpu', t1: 'board', ap: 'ap0', ram: d.seat === 'ram' ? 'ram1' : 'skram', cpu: 'cpu', ssd: 'skssd', s3: 'skssd' }, d.alias || {}) });
  }
});
