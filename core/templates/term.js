/* term: a terminal session. Commands type in character by character, their output prints line by line, and an idle
   prompt with a blinking caret waits at the end (projects/cloud-vs-devops).
   data: {eyebrow, accent, h1, title?, cwd?, steps:[{cmd: string | [string] (continuation lines), out?:[html]}],
          badge?:{text, cls}, sub?, foot?}
   `cmd` is plain text (it is typed, so it is escaped, never HTML); `out` lines are HTML and may use the spans
   .ok .er .wn .dm .ky .st .nu .hl. At 24px JetBrains Mono a line holds ~72 characters: split longer commands
   into continuation lines (the template adds the trailing backslash and the indent).
   beats: term · c1..n (command i starts typing) · o1..m (output lines, numbered across the whole session) · badge · sub
   A command without a beat types right after the previous line lands; an output line without a beat prints
   right after its command finishes typing, so one beat per command is enough to keep the session on the words.

   The session itself (tmWin / tmPlay / tmBeats) is shared: the map, workbench and pipeline scenes open terminals
   of their own. `pre` namespaces a session's beat names and ids ('t' → tc1, to1), so one slide can hold several. */
const TM = { bar: 52, pad: 22, lh: 42, cps: .022, tmin: .35, tmax: .9 };
const tmEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tmCmd = cmd => (Array.isArray(cmd) ? cmd : [cmd]);
/* the session as a flat list of rows: {kind:'c'|'k'|'o', step, text, id, name} ('k' = a command's continuation line) */
function tmRows(steps, p, pre) {
  const rows = []; let o = 0; pre = pre || '';
  steps.forEach((s, si) => {
    const parts = tmCmd(s.cmd);
    parts.forEach((t, j) => rows.push({ kind: j ? 'k' : 'c', step: si, text: t + (j < parts.length - 1 ? ' \\' : ''), id: p + pre + 'c' + (si + 1) + (j ? '_' + (j + 1) : '') }));
    (s.out || []).forEach(t => { o++; rows.push({ kind: 'o', step: si, text: t, id: p + pre + 'o' + o, name: pre + 'o' + o }); });
  });
  return rows;
}
const tmBeats = (steps, pre) => seqN((pre || '') + 'c', steps.length).concat(seqN((pre || '') + 'o', steps.reduce((a, s) => a + (s.out || []).length, 0)));
const tmHeight = (steps, lh) => TM.bar + TM.pad * 2 + (tmRows(steps, '').length + 1) * (lh || TM.lh);
/* the window: {id, p, pre, steps, title, cwd, x, y, w, accent, cls, small} → html. `small` is the compact type
   used when a terminal is one pane among several (map sidebar, pipeline overlay). */
function tmWin(o) {
  const rows = tmRows(o.steps, o.p, o.pre), lh = o.small ? 34 : TM.lh;
  const h = TM.bar + TM.pad * 2 + (rows.length + 1) * lh;
  const pc = ACCENT_VAR[o.accent] ? `;--pc:var(${ACCENT_VAR[o.accent]})` : '';
  const lines = rows.map(r => `<span class="tm-l${r.kind === 'o' ? '' : ' cm'}" id="${r.id}">${r.kind === 'o' ? r.text : ''}</span>`).join('');
  return `<div class="tm-win ${o.accent || ''}${o.small ? ' sm' : ''} ${o.cls || ''}" id="${o.id}" style="left:${o.x || 0}px;top:${o.y || 0}px;width:${o.w}px;height:${h}px${pc}">
    <div class="tm-bar"><span>${o.title || 'zsh'}</span><em>${o.cwd || '~/vidshare'}</em></div>
    <div class="tm-body">${lines}<span class="tm-l cm" id="${o.p}${o.pre || ''}idle"></span></div></div>`;
}
/* play a session. open = the beat record of the window's entrance (typing waits for it); fa/fb = the fraction
   window the fallback schedule spreads the rows across. Returns the last row's record. */
