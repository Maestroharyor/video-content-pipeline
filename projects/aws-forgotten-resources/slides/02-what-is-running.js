defineSlide({
  id: 's02', slug: '02-what-is-running', dur: 5,
  data: {
    eyebrow: 'The scary part', accent: 'r', h1: 'You might not know<br>what is running',
    foot: 'Resources do not stop billing because you stopped looking.',
    rows: [['i-0f3c9a7e2b1d4c8a', 'running'], ['vol-0a91c3e7f2d5b6a4', 'in-use'], ['dev-postgres', 'available'],
      ['nat-0e4b7c2a9d1f3e5b', 'available'], ['i-07d2e5b9a4c1f8e3', 'running'], ['demo-mysql', 'available']],
    sub: 'Every one of these is a line on next month\'s invoice.'
  },
  html: d => `${heading('s02-', d)}
  <div class="content"><div class="rel">
    ${d.rows.map((r, i) => `<div class="rowbar" id="s02-r${i + 1}" style="left:0;top:${i * 92}px;width:960px"><span id="s02-n${i + 1}">••••••••••••••••••</span><span class="tail" id="s02-s${i + 1}">?</span></div>`).join('')}
    <div class="badge r" id="s02-q" style="left:0;top:600px;font-size:34px">6 resources still billing</div>
    <div class="sub" id="s02-sub" style="left:0;top:700px;width:960px">${d.sub}</div>
  </div></div>`,
  frame: t => {
    const d = slideFor('s02').data;
    up('s02-eb', seg(t, .02, .14)); h1In('s02-h1', seg(t, .05, .22));
    d.rows.forEach((r, i) => {
      up('s02-r' + (i + 1), seg(t, .14 + i * .05, .30 + i * .05), 26);
      const rv = seg(t, .52 + i * .05, .60 + i * .05);
      txt('s02-n' + (i + 1), rv > .5 ? r[0] : '••••••••••••••••••');
      const s = document.getElementById('s02-s' + (i + 1));
      if (s) { s.textContent = rv > .5 ? r[1] : '?'; s.style.color = rv > .5 ? '#FFB4C0' : ''; }
      cls('s02-r' + (i + 1), 'r', rv > .5);
    });
    pp('s02-q', seg(t, .80, .90), .84);
    up('s02-sub', seg(t, .86, .96));
    up('s02-ft', seg(t, .88, 1));
  }
});
