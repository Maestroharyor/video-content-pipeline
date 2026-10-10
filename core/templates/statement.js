/* statement: one big quote panel, optional strike-through, figure, badge and sub
   data: {eyebrow, accent, h1, h1size?, label?, quote, cls?, strike?: bool, figure?: {kind, ...},
          badge?: {text, cls}, sub?, foot?, quote2?, label2?}

   `quote2` is the correction: the panel is struck and then its text is REPLACED in place on the `q2` beat,
   instead of cross-fading to a second slide holding a second card. The script does this three times ("not more
   information / the right information"), and two cards that differ only in their words read as a rebuild when
   the engine fades between them. Replacing in place keeps one panel on screen for the whole correction, which
   is what the correction actually is.
   The strike is measured onto the real text (see strikeText). The figure drops into the empty band below the
   content column — a line with nothing but a quote panel leaves the bottom half of the frame dead otherwise. */
defineTemplate('statement', {
  check: d => req(d, ['eyebrow', 'h1', 'quote'], 'statement'),
  beats: d => baseBeats(d).concat(['q', 'strike', 'q2', 'badge', 'fig', 'sub']),
  html: (d, c) => {
    const p = c.p, w = c.grid.cw;
    const strike = d.strike ? `<svg class="strike" id="${p}st" style="left:0;top:0;width:0;height:0" viewBox="0 0 1 1"></svg>` : '';
    return `${heading(p, d)}<div class="content"><div class="rel">
      <div class="cmp ${d.cls || ''}" id="${p}q" style="left:0;top:0;width:${w}px"><span class="lb" id="${p}lb">${d.label || ''}</span><span class="qt" id="${p}qt">${d.quote}</span></div>${strike}
      ${d.badge ? `<div class="badge ${d.badge.cls || 'n'}" id="${p}bd" style="left:0;top:250px;font-size:34px">${d.badge.text}</div>` : ''}
      ${subHtml(p, d.sub, d.badge ? 350 : 250, w)}</div></div>${figHtml(p, d.figure)}`;
  },
  // the webfont is wider than the fallback, so the first measurement is redone once fonts report loaded
  place: (d, c) => { if (d.strike) d._struck = strikeText(c.p + 'st', c.p + 'qt') && document.fonts.status === 'loaded'; },
  setup: (root, d, c) => { TEMPLATES.statement.place(d, c); },
  frame: (t, c) => {
    const p = c.p, d = c.data, B = beats(c);
    if (d.strike && !d._struck && !(d.quote2 && d._showing2)) TEMPLATES.statement.place(d, c);
    headIn(B, p);
    sx(p + 'q', B.p('q', .16, .32), -70);
    /* the stroke draws, then `quote2` swaps the words under it and the stroke is retired: one panel, two states */
    const st2 = d.quote2 ? B.at('q2', .70, .86) : null;
    const swapped = !!(st2 && st2.p > .5);
    if (d.quote2) {
      txt(p + 'qt', swapped ? d.quote2 : d.quote);
      if (d.label2) txt(p + 'lb', swapped ? d.label2 : d.label || '');
      d._showing2 = swapped;
    }
    draw(p + 'st', d.quote2 && swapped ? 0 : B.p('strike', .44, .58, 'draw'));
    figIn(B, p, d.figure, c);                 // the picture before the closing badge, and it chains off the quote
    pp(p + 'bd', B.p('badge', .62, .74, 'pop'), .8);
    up(p + 'sub', B.p('sub', .76, .88));
    footIn(B, p); holdLife(B, p, d);
  }
});