function tmPlay(B, c, p, pre, steps, open, fa0, fb0) {
  pre = pre || ''; fa0 = fa0 == null ? .22 : fa0; fb0 = fb0 == null ? .84 : fb0;
  const rows = tmRows(steps, p, pre), n = rows.length, span = fb0 - fa0;
  const prompt = '<span class="pr">$</span> ';
  const caret = on => `<span class="tm-car" style="opacity:${on ? 1 : 0}"></span>`;
  const blink = Math.floor((c.local || 0) * 2.2) % 2 === 0;
  const set = (id, html) => { const e = el(id); if (e && e.dataset.h !== html) { e.innerHTML = html; e.dataset.h = html; } };
  let prev = open, typing = null, i = 0;
  while (i < n) {
    const r = rows[i];
    const fa = fa0 + (i / n) * span, fb = fa + Math.min(.12, span / n);
    if (r.kind === 'o') {
      const cmdDone = rows[i - 1] && rows[i - 1].kind !== 'o';
      const rec = B.at(r.name, fa, fb, 'enter', { len: .18, after: prev, delay: (cmdDone ? prev.e - prev.s : 0) + .08 });
      up(r.id, rec.p, 8); prev = rec; i++; continue;
    }
    // a command: its first row and its continuation rows type as one string
    const parts = []; let j = i;
    do { parts.push(rows[j]); j++; } while (j < n && rows[j].kind === 'k');
    const full = parts.map(x => x.text), chars = full.join('').length;
    const len = cl(chars * TM.cps, TM.tmin, TM.tmax);
    const rec = B.at(pre + 'c' + (r.step + 1), fa, fb, 'enter', { len, after: prev, delay: (prev === open ? .35 : (prev.e - prev.s) + .22) });
    const typed = Math.floor(chars * cl(rec.p, 0, 1) + 1e-6);
    let before = 0;
    parts.forEach((x, k) => {
      const shown = cl(typed - before, 0, full[k].length);
      // the caret sits on the row being typed: the first row whose text is not complete yet
      const active = rec.p > 0 && rec.p < 1 && typed >= before && typed < before + full[k].length + (k === parts.length - 1 ? 1 : 0);
      set(x.id, (k === 0 ? prompt : '  ') + tmEsc(full[k].slice(0, shown)) + (active ? caret(true) : ''));
      // before the first command's word the window already shows its prompt, caret blinking, waiting for input
      const waiting = k === 0 && prev === open && rec.p <= 0 && open.p >= 1;
      if (waiting) set(x.id, prompt + caret(blink));
      st(x.id, { opacity: waiting || rec.p > 0 && (k === 0 || typed > before) ? 1 : 0 });
      before += full[k].length;
    });
    if (rec.p > 0 && rec.p < 1) typing = rec;
    prev = rec; i = j;
  }
  // the idle prompt waits after the last line lands, caret blinking (a pure function of ctx.local)
  const idle = prev && (B.on ? c.local > prev.e + .25 : c.t > fb0 + .1);
  set(p + pre + 'idle', prompt + caret(blink));
  st(p + pre + 'idle', { opacity: idle && !typing ? 1 : 0 });
  return prev;
}
defineTemplate('term', {
  check: d => req(d, ['eyebrow', 'h1', 'steps'], 'term'),
  beats: d => baseBeats(d).concat(['term'], tmBeats(d.steps), ['badge', 'sub']),
  html: (d, c) => {
    const p = c.p, G = c.grid, h = tmHeight(d.steps);
    return `${heading(p, d)}<div class="content"><div class="rel">
      ${tmWin({ id: p + 'term', p, steps: d.steps, title: d.title, cwd: d.cwd, w: G.cw, accent: d.accent })}
      ${d.badge ? `<div class="badge ${d.badge.cls || d.accent || 'n'}" id="${p}bd" style="left:0;top:${h + 30}px;font-size:30px">${d.badge.text}</div>` : ''}
      ${subHtml(p, d.sub, h + (d.badge ? 120 : 30), G.cw)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    const tr = B.at('term', .06, .18);
    up(p + 'term', tr.p, 26);
    tmPlay(B, c, p, '', d.steps, tr);
    pp(p + 'bd', B.p('badge', .86, .96, 'pop'), .84);
    up(p + 'sub', B.p('sub', .90, .98));
    footIn(B, p); holdLife(B, p, d, { alias: { badge: 'bd' } });
  }
});
