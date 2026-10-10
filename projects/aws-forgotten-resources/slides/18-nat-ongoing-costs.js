defineSlide({
  id: 's18', slug: '18-nat-ongoing-costs', dur: 5,
  data: {
    eyebrow: 'Ongoing costs', accent: 'r', h1: 'Hourly, plus<br>per gigabyte', h1size: 'sm',
    foot: 'Roughly 32 dollars a month before a single byte moves.',
    console: { service: 'Amazon VPC', crumb: ['VPC', 'NAT gateways'], nav: ['VPC dashboard', 'EC2 Global View', { grp: 'Virtual private cloud' }, 'Your VPCs', 'Subnets', 'Route tables', 'Internet gateways', 'Elastic IPs', 'NAT gateways', 'Endpoints'], active: 8,
      title: 'NAT gateways (1)', buttons: ['Actions ▾'], primary: 'Create NAT gateway', primaryBlue: true,
      cols: [{ l: 'Name', w: 3 }, { l: 'NAT gateway ID', w: 4 }, { l: 'State', w: 3 }, { l: 'Connectivity', w: 2 }],
      rows: [['prod-nat', { mono: 'nat-0e4b7c2a9d1f3e5b' }, { st: ['Available', 'ok'] }, 'Public']] },
    hourly: '$0.045 / hour', gb: '$0.045 / GB processed', month: '≈ $32 / month idle'
  },
  html: d => `${heading('s18-', d)}
  <div class="content"><div class="rel">
    ${awsConsole(Object.assign({ id: 's18-con', x: 0, y: 0 }, d.console))}
    <div class="badge r" id="s18-h" style="left:0;top:770px;font-size:30px">${d.hourly}</div>
    <div class="badge r" id="s18-g" style="left:400px;top:770px;font-size:30px">${d.gb}</div>
    <div class="badge a" id="s18-m" style="left:0;top:870px;font-size:40px;padding:18px 28px">${d.month}</div>
    <div class="sub" id="s18-sub" style="left:0;top:990px;width:960px">Every hour it exists, and every gigabyte that passes through it, is billed separately.</div>
  </div></div>`,
  frame: t => {
    up('s18-eb', seg(t, .02, .14)); h1In('s18-h1', seg(t, .05, .22));
    up('s18-con', seg(t, .06, .22), 60);
    up('s18-con-r1', seg(t, .20, .32), 16);
    const pu = pulse(seg(t, .32, .46));
    st('s18-con-r1', { background: 'rgba(217,21,21,' + (pu * .08) + ')' });
    pp('s18-h', seg(t, .42, .52), .84); pp('s18-g', seg(t, .52, .62), .84);
    pp('s18-m', seg(t, .68, .80), .8);
    up('s18-sub', seg(t, .80, .92));
    up('s18-ft', seg(t, .88, 1));
  }
});
