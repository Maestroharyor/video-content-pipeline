defineSlide({
  id: 's06', slug: '06-idle-fleet', dur: 5,
  data: {
    eyebrow: 'It gets worse', accent: 'a', h1: 'Four test servers<br>doing nothing', h1size: 'sm',
    foot: 'Idle at 0% CPU still bills at 100% of the hourly rate.',
    console: { service: 'EC2', crumb: ['EC2', 'Instances'], nav: ['Dashboard', 'EC2 Global View', { grp: 'Instances' }, 'Instances', 'Instance Types', 'Launch Templates', { grp: 'Elastic Block Store' }, 'Volumes', 'Snapshots'], active: 3,
      title: 'Instances (4)', buttons: ['Instance state ▾'], primary: 'Launch instances',
      cols: [{ l: 'Name', w: 3 }, { l: 'Instance state', w: 3 }, { l: 'Type', w: 2 }, { l: 'CPU (avg)', w: 2 }],
      rows: [['ai-demo-server', { st: ['Running', 'ok'] }, 't3.medium', { html: '<span id="s06-cpu1">0.3 %</span>' }],
        ['test-api-2', { st: ['Running', 'ok'] }, 't3.small', { html: '<span id="s06-cpu2">0.1 %</span>' }],
        ['load-test-old', { st: ['Running', 'ok'] }, 'c5.large', { html: '<span id="s06-cpu3">0.0 %</span>' }],
        ['jupyter-try', { st: ['Running', 'ok'] }, 'g4dn.xlarge', { html: '<span id="s06-cpu4">0.2 %</span>' }]] },
    chart: { title: 'Monthly compute, idle', bars: [{ l: 't3.medium', v: 30, c: 'o' }, { l: 't3.small', v: 15, c: 'o' }, { l: 'c5.large', v: 62, c: 'o' }, { l: 'g4dn.xlarge', v: 379, c: 'r' }] },
    total: 486
  },
  html: d => `${heading('s06-', d)}
  <div class="content"><div class="rel">
    ${awsConsole(Object.assign({ id: 's06-con', x: 0, y: 0 }, d.console))}
    ${costChart({ id: 's06-ch', x: 0, y: 760, w: 600, title: d.chart.title, unit: 'USD / month', bars: d.chart.bars, plotH: 200, fmt: v => '$' + v })}
    <div class="badge a" id="s06-tot" style="left:640px;top:790px;font-size:38px;padding:18px 26px"><span id="s06-amt">$0</span></div>
    <div class="sub" id="s06-sub" style="left:640px;top:890px;width:320px">A month, for servers nobody has logged into.</div>
  </div></div>`,
  frame: t => {
    const d = slideFor('s06').data;
    up('s06-eb', seg(t, .02, .14)); h1In('s06-h1', seg(t, .05, .22));
    up('s06-con', seg(t, .08, .24), 60);
    [1, 2, 3, 4].forEach(i => up('s06-con-r' + i, seg(t, .16 + i * .05, .30 + i * .05), 16));
    [1, 2, 3, 4].forEach(i => { const p = pulse(seg(t, .44 + i * .03, .58 + i * .03)); st('s06-cpu' + i, { color: p > .2 ? '#8D6605' : '', fontWeight: p > .2 ? 700 : 400 }); });
    up('s06-ch', seg(t, .50, .62), 40);
    bars('s06-ch', 4, t, .58, .86, .5);
    pp('s06-tot', seg(t, .66, .76), .8);
    tick('s06-amt', seg(t, .68, .92), 0, d.total, v => '$' + Math.round(v));
    up('s06-sub', seg(t, .80, .92));
    up('s06-ft', seg(t, .88, .98));
  }
});
