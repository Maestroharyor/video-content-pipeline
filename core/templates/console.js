/* console: AWS console mock with optional click flow (menu → item → confirmation modal), status change, badges and sub
   data: {eyebrow, accent, h1, console: awsConsole spec (no id/x/y), rowsIn?: n, select?: [rowIdx],
          menu?: [...], modal?: {...}, flow?: {x0, y0, times?}, states?: [[text,type],[..],[..]] (applied to stateRow, default 1),
          badges?: [{text, cls, x, y, size}], sub?, foot?, extra?: html} */
defineTemplate('console', {
  check: d => req(d, ['eyebrow', 'h1', 'console'], 'console'),
  beats: d => baseBeats(d).concat(['con'], seqN('row', d.rowsIn != null ? d.rowsIn : (d.console.rows || []).length), d.flow ? ['flow', 'flow.ok'] : [], seqN('bd', (d.badges || []).length), ['sub']),
  html: (d, c) => {
    const p = c.p, G = c.grid, w = G.cw;
    // the console mock is authored at 960x720; scale it to the content box (horizontal canvas, caption band)
    const k = Math.min(1, w / 960, (G.ch - 230) / 720), conH = Math.round(720 * k);
    return `${heading(p, d)}<div class="content"><div class="rel">
      <div style="position:absolute;left:0;top:0;width:960px;height:720px;transform:scale(${k.toFixed(4)});transform-origin:top left">${awsConsole(Object.assign({ id: p + 'con', x: 0, y: 0 }, d.console))}</div>
      ${d.menu ? awsMenu(p + 'menu', 0, 0, d.menu) : ''}${d.flow ? pointer(p + 'cur') : ''}${d.extra || ''}
      ${badges(p, d.badges, conH + 40)}
      ${subHtml(p, d.sub, conH + (G.canvas === 'vertical' ? 160 : 130), w)}</div></div>`;
  },
  setup: (root, d, c) => {
    const p = c.p;
    if (d.modal) document.getElementById(p + 'con').insertAdjacentHTML('beforeend', awsModal(p + 'md', 200, 110, d.modal));
    if (!d.flow) return;
    const btn = root.querySelector('#' + p + 'con ' + (d.flow.btn || '.aws-btn.dd'));
    const r = btn.getBoundingClientRect(), s = root.getBoundingClientRect();
    const m = document.getElementById(p + 'menu');
    m.style.left = (r.left - s.left - c.grid.cx) + 'px'; m.style.top = (r.bottom - s.top - c.grid.cy + 6) + 'px';
    const item = m.querySelector('.hl'); item.classList.remove('hl');
    root._flow = { cur: p + 'cur', menu: p + 'menu', modal: d.modal ? p + 'md' : null, btn, item, x0: d.flow.x0 || 380, y0: d.flow.y0 || 440, times: d.flow.times,
      b: centerOf(root, btn), i: centerOf(root, item), ok: d.modal ? centerOf(root, document.getElementById(p + 'md-ok')) : centerOf(root, item) };
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, root = document.getElementById(c.id), B = beats(c);
    headIn(B, p);
    up(p + 'con', B.p('con', .04, .18), 60);
    const n = d.rowsIn != null ? d.rowsIn : (d.console.rows || []).length;
    const rows = B.group('row', n, { a: .11, step: .03, len: .12, kind: 'enter' });
    for (let i = 1; i <= n; i++) up(p + 'con-r' + i, rows[i - 1].p, 16);
    (d.select || []).forEach((ri, k) => { const on = t > .16 + k * .03; cls(p + 'con-r' + ri + '-cb', 'on', on); cls(p + 'con-r' + ri, 'sel', on); });
    let phase = { confirmed: false, done: false };
    if (d.flow && root._flow) {
      // beat mode: slide the whole click flow so it starts on the `flow` beat, and stretch its tail so the confirm lands on `flow.ok`
      let times = root._flow.times, tt = t;
      if (B.on) {
        const f = B.at('flow', FLOW_T.in[0], FLOW_T.in[1], 'enter'), ok = B.M['flow.ok'] ? B.at('flow.ok', FLOW_T.clickOk[0], FLOW_T.clickOk[1], 'pop', { chain: false }) : null;
        const du = f.s / c.motion - FLOW_T.in[0], T = Object.assign({}, FLOW_T, times || {});
        const shifted = {}; for (const k in T) shifted[k] = [T[k][0] + du, T[k][1] + du];
        if (ok) { const want = ok.s / c.motion, have = shifted.clickOk[0], k0 = shifted.toOk[0], sc = (want - k0) / Math.max(.01, have - k0);
          ['toOk', 'clickOk', 'modalOut', 'curOut'].forEach(k => { shifted[k] = [k0 + (shifted[k][0] - k0) * sc, k0 + (shifted[k][1] - k0) * sc]; }); }
        for (const k in shifted) shifted[k] = [Math.min(1, shifted[k][0]), Math.min(1, shifted[k][1])];
        times = shifted;
      }
      phase = clickFlow(tt, Object.assign({}, root._flow, { times }));
    }
    if (d.states) {
      const row = d.stateRow || 1;
      const si = d.flow ? (!phase.confirmed ? 0 : !phase.done ? 1 : 2) : (t < .5 ? 0 : t < .7 ? 1 : 2);
      const sIdx = Math.min(si, d.states.length - 1);
      status(p + 'con-r' + row + '-st', d.states[sIdx][0], d.states[sIdx][1]);
    }
    badgesIn(B, p, (d.badges || []).length, d.flow ? .80 : .60);
    up(p + 'sub', B.p('sub', .86, .96));
    footIn(B, p); holdLife(B, p, d);
  }
});
