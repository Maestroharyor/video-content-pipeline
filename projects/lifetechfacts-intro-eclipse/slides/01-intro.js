/* Intro concept I, "Eclipse" (4.0s): the blue disc is there from the first frame but hidden behind an unseen body, with only a thin rim line
   and one ball orbiting it. The body slides away to the lower left, so the mark appears as a growing crescent while the balls finish a long
   slow lap with their arcs trailing; when the disc is whole the shared ending (LF.resolve) brings LT/F, wordmark, tagline and sheen.
   Flat shapes and masks only (no gradients, so nothing can band). Over the hidden part the orbit is drawn in the theme's ink colour, over
   the revealed disc in white. Every value is a pure function of ctx.local (seconds).
   Logo drawing: window.LF (assets/logos/lifetechfacts/lf-logo.js). */
(function () {
  const { G, f2, rad } = LF;
  const ROT0 = 300, T0 = 1.55, DIR = 148;   // degrees the orbit starts turned by; LT/F and wordmark timing base; direction the hiding body leaves in

  defineSlide({
    slug: '01-intro', dur: 4, audio: 'lf-intro-sting.wav',
    data: { theme: (window.PROJECT.intro || {}).theme, tagline: (window.PROJECT.intro || {}).tagline || LF.TAGLINE },
    html: (d, c) => {
      const p = c.p, t = LF.theme(d), L = LF.intro(c.grid), box = `maskUnits="userSpaceOnUse" x="0" y="0" width="${L.W}" height="${L.H}"`;
      return `${LF.css}${LF.bg(p, t)}
<svg class="lfi" id="${p}svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}"><defs>${LF.defs(p)}
  <mask id="${p}lit" ${box}><rect width="${L.W}" height="${L.H}" fill="#fff"/><circle id="${p}mo1" fill="#000"/></mask>
  <mask id="${p}drk" ${box}><rect width="${L.W}" height="${L.H}" fill="#000"/><circle id="${p}mo2" fill="#fff"/></mask>
  <filter id="${p}ink" x="-10%" y="-10%" width="120%" height="120%"><feFlood flood-color="${t.name === 'light' ? LF.BLUE : t.ink}"/><feComposite in2="SourceAlpha" operator="in"/></filter></defs>
<circle id="${p}rim" cx="${f2(L.cx)}" cy="${f2(L.cy)}" fill="none" stroke="${t.line}" stroke-width="2" opacity="0"/>
${LF.shock(p, L, t)}
<g mask="url(#${p}lit)">${LF.mark(p)}</g>
<g mask="url(#${p}drk)"><g id="${p}dk" filter="url(#${p}ink)"><use href="#${p}orb"/></g></g>
${LF.word(p, t.word)}
</svg>
${LF.tag(p, L, d.tagline, t)}`;
    },
    frame: (u, c) => {
      const p = c.p, T = c.local, d = c.data, t = LF.theme(d), L = LF.intro(c.grid), k = L.D / 1000, R = G.R * k, S = (a, b) => seg(T, a, b), at = (id, o) => LF.at(p, id, o);
      /* 0.00-1.90  the hiding body: first a hair of a crescent, then it slides off; the two masks share its circle */
      const dist = R * (.05 * eo(S(0, .5)) + 2.12 * eio(S(.45, 1.9))), moon = { cx: f2(L.cx + dist * Math.cos(rad(DIR))), cy: f2(L.cy + dist * Math.sin(rad(DIR))), r: f2(R + 2) };
      at('mo1', moon); at('mo2', moon);
      at('rim', { r: f2(R + 12), opacity: f2(.45 * S(0, .4) * (1 - S(1.5, 1.95))) });
      /* 0.10-2.35  one long lap, slowing all the way; ball 2 first, its arc trailing, then ball 1 */
      LF.resolve(p, L, T, t, { t0: T0, disc: false, balls: false, shock: false });
      at('dsc', { r: G.R });
      LF.orbit(p, { rot: ROT0 * (1 - eo(S(.1, 2.35))), b1: bk(S(.55, .85)), b2: bk(S(.1, .4)), a1: eo(S(.8, 2.1)), a2: eo(S(.45, 1.95)) });
      at('dk', { transform: `translate(${f2(L.cx - 500 * k)} ${f2(L.cy - 500 * k)}) scale(${k.toFixed(5)})` });
      /* 1.85  the disc is whole: one soft ring leaves it */
      LF.shockAt(p, L, S(1.85, 2.55), 0, { from: L.D / 2, to: L.D / 2 + 70 });
    }
  });
})();
