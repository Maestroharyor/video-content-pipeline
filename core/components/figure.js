/* Schematic figures for lines that would otherwise be a headline and one text panel with the bottom half of the
   frame empty. Each scene is stroked SVG plus glass tiles, drawn in the band below the content column, and is a
   pure function of (entrance progress, ctx.hold) like everything else the renderer captures.

   No filter and no backdrop-filter anywhere in here: the header of core/styles/aurora.css records that either one
   drops 4K capture from ~20 f/s to ~3 f/s.

   A slide opts in with `figure: { kind: 'concierge' }` in its data; statement and title carry the slot.
   A scene can carry `v: { y?, h, html, frame? }`: its own drawing for the vertical stage (a flow that runs down the frame
   instead of across it), with the same element ids so its horizontal frame() drives it unless it overrides one. */
/* BAND is the stage the scenes are drawn for: 1804x352 under the content column of the horizontal stage, ending at 864,
   just above the caption line. On the vertical stage the same scene is scaled to the full frame width (VBAND) under the
   content column (ending by 1300, above a social cut's caption band), so no scene has to be drawn twice. */
const FIG = { BAND: { x: 58, y: 512, w: 1804, h: 352 }, VBAND: { x: 0, y: 1080, w: 1080 },
  /* the part of the band each scene actually draws in [x0, y0, x1, y1], measured off the horizontal DNS deck: on the
     vertical stage that box, not the whole band, is scaled to the frame width, so a scene with empty margins grows */
  USED: { ask: [180, 90, 1620, 262], steps: [62, 96, 1742, 256], mall: [286, 80, 1504, 310], concierge: [10, 20, 1770, 334],
    pyramid: [352, 23, 1452, 338], anycast: [85, 10, 1719, 316], dial: [300, 76, 1504, 240], overload: [60, 30, 1744, 326],
    sites: [0, 24, 1804, 350], route: [0, 112, 1804, 314] } };

/* ---- shared parts ------------------------------------------------------------------------------------------ */
const fTile = o => `<div class="ft ${o.cls || ''}" id="${o.id}" style="left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px${o.st || ''}">`
  + (o.ico ? `<span class="fi" style="width:${o.is || 44}px;height:${o.is || 44}px"><svg viewBox="0 0 24 24"><use href="#${o.ico}"/></svg></span>` : '')
  + (o.n ? `<span class="fn"${o.ns ? ` style="font-size:${o.ns}px"` : ''}>${o.n}</span>` : '')
  + (o.s ? `<span class="fs"${o.ss ? ` style="font-size:${o.ss}px"` : ''}>${o.s}</span>` : '') + '</div>';
const fSvg = (id, B, body) => `<svg id="${id}" width="${B.w}" height="${B.h}" viewBox="0 0 ${B.w} ${B.h}">`
  + `<defs><marker id="${id}-a" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 1L9 5L0 9Z" fill="var(--acc,var(--teal))" stroke="none"/></marker></defs>${body}</svg>`;
const fPath = (id, d, cls) => `<path class="fp ${cls || ''}" id="${id}" d="${d}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>`;
/* wipe a path in and hand it its arrowhead only once it has actually arrived */
function fDraw(id, p, arrow) {
  const e = el(id); if (!e) return;
  const q = eo(cl(p, 0, 1));
  e.style.strokeDashoffset = (1 - q).toFixed(4);
  e.style.opacity = cl(q * 3, 0, 1).toFixed(3);
  e.classList.toggle('on', q > .02);
  if (arrow) e.setAttribute('marker-end', q > .96 ? `url(#${arrow})` : 'none');
}
const fRow = (n, w, gap, W) => { const total = n * w + (n - 1) * gap; return i => Math.round((W - total) / 2 + i * (w + gap)); };

