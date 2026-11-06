/* The prep family (projects/mise-version-manager, core/styles/prep.css). mise is named after mise-en-place, the
   kitchen habit of having every ingredient prepped and in its place before cooking, so the deck is a prep station
   seen from above, and the site it advertises (mise.jdx.dev) is shown as it really looks.
     station  one walnut board the video keeps returning to: a steel bowl per runtime, mismatched spice jars for the
              old one-per-language installers, mise's tin, recipe cards (mise.toml) and plain rows for a short list
     site     a phone showing mise.jdx.dev in its dark scheme: nav, hero, buttons, the install line, the mise.toml card

   ---------------- station ----------------
   data: {bowls?: [{name, src?, c}] (c = the ingredient colour when it fills), known?: n (bowls already labelled),
          filled?: [i], fills?: [{i, beat}] (bowl i fills on that beat), os?: {name, src},
          jars?: [{name, sub?, bowl?}] (in speech order; bowl = the 0-based bowl it stands on), jarsOn?: true (already on the board), struck?: [i], take?: 'strike'|'absorb',
          sweep?: beat (every jar still standing flies into the tin on it),
          tin?: {src}, tinOn?: true, recipes?: [{file, lines: [[key, value]] | [string]}], tick?: beat (recipes get a check),
          rows?: [{icon, text}], chips?: [{text, src?, icon?}], cast?, bubbles?}
   beats: board · os · m (the tin) · k1..kn (chips) · l1..ln (bowl labels) · t1..tn (jars land) · x1..xn (jar i is
          struck or absorbed) · p1..pn (recipes) · r1..rn (rows) · a1.. b1.. (cast, bubbles) */
const PR = { boardH: 660, bowl: 224, jarW: 150, jarH: 178, tin: 196, chipsH: 96, cardH: 172, cardGap: 22, rowH: 150 };
const prIcon = n => `<svg viewBox="0 0 24 24"><use href="#i-${n}"/></svg>`;
const prAcc = d => ACCENT_VAR[d.accent] ? `--acc:var(${ACCENT_VAR[d.accent]})` : '';
/* bowl centres on the board: a 2x2 grid */
const prBowl = (w, i) => ({ x: Math.round(w * (i % 2 ? .75 : .25)), y: i < 2 ? 178 : 470 });

