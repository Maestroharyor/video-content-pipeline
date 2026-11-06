/* The redline family (projects/flutter-vs-rn-styling, core/styles/redline.css): a design-handoff spec sheet.
     rlcall    a spec callout: marks, the headline's card, optional terminal lines (the deck's face-window lines)
     rlduel    a blank phone, then two halves: Flutter widgets vs React Native components
     rleditor  an editor (soft-wrapped real code that types in on its beats) over a simulator strip with the rendered
               component; optional strike, stamp, badge, pinned screenshot, indentation triangle, line counters, class tiles
     rlchain   tiles stepping along with arrows, then a tall screenshot of the last one's homepage
     rlstack   two or three labelled editor panes stacked, tags on them, optional matching class strings lit up
     rltree    a widget tree drawn node by node, chips under it
     rlgap     one big class chip; the component's children spread apart and redlines measure the gap
     rlcards   two cards of ✓ / ✗ rows
   Code comes from window.CODE (the project's code.js, generated from its compile-checked files), never retyped here.
   Cast and bubbles (core/components/cast.js) work on every rl template: cast, bubbles, beats a1.. b1.. */
const rlAcc = d => ACCENT_VAR[d.accent] ? `--acc:var(${ACCENT_VAR[d.accent]})` : '';
const rlBeats = d => baseBeats(d).concat(castBeats(d.cast, d.bubbles));
const RDL = { fs: 28, lh: 28 * 1.42, cw: 28 * .6, tabs: 58, gut: 74, padR: 20, mfs: 16, mlh: 16 * 1.5 };

/* ---------- syntax colouring (Dart, TSX, CSS): escape first, then wrap tokens in spans ---------- */
const RL_KW = { dart: 'class|extends|const|super|final|required|this|void|static|true|false|null', tsx: 'const|function|let|true|false', css: '',
  js: 'const|function|let|new|this|true|false|null', prisma: 'model|enum|datasource|generator' };
const RL_CTL = { dart: 'import|return|if|else', tsx: 'import|from|export|return|default|if|else', css: '', js: 'import|from|export|return|await|if|else', prisma: '' };
function rlEsc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
/* VS Code Dark+ colouring: storage keywords blue, control flow and imports purple, types and components teal,
   functions yellow, properties / attributes / named keys light blue, strings orange, numbers green */