FIG.kinds = {
  /* mark — one official brand logo with a caption, for a line that attributes something to a company or names a
     specific technology ("Anthropic calls it context rot", "I prefer Go for backend services"). The other kinds
     here are bespoke scenes; this one is the generic slot, because a statement that names a company should show
     that company's real mark rather than set its name in the body text again.
     data: { kind: 'mark', icon, brand?, label?, note? }  — icon/brand are logo() arguments, so the file comes
     from the project's fetched assets and its provenance is already recorded in SOURCES.md. */
  mark: {
    html: (p, f, B) => {
      const S = 150, x = Math.round(B.w / 2 - S / 2);
      /* no `.sq`: base.css:90 makes a square tile's image the full 150px, which is why these marks sat edge
         to edge with no breathing room. Plain `.ltile.lg` insets the image to 90px inside the 150px tile. */
      return `<div class="ltile lg" id="${p}tl" style="position:absolute;left:${x}px;top:40px">`
        + `<img src="${logo(f.icon, f.brand)}" alt="${f.label || ''}" onerror="this.remove()"></div>`
        + (f.label ? `<div class="fl on" id="${p}lb" style="left:0;top:${40 + S + 24}px;width:${B.w}px;text-align:center">${f.label}</div>` : '')
        + (f.note ? `<div class="fs2" id="${p}nt" style="left:0;top:${40 + S + 72}px;width:${B.w}px;text-align:center">${f.note}</div>` : '');
    },
    frame: (p, f, q, c) => {
      pp(p + 'tl', seg(q, 0, .62), .72);
      up(p + 'lb', seg(q, .40, .86), 14);
      up(p + 'nt', seg(q, .56, .96), 12);
      /* the mark breathes during the hold, the same idle every hero tile in the deck uses */
      const e = el(p + 'tl');
      if (e && c && c.hold > 0) e.style.transform = 'scale(' + idle(c.hold, .014, 4.6).toFixed(4) + ')';
    },
  },
  /* person — the recurring figure, for a line that asks the viewer to be someone ("think of yourself as a
     developer"). `src` is a full url (passet(...)), not a logo() name, because avatars are project assets.
     data: { kind: 'person', src, label?, note? } */
  person: {
    html: (p, f, B) => {
      const S = 156;
      return avatar({ id: p + 'av', x: Math.round(B.w / 2 - S / 2), y: 34, size: S, src: f.src, label: f.label })
        + (f.note ? `<div class="fs2" id="${p}nt" style="left:0;top:${34 + S + 74}px;width:${B.w}px;text-align:center">${f.note}</div>` : '');
    },
    frame: (p, f, q, c) => {
      pp(p + 'av', seg(q, 0, .68), .7);
      up(p + 'nt', seg(q, .52, .94), 12);
      const e = el(p + 'av');
      if (e && c && c.hold > 0) e.style.transform = 'scale(' + idle(c.hold, .012, 4.2).toFixed(4) + ')';
    },
  },
  /* marks — a ROW of official marks with a caption, for a line that is about a category of real products
     ("the same principle applies to LLMs") rather than about one company. `mark` is the singular version; this
     is the plural, and it exists because setting five product names in body text says far less than showing
     five marks the viewer already recognises.
     data: { kind: 'marks', items: [{icon, brand?, label?}], caption? } */
  marks: {
    html: (p, f, B) => {
      const it = f.items || [], n = it.length, S = 104, gap = 40;
      const x0 = fRow(n, S, gap, B.w);
      return it.map((m, i) => `<div class="ltile" id="${p}m${i + 1}" style="position:absolute;left:${x0(i)}px;top:44px">`
        + `<img src="${m.src || logo(m.icon, m.brand)}" alt="${m.label || ''}" onerror="this.remove()"></div>`).join('')
        + (f.caption ? `<div class="fs2" id="${p}cap" style="left:0;top:${44 + S + 36}px;width:${B.w}px;text-align:center">${f.caption}</div>` : '');
    },
    frame: (p, f, q, c) => {
      const it = f.items || [], n = it.length;
      it.forEach((_, i) => pp(p + 'm' + (i + 1), seg(q, (i / Math.max(1, n)) * .55, (i / Math.max(1, n)) * .55 + .40), .7));
      up(p + 'cap', seg(q, .62, .98), 12);
    },
  },
  /* 03 — the browser has a name and needs an address, and nothing in between knows how to get there yet */
  ask: {
    // vertical: name on top, the question on the line, the address underneath. Two tiles and a chip leave the
    // frame half empty at band size, so this one starts higher (the statement above it ends by ~860) and fills to 1550
    v: { y: 930, h: 620,
      html: (p, f, B) => fSvg(p + 'sv', B, fPath(p + 'ln', `M${B.w / 2} 230 V390`))
        + fTile({ id: p + 't1', x: B.w / 2 - 360, y: 10, w: 720, h: 220, ico: 'i-browser', is: 64, n: 'example.com', s: 'the name you type', ns: 56, ss: 30 })
        + `<div class="fc" id="${p}q" style="left:${B.w / 2}px;top:310px;transform:translate(-50%,-50%);font-size:48px;padding:14px 30px">?</div>`
        + fTile({ id: p + 't2', x: B.w / 2 - 360, y: 390, w: 720, h: 220, ico: 'i-server', is: 64, n: '— . — . — . —', s: 'the address it needs', ns: 56, ss: 30 }) },
    html: (p, f, B) => fSvg(p + 'sv', B, fPath(p + 'ln', 'M500 176 H1300'))
      + fTile({ id: p + 't1', x: 180, y: 90, w: 320, h: 172, ico: 'i-browser', n: 'example.com', s: 'the name you type', ns: 30 })
      + `<div class="fc" id="${p}q" style="left:${B.w / 2}px;top:176px;transform:translate(-50%,-50%);font-size:30px">?</div>`
      + fTile({ id: p + 't2', x: 1300, y: 90, w: 320, h: 172, ico: 'i-server', n: '— . — . — . —', s: 'the address it needs', ns: 30 }),
    frame: (p, f, q, c) => {
      pp(p + 't1', seg(q, 0, .34), .86); fDraw(p + 'ln', seg(q, .26, .70));
      pp(p + 't2', seg(q, .50, .84), .86);
      // one transform: pp() would write a bare scale() and throw away the chip's centring translate
      const qp = cl(seg(q, .72, 1), 0, 1);
      fd(p + 'q', cl(qp * 2.2, 0, 1));
      st(p + 'q', { transform: 'translate(-50%,-50%) scale(' + ((.5 + .5 * bk(qp)) * (c.hold > 0 ? idle(c.hold) : 1)).toFixed(4) + ')' });
    },
  },
  /* 06 — one lookup is four stops, so show four gaps between five boxes */
  steps: {
    // vertical: the five stops as a column, one gap between each
    v: { h: 460,
      html: (p, f, B) => {
        const N = [['i-browser', 'Browser'], ['i-net', 'Resolver'], ['i-globe', 'Root'], ['i-db', '.com'], ['i-server', 'Host']];
        const w = 460, h = 66, gap = 30, x = (B.w - w) / 2, y = i => 6 + i * (h + gap), links = [];
        for (let i = 0; i < 4; i++) links.push(fPath(p + 'l' + (i + 1), `M${B.w / 2} ${y(i) + h + 4} V${y(i + 1) - 6}`));
        return fSvg(p + 'sv', B, links.join(''))
          + N.map(([ico, n], i) => fTile({ id: p + 'n' + (i + 1), x, y: y(i), w, h, ico, n, ns: 30, is: 34, st: ';flex-direction:row;gap:20px' })).join('');
      } },
    html: (p, f, B) => {
      const N = [['i-browser', 'Browser'], ['i-net', 'Resolver'], ['i-globe', 'Root'], ['i-db', '.com'], ['i-server', 'Host']];
      const x = fRow(5, 288, 60, B.w), y = 96, links = [];
      for (let i = 0; i < 4; i++) links.push(fPath(p + 'l' + (i + 1), `M${x(i) + 288 + 10} ${y + 80} H${x(i + 1) - 12}`));
      return fSvg(p + 'sv', B, links.join(''))
        + N.map(([ico, n], i) => fTile({ id: p + 'n' + (i + 1), x: x(i), y, w: 288, h: 160, ico, n, ns: 30 })).join('');
    },
    frame: (p, f, q) => {
      for (let i = 0; i < 5; i++) pp(p + 'n' + (i + 1), seg(q, i * .15, i * .15 + .26), .86);
      for (let i = 0; i < 4; i++) fDraw(p + 'l' + (i + 1), seg(q, .10 + i * .15, .30 + i * .15), p + 'sv-a');
    },
  },
  /* 24 — you can read the sign; the unit number lives behind the desk */
  mall: {
    // vertical: the shop you can see above, the desk that knows the unit number below. The horizontal drawings are
    // moved by an outer <g>: pp() writes a CSS transform on the inner one, which would replace a transform attribute
    v: { h: 480,
      html: (p, f, B) => {
        const shop = `<g transform="translate(40 -76)"><g id="${p}shop" opacity="0"><path d="M300 262 H700 V132 H300 Z" class="fo fb"/><path d="M286 132 L340 80 H660 L714 132 Z" class="fo fa"/>`
          + `<rect x="344" y="166" width="312" height="56" rx="12" class="fo fa"/><path d="M430 262 V206 H570 V262" class="fo"/></g></g>`;
        const desk = `<g transform="translate(-764 160)"><g id="${p}desk" opacity="0"><path d="M1104 262 H1504 V196 H1104 Z" class="fo fb"/><path d="M1104 212 H1504" class="fo"/>`
          + `<path d="M1268 196 a64 64 0 0 0 -128 0 Z" class="fo fa"/><circle cx="1204" cy="178" r="7" class="fo fd"/></g></g>`;
        return fSvg(p + 'sv', B, shop + desk + fPath(p + 'ln', `M${B.w / 2} 202 V286`))
          + `<div class="fl on" id="${p}s1" style="left:384px;top:108px;width:312px;text-align:center">Chapel &amp; Co</div>`
          + `<div class="fl" id="${p}s2" style="left:340px;top:440px;width:400px;text-align:center">Information desk</div>`
          + `<div class="fc" id="${p}q" style="left:${B.w / 2 + 150}px;top:244px;transform:translate(-50%,-50%);font-size:28px">where is it?</div>`;
      } },
    html: (p, f, B) => {
      const shop = `<g id="${p}shop" opacity="0"><path d="M300 262 H700 V132 H300 Z" class="fo fb"/><path d="M286 132 L340 80 H660 L714 132 Z" class="fo fa"/>`
        + `<rect x="344" y="166" width="312" height="56" rx="12" class="fo fa"/><path d="M430 262 V206 H570 V262" class="fo"/></g>`;
      const desk = `<g id="${p}desk" opacity="0"><path d="M1104 262 H1504 V196 H1104 Z" class="fo fb"/><path d="M1104 212 H1504" class="fo"/>`
        + `<path d="M1268 196 a64 64 0 0 0 -128 0 Z" class="fo fa"/><circle cx="1204" cy="178" r="7" class="fo fd"/></g>`;
      return fSvg(p + 'sv', B, shop + desk + fPath(p + 'ln', 'M742 176 H1066'))
        + `<div class="fl on" id="${p}s1" style="left:344px;top:184px;width:312px;text-align:center">Chapel &amp; Co</div>`
        + `<div class="fl" id="${p}s2" style="left:1104px;top:284px;width:400px;text-align:center">Information desk</div>`
        + `<div class="fc" id="${p}q" style="left:904px;top:128px;transform:translate(-50%,-50%);font-size:26px">where is it?</div>`;
    },
    frame: (p, f, q, c) => {
      pp(p + 'shop', seg(q, 0, .32), .9); fd(p + 's1', seg(q, .16, .40));
      fDraw(p + 'ln', seg(q, .30, .66), p + 'sv-a');
      up(p + 'q', seg(q, .42, .66), 0);
      st(p + 'q', { transform: 'translate(-50%,-50%) scale(' + (c.hold > 0 ? idle(c.hold) : 1).toFixed(4) + ')' });
      pp(p + 'desk', seg(q, .56, .86), .9); fd(p + 's2', seg(q, .72, .96));
    },
  },
  /* 27 — you hand over one request; the desk makes every call and comes back once */
  concierge: {
    // vertical: you at the top hand the resolver one request; it makes the three calls below and hands one answer back
    v: { h: 470,
      html: (p, f, B) => {
        const cx = B.w / 2, tx = fRow(3, 290, 30, B.w);
        const desk = `<g transform="translate(${cx - 650} 20)"><g id="${p}desk" opacity="0"><path d="M470 268 H830 V200 H470 Z" class="fo fb"/><path d="M470 216 H830" class="fo"/>`
          + `<path d="M712 200 a62 62 0 0 0 -124 0 Z" class="fo fa"/><circle cx="650" cy="182" r="7" class="fo fd"/></g></g>`;
        const out = [0, 1, 2].map(i => fPath(p + 'o' + (i + 1), `M${cx + (i - 1) * 60} 290 C${cx + (i - 1) * 60} 330 ${tx(i) + 145} 320 ${tx(i) + 145} 372`)).join('');
        return fSvg(p + 'sv', B, desk + out + fPath(p + 'in', `M${cx - 40} 126 V196`) + fPath(p + 'bk', `M${cx + 190} 250 C${cx + 290} 220 ${cx + 290} 90 ${cx + 150} 70`))
          + fTile({ id: p + 'you', x: cx - 150, y: 6, w: 300, h: 120, ico: 'i-browser', n: 'You', s: 'one request', ns: 30, is: 36 })
          + [['i-globe', 'Root'], ['i-db', '.com'], ['i-server', 'Host']].map(([ico, n], i) =>
            fTile({ id: p + 'r' + (i + 1), x: tx(i), y: 372, w: 290, h: 88, ico, n, ns: 28, is: 34, st: ';flex-direction:row;gap:18px' })).join('')
          + `<div class="fl" id="${p}dl" style="left:${cx - 330}px;top:236px;width:160px;text-align:right">The resolver</div>`
          + `<div class="fc" id="${p}c1" style="left:${cx - 190}px;top:162px;transform:translate(-50%,-50%);font-size:24px">example.com?</div>`
          + `<div class="fc g" id="${p}c2" style="left:${cx + 330}px;top:150px;transform:translate(-50%,-50%);font-size:24px">9.10.11.12</div>`;
      } },
    html: (p, f, B) => {
      const desk = `<g id="${p}desk" opacity="0"><path d="M470 268 H830 V200 H470 Z" class="fo fb"/><path d="M470 216 H830" class="fo"/>`
        + `<path d="M712 200 a62 62 0 0 0 -124 0 Z" class="fo fa"/><circle cx="650" cy="182" r="7" class="fo fd"/></g>`;
      // start ys and end ys stay in the same order, so the three calls fan out without ever crossing each other
      const out = [64, 174, 284].map((ty, i) =>
        fPath(p + 'o' + (i + 1), `M840 ${212 + i * 16} C1060 ${212 + i * 16} 1160 ${ty} 1374 ${ty}`)).join('');
      const back = fPath(p + 'bk', 'M462 246 C400 282 336 288 254 264');
      return fSvg(p + 'sv', B, desk + out + back + fPath(p + 'in', 'M254 152 C338 138 400 170 462 208'))
        + fTile({ id: p + 'you', x: 10, y: 102, w: 240, h: 156, ico: 'i-browser', n: 'You', s: 'one request', ns: 30 })
        + [['i-globe', 'Root'], ['i-db', '.com'], ['i-server', 'Host']].map(([ico, n], i) =>
          fTile({ id: p + 'r' + (i + 1), x: 1374, y: 20 + i * 110, w: 396, h: 88, ico, n, ns: 28, is: 34, st: ';flex-direction:row;gap:20px' })).join('')
        + `<div class="fl" id="${p}dl" style="left:470px;top:288px;width:360px;text-align:center">The resolver</div>`
        + `<div class="fc" id="${p}c1" style="left:362px;top:112px;transform:translate(-50%,-50%);font-size:24px">example.com?</div>`
        + `<div class="fc g" id="${p}c2" style="left:356px;top:306px;transform:translate(-50%,-50%);font-size:24px">9.10.11.12</div>`;
    },
    frame: (p, f, q, c) => {
      pp(p + 'you', seg(q, 0, .26), .86);
      fDraw(p + 'in', seg(q, .16, .38), p + 'sv-a');
      up(p + 'c1', seg(q, .22, .40), 0); st(p + 'c1', { transform: 'translate(-50%,-50%)' });
      pp(p + 'desk', seg(q, .28, .54), .9); fd(p + 'dl', seg(q, .42, .62));
      // the three calls go out together, because that is the whole point: you made none of them
      for (let i = 0; i < 3; i++) {
        fDraw(p + 'o' + (i + 1), seg(q, .48 + i * .07, .74 + i * .07), p + 'sv-a');
        pp(p + 'r' + (i + 1), seg(q, .58 + i * .07, .84 + i * .07), .88);
      }
      fDraw(p + 'bk', seg(q, .82, 1));
      up(p + 'c2', seg(q, .88, 1), 0); st(p + 'c2', { transform: 'translate(-50%,-50%)' });
    },
  },
  /* 32 — one dot at the top, everything else hanging off it */
  pyramid: {
    html: (p, f, B) => {
      const cx = B.w / 2, t2 = fRow(3, 260, 80, B.w), t3 = fRow(6, 150, 40, B.w);
      const links = [];
      for (let i = 0; i < 3; i++) links.push(fPath(p + 'a' + (i + 1), `M${cx} 68 C${cx} 108 ${t2(i) + 130} 96 ${t2(i) + 130} 136`));
      for (let i = 0; i < 6; i++) links.push(fPath(p + 'b' + (i + 1), `M${t2(Math.floor(i / 2)) + 130} 226 C${t2(Math.floor(i / 2)) + 130} 256 ${t3(i) + 75} 246 ${t3(i) + 75} 276`));
      return fSvg(p + 'sv', B, links.join('') + `<circle id="${p}dot" cx="${cx}" cy="40" r="17" class="fo fd" opacity="0"/>`)
        + `<div class="fl" id="${p}dl" style="left:${cx + 40}px;top:28px">the root</div>`
        + ['.com', '.org', '.uk'].map((n, i) => fTile({ id: p + 't' + (i + 1), x: t2(i), y: 136, w: 260, h: 90, n, ns: 34 })).join('')
        + ['example', 'wikipedia', 'lifetech', 'mozilla', 'gov', 'ac'].map((n, i) =>
          fTile({ id: p + 'u' + (i + 1), x: t3(i), y: 276, w: 150, h: 62, n, ns: 22, cls: 'dim' })).join('');
    },
    frame: (p, f, q, c) => {
      pp(p + 'dot', seg(q, 0, .26), .3); fd(p + 'dl', seg(q, .12, .34));
      for (let i = 0; i < 3; i++) { fDraw(p + 'a' + (i + 1), seg(q, .20 + i * .06, .46 + i * .06)); pp(p + 't' + (i + 1), seg(q, .30 + i * .06, .56 + i * .06), .86); }
      for (let i = 0; i < 6; i++) { fDraw(p + 'b' + (i + 1), seg(q, .54 + i * .04, .76 + i * .04)); pp(p + 'u' + (i + 1), seg(q, .62 + i * .04, .84 + i * .04), .86); }
      if (c.hold > 0) st(p + 'dot', { transform: 'scale(' + idle(c.hold).toFixed(4) + ')', transformOrigin: 'center' });
    },
  },
  /* 34 — one address, answered by machines on four continents */
  anycast: {
    // vertical: the one address on top, four cities answering it in a 2x2 grid
    v: { h: 460,
      html: (p, f, B) => {
        const cx = B.w / 2, at = i => ({ x: i % 2 ? cx + 20 : cx - 460, y: 150 + Math.floor(i / 2) * 160 });
        const links = [0, 1, 2, 3].map(i => { const a = at(i); return fPath(p + 'l' + (i + 1), `M${cx} 80 C${cx} 120 ${a.x + 220} ${a.y - 60} ${a.x + 220} ${a.y}`); }).join('');
        return fSvg(p + 'sv', B, links)
          + `<div class="fc" id="${p}ip" style="left:${cx}px;top:44px;transform:translate(-50%,-50%);font-size:38px">199.7.83.42</div>`
          + ['Frankfurt', 'São Paulo', 'Singapore', 'Lagos'].map((s, i) => { const a = at(i);
            return fTile({ id: p + 'n' + (i + 1), x: a.x, y: a.y, w: 440, h: 136, ico: 'i-globe', n: s, s: 'same answer', ns: 30 }); }).join('');
      } },
    html: (p, f, B) => {
      const x = fRow(4, 356, 70, B.w), cx = B.w / 2;
      const links = [0, 1, 2, 3].map(i => fPath(p + 'l' + (i + 1), `M${cx} 86 C${cx} 134 ${x(i) + 178} 118 ${x(i) + 178} 166`)).join('');
      return fSvg(p + 'sv', B, links)
        + `<div class="fc" id="${p}ip" style="left:${cx}px;top:44px;transform:translate(-50%,-50%);font-size:34px">199.7.83.42</div>`
        + ['Frankfurt', 'São Paulo', 'Singapore', 'Lagos'].map((s, i) =>
          fTile({ id: p + 'n' + (i + 1), x: x(i), y: 166, w: 356, h: 150, ico: 'i-globe', n: s, s: 'same answer', ns: 28 })).join('');
    },
    frame: (p, f, q, c) => {
      up(p + 'ip', seg(q, 0, .26), 0); st(p + 'ip', { transform: 'translate(-50%,-50%)' });
      for (let i = 0; i < 4; i++) { fDraw(p + 'l' + (i + 1), seg(q, .18 + i * .10, .44 + i * .10)); pp(p + 'n' + (i + 1), seg(q, .28 + i * .10, .56 + i * .10), .86); }
      if (c.hold > 0) for (let i = 0; i < 4; i++) st(p + 'n' + (i + 1), { transform: 'scale(' + (1 + .006 * Math.sin(c.hold * 1.6 + i * 1.5)).toFixed(4) + ')' });
    },
  },
  /* 51 — the dial has a bad end on both sides */
  dial: {
    html: (p, f, B) => {
      const x0 = 300, x1 = B.w - 300, y = 168, seg3 = (x1 - x0) / 3;
      return fSvg(p + 'sv', B,
        `<path d="M${x0} ${y} H${x1}" class="fo fr" stroke-width="16" stroke-linecap="round"/>`
        + `<path id="${p}ok" d="M${x0 + seg3} ${y} H${x1 - seg3}" class="fo fg" stroke-width="16" stroke-linecap="round" opacity="0"/>`
        + `<g id="${p}kn" opacity="0"><circle cx="${B.w / 2}" cy="${y}" r="26" class="fo fd"/></g>`)
        + `<div class="fl" id="${p}la" style="left:${x0}px;top:${y + 46}px;width:${seg3}px;text-align:center">Too short</div>`
        + `<div class="fl on" id="${p}lb" style="left:${x0 + seg3}px;top:${y + 46}px;width:${seg3}px;text-align:center">Just enough</div>`
        + `<div class="fl" id="${p}lc" style="left:${x1 - seg3}px;top:${y + 46}px;width:${seg3}px;text-align:center">Too long</div>`
        + `<div class="fs2" id="${p}sa" style="left:${x0}px;top:${y - 92}px;width:${seg3}px;text-align:center">A lookup on every visit</div>`
        + `<div class="fs2" id="${p}sc" style="left:${x1 - seg3}px;top:${y - 92}px;width:${seg3}px;text-align:center">Days to see a change</div>`;
    },
    frame: (p, f, q, c) => {
      fd(p + 'sv', seg(q, 0, .24));
      fd(p + 'la', seg(q, .12, .34)); fd(p + 'lc', seg(q, .18, .40));
      up(p + 'sa', seg(q, .30, .54), 14); up(p + 'sc', seg(q, .38, .62), 14);
      pp(p + 'ok', seg(q, .56, .78), .6); fd(p + 'lb', seg(q, .66, .88));
      pp(p + 'kn', seg(q, .72, .94), .4);
      if (c.hold > 0) st(p + 'kn', { transform: 'translateX(' + (26 * Math.sin(c.hold * .9)).toFixed(1) + 'px)' });
    },
  },
  /* 56 — everything in the world arriving at one box */
  overload: {
    // vertical: every domain on earth arriving from above and below at one box
    v: { h: 470,
      html: (p, f, B) => {
        const cx = B.w / 2, cy = 235, arms = [];
        for (let i = 0; i < 10; i++) {
          const side = i % 2 ? 1 : -1, k = Math.floor(i / 2), sx = 110 + k * 215, ey = side < 0 ? 10 : 460;   // deterministic fan
          arms.push(fPath(p + 'a' + (i + 1), `M${sx} ${ey} C${sx} ${cy + side * 170} ${cx + (k - 2) * 50} ${cy + side * 150} ${cx + (k - 2) * 50} ${cy + side * 100}`));
        }
        return fSvg(p + 'sv', B, arms.join(''))
          + fTile({ id: p + 'sv2', x: cx - 200, y: cy - 96, w: 400, h: 192, ico: 'i-server', n: 'One server', s: 'every domain on earth', ns: 32, is: 52, cls: 'hot' });
      } },
    html: (p, f, B) => {
      const cx = B.w / 2, cy = 176, arms = [];
      for (let i = 0; i < 10; i++) {
        const side = i % 2 ? 1 : -1, row = Math.floor(i / 2);                 // deterministic fan, no randomness
        const y = 30 + row * 74, ex = side < 0 ? 60 : B.w - 60;
        arms.push(fPath(p + 'a' + (i + 1), `M${ex} ${y} C${cx + side * 420} ${y} ${cx + side * 300} ${cy} ${cx + side * 190} ${cy}`));
      }
      return fSvg(p + 'sv', B, arms.join(''))
        + fTile({ id: p + 'sv2', x: cx - 180, y: cy - 96, w: 360, h: 192, ico: 'i-server', n: 'One server', s: 'every domain on earth', ns: 32, is: 52, cls: 'hot' });
    },
    frame: (p, f, q, c) => {
      const e = cl(seg(q, 0, .30), 0, 1);
      fd(p + 'sv2', cl(e * 2.2, 0, 1));
      for (let i = 0; i < 10; i++) fDraw(p + 'a' + (i + 1), seg(q, .22 + i * .045, .52 + i * .045), p + 'sv-a');
      // it strains once everything has arrived, and keeps straining through the hold
      const load = seg(q, .70, 1), amp = c.hold > 0 ? 1 : load;
      const dx = 1.6 * amp * Math.sin((c.hold > 0 ? c.hold : 0) * 22 + load * 30);
      st(p + 'sv2', { transform: 'translateX(' + dx.toFixed(2) + 'px) scale(' + (.86 + .14 * bk(e)).toFixed(4) + ')' });
    },
  },
  /* 57 — hundreds of millions of them, and this is a few hundred squares */
  sites: {
    // vertical: the same 294 squares as a tall grid
    v: { h: 470,
      html: (p, f, B) => {
        const cols = 21, rows = 14, s = 22, gap = 9, w = cols * s + (cols - 1) * gap, x0 = Math.round((B.w - w) / 2), y0 = 6;
        let out = '';
        for (let i = 0; i < cols * rows; i++)
          out += `<rect id="${p}s${i}" x="${x0 + (i % cols) * (s + gap)}" y="${y0 + Math.floor(i / cols) * (s + gap)}" width="${s}" height="${s}" rx="5" class="fo fq" opacity="0"/>`;
        return fSvg(p + 'sv', B, out) + `<div class="fl" id="${p}lb" style="left:0;top:${y0 + rows * (s + gap) + 8}px;width:${B.w}px;text-align:center">and this is 294 of them</div>`;
      } },
    html: (p, f, B) => {
      const cols = 42, rows = 7, s = 30, gap = 12, w = cols * s + (cols - 1) * gap, x0 = Math.round((B.w - w) / 2), y0 = 24;
      let out = '';
      for (let i = 0; i < cols * rows; i++)
        out += `<rect id="${p}s${i}" x="${x0 + (i % cols) * (s + gap)}" y="${y0 + Math.floor(i / cols) * (s + gap)}" width="${s}" height="${s}" rx="7" class="fo fq" opacity="0"/>`;
      return fSvg(p + 'sv', B, out) + `<div class="fl" id="${p}lb" style="left:0;top:${y0 + rows * (s + gap) + 6}px;width:${B.w}px;text-align:center">and this is 294 of them</div>`;
    },
    frame: (p, f, q, c) => {
      const N = 42 * 7;
      for (let i = 0; i < N; i++) {
        const o = ((i * 37) % N) / N;                                          // deterministic scatter, not random
        const e = cl(seg(q, o * .72, o * .72 + .22), 0, 1);
        st(p + 's' + i, { opacity: (e * (.28 + .5 * (((i * 13) % 7) / 7))).toFixed(3) });
      }
      fd(p + 'lb', seg(q, .80, .98));
      if (c.hold > 0) st(p + 'sv', { opacity: (.92 + .08 * idle(c.hold) * 1.01).toFixed(3) });
    },
  },
  /* 63 — the whole route, replayed at the speed it actually happens */
  route: {
    // vertical: the five stops as a column, the light running down it
    v: { h: 470,
      html: (p, f, B) => {
        const N = [['i-browser', 'Browser'], ['i-net', 'Resolver'], ['i-globe', 'Root'], ['i-db', '.com'], ['i-server', 'Host']];
        const w = 460, h = 64, gap = 24, x = (B.w - w) / 2, y = i => i * (h + gap), links = [];
        for (let i = 0; i < 4; i++) links.push(`<path id="${p}t${i + 1}" d="M${B.w / 2} ${y(i) + h + 4} V${y(i + 1) - 4}" class="fo ft2"/>`);
        return fSvg(p + 'sv', B, links.join('') + `<circle id="${p}dot" cx="${B.w / 2 - w / 2 - 34}" cy="0" r="11" class="fo fd" opacity="0"/>`)
          + N.map(([ico, n], i) => fTile({ id: p + 'n' + (i + 1), x, y: y(i), w, h, ico, n, ns: 28, is: 32, st: ';flex-direction:row;gap:20px' })).join('')
          + `<div class="fl" id="${p}lb" style="left:0;top:${y(4) + h + 22}px;width:${B.w}px;text-align:center">all of it, before the page paints</div>`;
      },
      frame: (p, f, q, c) => {
        const y = i => i * 88 + 32;
        for (let i = 0; i < 5; i++) pp(p + 'n' + (i + 1), seg(q, i * .09, i * .09 + .22), .88);
        for (let i = 0; i < 4; i++) fd(p + 't' + (i + 1), seg(q, .10 + i * .09, .30 + i * .09));
        fd(p + 'lb', seg(q, .62, .84));
        const lap = 1.1, u = c.hold > 0 ? (c.hold % lap) / lap : cl(seg(q, .46, 1), 0, 1);
        st(p + 'dot', { opacity: (q > .44 ? Math.min(1, u * 8, (1 - u) * 8) : 0).toFixed(3), transform: 'translateY(' + lerp(y(0), y(4), u).toFixed(1) + 'px)' });
        for (let i = 0; i < 5; i++) cls(p + 'n' + (i + 1), 'hot', Math.abs(u - i / 4) < .08 && q > .44);
      } },
    html: (p, f, B) => {
      const N = [['i-browser', 'Browser'], ['i-net', 'Resolver'], ['i-globe', 'Root'], ['i-db', '.com'], ['i-server', 'Host']];
      const x = fRow(5, 268, 74, B.w), y = 112, links = [];
      for (let i = 0; i < 4; i++) links.push(`<path id="${p}t${i + 1}" d="M${x(i) + 268 + 8} ${y + 72} H${x(i + 1) - 8}" class="fo ft2"/>`);
      return fSvg(p + 'sv', B, links.join('') + `<circle id="${p}dot" cx="0" cy="${y + 72}" r="11" class="fo fd" opacity="0"/>`)
        + N.map(([ico, n], i) => fTile({ id: p + 'n' + (i + 1), x: x(i), y, w: 268, h: 144, ico, n, ns: 28 })).join('')
        + `<div class="fl" id="${p}lb" style="left:0;top:${y + 176}px;width:${B.w}px;text-align:center">all of it, before the page paints</div>`;
    },
    frame: (p, f, q, c) => {
      const x = fRow(5, 268, 74, FIG.BAND.w);
      for (let i = 0; i < 5; i++) pp(p + 'n' + (i + 1), seg(q, i * .09, i * .09 + .22), .88);
      for (let i = 0; i < 4; i++) fd(p + 't' + (i + 1), seg(q, .10 + i * .09, .30 + i * .09));
      fd(p + 'lb', seg(q, .62, .84));
      // one light runs the whole chain, loops through the hold, and each box lights as it passes
      const lap = 1.1, u = c.hold > 0 ? (c.hold % lap) / lap : cl(seg(q, .46, 1), 0, 1);
      const cx = lerp(x(0) + 134, x(4) + 134, u);
      st(p + 'dot', { opacity: (q > .44 ? Math.min(1, u * 8, (1 - u) * 8) : 0).toFixed(3), transform: 'translateX(' + cx.toFixed(1) + 'px)' });
      for (let i = 0; i < 5; i++) cls(p + 'n' + (i + 1), 'hot', Math.abs(u - i / 4) < .08 && q > .44);
    },
  },
};

