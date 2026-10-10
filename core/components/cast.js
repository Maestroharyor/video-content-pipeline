/* Cast: illustrated characters on sticker cards, and the speech bubbles they talk in (projects/cloud-vs-devops).
   The characters are line art on a transparent ground (DiceBear Notionists), so they sit on a light card: on the
   dark stage an unbacked drawing loses its outline. The card carries a ring in the character's colour and a name tag.
   castHtml({id, src, x, y, size, name, cls, flip}) → html      cls: 'b' | 'o' | 'v' | 't' | 'g' (ring + tag colour)
   bubbleHtml({id, text, x, y, w, tail: 'l' | 'r' | 'd' | 'u', cls}) → html
   castIn(id, p, sec)   pop in, then a slow idle bob while the character is on screen (a pure function of sec)
   bubbleIn(id, p, out) pop in; `out` (0..1) fades it away when the next line replaces it */
function castHtml(o) {
  const s = o.size || 180;
  return `<div class="cst ${o.cls || ''}" id="${o.id}" style="left:${o.x || 0}px;top:${o.y || 0}px;width:${s}px">
    <div class="cst-card" style="width:${s}px;height:${s}px"><img src="${o.src}" alt="${o.name || ''}"${o.flip ? ' style="transform:scaleX(-1)"' : ''}></div>
    ${o.name ? `<b>${o.name}</b>` : ''}</div>`;
}
function bubbleHtml(o) {
  return `<div class="bub ${o.cls || ''} tail-${o.tail || 'l'}" id="${o.id}" style="left:${o.x || 0}px;top:${o.y || 0}px${o.w ? ';width:' + o.w + 'px' : ''}">${o.text}</div>`;
}
function castIn(id, p, sec) {
  const e = bk(cl(p, 0, 1)), bob = p >= 1 ? Math.sin((sec || 0) * Math.PI * 2 / 3.2) * 4 : 0;
  st(id, { opacity: cl(p * 2.2, 0, 1), transform: 'translateY(' + ((1 - e) * 40 + bob).toFixed(2) + 'px) scale(' + (.86 + .14 * e).toFixed(4) + ')' });
}
function bubbleIn(id, p, out) {
  const e = bk(cl(p, 0, 1)), o = cl(p * 2.4, 0, 1) * (1 - eo(cl(out || 0, 0, 1)));
  st(id, { opacity: o, transform: 'scale(' + (.7 + .3 * e).toFixed(4) + ')' });
}
/* a cast list inside a template: [{src, name, cls, x, y, size, flip}] + bubbles [{who, text, x, y, w, tail}].
   beats: a1..an (characters) · b1..bn (bubbles; a bubble fades out when the next bubble of the same speaker lands) */
function castBlock(p, cast, bubbles) {
  return (cast || []).map((a, i) => castHtml(Object.assign({ id: p + 'a' + (i + 1) }, a))).join('') +
    (bubbles || []).map((b, i) => bubbleHtml(Object.assign({ id: p + 'b' + (i + 1) }, b))).join('');
}
const castBeats = (cast, bubbles) => seqN('a', (cast || []).length).concat(seqN('b', (bubbles || []).length));
function castPlay(B, c, p, cast, bubbles, a0) {
  a0 = a0 == null ? .06 : a0;
  const recs = (cast || []).map((_, i) => B.at('a' + (i + 1), a0 + i * .06, a0 + .12 + i * .06, 'pop', { focal: false }));
  recs.forEach((r, i) => castIn(p + 'a' + (i + 1), r.p, B.on ? c.local - r.e : 0));
  const bs = (bubbles || []).map((_, i) => B.at('b' + (i + 1), .2 + i * .2, .3 + i * .2, 'pop'));
  (bubbles || []).forEach((b, i) => {
    const nx = (bubbles || []).findIndex((x, j) => j > i && x.who === b.who);
    const out = nx < 0 ? 0 : (B.on ? seg(c.local, bs[nx].s - .2, bs[nx].s + .05) : seg(c.t, bs[nx].fa - .02, bs[nx].fa));
    bubbleIn(p + 'b' + (i + 1), bs[i].p, out);
  });
  return recs;
}