function rlHl(line, lang) {
  const out = [], kw = RL_KW[lang] ? new RegExp('^(' + RL_KW[lang] + ')\\b') : null, ctl = RL_CTL[lang] ? new RegExp('^(' + RL_CTL[lang] + ')\\b') : null;
  let i = 0;
  const push = (cls, s) => out.push(cls ? `<span class="${cls}">${rlEsc(s)}</span>` : rlEsc(s));
  while (i < line.length) {
    const r = line.slice(i), prev = line.slice(0, i), word = !/\w$/.test(prev);
    let m;
    if ((m = /^\/\/.*/.exec(r))) { push('c', m[0]); i += m[0].length; continue; }
    if ((m = /^('[^']*'|"[^"]*"|`[^`]*`)/.exec(r))) { push('s', m[0]); i += m[0].length; continue; }
    if ((m = /^@\w+/.exec(r))) { push('tc', m[0]); i += m[0].length; continue; }
    if (lang === 'tsx' && (m = /^(<\/?)([A-Za-z]+)/.exec(r))) { push('pu', m[1]); push(/^[A-Z]/.test(m[2]) ? 'ty' : 'tg', m[2]); i += m[0].length; continue; }
    if (lang === 'tsx' && (m = /^\/?>/.exec(r))) { push('pu', m[0]); i += m[0].length; continue; }
    if (lang === 'css' && (m = /^[a-z-]+(?=:)/.exec(r))) { push('pr', m[0]); i += m[0].length; continue; }
    if (lang === 'css' && (m = /^\.[a-z-]+/.exec(r))) { push('fn', m[0]); i += m[0].length; continue; }
    if (word && (m = /^\d+(\.\d+)?(rem|px)?/.exec(r))) { push('n', m[0]); i += m[0].length; continue; }
    if (word && ctl && (m = ctl.exec(r))) { push('kc', m[0]); i += m[0].length; continue; }
    if (word && kw && (m = kw.exec(r))) { push('k', m[0]); i += m[0].length; continue; }
    if (word && lang !== 'css' && (m = /^[A-Z]\w*/.exec(r))) { push(/^\s*\(/.test(line.slice(i + m[0].length)) && lang === 'tsx' ? 'fn' : 'ty', m[0]); i += m[0].length; continue; }
    if (word && (m = /^[a-z_]\w*/i.exec(r))) {
      const rest = line.slice(i + m[0].length);
      push(/^\s*\(/.test(rest) ? 'fn' : /^\s*[:=](?![=>])/.test(rest) || /\.$/.test(prev) ? 'at' : '', m[0]); i += m[0].length; continue;
    }
    push('', r[0]); i++;
  }
  return out.join('');
}
// .js/.ts colour as plain JavaScript (await, new, this), .prisma as a Prisma schema; everything else is TSX
const rlLang = f => /\.dart$/.test(f) ? 'dart' : /\.css$/.test(f) ? 'css' : /\.prisma$/.test(f) ? 'prisma' : /\.(js|ts)$/.test(f) ? 'js' : 'tsx';

/* ---------- the editor: VS Code, Dark Modern (ported from projects/frontend-one-click/kit.js FE.ed) ----------
   One window: title bar (traffic lights, command centre), activity bar, then one or more editor groups stacked (each its
   own tab bar, breadcrumbs, code and minimap), then the status bar. The window spans the stage (x 16-1064); the code
   column stays inside the phone safe zone (x 150-940), the minimap and activity bar sit outside it (no text there).
   Soft wrap is VS Code's wordWrap "on" with wrappingIndent "same". Code types in character by character with the caret.
   ed: {src (code.js key), from?, to?, ranges?: [[a, b], …] (fold rows between), file?, crumb?: 'lib', mini?, view? (max
        code height px), hl?: [line numbers], swap?: {n, from}, match?: 'text', blocks?: [[fromIdx, toIdx], …], cps?} */
const RLV_CHROME = { title: 50, tabs: 56, crumb: 36, status: 36, ab: 64, mm: 124, gut: 74, padR: 14 };
const RLV_IC = { dart: ['#3DB2F5', '◆'], tsx: ['#61DAFB', '⚛'], css: ['#42A5F5', '#'], js: ['#F7DF1E', 'JS'], ts: ['#3178C6', 'TS'], prisma: ['#7C83F0', '◭'] };
const RLV_LANG = { dart: 'Dart', tsx: 'TypeScript JSX', css: 'CSS', js: 'JavaScript', prisma: 'Prisma' };
const RLV_LANG_EXT = { ts: 'TypeScript' };   // the status bar names the file's own language where it differs from its colouring
const RLV_AB = ['M3 4.5h7l2 2h9v13H3z', 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.3 15.3 21 21', 'M6 3v12M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9c0 5-12 3-12 6',
  'M7 4l12 8-12 8z', 'M4 4h7v7H4zM13 13h7v7h-7zM4 13h7v7H4zM15 3l5 5-5 5-5-5z'];
const rlvSvg = d => `<svg viewBox="0 0 24 24"><path d="${d}"/></svg>`;
const rlvExt = f => (/\.(\w+)$/.exec(f) || ['', ''])[1];
// file icons as the language's own mark (the Material Icon Theme look), glyphs only when the project has no mark for it
const RLV_MARK = { dart: 'dart-light.svg', tsx: 'react-light.svg', css: 'css-light.svg' };
const rlvIcon = f => { const e = rlvExt(f); if (RLV_MARK[e] && typeof passet === 'function') return `<img class="fi" src="${passet(RLV_MARK[e])}" alt="">`;
  const ic = RLV_IC[e] || ['#8a8a8a', '≡']; return `<i class="fi" style="color:${ic[0]}">${ic[1]}</i>`; };
const RL_ROWS = {};   // row id → {text, full (coloured html), ind}: what the typing writes back, built once in html()
function rlRows(ed) {
  const src = (window.CODE || {})[ed.src];
  if (!src) throw new Error('redline: window.CODE["' + ed.src + '"] is missing (run node code/build.js)');
  const ranges = ed.ranges || [[ed.from || 1, ed.to || src.length]], rows = [];
  ranges.forEach((r, k) => {
    if (k) rows.push({ fold: true, text: '' });
    for (let n = r[0]; n <= r[1]; n++) rows.push({ n, text: src[n - 1] });
  });
  return rows;
}
/* visual rows a line takes with soft wrap: greedy word wrap the way the browser does it (break at spaces, a word longer
   than the row breaks anywhere), continuation rows at the line's own indent (wrappingIndent "same") */
function rlVisual(text, codeW, mini) {
  if (mini) return 1;
  const per = Math.floor(codeW / RDL.cw), ind = (/^ */.exec(text) || [''])[0].length;
  const words = text.trim().split(/(?<= )/);
  let rows = 1, used = ind;
  words.forEach(wd => {
    if (used + wd.trimEnd().length > per && used > ind) { rows++; used = ind; }
    used += wd.length;
    while (used > per) { rows++; used = ind + (used - per); }
  });
  return rows;
}
function rlColour(r, ed, lang, p, gid) {
  // a token that changes (swap) or lights up (match) is cut out before colouring, so its span survives
  const cut = ed.swap && r.n === ed.swap.n ? { tok: ed.swap.from, id: 'sw', cls: 'ty' } : ed.match && r.text.includes(ed.match) ? { tok: ed.match, id: 'mt', cls: '' } : null;
  if (cut && r.text.includes(cut.tok)) {
    const k = r.text.indexOf(cut.tok);
    return rlHl(r.text.slice(0, k), lang) + `<span class="${cut.cls}" id="${p}${gid}${cut.id}">${rlEsc(cut.tok)}</span>` + rlHl(r.text.slice(k + cut.tok.length), lang);
  }
  return rlHl(r.text, lang);
}
/* one editor group → {html, h}; row ids <p><gid>r<i> */
function rlGroup(p, gid, ed, w, o) {
  const rows = rlRows(ed), lang = rlLang(ed.src), mini = !!ed.mini, lh = mini ? RDL.mlh : RDL.lh, file = ed.file || ed.src;
  const codeW = w - RLV_CHROME.ab - RLV_CHROME.gut - RLV_CHROME.mm - RLV_CHROME.padR;
  const vis = rows.reduce((a, r) => a + (r.fold ? 1 : rlVisual(r.text, codeW, mini)), 0);
  const full = Math.round(12 + vis * lh + 16), view = ed.view ? Math.min(ed.view, full) : full;
  const hl = ed.hl || [];
  const body = rows.map((r, i) => {
    const id = p + gid + 'r' + (i + 1), ind = (/^ */.exec(r.text) || [''])[0].length;
    if (!r.fold) RL_ROWS[id] = { text: r.text, ind, full: rlColour(r, ed, lang, p, gid), part: t => rlHl(t, lang) };
    return `<div class="rl-ln${r.fold ? ' fold' : ''}${hl.includes(r.n) ? ' hl' : ''}" id="${id}"><span class="g">${r.fold ? '' : r.n}</span>` +
      (r.fold ? `<span class="t"><i class="fd">⋯</i></span>` : `<span class="t" style="padding-left:${mini ? 0 : ind}ch;text-indent:-${mini ? 0 : ind}ch"></span>`) + '</div>';
  }).join('');
  // the minimap: one bar per row, its length and colour from the row's text
  const mm = rows.map(r => `<i style="margin-left:${Math.min(60, ((/^ */.exec(r.text) || [''])[0].length) * 2)}px;width:${Math.min(80, r.text.trim().length * 1.3)}px"></i>`).join('');
  const crumb = (ed.crumb || (lang === 'dart' ? 'lib' : lang === 'css' ? 'styles' : 'src')).split('›').map(x => `<span>${x.trim()}</span>`).join('<b>›</b>');
  const h = RLV_CHROME.tabs + RLV_CHROME.crumb + view;
  return { rows, h, html: `<div class="vg" id="${p}${gid}" style="height:${h}px">
    <div class="bar"><span class="tab on">${rlvIcon(file)}<span class="tn">${file}</span><i class="x">×</i></span>${o.tag ? `<span class="rl-tag${o.tag.cls === 'ok' ? ' ok' : ''}" id="${p}${o.tag.id}">${o.tag.text}</span>` : ''}</div>
    <div class="bc">${crumb}<b>›</b>${rlvIcon(file)}<span>${file}</span></div>
    <div class="view" style="height:${view}px"><div class="src${mini ? ' mini' : ''}">${body}</div><div class="mm">${mm}</div></div></div>` };
}
/* the window: groups [{gid, ed, tag?}] → {html, h, groups: [{y, h}]} in content px (x/w are set to span the stage) */
function rlVsc(p, id, groups, c, o) {
  o = o || {};
  const G = c.grid, x = 16 - G.cx, w = G.w - 32;
  let y = RLV_CHROME.title; const gs = [];
  const html = groups.map(g => { const r = rlGroup(p, g.gid, g.ed, w, g); gs.push({ y, h: r.h }); y += r.h; return r.html; }).join('');
  const lang = rlLang(groups[0].ed.src), dart = lang === 'dart';
  const status = `<div class="sbar"><span class="rm">${rlvSvg('M8 7l-5 5 5 5M16 7l5 5-5 5')}</span><span>⎇ main</span><span>⊗ 0&nbsp; ⚠ 0</span><span class="sp"></span>` +
    `<span>Ln ${o.ln || 12}, Col ${o.col || 5}</span><span>Spaces: 2</span><span>${RLV_LANG_EXT[rlvExt(groups[0].ed.file || groups[0].ed.src)] || RLV_LANG[lang]}</span>${dart ? '<span>Flutter: 3.47.8</span>' : '<span>✓ Prettier</span>'}</div>`;
  const h = y + RLV_CHROME.status;
  return { h, groups: gs, html: `<div class="rl-panel vsc" id="${p}${id}" style="left:${x}px;top:${o.y || 0}px;width:${w}px;height:${h}px">
    <div class="vt"><span class="dots"><i></i><i></i><i></i></span><span class="nv">← →</span><div class="cc">${rlvSvg(RLV_AB[1])}${o.title || 'profile_app'}</div></div>
    <div class="vm"><div class="ab">${RLV_AB.map((d, i) => `<span class="${i === 0 ? 'on' : ''}">${rlvSvg(d)}</span>`).join('')}</div><div class="ea">${html}</div></div>${status}</div>` };
}
/* type a group in: block k starts on its beat (or right after the previous block), rows type one after another at a
   steady rate that finishes before the next block (or the exit), each row's indentation appears at once (auto-indent),
   the caret sits after the last typed character and blinks once a block is done. The view scrolls to keep the caret
   row in sight. Every row's [start, length, chars] in deck time goes to window.RL_TYPED (scripts: typed.json → sfx). */
function rlTypeGroup(c, p, gid, ed, starts) {
  const rows = rlRows(ed), n = rows.length, blocks = (ed.blocks || [[0, n - 1]]).map(b => [Math.min(b[0], n - 1), Math.min(b[1], n - 1)]);
  const exit = (c.exit != null ? c.exit : c.screen) - .45;
  const sched = []; let prevEnd = .25;
  blocks.forEach((b, k) => {
    const s = starts[k] != null ? starts[k] : prevEnd + .15, next = starts.slice(k + 1).find(v => v != null);
    const avail = Math.max(.4, Math.min(next != null ? next - .1 : exit, exit) - s);
    let chars = 0; for (let i = b[0]; i <= b[1]; i++) if (!rows[i].fold) chars += rows[i].text.trim().length;
    const gaps = (b[1] - b[0]) * .05, cps = Math.min(ed.cps || 160, Math.max(ed.cps || 26, chars / Math.max(.2, avail - gaps)));
    let t = s;
    for (let i = b[0]; i <= b[1]; i++) {
      const L = rows[i].fold ? 0 : rows[i].text.trim().length, d = Math.max(.04, L / cps);
      sched[i] = { s: t, d, L }; t += d + .05;
    }
    prevEnd = t;
  });
  let caret = -1;
  for (let i = 0; i < n; i++) {
    const r = el(p + gid + 'r' + (i + 1)), S = sched[i]; if (!r || !S) continue;
    const q = cl((c.local - S.s) / S.d, 0, 1), started = c.local >= S.s;
    r.style.visibility = started ? '' : 'hidden';
    if (started) caret = i;
    const R = RL_ROWS[p + gid + 'r' + (i + 1)], t = r.querySelector('.t');
    if (!R || !t) continue;
    const k = q >= 1 ? -1 : Math.floor(q * S.L);
    if (t.dataset.k !== String(k)) { t.innerHTML = k < 0 ? R.full : R.part(R.text.slice(0, R.ind + k)); t.dataset.k = String(k); }
  }
  for (let i = 0; i < n; i++) { const r = el(p + gid + 'r' + (i + 1)); if (r) r.classList.toggle('typing', i === caret); }
  const S = caret >= 0 && sched[caret], done = S && c.local >= S.s + S.d, blink = done ? Math.floor((c.local - S.s - S.d) / .53) % 2 === 0 : true;
  const cr = caret >= 0 && el(p + gid + 'r' + (caret + 1));
  if (cr) cr.classList.toggle('blink', !blink);
  // scroll: keep the caret row in the view; rows scrolled out are hidden (the safe-zone probe sees clipped text)
  const g = el(p + gid), view = g && g.querySelector('.view'), src = view && view.firstElementChild;
  if (view && src && cr) {
    const over = Math.max(0, cr.offsetTop + cr.offsetHeight + 16 - view.clientHeight);
    src.style.transform = 'translateY(' + (-over).toFixed(1) + 'px)';
    for (let i = 0; i < n; i++) { const r = el(p + gid + 'r' + (i + 1)); if (r && r.offsetTop - over < 6) r.style.visibility = 'hidden'; }
  }
  const T0 = (c.T != null ? c.T : c.local) - c.local;
  (window.RL_TYPED = window.RL_TYPED || {})[p + gid] = sched.filter(x => x && x.L).map(x => [+(T0 + x.s).toFixed(3), +x.d.toFixed(3), x.L]);
  return sched;
}

/* simulator strip: {kind: 'img', srcs: [a, b?], crop: [y0, y1] (pt of the 390x844 screen)} | {kind: 'rn', col?} — the
   component at 2x; label "Simulator · live" */
function rlSim(p, sim, x, y, w) {
  const k = w / 390 * (390 / 390), sc = (w - 20) / 390;
  let inner, h;
  if (sim.kind === 'img') {
    const y0 = sim.crop[0], y1 = sim.crop[1], ih = Math.round((y1 - y0) * sc), iw = Math.round(390 * sc);
    h = ih + 20;
    inner = sim.srcs.map((s, i) => `<div class="img${i ? ' b' : ''}" id="${p}sim${i + 1}" style="width:${iw}px;height:${Math.round(844 * sc)}px;top:${-Math.round(y0 * sc)}px;background-image:url(${s});background-size:${iw}px auto"></div>`).join('');
    inner = `<div class="scr" style="height:${ih}px">${inner}</div>`;
  } else {
    const ch = sim.col ? 92 : 88, pad = 16, ih = Math.round((ch + pad * 2) * sc);
    h = ih + 20;
    const card = sim.col ? `<div class="rn-card col" id="${p}rnc"><b>Ayomide</b><span>Mobile developer</span></div>`
      : `<div class="rn-card" id="${p}rnc"><div class="av" id="${p}rav">AO</div><div class="nm" id="${p}rnm"><b>Ayomide</b><span>Mobile developer</span></div><div class="fb" id="${p}rfb">Follow</div></div>`;
    inner = `<div class="scr" style="height:${ih}px"><div style="position:absolute;left:0;top:0;width:390px;padding:${pad}px;box-sizing:border-box;transform:scale(${sc.toFixed(4)});transform-origin:0 0">${card}</div></div>`;
  }
  void k;
  return { h, html: `<div class="rl-sim" id="${p}sim" style="left:${x}px;top:${y}px;width:${w}px"><span class="lbl">${sim.label || 'Simulator · <b>live</b>'}</span>${inner}</div>` };
}
/* a dimension line: {x, y, len, dir: 'h' | 'v', label} */
function rlDim(id, o) {
  return `<div class="rl-dim ${o.dir || 'h'}" id="${id}" style="left:${o.x}px;top:${o.y}px;${o.dir === 'v' ? 'height' : 'width'}:${o.len}px"><i>${o.label}</i></div>`;
}
function rlDimIn(id, q, dir) {
  const e = eo4(q);
  st(id, { opacity: String(cl(q * 3, 0, 1)), transform: (dir === 'v' ? 'scaleY(' : 'scaleX(') + e.toFixed(4) + ')' });
}

/* ---------------- rlcall ----------------
   data: {marks: [src], lines?: [html] (terminal lines, mono), mark beats k1..kn, line beats c1..cn}
   beats: card · k1..kn · c1..cn */
defineTemplate('rlcall', {
  check: d => req(d, ['eyebrow', 'h1'], 'rlcall'),
  beats: d => rlBeats(d).concat(['card'], seqN('k', (d.marks || []).length), seqN('c', (d.lines || []).length)),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, nl = (d.lines || []).length, h = 80 + 96 + nl * 70 + (nl ? 26 : 0);
    const marks = (d.marks || []).map((m, i) => `<img id="${p}k${i + 1}" src="${m}" alt="">`).join('');
    const lines = (d.lines || []).map((l, i) => `<div class="ln" id="${p}c${i + 1}">${l}</div>`).join('');
    const corners = [[-2, -2, '4px 0 0 4px'], [w - 28, -2, '4px 4px 0 0'], [-2, h - 28, '0 0 4px 4px'], [w - 28, h - 28, '0 4px 4px 0']]
      .map(([x, y, bw]) => `<i class="rl-corner" style="left:${x}px;top:${y}px;border-width:${bw}"></i>`).join('');
    return `${heading(p, d)}<div class="content"><div class="rel" style="${rlAcc(d)}">
      <div class="rl-callout" id="${p}card" style="left:0;top:0;width:${w}px;height:${h}px">${corners}<div class="row">${marks}</div>${lines}</div>
      ${castBlock(p, d.cast, d.bubbles)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    const cd = B.at('card', .06, .16, 'enter', { focal: false });
    up(p + 'card', cd.p, 40);
    B.group('k', (d.marks || []).length, { a: .2, step: .1, len: .1, kind: 'pop', dim: false }).forEach((r, i) => pp(p + 'k' + (i + 1), r.p, .5));
    B.group('c', (d.lines || []).length, { a: .4, step: .15, len: .15, kind: 'enter', dim: false }).forEach((r, i) => {
      st(p + 'c' + (i + 1), { opacity: String(r.p > 0 ? 1 : 0), clipPath: `inset(0 ${((1 - r.p) * 100).toFixed(1)}% 0 0)` });
    });
    castPlay(B, c, p, d.cast, d.bubbles);
    footIn(B, p); holdLife(B, p, d, { alias: { card: 'card' } });
  }
});

/* ---------------- rlduel ----------------
   data: {phone: 'new app', left: {name, src, sub, code, acc}, right: {…}}
   beats: ph · l · r */
defineTemplate('rlduel', {
  check: d => req(d, ['eyebrow', 'h1', 'left', 'right'], 'rlduel'),
  beats: d => rlBeats(d).concat(['ph', 'l', 'r']),
  html: (d, c) => {
    // an iPhone (390 x 844 pt screen) scaled into the frame, large on the left (preview 2: "bigger or by the side");
    // the screen is the real Flutter web build of the card. The two halves stack beside it, "vs" between them.
    const p = c.p, w = c.grid.cw, phW = 380, z = (phW - 22) / 390, phH = Math.round(844 * z + 22), gx = phW + 30, hw = w - gx, hh = 240;
    const y1 = Math.round(phH / 2 - hh - 50), y2 = Math.round(phH / 2 + 50);
    const half = (s, y, id) => `<div class="rl-half" id="${p}${id}" style="left:${gx}px;top:${y}px;width:${hw}px;height:${hh}px;--acc:${s.acc}">
      <div class="hd"><img src="${s.src}" alt="">${s.name}</div><small>${s.sub}</small><code>${rlEsc(s.code)}</code></div>`;
    return `${heading(p, d)}<div class="content"><div class="rel" style="${rlAcc(d)}">
      <div class="rl-iph" id="${p}ph" style="left:0;top:0;width:${phW}px;height:${phH}px"><span class="sbtn a"></span><span class="sbtn b"></span><span class="sbtn c"></span>
        <div class="scr"><div class="z" style="transform:scale(${z.toFixed(4)})"><div class="app" style="background-image:url(${d.screen})"></div>
        <div class="ap-sb"><b>9:41</b><span class="isl"></span><span class="sig"><i></i><i></i><i></i><i></i></span><span class="wifi"></span><span class="bat"><i></i></span></div><span class="hbar"></span></div></div></div>
      ${half(d.left, y1, 'l')}${half(d.right, y2, 'r')}
      <div class="rl-vs" id="${p}vs" style="left:${gx + hw / 2 - 28}px;top:${Math.round(phH / 2 - 32)}px">vs</div>
      ${castBlock(p, d.cast, d.bubbles)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    pp(p + 'ph', B.p('ph', .06, .16, 'pop'), .8);
    const l = B.at('l', .3, .4, 'enter'), r = B.at('r', .5, .6, 'enter');
    sx(p + 'l', l.p, 80); sx(p + 'r', r.p, 80);
    pp(p + 'vs', seg(c.local, r.s + .15, r.s + .45), .4);
    castPlay(B, c, p, d.cast, d.bubbles);
    footIn(B, p); holdLife(B, p, d);
  }
});

/* ---------------- rleditor ----------------
   data: {ed (see rlEditor), sim?, shot?: {src, w, ratio, crop: [y0, y1], url, x?, y?}, strike?: true, stamp?: text,
          badge?: {text, cls}, tri?: true (trace the indentation of the visible rows), count?: [{label, from?, to, x?}],
          splits?: [{text, sub}] (class tiles that fly out of the code), seeds?: [token, …] (ed.swap cycles through them)}
   beats: ed · l1..ln (typing blocks) · sim · shot · x1 (strike) · stamp · badge · tri · n (counters) · k1..kn (tiles) · ph (seed swap) */
defineTemplate('rleditor', {
  check: d => req(d, ['eyebrow', 'h1', 'ed'], 'rleditor'),
  beats: d => rlBeats(d).concat(['ed', 'sim', 'shot', 'x1', 'stamp', 'badge', 'tri', 'n', 'ph'], seqN('l', (d.ed.blocks || [0]).length), seqN('k', (d.splits || []).length)),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw;
    const ed = rlVsc(p, 'ed', [{ gid: 'g', ed: d.ed }], c, { title: d.title }), ew = w;
    let y = d.simY != null ? d.simY : ed.h + 70, out = ed.html;
    if (d.sim) { const s = rlSim(p, d.sim, d.simX || 0, y, d.simW || w); out += s.html; y += s.h; }
    if (d.shot) {
      const s = d.shot, iw = s.w - 24, ih = Math.round(iw * s.ratio), ch = Math.round(ih * (s.crop[1] - s.crop[0]));
      out += `<div class="rl-shot" id="${p}shot" style="left:${s.x != null ? s.x : w - s.w}px;top:${s.y != null ? s.y : 0}px;width:${s.w}px">
        <div class="url">${s.url}</div><div class="ph" style="height:${ch}px;background:url(${s.src}) 0 ${-Math.round(ih * s.crop[0])}px/${iw}px auto no-repeat"></div></div>`;
    }
    if (d.strike) out += `<div class="rl-x" id="${p}x1" style="left:-10px;top:${Math.round(ed.h * .55)}px;width:${ew + 20}px;transform:rotate(-8deg) scaleX(0)"></div>`;
    if (d.stamp) out += `<div class="rl-stamp" id="${p}stamp" style="right:${d.stampR || 30}px;top:${d.stampY != null ? d.stampY : Math.round(ed.h * .3)}px">${d.stamp}</div>`;
    if (d.badge) out += `<div class="rl-tag${d.badge.cls === 'ok' ? ' ok' : ''}" id="${p}bd" style="right:${d.badge.r || 20}px;top:${d.badge.y != null ? d.badge.y : 10}px">${d.badge.text}</div>`;
    if (d.tri) out += `<svg class="rl-edge" id="${p}tri" style="left:${16 - c.grid.cx}px;top:0;width:${c.grid.w - 32}px;height:${ed.h}px;z-index:4" viewBox="0 0 ${c.grid.w - 32} ${ed.h}"><path id="${p}trip" d="" style="stroke:var(--red);stroke-width:5;fill:rgba(255,61,127,.05);stroke-linejoin:round"/></svg>`;
    (d.count || []).forEach((k, i) => {
      out += `<div class="rl-chip" id="${p}n${i + 1}" style="left:${k.x != null ? k.x : i * 440}px;top:${d.countY != null ? d.countY : y + 30}px;--acc:${k.acc || 'var(--dart)'}">
        ${k.src ? `<img src="${k.src}" alt="">` : ''}${k.label}<code id="${p}nv${i + 1}">${k.to}</code></div>`;
    });
    (d.splits || []).forEach((t, i) => {
      out += `<div class="rl-chip" id="${p}k${i + 1}" style="left:${t.x}px;top:${t.y}px;--acc:var(--dart)"><code>${t.text}</code>${t.sub ? `<small style="font:700 28px JB;color:var(--tx3)">${t.sub}</small>` : ''}</div>`;
    });
    return `${heading(p, d)}<div class="content"><div class="rel" style="${rlAcc(d)}">${out}${castBlock(p, d.cast, d.bubbles)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    const e = B.at('ed', .04, .12, 'enter', { focal: false });
    up(p + 'ed', e.p, 40);
    const nb = (d.ed.blocks || [0]).length;
    rlTypeGroup(c, p, 'g', d.ed, Array.from({ length: nb }, (_, k) => B.M && B.M['l' + (k + 1)] ? B.M['l' + (k + 1)].s : (k === 0 ? e.s + .3 : null)));
    if (d.sim) {
      const s = B.at('sim', .5, .6, 'enter', { focal: false });
      up(p + 'sim', s.p, 30);
      // a second image (the same screen under another seed) crossfades in on the swap beat
      if (d.sim.srcs && d.sim.srcs.length > 1) {
        const ph = B.at('ph', .7, .8, 'enter', { len: .5 });
        const seeds = d.seeds || [], n = d.sim.srcs.length;
        // the seed token and the screen walk the list together: one step per 0.9 s from the beat
        const step = Math.min(n - 1, Math.floor(Math.max(0, c.local - ph.s) / .9) + (c.local >= ph.s ? 1 : 0));
        const frac = c.local >= ph.s ? seg(c.local - ph.s - (step - 1) * .9, 0, .35) : 0;
        // before the swap the first screen shows; then each new screen fades in over the one before it
        const before = c.local < ph.s;
        d.sim.srcs.forEach((_, i) => st(p + 'sim' + (i + 1), { opacity: String(before ? (i === 0 ? 1 : 0) : i === step ? frac : i === step - 1 ? 1 : 0), zIndex: String(i === step ? 2 : 1) }));
        if (seeds.length) txt(p + 'gsw', seeds[Math.max(0, step)]);
        cls(p + 'gsw', 'rl-match', c.local >= ph.s && frac < 1);
      }
    }
    if (d.shot) {
      const s = B.at('shot', .3, .4, 'enter', { focal: false });
      st(p + 'shot', { opacity: String(cl(s.p * 2.5, 0, 1)), transform: `translateY(${((1 - eo4(s.p)) * -40).toFixed(1)}px) rotate(${(2.5 * eo4(s.p)).toFixed(2)}deg)` });
    }
    if (d.strike) st(p + 'x1', { transform: 'rotate(-8deg) scaleX(' + eo4(B.p('x1', .7, .8, 'draw')).toFixed(4) + ')' });
    if (d.stamp) { const s = B.p('stamp', .8, .9, 'pop'); st(p + 'stamp', { opacity: String(cl(s * 3, 0, 1)), transform: 'rotate(-8deg) scale(' + (1.7 - .7 * bk(s)).toFixed(4) + ')' }); }
    if (d.badge) pp(p + 'bd', B.p('badge', .6, .7, 'pop'), .6);
    if (d.tri) {
      // the indentation of the visible rows: the text's left edge, row by row, closed back along the gutter
      const pth = el(p + 'trip'), code = el(p + 'g') && el(p + 'g').querySelector('.src');
      const typed = code && [...code.querySelectorAll('.rl-ln')].every(r => r.style.visibility !== 'hidden' && (!r.querySelector('.t').dataset.k || r.querySelector('.t').dataset.k === '-1'));
      if (pth && code && typed && !pth.getAttribute('d')) {
        // the indentation of every row, measured once the code is fully typed: x of the first non-space character
        const win = el(p + 'ed').getBoundingClientRect(), k = el(p + 'ed').offsetWidth / win.width, pts = [];
        code.querySelectorAll('.rl-ln').forEach(r => {
          const t = r.querySelector('.t'), R = RL_ROWS[r.id];
          if (!R || !R.text.trim()) return;
          const g = r.querySelector('.g').getBoundingClientRect(), rr = r.getBoundingClientRect();
          const x = (g.right - win.left) * k - 6 + R.ind * RDL.mfs * .6, yy = (rr.top - win.top) * k + rr.height * k / 2;
          pts.push([x, yy]); void t;
        });
        if (pts.length) {
          const x0 = pts[0][0];
          pth.setAttribute('d', 'M' + x0 + ' ' + pts[0][1] + pts.map(q => ' L' + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('') + ' L' + x0 + ' ' + pts[pts.length - 1][1] + ' Z');
          const len = pth.getTotalLength ? pth.getTotalLength() : 3000;
          pth.style.strokeDasharray = String(len); pth.dataset.len = String(len);
        }
      }
      const q = B.p('tri', .7, .8, 'draw', { len: .7 }), len = pth && +pth.dataset.len || 3000;
      if (pth) { pth.style.strokeDashoffset = String((1 - eo(q)) * len); pth.style.fillOpacity = String(seg(q, .7, 1)); }
      st(p + 'tri', { opacity: String(q > 0 ? 1 : 0) });
    }
    (d.count || []).forEach((k, i) => {
      const r = i === 0 ? B.at('n', .6, .7, 'enter') : B.at('n' + (i + 1), .7, .8, 'enter', { after: B.at('n', .6, .7, 'enter'), delay: .25 });
      up(p + 'n' + (i + 1), r.p, 24);
      tick(p + 'nv' + (i + 1), seg(c.local, r.s + .1, r.s + .8), k.from != null ? k.from : 0, k.to, v => Math.round(v) + ' lines');
    });
    B.group('k', (d.splits || []).length, { a: .4, step: .08, len: .1, kind: 'pop', dim: false }).forEach((r, i) => {
      const t = d.splits[i], e4 = eo4(r.p);
      st(p + 'k' + (i + 1), { opacity: String(cl(r.p * 2.5, 0, 1)), transform: `translate(${((1 - e4) * (t.fx || 0)).toFixed(1)}px,${((1 - e4) * (t.fy || 0)).toFixed(1)}px) scale(${(.7 + .3 * bk(r.p)).toFixed(4)})` });
    });
    castPlay(B, c, p, d.cast, d.bubbles);
    footIn(B, p); holdLife(B, p, d, { alias: { x1: 'x1', tri: 'tri', n: 'n1', ph: 'sim' } });
  }
});

/* ---------------- rlchain ----------------
   data: {tiles: [{name, src, sub, hot?}], shot: {src, ratio, crop: [y0, y1], url}, stamp?}
   beats: k1..kn · shot · badge (the stamp) */
defineTemplate('rlchain', {
  check: d => req(d, ['eyebrow', 'h1', 'tiles'], 'rlchain'),
  beats: d => rlBeats(d).concat(['shot', 'badge'], seqN('k', d.tiles.length)),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, n = d.tiles.length, gap = 50, tw = Math.floor((w - gap * (n - 1)) / n), th = 200;
    const tiles = d.tiles.map((t, i) => `<div class="rl-tile${t.hot ? ' hot' : ''}" id="${p}k${i + 1}" style="left:${i * (tw + gap)}px;top:0;width:${tw}px;height:${th}px">
      <img src="${t.src}" alt=""><b>${t.name}</b><small>${t.sub || ''}</small></div>`).join('');
    const arrows = d.tiles.slice(1).map((_, i) => `<div class="rl-arrow" id="${p}ar${i + 1}" style="left:${(i + 1) * (tw + gap) - gap + 8}px;top:${th / 2 - 26}px">→</div>`).join('');
    let shot = '', shotEnd = th + 300;
    if (d.shot) {
      const s = d.shot, sw = w, iw = sw - 24, ih = Math.round(iw * s.ratio), ch = Math.round(ih * (s.crop[1] - s.crop[0]));
      shotEnd = th + 36 + 12 + 54 + ch;
      shot = `<div class="rl-shot" id="${p}shot" style="left:0;top:${th + 36}px;width:${sw}px"><div class="url">${s.url}</div>
        <div class="ph" style="height:${ch}px;background:url(${s.src}) 0 ${-Math.round(ih * s.crop[0])}px/${iw}px auto no-repeat"></div></div>`;
    }
    // the stamp lands low on the screenshot, clear of the site's header and its headline
    const stamp = d.stamp ? `<div class="rl-stamp" id="${p}bd" style="right:30px;top:${shotEnd - 120}px">${d.stamp}</div>` : '';
    return `${heading(p, d)}<div class="content"><div class="rel" style="${rlAcc(d)}">${tiles}${arrows}${shot}${stamp}${castBlock(p, d.cast, d.bubbles)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    const ks = B.group('k', d.tiles.length, { a: .1, step: .12, len: .12, kind: 'pop' });
    ks.forEach((r, i) => { pp(p + 'k' + (i + 1), r.p, .7); dim(p + 'k' + (i + 1), r.dim); if (i) fd(p + 'ar' + i, seg(c.local, r.s - .2, r.s + .1)); });
    if (d.shot) { const s = B.at('shot', .5, .6, 'enter', { focal: false }); up(p + 'shot', s.p, 60); }
    if (d.stamp) { const s = B.p('badge', .8, .9, 'pop'); st(p + 'bd', { opacity: String(cl(s * 3, 0, 1)), transform: 'rotate(-7deg) scale(' + (1.7 - .7 * bk(s)).toFixed(4) + ')' }); }
    castPlay(B, c, p, d.cast, d.bubbles);
    footIn(B, p); holdLife(B, p, d);
  }
});

/* ---------------- rlstack ----------------
   data: {panes: [{label, sub?, src?, ed, tag?: {text, cls}}], match?: true (every pane's ed.match string lights up)}
   beats: top · mid · bot (the panes, two or three) · k1..kn (their tags) · match */
defineTemplate('rlstack', {
  check: d => req(d, ['eyebrow', 'h1', 'panes'], 'rlstack'),
  beats: d => rlBeats(d).concat(['top', 'mid', 'bot', 'match'], seqN('k', d.panes.length)),
  html: (d, c) => {
    const p = c.p;
    // one VS Code window, the editor groups stacked (workbench.editor layout: two or three rows); a tag rides each tab bar
    const win = rlVsc(p, 'win', d.panes.map((pn, i) => ({ gid: 'e' + (i + 1), ed: pn.ed, tag: pn.tag ? Object.assign({ id: 'k' + (i + 1) }, pn.tag) : null })), c, { title: d.title });
    return `${heading(p, d)}<div class="content"><div class="rel" style="${rlAcc(d)}">${win.html}${castBlock(p, d.cast, d.bubbles)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c), names = d.panes.length === 3 ? ['top', 'mid', 'bot'] : ['top', 'bot'];
    headIn(B, p);
    up(p + 'win', B.p('win', .04, .12, 'enter', { focal: false }), 40);
    d.panes.forEach((pn, i) => {
      const r = B.at(names[i], .08 + i * .25, .18 + i * .25, 'enter');
      rlTypeGroup(c, p, 'e' + (i + 1), pn.ed, [r.s]);
      if (pn.tag) pp(p + 'k' + (i + 1), B.p('k' + (i + 1), .7 + i * .1, .8 + i * .1, 'pop', { focal: false }), .6);
    });
    if (d.match) {
      const m = B.at('match', .85, .95, 'pop');
      d.panes.forEach((_, i) => cls(p + 'e' + (i + 1) + 'mt', 'rl-match', m.p > .1));
    }
    castPlay(B, c, p, d.cast, d.bubbles);
    footIn(B, p); holdLife(B, p, d, { alias: { match: 'win' } });
  }
});

/* ---------------- rltree ----------------
   data: {nodes: [{text, x, y, parent?}], chips: [{text, src?}]}  (x, y: the node's top-left in content px)
   beats: tree · k1..kn */
defineTemplate('rltree', {
  check: d => req(d, ['eyebrow', 'h1', 'nodes'], 'rltree'),
  beats: d => rlBeats(d).concat(['tree'], seqN('k', (d.chips || []).length)),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, NH = 72;
    const nodes = d.nodes.map((n, i) => `<div class="rl-node" id="${p}nd${i + 1}" style="left:${n.x}px;top:${n.y}px">${n.text}</div>`).join('');
    const maxY = Math.max(...d.nodes.map(n => n.y)) + NH;
    const edges = `<svg class="rl-edge" style="left:0;top:0;width:${w}px;height:${maxY}px" viewBox="0 0 ${w} ${maxY}">${d.nodes.map((n, i) => n.parent == null ? '' :
      `<path id="${p}eg${i + 1}" d="M${d.nodes[n.parent].x + 40} ${d.nodes[n.parent].y + NH} V${n.y + NH / 2} H${n.x}" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1"/>`).join('')}</svg>`;
    // chips: a row under the tree, or (chipX) a column beside it
    const cy = maxY + 50, cw = Math.floor((w - 40) / 3);
    const at = i => d.chipX != null ? `left:${d.chipX}px;top:${(d.chipY || 0) + i * 110}px` : `left:${i * (cw + 20)}px;top:${cy}px;width:${cw}px;justify-content:center`;
    const chips = (d.chips || []).map((k, i) => `<div class="rl-chip" id="${p}k${i + 1}" style="${at(i)}">${k.src ? `<img src="${k.src}" alt="">` : ''}${k.text}</div>`).join('');
    return `${heading(p, d)}<div class="content"><div class="rel" style="${rlAcc(d)}">${edges}${nodes}${chips}${castBlock(p, d.cast, d.bubbles)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    const t = B.at('tree', .06, .16, 'enter', { focal: false, len: 1.4 });
    d.nodes.forEach((n, i) => {
      const a = t.s + i * .14, q = seg(c.local, a, a + .3);
      pp(p + 'nd' + (i + 1), q, .7);
      const e = el(p + 'eg' + (i + 1)); if (e) e.style.strokeDashoffset = String(1 - eo(seg(c.local, a - .15, a + .1)));
    });
    B.group('k', (d.chips || []).length, { a: .5, step: .12, len: .12, kind: 'pop' }).forEach((r, i) => { pp(p + 'k' + (i + 1), r.p, .7); cls(p + 'k' + (i + 1), 'hot', r.p > 0 && !(r.dim > 0)); });
    castPlay(B, c, p, d.cast, d.bubbles);
    footIn(B, p); holdLife(B, p, d);
  }
});

/* ---------------- rlgap ----------------
   data: {chip: 'gap-4', note: '= 16px'}  the big chip, the RN card at 2x in a simulator strip; its children start
   packed (gap 0) and spread to 16px on beat `m`, redlines measure each gap
   beats: k1 (the chip) · m (spread + redlines) · ph (the component outline) */
defineTemplate('rlgap', {
  check: d => req(d, ['eyebrow', 'h1', 'chip'], 'rlgap'),
  beats: d => rlBeats(d).concat(['k1', 'm', 'ph']),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, s = rlSim(p, { kind: 'rn', label: d.simLabel }, 0, 310, w);
    return `${heading(p, d)}<div class="content"><div class="rel" style="${rlAcc(d)}">
      <div class="rl-big" id="${p}k1" style="left:0;top:0;width:${w}px;height:220px">${d.chip}<small>${d.note || ''}</small></div>
      ${s.html}<div id="${p}dims"></div>${castBlock(p, d.cast, d.bubbles)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    pp(p + 'k1', B.p('k1', .1, .2, 'pop'), .6);
    up(p + 'sim', seg(c.local, 0.2, 0.6), 30);
    const m = B.at('m', .5, .6, 'enter', { len: .7 }), k = eo4(m.p);
    st(p + 'rnc', { gap: (16 * k).toFixed(2) + 'px' });
    // the outline of the component on the screen (ph): a pink frame around the card
    const o = B.p('ph', .7, .8, 'pop');
    st(p + 'rnc', { boxShadow: `0 0 0 ${(3 * o).toFixed(2)}px #FF3D7F, 0 1px 3px rgba(0,0,0,.08)` });
    // redlines between avatar | names | button, measured from the live layout (the scaled card inside the strip)
    const host = el(p + 'dims'), card = el(p + 'rnc'), rel = host && host.parentElement;
    if (host && card && rel) {
      const rr = rel.getBoundingClientRect(), sc = rel.offsetWidth / rr.width || 1;
      const box = id => { const b = el(id).getBoundingClientRect(); return { l: (b.left - rr.left) * sc, r: (b.right - rr.left) * sc, t: (b.top - rr.top) * sc, b: (b.bottom - rr.top) * sc }; };
      const a = box(p + 'rav'), n = box(p + 'rnm'), f = box(p + 'rfb'), y = Math.round(a.b + 40);
      host.innerHTML = rlDim(p + 'g1', { x: Math.round(a.r), y, len: Math.max(1, Math.round(n.l - a.r)), label: '16' }) +
        rlDim(p + 'g2', { x: Math.round(n.r), y, len: Math.max(1, Math.round(f.l - n.r)), label: '16' });
      const q = seg(c.local, m.e - .1, m.e + .4);
      rlDimIn(p + 'g1', q); rlDimIn(p + 'g2', seg(c.local, m.e, m.e + .5));
    }
    castPlay(B, c, p, d.cast, d.bubbles);
    footIn(B, p); holdLife(B, p, d, { alias: { ph: 'sim' } });
  }
});

/* ---------------- rlcards ----------------
   data: {cards: [{name, src, rows: [{text, ok}]}]}
   beats: a (first card) · b (second card) · rows follow their card */
defineTemplate('rlcards', {
  check: d => req(d, ['eyebrow', 'h1', 'cards'], 'rlcards'),
  beats: d => rlBeats(d).concat(['c1', 'c2']),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw, cw = (w - 30) / 2;
    const cards = d.cards.map((k, i) => `<div class="rl-card" id="${p}c${i + 1}" style="left:${i * (cw + 30)}px;top:0;width:${cw}px">
      <div class="hd"><img src="${k.src}" alt="">${k.name}</div>
      ${k.rows.map((r, j) => `<div class="rl-row ${r.ok ? 'y' : 'n'}" id="${p}c${i + 1}r${j + 1}"><i>${r.ok ? '✓' : '✗'}</i>${r.text}</div>`).join('')}</div>`).join('');
    return `${heading(p, d)}<div class="content"><div class="rel" style="${rlAcc(d)}">${cards}${castBlock(p, d.cast, d.bubbles)}</div></div>`;
  },
  frame: (u, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    d.cards.forEach((k, i) => {
      const r = B.at('c' + (i + 1), .1 + i * .3, .2 + i * .3, 'enter');
      up(p + 'c' + (i + 1), r.p, 40);
      k.rows.forEach((_, j) => sx(p + 'c' + (i + 1) + 'r' + (j + 1), seg(c.local, r.s + .25 + j * .12, r.s + .55 + j * .12), -24));
    });
    castPlay(B, c, p, d.cast, d.bubbles);
    footIn(B, p); holdLife(B, p, d);
  }
});