function prStationHtml(d, c) {
  const p = c.p, w = c.grid.cw, bY = d.chips ? PR.chipsH : 0, mid = { x: w / 2, y: 324 };
  const bH = d.recipes && !d.bowls ? 36 + d.recipes.length * (PR.cardH + PR.cardGap) + 14 + (d.cast && d.recipes.length < 3 ? 120 : 0)
    : d.rows ? 60 + d.rows.length * (PR.rowH + 40) : PR.boardH;
  const bowls = (d.bowls || []).map((b, j) => {
    const i = j + 1, o = prBowl(w, j), known = i <= (d.known || 0);
    return `<div class="pr-bowl${known ? '' : ' empty'}" id="${p}bw${i}" style="left:${o.x - PR.bowl / 2}px;top:${o.y - PR.bowl / 2}px;width:${PR.bowl}px;height:${PR.bowl}px">
      <i class="fill" id="${p}f${i}" style="background:${b.c || 'var(--herb)'}"></i>
      <span class="tape" id="${p}l${i}">${b.src ? `<img src="${b.src}" alt="">` : ''}${b.name}</span></div>`;
  }).join('');
  const jars = (d.jars || []).map((j, k) => {
    const i = k + 1, o = prBowl(w, j.bowl != null ? j.bowl : k);
    return `<div class="pr-jar" id="${p}t${i}" style="left:${o.x - PR.jarW / 2}px;top:${o.y - PR.jarH / 2 - 16}px;width:${PR.jarW}px;height:${PR.jarH}px">
      <span class="lid"></span><span class="lb"><b>${j.name}</b>${j.sub ? `<i>${j.sub}</i>` : ''}</span><i class="x" id="${p}x${i}"></i></div>`;
  }).join('');
  const tin = d.tin ? `<div class="pr-tin" id="${p}m" style="left:${mid.x - PR.tin / 2}px;top:${mid.y - PR.tin / 2}px;width:${PR.tin}px;height:${PR.tin}px"><img src="${d.tin.src}" alt="mise"></div>` : '';
  const rw = w - 48 - (d.cast ? 250 : 0);
  const recipes = (d.recipes || []).map((r, k) => `<div class="pr-card" id="${p}p${k + 1}" style="left:24px;top:${36 + k * (PR.cardH + PR.cardGap)}px;width:${rw}px;height:${PR.cardH}px">
      <div class="hd"><span class="mn">≡</span>${r.file}<i class="ok" id="${p}ok${k + 1}">${prIcon('check')}</i></div>
      <div class="bd"><span class="sec">[tools]</span>${r.lines.map(l => Array.isArray(l) ? `<span><b>${l[0]}</b> = <em>"${l[1]}"</em></span>` : `<span>${l}</span>`).join('')}</div></div>`).join('');
  const rows = (d.rows || []).map((r, k) => `<div class="pr-row" id="${p}r${k + 1}" style="left:36px;top:${60 + k * (PR.rowH + 40)}px;width:${w - 72}px;height:${PR.rowH}px">
      <span class="ic">${prIcon(r.icon)}</span>${r.text}</div>`).join('');
  const os = d.os ? `<div class="pr-os" id="${p}os" style="left:${mid.x}px;top:${mid.y - 40}px">${d.os.src ? `<img src="${d.os.src}" alt="">` : ''}${d.os.name}</div>` : '';
  const chips = d.chips ? `<div class="pr-chips" style="top:0;width:${w}px">${d.chips.map((k, i) => `<span class="pr-chip" id="${p}k${i + 1}">${k.src ? `<img src="${k.src}" alt="">` : k.icon ? prIcon(k.icon) : ''}${k.text}</span>`).join('')}</div>` : '';
  return `${heading(p, d)}<div class="content"><div class="rel" style="${prAcc(d)}">${chips}
    <div class="pr-board" id="${p}board" style="top:${bY}px;width:${w}px;height:${bH}px">${bowls}${tin}${jars}${recipes}${rows}${os}
      ${castBlock(p, d.cast, d.bubbles)}</div></div></div>`;
}

