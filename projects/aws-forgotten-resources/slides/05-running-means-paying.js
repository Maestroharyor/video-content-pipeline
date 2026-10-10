defineSlide({
  id: 's05', slug: '05-running-means-paying', dur: 5,
  data: {
    eyebrow: 'The rule', accent: 'r', h1: 'Running<br>means paying',
    foot: 'The meter runs whether or not you send it a single request.',
    console: { service: 'EC2', crumb: ['EC2', 'Instances'], nav: ['Dashboard', 'EC2 Global View', { grp: 'Instances' }, 'Instances', 'Instance Types', 'Launch Templates', { grp: 'Elastic Block Store' }, 'Volumes', 'Snapshots'], active: 3,
      title: 'Instances (1)', buttons: ['Instance state ▾', 'Actions ▾'], primary: 'Launch instances',
      cols: [{ l: 'Name', w: 3 }, { l: 'Instance ID', w: 4 }, { l: 'Instance state', w: 3 }, { l: 'Type', w: 2 }],
      rows: [['ai-demo-server', { mono: 'i-0f3c9a7e2b1d4c8a' }, { st: ['Running', 'ok'] }, 't3.medium']] },
    rate: 0.0416, hours: 720
  },
  html: d => `${heading('s05-', d)}
  <div class="content"><div class="rel">
    ${awsConsole(Object.assign({ id: 's05-con', x: 0, y: 0 }, d.console))}
    <div class="badge n" id="s05-rate" style="left:0;top:760px;font-size:30px">$${d.rate.toFixed(4)} / hour</div>
    <div class="badge r" id="s05-tot" style="left:0;top:850px;font-size:40px;padding:18px 28px"><span id="s05-amt">$0.00</span>&nbsp;<span style="font:600 26px Inter;color:#FFB4C0">this month</span></div>
    <div class="badge a" id="s05-247" style="left:600px;top:760px;font-size:30px">24 / 7</div>
    <div class="sub" id="s05-sub" style="left:0;top:980px;width:960px">Compute is billed per second while the instance state says Running.</div>
  </div></div>`,
  frame: t => {
    const d = slideFor('s05').data;
    up('s05-eb', seg(t, .02, .14)); h1In('s05-h1', seg(t, .05, .22));
    up('s05-con', seg(t, .08, .24), 60);
    up('s05-con-r1', seg(t, .22, .34), 16);
    const pu = pulse(seg(t, .34, .48));
    st('s05-con-r1-st', { textShadow: '0 0 ' + (pu * 18) + 'px rgba(3,127,12,.9)', transform: 'scale(' + (1 + pu * .06) + ')', transformOrigin: 'left center' });
    up('s05-rate', seg(t, .40, .52));
    up('s05-tot', seg(t, .46, .58));
    tick('s05-amt', seg(t, .50, .92), 0, d.rate * d.hours, money);
    pp('s05-247', seg(t, .74, .84), .8);
    up('s05-sub', seg(t, .80, .92));
    up('s05-ft', seg(t, .88, .98));
  }
});
