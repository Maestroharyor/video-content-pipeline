/* app: the vidshare web app in a browser window (projects/cloud-vs-devops). It starts as a dashed wireframe (the
   idea) and fills into the real UI on the `fill` beat (the vision); feature buttons pop in, or, beside a code pane,
   light up as the route that implements them is typed. Question bubbles can pop around it.
   data: {eyebrow, accent, h1, features:[{label, icon?, n?}], mode?: 'build' | 'wire', sketch?: bool,
          code?: {file, lines:[html]}, cast?:[…], bubbles?:[…], questions?:[string], sub?, foot?}
   mode 'build' (default): buttons pop in on k1..kn. mode 'wire': buttons are there from the start and light up on
   k1..kn (use the same words as the matching l1..ln so the button lights with its route).
   beats: win · fill · k1..kn · code · l1..ln · a1..an · b1..bn · q1..qn · sub
   The browser is authored at 1000x600 and scaled to the room the layout leaves it. */
const APP = { w: 1000, h: 600 };
const apIco = { like: 'i-like', comment: 'i-help', share: 'i-net', follow: 'i-key', bell: 'i-bell', play: 'i-browser' };
function apBrowser(p, d) {
  const f = d.features || [];
  const btns = f.map((b, i) => `<span class="ap-btn${b.cls ? ' ' + b.cls : ''}" id="${p}k${i + 1}">${b.icon ? `<svg viewBox="0 0 24 24"><use href="#${apIco[b.icon] || b.icon}"/></svg>` : ''}${b.label}${b.n ? `<i>${b.n}</i>` : ''}</span>`).join('');
  const next = [['Deploying on a Friday', '41k views'], ['How CDNs work', '12k views'], ['Our first 1,000 users', '8.2k views']]
    .map(([t, v]) => `<div class="ap-nx"><span class="ap-th"></span><div><b>${t}</b><i>${v}</i></div></div>`).join('');
  const sk = `<div class="ap-sk" id="${p}sk"><i style="left:24px;top:72px;width:640px;height:360px"></i><i style="left:24px;top:452px;width:460px;height:26px"></i>
    <i style="left:24px;top:496px;width:640px;height:48px"></i><i style="left:690px;top:72px;width:286px;height:92px"></i>
    <i style="left:690px;top:180px;width:286px;height:92px"></i><i style="left:690px;top:288px;width:286px;height:92px"></i>
    <em style="left:250px;top:230px">idea.png</em></div>`;
  return `<div class="ap-bar"><i></i><i></i><i></i><span>vidshare.app</span></div>${sk}
    <div class="ap-real" id="${p}real">
      <div class="ap-player"><svg viewBox="0 0 24 24"><path d="M9 7v10l8-5z"/></svg><div class="ap-prog"><i></i></div></div>
      <div class="ap-title">Launch day: we built our own YouTube</div>
      <div class="ap-row">${btns}</div>
      <div class="ap-side"><b>Up next</b>${next}</div></div>`;
}
defineTemplate('app', {
  check: d => req(d, ['eyebrow', 'h1'], 'app'),
  beats: d => baseBeats(d).concat(['win', 'fill'], seqN('k', (d.features || []).length), d.code ? ['code'].concat(seqN('l', d.code.lines.length)) : [],
    castBeats(d.cast, d.bubbles), seqN('q', (d.questions || []).length), ['sub']),
  html: (d, c) => {
    const p = c.p, G = c.grid, cast = d.cast || [];
    // vertical canvas: the browser takes the column; the cast and the question bubbles sit under it
    const V = G.canvas === 'vertical', castW = cast.length && !V ? (cast[0].size || 190) + 30 : 0;
    let codeHtml = '', bx = castW, bw = G.cw - castW - ((d.questions || []).length && !V ? 290 : 0);
    if (d.code) {
      const cw = 640, lines = d.code.lines;
      codeHtml = `<div class="code" id="${p}code" style="position:absolute;left:${castW}px;top:0;width:${cw}px"><div class="bar"><i></i><i></i><i></i><span>${d.code.file}</span></div>
        <pre style="font-size:20px">${lines.map((l, i) => `<span class="cl" id="${p}l${i + 1}">${l}</span>`).join('')}</pre></div>`;
      bx = castW + cw + 30; bw = G.cw - bx;
    }
    const k = Math.min(1, bw / APP.w), bh = Math.round(APP.h * k);
    const qs = (d.questions || []).map((q, i) => bubbleHtml({ id: p + 'q' + (i + 1), text: q, x: V ? 250 : G.cw - 270, y: V ? bh + 50 + i * 125 : 30 + i * 170, w: V ? 380 : 270, tail: 'l' })).join('');
    const castPos = cast.map(a => Object.assign({ x: 0, y: V ? bh + 170 : Math.max(0, bh - (a.size || 190) - 40) }, a));
    return `${heading(p, d)}<div class="content"><div class="rel">
      ${codeHtml}
      <div class="ap-box" style="position:absolute;left:${bx}px;top:0;width:${Math.round(APP.w * k)}px;height:${bh}px">
        <div class="ap-win${d.mode === 'wire' ? ' wire' : ''}" id="${p}win" style="left:0;top:0;width:${APP.w}px;height:${APP.h}px;transform-origin:0 0;--k:${k}">${apBrowser(p, d)}</div></div>
      ${castBlock(p, castPos, d.bubbles)}${qs}
      ${subHtml(p, d.sub, V ? bh + 440 : bh + 30, G.cw)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    const w = B.at('win', .06, .16);
    const k = parseFloat(el(p + 'win').style.getPropertyValue('--k')) || 1, e = eo4(w.p);
    st(p + 'win', { opacity: e, transform: 'translateY(' + ((1 - e) * 30) + 'px) scale(' + k + ')' });
    // the wireframe crossfades into the real UI; without a sketch the UI is there with the window
    const f = d.sketch ? B.p('fill', .24, .34) : 1;
    fd(p + 'sk', d.sketch ? 1 - eo(f) : 0); fd(p + 'real', d.sketch ? eo(f) : 1);
    const n = (d.features || []).length;
    B.group('k', n, { a: .36, step: .06, len: .1, kind: 'pop', dim: false }).forEach((r, i) => {
      const id = p + 'k' + (i + 1);
      if (d.mode === 'wire') { cls(id, 'lit', r.p > .5); st(id, { transform: 'scale(' + (1 + .08 * pulse(r.p)) + ')' }); }
      else pp(id, r.p, .6);
    });
    if (d.code) {
      up(p + 'code', B.p('code', .10, .22), 24);
      const nl = d.code.lines.length, wl = .5 / nl;
      B.group('l', nl, { a: .24, step: wl * .82, len: wl * 1.5, kind: 'enter' }).forEach((r, i) => codeLine(p + 'l' + (i + 1), r.p));
    }
    castPlay(B, c, p, d.cast, d.bubbles);
    B.group('q', (d.questions || []).length, { a: .7, step: .06, len: .1, kind: 'pop', dim: false }).forEach((r, i) => bubbleIn(p + 'q' + (i + 1), r.p, 0));
    up(p + 'sub', B.p('sub', .88, .96));
    footIn(B, p); holdLife(B, p, d);
  }
});
