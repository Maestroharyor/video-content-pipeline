/* stackcode: the same storage task, written in one stack. A write-path rail across the top
   (language → abstraction → platform API → store) whose stages light in the order the narration walks them,
   one or two code panes underneath, and an optional task chip ("darkMode = true") that names what is being saved.
   Forty-odd slides of this deck are the same four tasks in a different stack, so the layout is deliberately
   identical every time: only the rail, the badge and the code change, which is what makes the comparison legible.
   The chip and the badges live in the left column under the headline; the rail and the panes own the content box.
   data: {eyebrow, accent, h1, h1size?, chip?, rail?:[{label, icon?, brand?}],
          panes:[{badge?, icon?, brand?, file?, cls?, tight?, lines:[html]}],
          badge?:{text,cls} | badges?:[{text,cls}], sub?, foot?}
   Code lines carry the shared syntax spans (.k .s .n .c .f .p). Keep a pane at or under 15 lines (18 when
   `tight`): the pane is sized from its line count and the content column stops at the caption band.
   beats: chip · r1..rn (rail stages) · p1 p2 (panes) · p<i>l<j> (pane i's line j; the first line's beat starts
   the whole cascade, so `p1l1:"our code"` reveals the body on that word) · badge / bd1..bdn · sub */
const SC = { railH: 62, barH: 46, padY: 34, lh: 33.5, lhT: 28, gap: 24 };
const scPaneH = pn => Math.round(SC.barH + SC.padY + pn.lines.length * (pn.tight ? SC.lhT : SC.lh));
const scRail = (p, rail, y) => rail.length ? `<div class="sc-rail" id="${p}rail" style="left:0;top:${y}px">`
  + rail.map((s, i) => `${i ? `<span class="sl"></span>` : ''}<div class="st" id="${p}r${i + 1}">
      ${s.icon ? `<img src="${logo(s.icon, s.brand === undefined ? true : s.brand)}" alt="" onerror="this.remove()">` : ''}<span>${s.label}</span></div>`).join('') + '</div>' : '';
const scPane = (p, d, pn, i, x, y, w, h) => `<div class="sc-pane ${pn.cls || d.accent || 'a'}${pn.tight ? ' tight' : ''}" id="${p}p${i + 1}"
    style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
    <div class="pb">${pn.icon ? `<img src="${logo(pn.icon, pn.brand === undefined ? true : pn.brand)}" alt="" onerror="this.remove()">` : ''}${pn.badge || ''}${pn.file ? `<i>${pn.file}</i>` : ''}</div>
    <pre>${pn.lines.map((l, j) => `<span class="cl" id="${p}p${i + 1}l${j + 1}">${l}</span>`).join('')}</pre></div>`;
