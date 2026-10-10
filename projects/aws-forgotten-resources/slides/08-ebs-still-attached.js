defineSlide({
  id: 's08', slug: '08-ebs-still-attached', dur: 5,
  data: {
    eyebrow: 'What keeps billing', accent: 'a', h1: 'The EBS volume<br>is still attached', h1size: 'sm',
    foot: 'You might think you are safe. The storage disagrees.',
    ec2: { name: 'ai-demo-server', sub: 'i-0f3c9a7e2b1d4c8a', state: 'Stopped' },
    vol: { name: '30 GiB · gp3', sub: 'vol-0a91c3e7f2d5b6a4', state: 'In-use' },
    console: { service: 'EC2', crumb: ['EC2', 'Volumes'], nav: ['Dashboard', 'EC2 Global View', { grp: 'Instances' }, 'Instances', 'Instance Types', 'Launch Templates', { grp: 'Elastic Block Store' }, 'Volumes', 'Snapshots'], active: 7,
      title: 'Volumes (1)', buttons: ['Actions ▾'], primary: 'Create volume', primaryBlue: true,
      cols: [{ l: 'Volume ID', w: 4 }, { l: 'Size', w: 2 }, { l: 'Volume state', w: 3 }, { l: 'Attached resources', w: 3 }],
      rows: [[{ mono: 'vol-0a91c3e7f2d5b6a4' }, '30 GiB', { st: ['In-use', 'ok'] }, { link: 'i-0f3c9a7e…' }]] },
    cost: '$2.40 / month per volume'
  },
  html: d => `${heading('s08-', d)}
  <div class="content"><div class="rel">
    <div class="node" id="s08-ec2" style="left:0;top:0;width:440px"><img src="${logo('ec2')}" alt="EC2"><span class="nt"><b>${d.ec2.name}</b><i>${d.ec2.sub}</i><span class="pill stop" id="s08-ec2-pill">■ ${d.ec2.state}</span></span></div>
    <div class="node a" id="s08-vol" style="left:520px;top:0;width:440px"><img src="${logo('ebs')}" alt="EBS"><span class="nt"><b>${d.vol.name}</b><i>${d.vol.sub}</i><span class="pill ok">● ${d.vol.state}</span></span></div>
    <svg class="draw" id="s08-cable" style="left:440px;top:66px;width:80px;height:20px" viewBox="0 0 80 20"><path d="M0 10 H80" stroke="#F59E0B" stroke-width="6" stroke-dasharray="12 10"/></svg>
    ${awsConsole(Object.assign({ id: 's08-con', x: 0, y: 200 }, d.console))}
    <div class="badge a" id="s08-cost" style="left:0;top:960px;font-size:30px">${d.cost}</div>
    <div class="badge r" id="s08-safe" style="left:560px;top:960px;font-size:30px">Still billing</div>
    <div class="sub" id="s08-sub" style="left:0;top:1060px;width:960px">Stopped instances keep their root volume. The volume keeps its price.</div>
  </div></div>`,
  frame: t => {
    up('s08-eb', seg(t, .02, .14)); h1In('s08-h1', seg(t, .05, .22));
    pp('s08-ec2', seg(t, .10, .22), .88);
    st('s08-ec2', { filter: 'saturate(' + (1 - .7 * seg(t, .28, .40)) + ')', opacity: 1 - .35 * seg(t, .28, .40) });
    draw('s08-cable', seg(t, .22, .34));
    pp('s08-vol', seg(t, .30, .42), .88);
    const gl = pulse(seg(t, .42, .56));
    st('s08-vol', { boxShadow: '0 0 ' + (44 + gl * 40) + 'px rgba(245,158,11,' + (.16 + gl * .35) + ')' });
    up('s08-con', seg(t, .44, .58), 60);
    up('s08-con-r1', seg(t, .56, .68), 16);
    pp('s08-cost', seg(t, .70, .80), .84);
    pp('s08-safe', seg(t, .78, .88), .84);
    up('s08-sub', seg(t, .84, .94));
    up('s08-ft', seg(t, .88, 1));
  }
});
