defineSlide({
  id: 's03', slug: '03-three-resources', dur: 5,
  data: {
    eyebrow: 'Three usual suspects', accent: 't', h1: 'Forgotten on,<br>forgotten billed', h1size: 'sm',
    foot: 'Three line items most people never see coming.',
    // teaser only: the services are revealed on their own intro slides (04, 12, 16), so this slide shows ? tiles and redacted names
    items: [{ num: '01', w: 330, sub: 'The obvious one' }, { num: '02', w: 290, sub: 'The one you overlook' }, { num: '03', w: 360, sub: 'The one that surprises you' }],
    sub: 'Developers spin these up for a test, a demo, a weekend project, and then walk away.'
  },
  html: d => `${heading('s03-', d)}
  <div class="content"><div class="rel">
    ${d.items.map((it, i) => `<div class="node col" id="s03-n${i + 1}" style="left:0;top:${i * 250}px;width:960px;height:210px;flex-direction:row;justify-content:flex-start;gap:34px;padding:0 40px">
      <span class="badge t" id="s03-b${i + 1}" style="position:static;font-size:30px;padding:10px 20px">${it.num}</span>
      <div class="ltile lg dark" id="s03-q${i + 1}"><span style="font:900 78px ID;color:var(--teal);line-height:1">?</span></div>
      <span class="nt" style="text-align:left"><span id="s03-r${i + 1}" style="display:block;width:${it.w}px;height:38px;margin:6px 0 10px;border-radius:9px;transform-origin:left;background:repeating-linear-gradient(90deg,#2A3650 0 18px,#344364 18px 30px);opacity:.75"></span><i style="font-size:28px">${it.sub}</i></span>
    </div>`).join('')}
    <div class="sub" id="s03-sub" style="left:0;top:790px;width:960px">${d.sub}</div>
  </div></div>`,
  frame: t => {
    up('s03-eb', seg(t, .02, .14)); h1In('s03-h1', seg(t, .05, .22));
    [1, 2, 3].forEach(i => {
      sx('s03-n' + i, seg(t, .16 + (i - 1) * .14, .36 + (i - 1) * .14), -70);
      pp('s03-b' + i, seg(t, .30 + (i - 1) * .14, .42 + (i - 1) * .14), .6);
      pp('s03-q' + i, seg(t, .34 + (i - 1) * .14, .48 + (i - 1) * .14), .5);       // the ? pops after its row lands
      fill('s03-r' + i, seg(t, .40 + (i - 1) * .14, .56 + (i - 1) * .14));          // redaction bar wipes in
    });
    up('s03-sub', seg(t, .74, .88));
    up('s03-ft', seg(t, .86, .98));
  }
});
