defineSlide({
  id: 's13', slug: '13-ec2-gone-db-running', dur: 5,
  data: {
    eyebrow: 'Separate resource', accent: 'b', h1: 'Server gone,<br>database still up', h1size: 'sm',
    foot: 'Terminating the instance does not touch the database.',
    gone: [{ icon: 'ec2', label: 'EC2 instance', sub: 'terminated' }, { icon: 'ebs', label: 'EBS volume', sub: 'deleted' }],
    db: { icon: 'rds', label: 'dev-postgres', sub: 'db.t3.micro · PostgreSQL 16', state: 'Available' },
    sub: 'The database was created from its own console, so it lives and bills on its own.'
  },
  html: d => `${heading('s13-', d)}
  <div class="content"><div class="rel">
    ${d.gone.map((g, i) => `<div class="node col" id="s13-g${i + 1}" style="left:${i * 500}px;top:0;width:460px;height:280px"><img src="${logo(g.icon)}" alt="" style="width:110px;height:110px;border-radius:22px"><span class="nt"><b>${g.label}</b><i>${g.sub}</i></span></div>${xMark('s13-x' + (i + 1), i * 500 + 150, 30, 160)}`).join('')}
    <svg class="draw" id="s13-link" style="left:480px;top:280px;width:20px;height:80px" viewBox="0 0 20 80"><path d="M10 0 V80" stroke="#38BDF8" stroke-width="6" stroke-dasharray="12 10"/></svg>
    <div class="node g" id="s13-db" style="left:0;top:360px;width:960px;height:200px;padding:0 40px;gap:30px"><img src="${logo(d.db.icon)}" alt="" style="width:120px;height:120px;border-radius:24px"><span class="nt"><b style="font-size:40px">${d.db.label}</b><i style="font-size:28px">${d.db.sub}</i></span><span class="pill ok" id="s13-pill" style="margin-left:auto;font-size:26px;padding:10px 20px">● ${d.db.state}</span></div>
    <div class="sub" id="s13-sub" style="left:0;top:620px;width:960px">${d.sub}</div>
  </div></div>`,
  frame: t => {
    up('s13-eb', seg(t, .02, .14)); h1In('s13-h1', seg(t, .05, .22));
    pp('s13-g1', seg(t, .10, .22), .88); pp('s13-g2', seg(t, .16, .28), .88);
    draw('s13-x1', seg(t, .30, .42)); draw('s13-x2', seg(t, .38, .50));
    st('s13-g1', { opacity: 1 - .55 * seg(t, .40, .50) }); st('s13-g2', { opacity: 1 - .55 * seg(t, .46, .56) });
    draw('s13-link', seg(t, .50, .58));
    pp('s13-db', seg(t, .54, .68), .9);
    const g = pulse(seg(t, .66, .84));
    st('s13-db', { boxShadow: '0 0 ' + (44 + g * 40) + 'px rgba(52,211,153,' + (.18 + g * .3) + ')' });
    pp('s13-pill', seg(t, .70, .80), .7);
    up('s13-sub', seg(t, .80, .92));
    up('s13-ft', seg(t, .88, 1));
  }
});
