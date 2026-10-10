/* recover: a self-healing run, top to bottom (projects/resilience-braandly, theme `incident`). A header with the
   service and a downtime clock, a vertical chain of steps that go queued → running → done on their beats, and the
   heart-monitor trace from `crash` coming back to life when the last step lands. A character can stand beside the
   chain and comment. Vertical where `pipeline` is a row: on a 9:16 stage four stage names do not fit side by side.
   data: {eyebrow, accent, h1, run:{title, meta}, steps:[{name, meta?}], clock?:{to}, badge?:{text, cls},
          cast?:[…], bubbles?:[…], sub?, foot?}
   beats: run · s1..sn (a step runs .45s, then settles) · badge · a1.. b1.. · sub */
const RC = { head: 92, gap: 22, rowH: 104, rowW: 600, ecg: 120, runLen: .45 };
const RC_ICON = '<svg viewBox="0 0 24 24" class="ck"><path d="m5 12.5 4.6 4.6L19 6.8"/></svg>';
defineTemplate('recover', {
  check: d => req(d, ['eyebrow', 'h1', 'run', 'steps'], 'recover'),
  beats: d => baseBeats(d).concat(['run'], seqN('s', d.steps.length), ['badge'], castBeats(d.cast, d.bubbles), ['sub']),
  html: (d, c) => {
    const p = c.p, W = c.grid.cw, y0 = RC.head + RC.gap + 8;
    const rows = d.steps.map((s, i) => `<div class="ic-step" id="${p}s${i + 1}" style="left:0;top:${y0 + i * (RC.rowH + RC.gap)}px;width:${RC.rowW}px;height:${RC.rowH}px">
        <span class="si" id="${p}si${i + 1}">${RC_ICON}</span><span class="sx"><b>${s.name}</b><i>${s.meta || ''}</i></span></div>
        ${i ? `<div class="ic-link" id="${p}cn${i + 1}" style="left:47px;top:${y0 + i * (RC.rowH + RC.gap) - RC.gap}px;height:${RC.gap}px"></div>` : ''}`).join('');
    const ecgY = y0 + d.steps.length * (RC.rowH + RC.gap) + 8, end = ecgY + RC.ecg;
    return `${heading(p, d)}<div class="content"><div class="rel" style="height:${end + (d.badge ? 110 : 0)}px">
      <div class="ic-rh" id="${p}run" style="left:0;top:0;width:${W}px;height:${RC.head}px"><span class="dot" id="${p}dot"></span><b>${d.run.title}</b>
        <i>${d.run.meta || 'downtime'} <span id="${p}clk">0.0s</span></i></div>
      ${rows}
      <div class="abs" id="${p}ecgw" style="left:0;top:${ecgY}px">${ecgHtml(p + 'ecg', W, RC.ecg, 'api heartbeat')}</div>
      ${d.badge ? `<div class="badge ${d.badge.cls || 'g'}" id="${p}bd" style="left:0;top:${end + 26}px;font-size:30px">${d.badge.text}</div>` : ''}
      ${castBlock(p, d.cast, d.bubbles)}
      ${subHtml(p, d.sub, end + (d.badge ? 130 : 30), W)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c), n = d.steps.length;
    headIn(B, p);
    const rq = B.at('run', .06, .16);
    up(p + 'run', rq.p, 20);
    let last = null, state = [];
    d.steps.forEach((s, i) => {
      const id = p + 's' + (i + 1), a = .22 + i * (.5 / n);
      up(id, seg(rq.p, .3 + i * .12, .8 + i * .05), 16);                 // the chain follows the header in, queued
      const r = B.at('s' + (i + 1), a, a + .5 / n, 'enter', { len: RC.runLen });
      const now = r.p <= 0 ? 'queued' : r.p < 1 ? 'run' : 'ok';
      const k = B.on ? seg(c.local, r.e, r.e + .3) : seg(t, r.fb, r.fb + .05);
      if (k > 0 && k < 1) st(id, { transform: 'scale(' + (1 + .04 * pulse(k)) + ')' });
      ['run', 'ok'].forEach(x => cls(id, x, now === x));
      st(p + 'si' + (i + 1), { transform: now === 'run' ? 'rotate(' + (((c.local || 0) * 540) % 360).toFixed(1) + 'deg)' : 'none' });
      if (i) { cls(p + 'cn' + (i + 1), 'ok', now !== 'queued'); fd(p + 'cn' + (i + 1), seg(rq.p, .3 + i * .12, .8 + i * .05)); }
      state.push(now); last = r;
    });
    const done = state[n - 1] === 'ok';
    cls(p + 'dot', 'ok', done);
    // the downtime clock runs from the first step until the service is back, then stops
    const first = B.at('s1', .22, .3, 'enter', { focal: false });
    const clk = B.on ? cl(c.local - first.s, 0, (last.e - first.s)) : cl(t - first.fa, 0, 1) * 4;
    txt(p + 'clk', clk.toFixed(1) + 's');
    // the trace is flat (the crash) until the last step lands, then the heartbeat comes back
    up(p + 'ecgw', seg(rq.p, .6, 1), 16);
    ecgFrame(p + 'ecg', c, c.grid.cw, RC.ecg, -99, B.on ? last.e : null);
    pp(p + 'bd', B.p('badge', .8, .9, 'pop'), .84);
    castPlay(B, c, p, d.cast, d.bubbles);
    up(p + 'sub', B.p('sub', .9, .98));
    footIn(B, p); holdLife(B, p, d, { alias: { badge: 'bd' } });
  }
});
