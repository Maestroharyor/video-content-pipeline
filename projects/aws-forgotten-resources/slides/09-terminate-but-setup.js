defineSlide({
  id: 's09', slug: '09-terminate-but-setup', dur: 5,
  data: {
    eyebrow: 'The objection', accent: 'v', h1: 'But all that<br>setup?',
    foot: 'Terminating throws away the machine and everything you installed on it.',
    console: { service: 'EC2', crumb: ['EC2', 'Instances'], nav: ['Dashboard', 'EC2 Global View', { grp: 'Instances' }, 'Instances', 'Instance Types', 'Launch Templates', { grp: 'Elastic Block Store' }, 'Volumes', 'Snapshots'], active: 3,
      title: 'Instances (1)', buttons: ['Instance state ▾', 'Actions ▾'], primary: 'Launch instances',
      cols: [{ l: 'Name', w: 3 }, { l: 'Instance ID', w: 4 }, { l: 'Instance state', w: 3 }, { l: 'Type', w: 2 }],
      rows: [['ai-demo-server', { mono: 'i-0f3c9a7e2b1d4c8a' }, { st: ['Stopped', 'stop'] }, 't3.medium']] },
    modal: { title: 'Terminate instance?', body: 'You are about to terminate the following instance: <b>i-0f3c9a7e2b1d4c8a (ai-demo-server)</b>', warn: 'On an EBS-backed instance, the default action is for the root EBS volume to be deleted when the instance is terminated.', ok: 'Terminate' },
    chips: [{ sym: 'i-pkg', text: 'packages', cls: 'v' }, { icon: 'docker', brand: true, text: 'Docker', cls: 'v' }, { sym: 'i-key', text: 'env vars', cls: 'v' }, { icon: 'nginx', brand: true, text: 'nginx', cls: 'v' }]
  },
  html: d => `${heading('s09-', d)}
  <div class="content"><div class="rel">
    ${awsConsole(Object.assign({ id: 's09-con', x: 0, y: 0 }, d.console))}
    ${d.chips.map((ch, i) => chip(Object.assign({ id: 's09-c' + (i + 1), x: [0, 262, 500, 740][i], y: 790 }, ch))).join('')}
    <div class="badge n" id="s09-q" style="left:0;top:900px;font:600 34px Inter;padding:18px 26px;color:#DCD0FF;border-color:rgba(139,92,246,.6)">"I'll lose an afternoon rebuilding it."</div>
  </div></div>`,
  setup: root => {
    // the modal lives inside the console so the scrim only covers the console
    const con = document.getElementById('s09-con');
    con.insertAdjacentHTML('beforeend', awsModal('s09-md', 200, 120, slideFor('s09').data.modal));
  },
  frame: t => {
    up('s09-eb', seg(t, .02, .14)); h1In('s09-h1', seg(t, .05, .24));
    up('s09-con', seg(t, .06, .22), 60);
    up('s09-con-r1', seg(t, .14, .26), 16);
    cls('s09-con-r1-cb', 'on', t > .2); cls('s09-con-r1', 'sel', t > .2);
    fd('s09-md-scrim', seg(t, .26, .34));
    pp('s09-md', seg(t, .28, .40), .92);
    [1, 2, 3, 4].forEach(i => up('s09-c' + i, seg(t, .44 + i * .07, .58 + i * .07), -40));
    up('s09-q', seg(t, .80, .92));
    up('s09-ft', seg(t, .88, 1));
  }
});