/* ---- the slot templates use ---------------------------------------------------------------------------------- */
function figHtml(p, f) {
  if (!f || !FIG.kinds[f.kind]) return '';
  const B = FIG.BAND, K = FIG.kinds[f.kind], acc = ACCENT_VAR[f.accent] ? `;--acc:var(${ACCENT_VAR[f.accent]})` : '';
  if ((window.GRID || {}).canvas !== 'vertical')
    return `<div class="fig" id="${p}fig" style="left:${B.x}px;top:${B.y}px;width:${B.w}px;height:${B.h}px${acc}">${K.html(p + 'g', f, B)}</div>`;
  const V = FIG.VBAND;
  if (K.v) {
    // a scene drawn for the vertical stage: full frame width, its own height, its own layout
    const VB = { w: V.w, h: K.v.h };
    return `<div class="fig" id="${p}fig" style="left:0;top:${K.v.y || V.y}px;width:${VB.w}px;height:${VB.h}px${acc}">${K.v.html(p + 'g', f, VB)}</div>`;
  }
  // otherwise the horizontal drawing, its used box scaled to the frame width
  const PAD = 30, [x0, y0, x1, y1] = FIG.USED[f.kind] || [0, 0, B.w, B.h];
  const k = Math.min(1, (V.w - 2 * PAD) / (x1 - x0)), h = Math.round((y1 - y0) * k + 2 * PAD);
  const tx = (V.w - (x1 - x0) * k) / 2 - x0 * k, ty = PAD - y0 * k;
  return `<div class="fig" id="${p}fig" style="left:${V.x}px;top:${V.y}px;width:${V.w}px;height:${h}px${acc}">`
    + `<div style="position:absolute;left:0;top:0;width:${B.w}px;height:${B.h}px;transform:translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${k.toFixed(4)});transform-origin:0 0">${K.html(p + 'g', f, B)}</div></div>`;
}
function figIn(B, p, f, c) {
  if (!f || !FIG.kinds[f.kind]) return;
  const r = B.at('fig', .46, .70, 'enter', { len: 1.6 });   // a scene is a short sequence, not a single entrance
  up(p + 'fig', cl(r.p * 2.6, 0, 1), 26);
  const K = FIG.kinds[f.kind], vf = (window.GRID || {}).canvas === 'vertical' && K.v && K.v.frame;
  (vf || K.frame)(p + 'g', f, cl(r.p, 0, 1), c);   // a vertical variant shares its element ids, so only a geometry-driven frame is redefined
}
