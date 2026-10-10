defineSlide({
  id: 's07', slug: '07-misconception-stopped', dur: 5,
  data: {
    eyebrow: 'The misconception', accent: 'a', h1: 'Stopped<br>is not free',
    foot: 'Pausing the compute pauses exactly one line of the bill.',
    console: { service: 'EC2', crumb: ['EC2', 'Instances'], nav: ['Dashboard', 'EC2 Global View', { grp: 'Instances' }, 'Instances', 'Instance Types', 'Launch Templates', { grp: 'Elastic Block Store' }, 'Volumes', 'Snapshots'], active: 3,
      title: 'Instances (1)', buttons: ['Instance state ▾', 'Actions ▾'], primary: 'Launch instances',
      cols: [{ l: 'Name', w: 3 }, { l: 'Instance ID', w: 4 }, { l: 'Instance state', w: 3 }, { l: 'Type', w: 2 }],
      rows: [['ai-demo-server', { mono: 'i-0f3c9a7e2b1d4c8a' }, { st: ['Running', 'ok'] }, 't3.medium']] },
    menu: [{ hl: 'Stop instance' }, 'Start instance', 'Reboot instance', { dis: 'Hibernate instance' }, '-', 'Terminate instance'],
    modal: { title: 'Stop instance?', body: 'You are about to stop the following instance: <b>i-0f3c9a7e2b1d4c8a (ai-demo-server)</b>', warn: 'Attached EBS volumes and Elastic IP addresses are retained and continue to be billed while the instance is stopped.', ok: 'Stop' },
    states: [['Running', 'ok'], ['Stopping', 'prog'], ['Stopped', 'stop']],
    badge: 'Stopped ≠ $0', sub: 'Compute stops. Storage, addresses and snapshots keep going.'
  },
  html: d => `${heading('s07-', d)}
  <div class="content"><div class="rel">
    ${awsConsole(Object.assign({ id: 's07-con', x: 0, y: 0 }, d.console))}
    ${awsMenu('s07-menu', 0, 0, d.menu)}
    ${pointer('s07-cur')}
    <div class="badge a" id="s07-bd" style="left:0;top:770px;font-size:44px;padding:20px 30px">${d.badge}</div>
    <div class="sub" id="s07-sub" style="left:0;top:890px;width:960px">${d.sub}</div>
  </div></div>`,
  setup: root => {
    const d = slideFor('s07').data;
    document.getElementById('s07-con').insertAdjacentHTML('beforeend', awsModal('s07-md', 200, 110, d.modal));
    const btn = root.querySelector('#s07-con .aws-btn.dd'); const r = btn.getBoundingClientRect(), s = root.getBoundingClientRect();
    const m = document.getElementById('s07-menu'); m.style.left = (r.left - s.left - GRID.cx) + 'px'; m.style.top = (r.bottom - s.top - GRID.cy + 6) + 'px';
    const item = m.querySelector('.hl'); item.classList.remove('hl');
    root._flow = { cur: 's07-cur', menu: 's07-menu', modal: 's07-md', btn, item, x0: 300, y0: 420,
      b: centerOf(root, btn), i: centerOf(root, item), ok: centerOf(root, document.getElementById('s07-md-ok')) };
  },
  frame: t => {
    const root = document.getElementById('s07'), d = slideFor('s07').data;
    up('s07-eb', seg(t, .02, .12)); h1In('s07-h1', seg(t, .04, .18));
    up('s07-con', seg(t, .04, .18), 60);
    up('s07-con-r1', seg(t, .12, .22), 16);
    cls('s07-con-r1-cb', 'on', t > .20); cls('s07-con-r1', 'sel', t > .20);
    const f = clickFlow(t, root._flow);
    const si = !f.confirmed ? 0 : t < .86 ? 1 : 2;
    status('s07-con-r1-st', d.states[si][0], d.states[si][1]);
    pp('s07-bd', seg(t, .80, .90), .8);
    up('s07-sub', seg(t, .86, .96));
    up('s07-ft', seg(t, .90, 1));
  }
});
