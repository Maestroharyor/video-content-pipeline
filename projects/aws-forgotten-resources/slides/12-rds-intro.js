defineSlide({
  id: 's12', slug: '12-rds-intro', dur: 5,
  data: {
    eyebrow: '02 · Amazon RDS', accent: 'b', h1: 'The one you<br>overlook',
    foot: 'Easy to forget because it is not on the EC2 page.',
    label: 'Relational Database Service', engines: [{ icon: 'postgresql', text: 'PostgreSQL' }, { icon: 'mysql', text: 'MySQL' }],
    sub: 'A managed database you set up once for the app, then never opened again.'
  },
  html: d => `${heading('s12-', d)}
  <div class="content"><div class="rel">
    <div class="node col" id="s12-n" style="left:0;top:0;width:960px;height:420px;padding:0">
      <div class="ltile xl sq"><img src="${logo('rds')}" alt="Amazon RDS"></div>
      <span class="nt"><b style="font:800 52px ID;letter-spacing:-.02em">Amazon RDS</b><i style="font-size:30px;color:var(--blue)">${d.label}</i></span>
    </div>
    ${d.engines.map((e, i) => chip({ id: 's12-c' + (i + 1), x: 200 + i * 300, y: 470, icon: e.icon, brand: true, text: e.text, cls: 'b' }))}
    <div class="sub" id="s12-sub" style="left:0;top:600px;width:960px">${d.sub}</div>
  </div></div>`,
  frame: t => {
    up('s12-eb', seg(t, .02, .14)); h1In('s12-h1', seg(t, .05, .24));
    pp('s12-n', seg(t, .12, .30), .86);
    sx('s12-c1', seg(t, .40, .54), -50); sx('s12-c2', seg(t, .48, .62), 50);
    up('s12-sub', seg(t, .66, .80));
    up('s12-ft', seg(t, .86, .98));
  }
});