defineTemplate('stackcode', {
  check: d => {
    req(d, ['eyebrow', 'h1', 'panes'], 'stackcode');
    if (!d.panes.length || d.panes.length > 2) throw new Error('template "stackcode": one or two panes');
    d.panes.forEach((pn, i) => { if (!pn.lines) throw new Error('template "stackcode": panes[' + i + '].lines is required'); });
  },
  beats: d => baseBeats(d).concat(['chip', 'sub'], seqN('r', (d.rail || []).length), seqN('p', d.panes.length),
    d.badges ? seqN('bd', d.badges.length) : ['badge'],
    d.panes.reduce((a, pn, i) => a.concat(seqN('p' + (i + 1) + 'l', pn.lines.length)), [])),
  html: (d, c) => {
    if (c.grid.canvas === 'vertical') return TEMPLATES.stackcode.vhtml(d, c);
    const p = c.p, w = c.grid.cw, H = c.grid.ch, rail = d.rail || [], np = d.panes.length;
    const list = d.badges || (d.badge ? [d.badge] : []);
    const ids = d.badges ? list.map((_, i) => p + 'bd' + (i + 1)) : [p + 'bd'];
    const top = rail.length ? SC.railH + 30 : 0;
    const railHtml = scRail(p, rail, 0);
    // The chip names what is being saved, so it belongs under the headline in the left column, not crowded
    // against the rail's last stage. The badges stack under it, in the same column and the same slide-root
    // coordinates: they used to be pinned to the right of the content box, where badge 1 collided with the rail's
    // last stage and badges 2..n sat inside the pane box, under an opaque pane. The left column is empty between
    // the headline and the footnote on every slide this template makes, so nothing has to give way for them.
    const chipY = c.grid.h1Y + 250;
    const chipHtml = d.chip ? `<div class="sc-chip" id="${p}chip" style="left:var(--gx);top:${chipY}px">${d.chip}</div>` : '';
    const bdY = chipY + (d.chip ? 76 : 0);
    const badgeHtml = list.map((b, i) => `<div class="badge ${b.cls || 'n'}" id="${ids[i]}" style="left:var(--gx);top:${bdY + i * 68}px;font-size:26px">${b.text}</div>`).join('');
    const paneW = np === 1 ? w : Math.floor((w - SC.gap) / 2);
    const tall = Math.max(...d.panes.map(pn => Math.round(SC.barH + SC.padY + pn.lines.length * (pn.tight ? SC.lhT : SC.lh))));
    // Top-anchored: a short pane block belongs under the eyebrow, not floating mid-frame with dead space
    // above it. The cap is deliberately small, so extra room is absorbed downward instead of as padding.
    const padT = Math.max(0, Math.min(40, Math.round((H - top - tall) / 3)));
    const panes = d.panes.map((pn, i) => scPane(p, d, pn, i, i * (paneW + SC.gap), top + padT, paneW, Math.min(scPaneH(pn), H - top))).join('');
    return `${heading(p, d)}${chipHtml}${badgeHtml}<div class="content"><div class="rel">${railHtml}${panes}
      ${subHtml(p, d.sub, Math.min(top + padT + tall + 26, H - 80), w)}</div></div>`;
  },
  /* 9:16: one column, read top to bottom. The chip and the badges have no empty left column to live in here
     (the headline spans the frame), so they join the content block: chip, rail, the panes stacked rather than
     side by side (two 388px panes cut every code line in half), then the badges in a row. vfit scales the
     whole block to the frame, so nothing below measures the stage. */
  vhtml: (d, c) => {
    const p = c.p, w = c.grid.cw, rail = d.rail || [];
    const list = d.badges || (d.badge ? [d.badge] : []);
    const ids = d.badges ? list.map((_, i) => p + 'bd' + (i + 1)) : [p + 'bd'];
    let y = 0;
    const chipHtml = d.chip ? `<div class="sc-chip" id="${p}chip" style="left:0;top:${y}px">${d.chip}</div>` : '';
    if (d.chip) y += 76;
    const railHtml = scRail(p, rail, y);
    if (rail.length) y += SC.railH + 30;
    const panes = d.panes.map((pn, i) => { const h = scPaneH(pn), html = scPane(p, d, pn, i, 0, y, w, h); y += h + SC.gap; return html; }).join('');
    const badgeHtml = list.map((b, i) => `<div class="badge ${b.cls || 'n'}" id="${ids[i]}" style="left:0;top:${y + 4 + i * 68}px;font-size:26px">${b.text}</div>`).join('');
    y += list.length ? 4 + list.length * 68 : 0;
    return `${heading(p, d)}<div class="content"><div class="rel">${chipHtml}${railHtml}${panes}${badgeHtml}
      ${subHtml(p, d.sub, y + 10, w)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, rail = d.rail || [], np = d.panes.length, B = beats(c);
    headIn(B, p);
    pp(p + 'chip', B.p('chip', .08, .20, 'pop'), .8);
    // the rail: stages arrive left to right, and a stage stays lit once the narration has passed it
    const st = B.group('r', rail.length, { a: .10, step: .05, len: .12, kind: 'enter', dim: false });
    // only the stage the narration is on stays hot; the ones behind it settle to 'done'
    let live = -1;
    st.forEach((r, i) => { if (r.p > .5) live = i; });
    st.forEach((r, i) => { const id = p + 'r' + (i + 1); sx(id, r.p, -34);
      cls(id, 'lit', i === live); cls(id, 'done', r.p > .5 && i !== live); });
    const panes = B.group('p', np, { a: .20, step: .10, len: ENTER.len, kind: 'enter', dim: false });
    panes.forEach((r, i) => {
      sx(p + 'p' + (i + 1), r.p, -90);
      const n = d.panes[i].lines.length;
      B.group('p' + (i + 1) + 'l', n, { a: r.fa + .08, step: Math.min(.04, .42 / n), len: .14, kind: 'enter' })
        .forEach((lr, j) => codeLine(p + 'p' + (i + 1) + 'l' + (j + 1), lr.p));
    });
    if (d.badges) B.group('bd', d.badges.length, { a: .70, step: .06, len: .10, kind: 'pop' }).forEach((r, i) => pp(p + 'bd' + (i + 1), r.p, .84));
    else pp(p + 'bd', B.p('badge', .66, .78, 'pop'), .84);
    up(p + 'sub', B.p('sub', .84, .94));
    footIn(B, p); holdLife(B, p, d);
  }
});
