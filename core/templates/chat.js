/* chat: an AI client window beside the thing it talks to (projects/mcp-server-tutorial). Two arrangements:
   mode 'app'  — the task manager on the right (its rows), the AI assistant's chat window on the left; the tools the app
                 could offer pop between them as chips, then the assistant asks what the app can do.
                 data: {tasks:[{text, sub?, done?}], tools:[string], ask, hello?, chipRow? (tools in one centred row)}
                 beats: win (the app window) · app (its rows) · ai (the chat window) · k1..kn (tool chips) · q (the ask)
   mode 'tool' — the tool definition on the left (name / description / input schema light as they are said), the AI
                 client on the right: tools/list returns the server's tools, then tools/call runs one and prints the result.
                 data: {name, fields:[{k, v}], tools:[{name, sub?}], call:{name, result:[html]}}
                 beats: card · f1..fn · disc (tools/list) · call (tools/call)
   common: {eyebrow, accent, h1, h1size?, mode, sub?, foot?}. Both windows are authored in content coordinates. */
const CHAT = { w: 520, gap: 60, h: 600 };
function chatWin(id, x, w, h, title, body) {
  return `<div class="ch-win" id="${id}" style="left:${x}px;top:0;width:${w}px;height:${h}px">
    <div class="ch-top"><i></i><i></i><i></i><b>${title}</b><span class="ch-ai"><svg viewBox="0 0 24 24"><use href="#i-ai"/></svg></span></div>
    <div class="ch-body">${body}</div></div>`;
}
defineTemplate('chat', {
  check: d => req(d, ['eyebrow', 'h1', 'mode'], 'chat'),
  beats: d => baseBeats(d).concat(d.mode === 'app' ? ['win', 'app', 'ai'].concat(seqN('k', d.tools.length), ['q'])
    : ['card'].concat(seqN('f', d.fields.length), ['disc', 'call']), ['sub']),
  html: (d, c) => {
    const p = c.p, G = c.grid, W = CHAT.w, xR = W + CHAT.gap;
    let html = '';
    if (d.mode === 'app') {
      const rows = d.tasks.map((r, i) => `<div class="ch-task" id="${p}r${i + 1}" style="top:${22 + i * 80}px"><span class="bx ${r.done ? 'dn' : ''}"></span>${r.text}${r.sub ? `<small>${r.sub}</small>` : ''}</div>`).join('');
      html += chatWin(p + 'win', xR, W, 420, 'tasks.app', rows);
      html += chatWin(p + 'ai', 0, W, 420, 'AI assistant', `<div class="ch-msg a" id="${p}hi" style="top:22px">${d.hello || 'How can I help?'}</div>`);
      // the tools sit under both windows, two per row, like a menu nobody has handed the assistant yet
      // chipRow: one centred row under both windows (JetBrains Mono .60em at 24px, 40px padding, 24px gaps)
      const cw = d.tools.map(k => Math.round(k.length * 24 * .6 + 42)), tw = cw.reduce((a, b) => a + b, 0) + 24 * (cw.length - 1);
      let cx = Math.round((2 * W + CHAT.gap - tw) / 2);
      html += d.tools.map((k, i) => { const x = d.chipRow ? cx : (i % 2) * 560 + 40, y = d.chipRow ? 470 : 470 + Math.floor(i / 2) * 84; cx += cw[i] + 24;
        return `<div class="ch-chip" id="${p}k${i + 1}" style="left:${x}px;top:${y}px">${k}</div>`; }).join('');
      html += `<div class="ch-q" id="${p}q" style="left:40px;top:300px">${d.ask}</div>`;
    } else {
      const flds = d.fields.map((f, i) => `<div class="ch-fld" id="${p}f${i + 1}" style="top:${22 + i * 128}px"><small>${f.k}</small><code>${f.v}</code></div>`).join('');
      html += chatWin(p + 'card', 0, W, CHAT.h, 'server.registerTool', flds);
      const list = `<div class="ch-dots" id="${p}dots" style="top:30px"><i id="${p}d1"></i><i id="${p}d2"></i><i id="${p}d3"></i><span>thinking</span></div>`
        + `<div class="ch-call" id="${p}disc" style="top:22px"><div class="ch-h"><i></i>tools/list</div></div>`
        + d.tools.map((k, i) => `<div class="ch-tool" id="${p}t${i + 1}" style="top:${78 + i * 64}px"><i></i>${k.name}${k.sub ? `<small>${k.sub}</small>` : ''}</div>`).join('');
      const top = 78 + d.tools.length * 64 + 18;
      const call = `<div class="ch-call" id="${p}call" style="top:${top}px"><div class="ch-h"><i></i>tools/call · ${d.call.name}</div><pre>${d.call.result.join('\n')}</pre></div>`;
      html += chatWin(p + 'cl', xR, W, CHAT.h, 'AI client', list + call);
    }
    return `${heading(p, d)}<div class="content"><div class="rel">${html}${subHtml(p, d.sub, d.mode === 'app' ? 660 : 640, G.cw)}</div></div>`;
  },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c);
    headIn(B, p);
    if (d.mode === 'app') {
      up(p + 'win', B.p('win', .1, .2), 30);
      const ap = B.at('app', .2, .3);
      d.tasks.forEach((r, i) => up(p + 'r' + (i + 1), B.on ? seg(c.local, ap.s + i * .08, ap.s + i * .08 + .4) : seg(t, ap.fa + i * .03, ap.fb + i * .03), 18));
      const ai = B.at('ai', .3, .4); up(p + 'ai', ai.p, 30);
      // the user's message types itself in once the chat window is up (~30 characters a second)
      const hiQ = B.on ? seg(c.local, ai.e, ai.e + .3 + String(d.hello || '').length / 30) : seg(t, ai.fb, ai.fb + .05);
      fd(p + 'hi', cl(hiQ * 6, 0, 1)); st(p + 'hi', { clipPath: `inset(0 ${(100 * (1 - eo(hiQ))).toFixed(1)}% 0 0 round 14px)` });
      B.group('k', d.tools.length, { a: .45, step: .08, len: .1, kind: 'pop', dim: false }).forEach((r, i) => pp(p + 'k' + (i + 1), r.p, .7));
      pp(p + 'q', B.p('q', .85, .95, 'pop'), .7);
    } else {
      const cd = B.at('card', .1, .2); up(p + 'card', cd.p, 30);
      // the AI client window is on screen with the card: it is waiting, empty, until it discovers the tools
      up(p + 'cl', B.on ? seg(c.local, cd.s + .15, cd.s + .55) : seg(t, cd.fa + .03, cd.fb + .03), 30);
      const fr = B.group('f', d.fields.length, { a: .25, step: .1, len: .1, kind: 'pop', dim: false });
      fr.forEach((r, i) => { const on = cl(r.p * 1.5, 0, 1); st(p + 'f' + (i + 1), { opacity: (.35 + .65 * on).toFixed(3) }); cls(p + 'f' + (i + 1), 'on', r.p > .3); });
      const ds = B.at('disc', .6, .7, 'pop'); pp(p + 'disc', ds.p, .8);
      // the client "thinks" between the card landing and the tools coming back: three dots pulse, then give way
      const th = B.on ? seg(c.local, cd.e + .3, cd.e + .6) * (1 - seg(c.local, ds.s - .15, ds.s + .05)) : 0;
      fd(p + 'dots', th);
      [1, 2, 3].forEach(k => st(p + 'd' + k, { transform: `translateY(${(-6 * Math.max(0, Math.sin((c.local || 0) * Math.PI * 2 / .9 - k * .9))).toFixed(2)}px)` }));
      d.tools.forEach((k, i) => sx(p + 't' + (i + 1), B.on ? seg(c.local, ds.s + .2 + i * .08, ds.s + .6 + i * .08) : seg(t, ds.fa + .02 * i, ds.fb + .02 * i), 30));
      const cl2 = B.at('call', .8, .9, 'pop'); pp(p + 'call', cl2.p, .8); cls(p + 't1', 'on', cl2.p > .2);
    }
    up(p + 'sub', B.p('sub', .9, .98));
    footIn(B, p); holdLife(B, p, d);
  }
});