function prStationFrame(u, c) {
  const p = c.p, d = c.data, B = beats(c), w = c.grid.cw;
  headIn(B, p);
  const board = B.at('board', .04, .14, 'enter', { focal: false });
  up(p + 'board', board.p, 40);
  pp(p + 'os', B.p('os', .3, .4, 'pop'), .6);
  B.group('k', (d.chips || []).length, { a: .2, step: .1, len: .12, kind: 'pop', dim: false }).forEach((r, i) => pp(p + 'k' + (i + 1), r.p, .7));
  // a bowl reads as an empty dashed ring until its label lands, then fills with its ingredient on its fill beat
  (d.bowls || []).forEach((b, j) => {
    const i = j + 1, known = i <= (d.known || 0);
    const l = known ? 1 : (B.M && B.M['l' + i] ? B.p('l' + i, .2, .3, 'pop') : 0);
    pp(p + 'l' + i, l, .5);
    if (!known) cls(p + 'bw' + i, 'empty', l < .5);
    const fr = (d.fills || []).find(f => f.i === i), filled = (d.filled || []).includes(i);
    const fq = filled ? 1 : fr && B.M && B.M[fr.beat] ? seg(c.local, B.M[fr.beat].s + j * .08, B.M[fr.beat].s + j * .08 + BEAT.bar) : 0;
    st(p + 'f' + i, { transform: 'scale(' + eo(fq).toFixed(4) + ')', opacity: String(cl(fq * 3, 0, 1)) });
  });
  const tin = d.tin ? (d.tinOn ? { p: 1, s: 0 } : B.at('m', .4, .5, 'pop')) : null;
  if (tin) pp(p + 'm', tin.p, .4);
  const sweep = d.sweep && B.M && B.M[d.sweep] ? B.M[d.sweep].s : null;
  (d.jars || []).forEach((j, k) => {
    const i = k + 1, id = p + 't' + i, o = prBowl(w, j.bowl != null ? j.bowl : k);
    const land = d.jarsOn ? 1 : B.p('t' + i, .1 + k * .12, .2 + k * .12, 'enter');
    const e = eo4(land), struck = (d.struck || []).includes(i);
    const xq = struck ? 1 : B.M && B.M['x' + i] ? B.p('x' + i, .5, .6, 'draw') : 0;
    // absorbed: the jar shrinks into the tin; swept: the same, on one beat for every jar still standing
    const take = d.take === 'absorb' ? xq : 0;
    const sw = sweep != null ? seg(c.local, sweep + k * .08, sweep + k * .08 + .55) : 0;
    const a = eo(Math.max(take, sw)), dx = (w / 2 - o.x) * a, dy = (324 - o.y + 16) * a;
    st(id, { opacity: String(cl(land * 2.4, 0, 1) * (1 - cl((a - .7) / .3, 0, 1))),
      transform: `translate(${dx.toFixed(1)}px,${(dy - (1 - e) * 170).toFixed(1)}px) scale(${(1 - .7 * a).toFixed(4)}) rotate(${((1 - e) * (k % 2 ? 9 : -9)).toFixed(2)}deg)` });
    if (d.take !== 'absorb') { st(p + 'x' + i, { transform: 'rotate(-38deg) scaleX(' + eo(xq).toFixed(4) + ')' }); if (xq > 0) dim(id, xq, .5); }
  });
  const tick = d.tick && B.M && B.M[d.tick] ? B.M[d.tick].s : null;
  B.group('p', (d.recipes || []).length, { a: .12, step: .12, len: .12, kind: 'enter', dim: false }).forEach((r, k) => {
    sx(p + 'p' + (k + 1), r.p, k % 2 ? 60 : -60);
    pp(p + 'ok' + (k + 1), tick == null ? 0 : seg(c.local, tick + k * .14, tick + k * .14 + BEAT.pop), .4);
  });
  B.group('r', (d.rows || []).length, { a: .15, step: .15, len: .12, kind: 'enter', dim: true }).forEach((r, k) => { sx(p + 'r' + (k + 1), r.p, -60); dim(p + 'r' + (k + 1), r.dim, .55); });
  castPlay(B, c, p, d.cast, d.bubbles, .3);
  footIn(B, p); holdLife(B, p, d, { alias: { m: 'm', board: 'board' } });
}

defineTemplate('station', {
  check: d => req(d, ['eyebrow', 'h1'], 'station'),
  beats: d => baseBeats(d).concat(['board', 'os', 'm'], seqN('k', (d.chips || []).length), seqN('l', (d.bowls || []).length),
    seqN('t', (d.jars || []).length), seqN('x', (d.jars || []).length), seqN('p', (d.recipes || []).length),
    seqN('r', (d.rows || []).length), castBeats(d.cast, d.bubbles)),
  html: prStationHtml,
  frame: prStationFrame,
});

/* ---------------- site ----------------
   mise.jdx.dev itself: the real screenshots taken for this video (projects/mise-version-manager/assets/web, dark scheme,
   mobile width at 2x), not a rebuilt mock. Two modes:
     page   a browser as wide as the column, its address bar on mise.jdx.dev, the full-page screenshot scrolling down
            from the hero as the line runs (data.shot, data.scroll: [from, to] in screenshot px at the column's width)
     shots  cropped pieces of the page as boxed cards that slide in from the left, one per beat, each a little further
            right than the last (data.shots: [{src, w, h}] in source px)
   The screenshots are background images, so a page clipped by the window is not an <img> sitting off the frame.
   data: {url, page?: {shot, w, h, scroll}, shots?: [...], chip?: {text}}
   beats: page (the browser / the first card) · s2..sn (the next cards) · logo · hl (start of the scroll) · k1 (the taped chip) */
