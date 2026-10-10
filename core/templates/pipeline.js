/* pipeline: one CI run. A header (run number, commit, branch), a row of stages that go queued → running →
   passed or failed on their beats, an optional log tail and an optional rollback row (projects/cloud-vs-devops).
   data: {eyebrow, accent, h1, run:{title, meta, state?:'run'|'ok'|'fail'}, stages:[{name, meta?, pre?, st?}],
          log?:[{s: stage number, text: html}], rollback?:{text, meta}, badge?:{text, cls}, sub?, foot?}
   pre = the stage's state on the first frame ('ok' | 'fail' | 'run' | 'queued', default 'queued'): a slide that
   continues the previous run starts where that one stopped. st = the state its beat turns it into ('ok' | 'fail');
   a stage with no st keeps its pre state for the whole slide. A beat runs the stage for .45s, then settles it.
   The header dot follows the run: red once any stage has failed, green when the last stage passes.
   beats: run · s1..n · rb · badge · sub */
const PL = { headH: 96, gap: 26, stH: 150, cGap: 30, logLh: 36, rbH: 80, runLen: .45 };
const PL_ICON = '<svg viewBox="0 0 24 24" class="ck"><path d="m5 12.5 4.6 4.6L19 6.8"/></svg><svg viewBox="0 0 24 24" class="x"><path d="M7 7l10 10"/><path d="M17 7 7 17"/></svg>';
function plLayout(d, G) {
  const n = d.stages.length, stW = Math.floor((G.cw - (n - 1) * PL.cGap) / n);
  const stY = PL.headH + PL.gap, logY = stY + PL.stH + PL.gap;
  const logH = d.log ? 32 + d.log.length * PL.logLh : 0;
  const rbY = logY + (d.log ? logH + PL.gap : 0);
  return { n, stW, stY, logY, logH, rbY, end: rbY + (d.rollback ? PL.rbH : 0) };
}
defineTemplate('pipeline', {
  check: d => req(d, ['eyebrow', 'h1', 'run', 'stages'], 'pipeline'),
  /* v2 overlays (projects/cloud-vs-devops): peek: {file, lines, until?} a file window that slides in over the right side
     (beats peek, pl1..n; it slides out again when the `until` stage's beat starts) · stamp: {text} a rubber stamp over the last stage (beat stamp) · term: {steps, cwd} a terminal
     over the log (beats term, tc1.., to1..) · pager: {title, body} an on-call phone that buzzes in (beat pager)
     · chips: [{text, cls}] a row under the run (k1..kn) */
  beats: d => baseBeats(d).concat(['run'], seqN('s', d.stages.length), ['rb', 'badge', 'sub'],
    d.peek ? ['peek'].concat(seqN('pl', d.peek.lines.length)) : [], d.stamp ? ['stamp'] : [],
    d.term ? ['term'].concat(tmBeats(d.term.steps, 't')) : [], d.pager ? ['pager'] : [], seqN('k', (d.chips || []).length)),
  html: (d, c) => {
    const p = c.p, G = c.grid, L = plLayout(d, G);
    const stages = d.stages.map((s, i) => {
      const x = i * (L.stW + PL.cGap);
      const cn = i ? `<div class="pl-cn" id="${p}cn${i + 1}" style="left:${x - PL.cGap}px;top:${L.stY + PL.stH / 2 - 1}px;width:${PL.cGap}px"></div>` : '';
      return `${cn}<div class="pl-st ${s.pre || ''}" id="${p}s${i + 1}" style="left:${x}px;top:${L.stY}px;width:${L.stW}px;height:${PL.stH}px">
        <span class="si" id="${p}si${i + 1}">${PL_ICON}</span><span class="sn">${s.name}</span><span class="sm">${s.meta || ''}</span></div>`;
    }).join('');
    const log = d.log ? `<div class="pl-log" id="${p}log" style="left:0;top:${L.logY}px;width:${G.cw}px;height:${L.logH}px">${d.log.map((l, i) => `<span class="lg" id="${p}lg${i + 1}">${l.text}</span>`).join('')}</div>` : '';
    const rb = d.rollback ? `<div class="pl-rb" id="${p}rb" style="left:0;top:${L.rbY}px;width:${G.cw}px"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4.5v4.2h4.2"/></svg>${d.rollback.text}<i>${d.rollback.meta || ''}</i></div>` : '';
    return `${heading(p, d)}<div class="content"><div class="rel">
      <div class="pl-head" id="${p}run" style="left:0;top:0;width:${G.cw}px;height:${PL.headH}px"><span class="dot" id="${p}dot"></span><b>${d.run.title}</b><i>${d.run.meta || ''}</i></div>
      ${stages}${log}${rb}
      ${d.peek ? `<div class="code pl-peek" id="${p}peek" style="position:absolute;left:${G.cw - 600}px;top:${PL.headH - 20}px;width:600px"><div class="bar"><i></i><i></i><i></i><span>${d.peek.file}</span></div>
        <pre style="font-size:21px;line-height:34px;padding:18px 24px">${d.peek.lines.map((l, i) => `<span class="cl" id="${p}pl${i + 1}">${l}</span>`).join('')}</pre></div>` : ''}
      ${d.stamp ? `<div class="pl-stamp" id="${p}stamp" style="left:${d.stamp.x != null ? d.stamp.x : G.cw - 820}px;top:${d.stamp.y != null ? d.stamp.y : L.stY - 76}px">${d.stamp.text}</div>` : ''}
      ${d.term ? tmWin({ id: p + 'term', p, pre: 't', steps: d.term.steps, cwd: d.term.cwd, x: d.term.x || 0, y: d.term.y != null ? d.term.y : L.logY - 10, w: d.term.w || 900, accent: 'r', small: true, cls: 'pl-term' }) : ''}
      ${d.pager ? `<div class="pl-phone" id="${p}pager" style="left:${d.pager.x != null ? d.pager.x : G.cw - 330}px;top:${d.pager.y != null ? d.pager.y : PL.headH + 10}px"><div class="ph-top">3:07 AM</div>
        <div class="ph-note"><b><svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;vertical-align:-3px"><use href="#i-bell"/></svg> ${d.pager.title}</b><span>${d.pager.body}</span></div></div>` : ''}
      ${d.chips ? `<div style="position:absolute;left:0;top:${L.end + 30}px;display:flex;gap:16px">${d.chips.map((k, i) => `<span class="chip ${k.cls || 'g'}" id="${p}k${i + 1}">${k.text}</span>`).join('')}</div>` : ''}
      ${d.badge ? `<div class="badge ${d.badge.cls || 'r'}" id="${p}bd" style="left:0;top:${L.end + 30}px;font-size:30px">${d.badge.text}</div>` : ''}
      ${subHtml(p, d.sub, L.end + (d.badge ? 120 : 30), G.cw)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c), n = d.stages.length;
    headIn(B, p);
    const rq = B.p('run', .08, .20);
    up(p + 'run', rq, 22);
    const state = [];
    d.stages.forEach((s, i) => {
      const id = p + 's' + (i + 1), a = .24 + i * (.5 / n);
      up(id, seg(rq, .3 + i * .1, .8 + i * .04), 16);      // the stage row follows the header in, left to right
      let now = s.pre || 'queued';
      if (s.st) {
        const r = B.at('s' + (i + 1), a, a + .5 / n, 'enter', { len: PL.runLen });
        if (r.p > 0 && r.p < 1) now = 'run';
        else if (r.p >= 1) now = s.st;
        // the settle pops once: scale overshoot over the .3s after the run ends
        const k = B.on ? seg(c.local, r.e, r.e + .3) : seg(t, r.fb, r.fb + .05);
        if (k > 0 && k < 1) st(id, { transform: 'scale(' + (1 + .05 * pulse(k)) + ')' });   // after the entrance, so it never fights up()
      }
      ['run', 'ok', 'fail'].forEach(k => cls(id, k, now === k));
      // the running ring turns (a pure function of ctx.local)
      st(p + 'si' + (i + 1), { transform: now === 'run' ? 'rotate(' + (((c.local || 0) * 540) % 360).toFixed(1) + 'deg)' : 'none' });
      if (i) { cls(p + 'cn' + (i + 1), 'ok', state[i - 1] === 'ok' && now !== 'queued'); fd(p + 'cn' + (i + 1), seg(rq, .3 + i * .1, .8 + i * .04)); }   // connectors arrive with their stage
      state.push(now);
    });
    const dot = state.includes('fail') ? 'fail' : state[n - 1] === 'ok' ? 'ok' : '';
    cls(p + 'dot', 'ok', dot === 'ok'); cls(p + 'dot', 'fail', dot === 'fail');
    if (d.log) {
      fd(p + 'log', seg(rq, .6, 1));
      // a line prints when its stage starts running; `end: true` holds it until the stage settles on its st
      d.log.forEach((l, i) => {
        const si = l.s - 1, s = d.stages[si] || {};
        fd(p + 'lg' + (i + 1), (l.end ? s.st && state[si] === s.st : state[si] !== 'queued') ? 1 : 0);
      });
    }
    sx(p + 'rb', B.p('rb', .80, .92), -46);
    if (d.peek) {
      // peek.until: the stage whose beat takes the file away again (the run moves on to stages the file was covering)
      const gone = d.peek.until ? B.at(d.peek.until, .7, .8, 'enter', { focal: false }) : null;
      sx(p + 'peek', B.p('peek', .5, .6) * (gone ? 1 - seg(gone.p, 0, .6) : 1), 80);
      B.group('pl', d.peek.lines.length, { a: .55, step: .03, len: .06, kind: 'enter', dim: false }).forEach((r, i) => codeLine(p + 'pl' + (i + 1), r.p)); }
    if (d.stamp) { const r = B.p('stamp', .6, .7, 'pop'), e = bk(cl(r, 0, 1));
      st(p + 'stamp', { opacity: String(cl(r * 2.4, 0, 1)), transform: `rotate(-8deg) scale(${(1.6 - .6 * e).toFixed(3)})` }); }
    if (d.term) { const tr = B.at('term', .7, .8); up(p + 'term', tr.p, 30); tmPlay(B, c, p, 't', d.term.steps, tr, .75, .95); }
    if (d.pager) { const r = B.at('pager', .85, .95, 'enter', { len: .5 }), buzz = B.on ? seg(c.local, r.e, r.e + .9) : 0;
      st(p + 'pager', { opacity: String(eo(r.p)), transform: `translateY(${((1 - eo4(r.p)) * 260).toFixed(1)}px) translateX(${(Math.sin(buzz * Math.PI * 14) * 7 * (1 - buzz)).toFixed(2)}px) rotate(${(Math.sin(buzz * Math.PI * 14) * 1.5 * (1 - buzz)).toFixed(2)}deg)` }); }
    B.group('k', (d.chips || []).length, { a: .9, step: .03, len: .06, kind: 'pop', dim: false }).forEach((r, i) => pp(p + 'k' + (i + 1), r.p, .7));
    pp(p + 'bd', B.p('badge', .70, .82, 'pop'), .84);
    up(p + 'sub', B.p('sub', .90, .98));
    footIn(B, p); holdLife(B, p, d, { alias: { badge: 'bd' } });
  }
});