const PS = { bar: 72, h: 780, step: 44 };
function psBar(url) {
  return `<div class="ms-bar"><i></i><i></i><i></i><span class="url"><svg viewBox="0 0 24 24"><use href="#i-lock"/></svg>${url}</span></div>`;
}
defineTemplate('site', {
  check: d => req(d, ['eyebrow', 'h1', 'url'], 'site'),
  beats: d => baseBeats(d).concat(['page', 'logo', 'hl'], seqN('s', (d.shots || []).length).slice(1), d.chip ? ['k1'] : []),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw;
    let inner = '';
    if (d.page) {
      const vh = PS.h - PS.bar, ih = Math.round(d.page.h * w / d.page.w);
      inner = `<div class="ms-win" id="${p}page" style="left:0;top:0;width:${w}px;height:${PS.h}px">${psBar(d.url)}
        <div class="ms-view" style="height:${vh}px"><div class="ms-shot" id="${p}pg" style="height:${ih}px;background-image:url('${d.page.shot}')"></div></div></div>`;
    } else {
      // the cards step right as they stack down, scaled so the stack fits the column's height
      const n = d.shots.length, cw = w - PS.step * (n - 1);
      const hs = d.shots.map(q => Math.round(q.h * cw / q.w)), gap = -40, tot = hs.reduce((a, b) => a + b, 0) + gap * (n - 1);
      const k = Math.min(1, PS.h / tot);
      let y = 0;
      inner = d.shots.map((q, i) => {
        const h = Math.round(hs[i] * k), ww = Math.round(cw * k), html = `<div class="ms-card${i === n - 1 ? ' hero' : ''}" id="${p}${i ? 's' + (i + 1) : 'page'}"
          style="left:${i * PS.step}px;top:${y}px;width:${ww}px;height:${h}px;background-image:url('${q.src}')"></div>`;
        y += h + gap; return html;
      }).join('') + `<div class="ms-url" style="right:0;top:-62px"><svg viewBox="0 0 24 24"><use href="#i-lock"/></svg>${d.url}</div>`;
    }
    return `${heading(p, d)}<div class="content"><div class="rel" style="${prAcc(d)}">${inner}
      ${d.chip ? `<span class="pr-chip tape" id="${p}k1" style="position:absolute;right:16px;top:${PS.h - 70}px">${d.chip.text}</span>` : ''}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c), w = c.grid.cw;
    headIn(B, p);
    const pg = B.at('page', .04, .16, 'enter', { focal: false });
    if (d.page) {
      up(p + 'page', pg.p, 70);
      // the page scrolls from the hl beat to just before the exit, slowest at both ends
      const hl = B.at('hl', .3, .9, 'enter', { focal: false }), end = Math.max(hl.s + 1, (c.exit != null ? c.exit : c.motion) - .6);
      const sc = d.page.scroll, y = sc[0] + (sc[1] - sc[0]) * eio(seg(c.local, hl.s, end));
      st(p + 'pg', { transform: 'translateY(' + (-y * w / d.page.w).toFixed(1) + 'px)' });
    } else {
      sx(p + 'page', pg.p, -260);
      d.shots.slice(1).forEach((_, i) => sx(p + 's' + (i + 2), B.p('s' + (i + 2), .3 + i * .2, .4 + i * .2, 'enter'), -260));
    }
    if (d.chip) { const k = B.p('k1', .8, .9, 'pop'); st(p + 'k1', { opacity: String(cl(k * 2.2, 0, 1)), transform: 'rotate(-4deg) scale(' + (.7 + .3 * bk(k)).toFixed(4) + ')' }); }
    footIn(B, p); holdLife(B, p, d, { alias: { page: 'page' } });
  }
});
